import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

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

@Injectable()
export class CatalogProcessingService {

  private readonly logger = new Logger(CatalogProcessingService.name);

  private readonly TEMP_IMG_DIR = './uploads/catalog/temp_pages';
  private readonly CROPPED_DIR = './uploads/products';

  private readonly N8N_WEBHOOK_URL =
    'http://sales_n8n:5678/webhook-test/de0958fc-e5a0-412b-a706-7b9d3c474fdd';


  async processPdf(pdfPath: string): Promise<void> {

    this.logger.log(`🚀 Iniciando conversión con pdftoppm: ${pdfPath}`);

    await fs.ensureDir(this.TEMP_IMG_DIR);

    const baseFileName = path.parse(pdfPath).name;

    try {

      this.logger.log('📸 Renderizando páginas...');
      execSync(
        `pdftoppm -jpeg -r 150 -f 2 -l 3 "${pdfPath}" "${this.TEMP_IMG_DIR}/${baseFileName}"`,
        { stdio: 'inherit' }
      );

      const files = await fs.readdir(this.TEMP_IMG_DIR);

      const pageImages = files
        .filter(f => f.startsWith(baseFileName) && f.endsWith('.jpg'))
        .sort();

      this.logger.log(`✅ ${pageImages.length} páginas listas para enviar.`);

      for (const [index, imgName] of pageImages.entries()) {

        const imgPath = path.join(this.TEMP_IMG_DIR, imgName);

        await this.sendToN8n(imgPath, imgName);

        this.logger.log(`📊 Progreso: Enviando página ${index + 1} de ${pageImages.length} totales...`);

        await fs.remove(imgPath);

        if (index < pageImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }



    } catch (error: any) {

      this.logger.error(
        `Fallo envío a n8n: ${error.response?.data?.message || error.message}`
      );

      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
      }

    } finally {

      await fs.remove(pdfPath);
    }


  }


