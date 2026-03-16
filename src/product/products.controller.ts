// import {
//     Controller,
//     Get,
//     Post,
//     Body,
//     UseGuards,
//     Patch,
//     Param,
//     UseInterceptors,
//     UploadedFile,
//     BadRequestException,
//     Request,
//     Res,
// } from '@nestjs/common';
// import express from 'express';

// import { ProductsService } from './products.service';
// import { CatalogProcessingService } from './catalog-processing.service';
// import { CreateProductDto } from './dto/create-product.dto';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '../auth/enums/user-role.enum';

// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';

// @Controller('products')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class ProductsController {
//     constructor(
//         private readonly productsService: ProductsService,
//         private readonly catalogProcessingService: CatalogProcessingService,
//     ) { }

//     // ====================================================
//     // CREAR PRODUCTO INDIVIDUAL
//     // ====================================================

//     @Post()
//     @Roles(UserRole.ADMIN)
//     @UseInterceptors(
//         FileInterceptor('image', {
//             storage: diskStorage({
//                 destination: './uploads/products',
//                 filename: (req, file, cb) => {
//                     const uniqueSuffix =
//                         Date.now() + '-' + Math.round(Math.random() * 1e9);
//                     cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
//                 },
//             }),
//             fileFilter: (req, file, cb) => {
//                 if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
//                     return cb(
//                         new BadRequestException(
//                             'Only image files (jpg, jpeg, png, webp) are allowed!',
//                         ),
//                         false,
//                     );
//                 }
//                 cb(null, true);
//             },
//             limits: {
//                 fileSize: 2 * 1024 * 1024, // 2MB
//             },
//         }),
//     )
//     create(
//         @Body() createProductDto: CreateProductDto,
//         @UploadedFile() file: Express.Multer.File,
//         @Request() req: any,
//     ) {
//         return this.productsService.create(createProductDto, file, req);
//     }

//     // ====================================================
//     // LISTAR PRODUCTOS
//     // ====================================================

//     @Get()
//     findAll() {
//         return this.productsService.findAll();
//     }

//     // ====================================================
//     // DASHBOARD
//     // ====================================================

//     @Get('dashboard')
//     @Roles(UserRole.ADMIN)
//     getDashboardStats() {
//         return this.productsService.getDashboardStats();
//     }

//     // ====================================================
//     // ACTUALIZAR PRODUCTO
//     // ====================================================

//     @Patch(':id')
//     @Roles(UserRole.ADMIN)
//     async update(
//         @Param('id') id: string,
//         @Body() updateProductDto: Partial<CreateProductDto>,
//     ) {
//         return this.productsService.update(id, updateProductDto);
//     }

//     // ====================================================
//     // IMPORTAR CATÁLOGO PDF
//     // ====================================================

//     @Post('upload-catalog')
//     // @Roles(UserRole.ADMIN)
//     @UseInterceptors(
//         FileInterceptor('file', {
//             storage: diskStorage({
//                 destination: './uploads/catalog/temp',
//                 filename: (req, file, cb) => {
//                     cb(null, `catalog-${Date.now()}.pdf`);
//                 },
//             }),
//             limits: {
//                 fileSize: 50 * 1024 * 1024, // 50MB
//             },
//             fileFilter: (req, file, cb) => {
//                 if (file.mimetype !== 'application/pdf') {
//                     return cb(
//                         new BadRequestException('Only PDF files are allowed!'),
//                         false,
//                     );
//                 }
//                 cb(null, true);
//             },
//         }),
//     )
//     async uploadCatalog(@UploadedFile() file: Express.Multer.File) {
//         if (!file) {
//             throw new BadRequestException('File is required');
//         }

//         // 🔥 QUITAMOS EL AWAIT para que responda de inmediato al frontend
//         // El proceso seguirá corriendo "en las sombras" del servidor.
//         this.catalogProcessingService.processPdf(file.path)
//             .catch(err => {
//                 // Importante loguear el error porque ya no le llegará al usuario
//                 console.error('❌ Error en el procesamiento de fondo:', err);
//             });

//         return {
//             message: 'Catálogo recibido. El procesamiento ha comenzado en segundo plano.',
//             pdfRecibido: file.filename,
//         };
//     }

//     @Post('import-process')
//     // @Roles(UserRole.ADMIN)
//     @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en n8n
//     async importProcess(
//         @UploadedFile() file: Express.Multer.File,
//         @Body('products') productsRaw: string,
//     ) {

//         console.log('📥 ¡Llegada de datos desde n8n confirmada!');

//         if (!file) throw new BadRequestException('No se recibió la imagen de la página');
//         if (!productsRaw) throw new BadRequestException('No se recibió el JSON de productos');

//         // Convertimos el string que envía n8n a un Array real
//         const products = JSON.parse(productsRaw);

//         // Pasamos el buffer y la lista de productos al servicio
//         return this.productsService.processPageImport(file.buffer, products);
//     }
// }


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
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CatalogProcessingService } from './catalog-processing.service';
import { CreateProductDto } from './dto/create-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Public } from 'src/auth/decorators/public.decorator';

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
            storage: diskStorage({
                destination: './uploads/products',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
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
    findAll() {
        return this.productsService.findAll();
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
    @Post('upload-catalog')
    // @UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Protegido: Solo un ADMIN puede subir el PDF inicial
    // @Roles(UserRole.ADMIN)
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
    @Post('import-process')
    // 🔓 SIN GUARDS: Permite que n8n entregue los resultados del OCR
    @UseInterceptors(FileInterceptor('file'))
    async importProcess(
        @UploadedFile() file: Express.Multer.File,
        @Body('products') productsRaw: string,
    ) {
        console.log('📥 ¡Llegada de datos desde n8n confirmada!');

        if (!file) throw new BadRequestException('No se recibió la imagen de la página');
        if (!productsRaw) throw new BadRequestException('No se recibió el JSON de productos');

        const products = JSON.parse(productsRaw);
        return this.productsService.processPageImport(file.buffer, products);
    }
}