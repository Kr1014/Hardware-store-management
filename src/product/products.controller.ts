import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get('dashboard')
    getDashboardStats() {
        return this.productsService.getDashboardStats();
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
        return this.productsService.update(id, updateProductDto);
    }

}