  private async sendToN8n(imgPath: string, fileName: string) {

    this.logger.log(`📤 Enviando ${fileName} a n8n...`);

    const form = new (FormData as any)();
    form.append('file', fs.createReadStream(imgPath));
    form.append('fileName', fileName);

    try {

      await axios.post(this.N8N_WEBHOOK_URL, form, {
        headers: { ...form.getHeaders() },
        timeout: 120000,
      });

      this.logger.log(`📥 Respuesta n8n (${fileName}): OK`);

    } catch (error: any) {

      const errorMsg = error.response
        ? `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error.message;

      this.logger.error(`Fallo envío a n8n: ${errorMsg}`);
    }
  }

  // async cropProducts(imageBuffer: Buffer, products: CropProductData[]): Promise<boolean> {
  //   if (!fs.existsSync(this.CROPPED_DIR)) {
  //     fs.mkdirSync(this.CROPPED_DIR, { recursive: true });
  //   }

  //   const metadata = await sharp(imageBuffer).metadata();
  //   const realWidth = metadata.width || 0;
  //   const realHeight = metadata.height || 0;

  //   // Límite superior para ignorar el encabezado de la página (12%)
  //   const headerLimitY = Math.round(realHeight * 0.12);

  //   // Áreas de escaneo y recorte
  //   const scanLeft = Math.round(realWidth * 0.02);
  //   const scanWidth = Math.round(realWidth * 0.15);
  //   const cropLeft = Math.round(realWidth * 0.01);
  //   const cropWidth = Math.round(realWidth * 0.19);

  //   // Extraemos la franja lateral para analizar densidad de píxeles
  //   const { data, info } = await sharp(imageBuffer)
  //     .extract({ left: scanLeft, top: headerLimitY, width: scanWidth, height: realHeight - headerLimitY })
  //     .greyscale()
  //     .raw()
  //     .toBuffer({ resolveWithObject: true });

  //   const rowsWithContent = new Array(info.height).fill(false);
  //   const threshold = 240; // Sensibilidad al blanco (240-255 es considerado fondo)

  //   for (let y = 0; y < info.height; y++) {
  //     let darkPixelsInRow = 0;
  //     for (let x = 0; x < info.width; x++) {
  //       if (data[y * info.width + x] < threshold) {
  //         darkPixelsInRow++;
  //       }
  //     }

  //     // 🔥 MEJORA 1: Filtro de densidad aumentado (0.12)
  //     // Esto ignora líneas de texto finas como "IMAGEN" o "PI-..." 
  //     // porque no tienen suficiente "masa" oscura en la fila.
  //     if (darkPixelsInRow > (info.width * 0.12)) {
  //       rowsWithContent[y] = true;
  //     }
  //   }

  //   let allBlocks: Array<{ top: number; bottom: number; height: number }> = [];
  //   let startY = -1;

  //   // 🔥 MEJORA 2: Gap reducido a 10px
  //   // Al ser más pequeño, detectará espacios mínimos entre productos y 
  //   // evitará que salgan duplicados en una misma tira.
  //   const minGap = 10;
  //   let whiteSpaceCounter = 0;

  //   for (let y = 0; y < rowsWithContent.length; y++) {
  //     if (rowsWithContent[y]) {
  //       if (startY === -1) startY = y;
  //       whiteSpaceCounter = 0;
  //     } else if (startY !== -1) {
  //       whiteSpaceCounter++;
  //       if (whiteSpaceCounter >= minGap) {
  //         const endY = y - whiteSpaceCounter;
  //         const blockHeight = endY - startY;

  //         // Solo guardamos bloques que tengan una altura mínima razonable de producto
  //         if (blockHeight > 60) {
  //           allBlocks.push({
  //             top: startY + headerLimitY,
  //             bottom: endY + headerLimitY,
  //             height: blockHeight
  //           });
  //         }
  //         startY = -1;
  //         whiteSpaceCounter = 0;
  //       }
  //     }
  //   }

  //   // Ordenamos por tamaño para quedarnos con los bloques más grandes (productos reales)
  //   const finalBlocks = allBlocks
  //     .sort((a, b) => b.height - a.height)
  //     .slice(0, products.length)
  //     .sort((a, b) => a.top - b.top);

  //   this.logger.log(`🎯 Recorte final: Procesando ${finalBlocks.length} productos detectados.`);

  //   for (let i = 0; i < finalBlocks.length; i++) {
  //     const product = products[i];
  //     const block = finalBlocks[i];

  //     await sharp(imageBuffer)
  //       .extract({
  //         left: cropLeft,
  //         // 🔥 MEJORA 3: Eliminamos el margen negativo (-15)
  //         // Usar block.top exacto garantiza que no "atrapes" el texto que está justo arriba.
  //         top: block.top,
  //         width: cropWidth,
  //         // 🔥 MEJORA 4: Margen extra de altura mínimo (+5)
  //         // Evita que el final del recorte toque el inicio del siguiente producto.
  //         height: block.height + 5
  //       })
  //       .jpeg({ quality: 100 })
  //       .toFile(path.join(this.CROPPED_DIR, `${product.code}.jpg`));

  //     this.logger.log(`✅ Producto guardado: ${product.code} (${block.height}px)`);
  //   }

  //   return true;
  // }
  async cropProducts(imageBuffer: Buffer, products: CropProductData[]): Promise<boolean> {
    if (!fs.existsSync(this.CROPPED_DIR)) {
      fs.mkdirSync(this.CROPPED_DIR, { recursive: true });
    }

    const metadata = await sharp(imageBuffer).metadata();
    const realWidth = metadata.width || 0;
    const realHeight = metadata.height || 0;

    // Umbral del 12% para detectar la zona de la cabecera
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

    // ORDENAR POR POSICIÓN
    allBlocks.sort((a, b) => a.top - b.top);

    // LÓGICA DE FILTRADO INTELIGENTE:
    // Solo descartamos el primer bloque si está MUY arriba (zona cabecera) 
    // Y si al quitarlo todavía nos quedan suficientes bloques para los productos.
    let productBlocks = allBlocks.filter(block => {
      const isHeaderZone = block.top < headerAreaLimit;
      const isVeryLarge = block.height > (realHeight * 0.15); // La cabecera negra suele ser alta

      // Si es un bloque en la zona superior y parece cabecera, lo ignoramos
      if (isHeaderZone && isVeryLarge && allBlocks.length > products.length) {
        return false;
      }
      return true;
    });

    // Si después del filtro aún sobran (o faltan), ajustamos al número exacto de productos
    // priorizando los que están más abajo (los productos nunca están arriba del todo)
    if (productBlocks.length > products.length) {
      productBlocks = productBlocks.slice(productBlocks.length - products.length);
    }

    this.logger.log(`🎯 Procesando ${productBlocks.length} de ${products.length} productos esperados.`);

    for (let i = 0; i < productBlocks.length; i++) {
      const product = products[i];
      const block = productBlocks[i];

      // Validación extra: si el bloque es demasiado alto, lo ajustamos desde abajo
      // Esto resuelve el caso de image_e855f0.png donde la cabecera se pega al producto
      let finalTop = block.top;
      let finalHeight = block.height;
      const expectedMaxHeight = Math.round(realHeight * 0.10);

      if (finalHeight > expectedMaxHeight * 1.5) {
        finalTop = block.bottom - expectedMaxHeight;
        finalHeight = expectedMaxHeight;
      }

      await sharp(imageBuffer)
        .extract({
          left: cropLeft,
          top: Math.max(0, Math.floor(finalTop)),
          width: cropWidth,
          height: Math.min(realHeight - finalTop, Math.ceil(finalHeight))
        })
        .jpeg({ quality: 100 })
        .toFile(path.join(this.CROPPED_DIR, `${product.code}.jpg`));
    }

    return true;
  }
}



