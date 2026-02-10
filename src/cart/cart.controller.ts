import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Post('items')
    addItem(@Request() req, @Body() dto: AddItemDto) {
        return this.cartService.addItem(req.user.userId, dto);
    }

    @Patch('items/:itemId')
    async updateQuantity(
        @Param('itemId') itemId: string,
        @Body('quantity') quantity: number,
        @Request() req
    ) {
        const userId = req.user.id; // Ajusta según tu Auth
        return this.cartService.updateItemQuantity(userId, itemId, quantity);
    }

    @Delete('items/:id')
    removeItem(@Request() req, @Param('id') itemId: string) {
        return this.cartService.removeItem(req.user.userId, itemId);
    }

    @Get()
    getCart(@Request() req) {
        return this.cartService.getCart(req.user.userId);
    }

    @Delete()
    clearCart(@Request() req) {
        return this.cartService.clearCart(req.user.userId);
    }

    @Post('checkout')
    checkout(@Request() req) {
        // Enviamos tanto el userId (para el carrito) como el email (para el correo)
        return this.cartService.checkout(req.user.userId, req.user.email);
    }
}