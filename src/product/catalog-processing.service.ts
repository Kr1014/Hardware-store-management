import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { S3Service } from '../common/storage/s3.service'; // Ajusta la ruta según tu estructura

interface VisualBlock {
  top: number;
  bottom: number;
}

export interface CropProductData {
  code: string;
  name?: string;
  purchasePrice?: string;
  salePrice1?: string;
  salePrice2?: string;
  description?: string;
  imageUrl?: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface N8nResponse {
  products: CropProductData[];
}

@Injectable()
export class CatalogProcessingService {
  private readonly logger = new Logger(CatalogProcessingService.name);

  private readonly TEMP_IMG_DIR = './uploads/catalog/temp_pages';
  private readonly N8N_API_KEY = process.env.N8N_API_KEY!;
  private readonly N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;

  constructor(private readonly s3Service: S3Service) { }

  async processPdf(file: Express.Multer.File): Promise<void> {
    // 1. Definir rutas en /tmp (único lugar con permisos de escritura en Railway)
    const tempPdfPath = path.join('/tmp', `catalog-${Date.now()}.pdf`);
    const currentTempImgDir = path.join('/tmp', `images-${Date.now()}`);

    await fs.writeFile(tempPdfPath, file.buffer);

    try {
      // 2. Crear el archivo físico desde el buffer de memoria
      await fs.ensureDir(currentTempImgDir);
      await fs.writeFile(tempPdfPath, file.buffer);

      const baseFileName = path.parse(tempPdfPath).name;

      // 3. Obtener el número de páginas
      const totalPages = parseInt(
        execSync(`pdfinfo "${tempPdfPath}" | grep Pages: | awk '{print $2}'`)
          .toString()
          .trim()
      );

      this.logger.log(`🚀 Catálogo detectado: ${totalPages} páginas.`);

      for (let i = 1; i <= totalPages; i++) {
        this.logger.log(`📸 Procesando página ${i}/${totalPages}...`);

        const currentImgName = `${baseFileName}-page-${i}.jpg`;
        const imgPath = path.join(currentTempImgDir, currentImgName);
        const outputBase = path.join(currentTempImgDir, `${baseFileName}-page-${i}`);

        // 4. Convertir PDF a JPG (Requiere poppler-utils instalado en el server)
        execSync(
          `pdftoppm -jpeg -r 150 -f ${i} -l ${i} -singlefile "${tempPdfPath}" "${outputBase}"`,
          { stdio: 'inherit' }
        );

        if (fs.existsSync(imgPath)) {
          // 5. Enviar a n8n
          const n8nResponse = await this.sendToN8n(imgPath, currentImgName);

          // 6. Si n8n detectó productos, recortarlos
          if (n8nResponse?.products && n8nResponse.products.length > 0) {
            this.logger.log(`✂️ Recortando ${n8nResponse.products.length} productos de la página ${i}`);
            const imageBuffer = await fs.readFile(imgPath);
            await this.cropProducts(imageBuffer, n8nResponse.products);
          }

          // Limpiar la imagen de la página actual para ahorrar espacio en /tmp
          await fs.remove(imgPath);
        }

        // Delay de cortesía para no saturar n8n ni la CPU de Railway
        if (i < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      this.logger.log('🏁 Procesamiento de catálogo finalizado.');

    } catch (error: any) {
      this.logger.error(`❌ Error en processPdf: ${error.message}`);
      throw error;
    } finally {
      // 7. LIMPIEZA CRÍTICA: Borrar el PDF y la carpeta temporal de imágenes
      await Promise.all([
        fs.remove(tempPdfPath).catch(() => { }),
        fs.remove(currentTempImgDir).catch(() => { })
      ]);
    }
  }

  private async sendToN8n(imgPath: string, fileName: string): Promise<N8nResponse | null> {
    this.logger.log(`📤 Enviando ${fileName} a n8n...`);
    const form = new FormData();
    form.append('file', fs.createReadStream(imgPath));
    form.append('fileName', fileName);

    try {
      const response = await axios.post<N8nResponse>(this.N8N_WEBHOOK_URL, form, {
        headers: {
          ...form.getHeaders(),
          'x-api-key': this.N8N_API_KEY
        },
        timeout: 180000,
      });

      if (response.data && response.data.products) {
        this.logger.log(`📥 Respuesta n8n: ${response.data.products.length} productos.`);
        return response.data;
      }
      return null;
    } catch (error: any) {
      this.logger.error(`❌ Fallo envío a n8n [${fileName}]: ${error.message}`);
      return null;
    }
  }

  async cropProducts(imageBuffer: Buffer, products: CropProductData[]): Promise<boolean> {
    const metadata = await sharp(imageBuffer).metadata();
    const realWidth = metadata.width || 0;
    const realHeight = metadata.height || 0;

    const headerAreaLimit = Math.round(realHeight * 0.12);
    const scanLeft = Math.round(realWidth * 0.02);
    const scanWidth = Math.round(realWidth * 0.15);
    const cropLeft = Math.round(realWidth * 0.01);
    const cropWidth = Math.round(realWidth * 0.19);

    const { data, info } = await sharp(imageBuffer)
      .extract({ left: scanLeft, top: 0, width: scanWidth, height: realHeight })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    interface Block { top: number; bottom: number; height: number; }
    let allBlocks: Block[] = [];
    let startY = -1;
    const threshold = 240;

    for (let y = 0; y < info.height; y++) {
      let isDark = false;
      let darkPixels = 0;
      for (let x = 0; x < info.width; x++) {
        if (data[y * info.width + x] < threshold) darkPixels++;
      }
      if (darkPixels > (info.width * 0.12)) isDark = true;

      if (isDark) {
        if (startY === -1) startY = y;
      } else if (startY !== -1) {
        const blockHeight = y - startY;
        if (blockHeight > 50) {
          allBlocks.push({ top: startY, bottom: y, height: blockHeight });
        }
        startY = -1;
      }
    }

    allBlocks.sort((a, b) => a.top - b.top);

    let productBlocks = allBlocks.filter(block => {
      const isHeaderZone = block.top < headerAreaLimit;
      const isVeryLarge = block.height > (realHeight * 0.15);
      if (isHeaderZone && isVeryLarge && allBlocks.length > products.length) {
        return false;
      }
      return true;
    });

    if (productBlocks.length > products.length) {
      productBlocks = productBlocks.slice(productBlocks.length - products.length);
    }

    this.logger.log(`🎯 Procesando ${productBlocks.length} de ${products.length} productos esperados.`);

    for (let i = 0; i < productBlocks.length; i++) {
      const product = products[i];
      const block = productBlocks[i];

      let finalTop = block.top;
      let finalHeight = block.height;
      const expectedMaxHeight = Math.round(realHeight * 0.10);

      if (finalHeight > expectedMaxHeight * 1.5) {
        finalTop = block.bottom - expectedMaxHeight;
        finalHeight = expectedMaxHeight;
      }

      try {
        // 🚀 Recorte en memoria y subida directa a AWS S3
        const croppedBuffer = await sharp(imageBuffer)
          .extract({
            left: cropLeft,
            top: Math.max(0, Math.floor(finalTop)),
            width: cropWidth,
            height: Math.min(realHeight - finalTop, Math.ceil(finalHeight))
          })
          .jpeg({ quality: 100 })
          .toBuffer();

        const s3Key = `products/${product.code}.jpg`;
        const s3Url = await this.s3Service.uploadFile(croppedBuffer, s3Key, 'image/jpeg');

        this.logger.log(`✅ Producto ${product.code} subido a S3: ${s3Url}`);
        product.imageUrl = s3Url; // Actualizamos la URL para que el sistema sepa dónde está
      } catch (err) {
        this.logger.error(`❌ Error procesando/subiendo producto ${product.code}: ${err.message}`);
      }
    }

    return true;
  }
}
