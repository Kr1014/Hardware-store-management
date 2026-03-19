import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Patch,
    Param,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Request,
    Query,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CatalogProcessingService } from './catalog-processing.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { N8nProductDto } from './dto/import-product.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname } from 'path';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('products')
// 🔓 Quitamos los guards de aquí para que no bloqueen todo el controlador
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly catalogProcessingService: CatalogProcessingService,
    ) { }

    // ====================================================
    // CREAR PRODUCTO INDIVIDUAL
    // ====================================================
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Protegido
    @Roles(UserRole.ADMIN)
    @UseInterceptors(
        FileInterceptor('image', {
            // RAILWAY ES EFÍMERO: Guardamos en memoria para luego subir a S3, 
            // o simplemente aceptamos la metadata si el frontend subió directo a S3.
            storage: memoryStorage(),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                    return cb(new BadRequestException('Only images allowed!'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 2 * 1024 * 1024 },
        }),
    )
    create(
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        return this.productsService.create(createProductDto, file, req);
    }

    // ====================================================
    // LISTAR PRODUCTOS (Público o Protegido según tu necesidad)
    // ====================================================
    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.productsService.findAll(paginationDto);
    }

    // ====================================================
    // DASHBOARD
    // ====================================================
    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Protegido
    @Roles(UserRole.ADMIN)
    getDashboardStats() {
        return this.productsService.getDashboardStats();
    }

    // ====================================================
    // ACTUALIZAR PRODUCTO
    // ====================================================
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Protegido
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: Partial<CreateProductDto>,
    ) {
        return this.productsService.update(id, updateProductDto);
    }

    // ====================================================
    // IMPORTAR CATÁLOGO PDF (Inicia el flujo)
    // ====================================================
    @Public()
    @UseGuards(ApiKeyGuard) // 🛡️ Protegido por API Key para n8n
    @Post('upload-catalog')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/catalog/temp',
                filename: (req, file, cb) => {
                    cb(null, `catalog-${Date.now()}.pdf`);
                },
            }),
            limits: { fileSize: 50 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (file.mimetype !== 'application/pdf') {
                    return cb(new BadRequestException('Only PDF files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadCatalog(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        this.catalogProcessingService.processPdf(file.path)
            .catch(err => console.error('❌ Error en procesamiento:', err));

        return {
            message: 'Catálogo recibido. Procesando en segundo plano...',
            pdfRecibido: file.filename,
        };
    }

    // ====================================================
    // IMPORT-PROCESS (Recibe datos de n8n)
    // ====================================================
    @Public()
    @UseGuards(ApiKeyGuard) // 🛡️ Protegido por API Key para n8n
    @Post('import-process')
    @UseInterceptors(FileInterceptor('file'))
    async importProcess(
        @UploadedFile() file: Express.Multer.File,
        @Body('products') productsRaw: string,
        @Request() req: any,
    ) {
        console.log('📥 ¡Llegada de datos desde n8n confirmada!');

        // 1. TIMEOUT MANAGEMENT: Evitar que la conexión se cierre mientras se insertan miles de registros
        if (req.setTimeout) {
            req.setTimeout(0); // Ilimitado para esta petición pesada
        }

        if (!file) throw new BadRequestException('No se recibió la imagen de la página');
        if (!productsRaw) throw new BadRequestException('No se recibió el JSON de productos');

        // 2. DATA VALIDATION (DTO)
        let productsRawObj;
        try {
            productsRawObj = JSON.parse(productsRaw);
        } catch (e) {
            throw new BadRequestException('El payload de productos no es un JSON válido');
        }

        const productsInstances = plainToInstance(N8nProductDto, productsRawObj as any[]) as unknown as N8nProductDto[];
        const validProducts: N8nProductDto[] = [];

        for (const prod of productsInstances) {
            const errors = await validate(prod);
            if (errors.length === 0) {
                validProducts.push(prod);
            } else {
                console.warn(`⚠️ [N8N] Producto omitido por datos inválidos (código: ${prod?.code || 'N/A'})`);
            }
        }

        // 3. PROCESAMIENTO
        const result = await this.productsService.processPageImport(file.buffer, validProducts);

        // 4. MEMORY MANAGEMENT: Liberar el buffer a mano para ayudar al Garbage Collector
        file.buffer = Buffer.alloc(0);

        return result;
    }
}