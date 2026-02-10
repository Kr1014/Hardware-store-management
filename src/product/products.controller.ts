import { Controller, Get, Post, Body, UseGuards, Patch, Param, UseInterceptors, UploadedFile, BadRequestException, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './uploads/products',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return cb(new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 2 * 1024 * 1024 // 2MB
        }
    }))
    create(
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ) {
        return this.productsService.create(createProductDto, file, req);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get('dashboard')
    @Roles(UserRole.ADMIN)
    getDashboardStats() {
        return this.productsService.getDashboardStats();
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
        return this.productsService.update(id, updateProductDto);
    }

}
