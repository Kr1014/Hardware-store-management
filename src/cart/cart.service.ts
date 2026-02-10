import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { AddItemDto } from './dto/add-item.dto';
import { MailService } from '../mail/mail.service';
import { DataSource } from 'typeorm';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        private mailService: MailService,
        private dataSource: DataSource,
    ) { }

    async addItem(userId: string, dto: AddItemDto) {
        // 1. Validate product exists and has sufficient stock
        const product = await this.productRepository.findOne({
            where: { id: dto.productId }
        });

        if (!product) {
            throw new NotFoundException(`Product ${dto.productId} not found`);
        }

        if (product.stock < dto.quantity) {
            throw new BadRequestException(
                `Insufficient stock. Available: ${product.stock}, Requested: ${dto.quantity}`
            );
        }

        // 2. Get or create cart for user
        let cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items']
        });

        if (!cart) {
            cart = this.cartRepository.create({ userId });
            cart = await this.cartRepository.save(cart);
        }

        // 3. Check if item already exists in cart
        const existingItem = await this.cartItemRepository.findOne({
            where: { cartId: cart.id, productId: dto.productId }
        });

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + dto.quantity;

            if (product.stock < newQuantity) {
                throw new BadRequestException(
                    `Insufficient stock. Available: ${product.stock}, Cart total would be: ${newQuantity}`
                );
            }

            existingItem.quantity = newQuantity;
            return this.cartItemRepository.save(existingItem);
        }

        // 4. Create new cart item
        const cartItem = this.cartItemRepository.create({
            cartId: cart.id,
            productId: dto.productId,
            quantity: dto.quantity
        });

        return this.cartItemRepository.save(cartItem);
    }

    async removeItem(userId: string, itemId: string) {
        const cart = await this.cartRepository.findOne({
            where: { userId }
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const item = await this.cartItemRepository.findOne({
            where: { id: itemId, cartId: cart.id }
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        await this.cartItemRepository.remove(item);
        return { message: 'Item removed from cart' };
    }

    async getCart(userId: string) {
        const cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items', 'items.product']
        });

        if (!cart) {
            return { items: [], total: 0 };
        }

        const total = cart.items.reduce((sum, item) => {
            return sum + (Number(item.product.salePrice1) * item.quantity);
        }, 0);

        return {
            ...cart,
            total: total.toFixed(2)
        };
    }

    async clearCart(userId: string) {
        const cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items']
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        await this.cartItemRepository.remove(cart.items);
        return { message: 'Cart cleared successfully' };
    }

    async updateItemQuantity(userId: string, itemId: string, newQuantity: number) {
        if (newQuantity < 1) {
            throw new BadRequestException('La cantidad debe ser al menos 1');
        }

        // 1. Verificar que el carrito existe
        const cart = await this.cartRepository.findOne({ where: { userId } });
        if (!cart) throw new NotFoundException('Carrito no encontrado');

        // 2. Buscar el item con su producto para validar stock
        const item = await this.cartItemRepository.findOne({
            where: { id: itemId, cartId: cart.id },
            relations: ['product']
        });

        if (!item) throw new NotFoundException('Producto no encontrado en el carrito');

        // 3. Validar stock
        if (item.product.stock < newQuantity) {
            throw new BadRequestException(`Stock insuficiente. Disponible: ${item.product.stock}`);
        }

        // 4. Actualizar y guardar
        item.quantity = newQuantity;
        return await this.cartItemRepository.save(item);
    }

    async checkout(userId: string, userEmail: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // USAR EL MANAGER DE LA TRANSACCIÓN PARA TODO
            const cart = await queryRunner.manager.findOne(Cart, {
                where: { userId },
                relations: ['items', 'items.product']
            });

            if (!cart || cart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }

            const total = cart.items.reduce((sum, item) => {
                return sum + (Number(item.product.salePrice1) * item.quantity);
            }, 0);

            // Primero borramos los items en la DB (dentro de la transacción)
            await queryRunner.manager.remove(CartItem, cart.items);

            // Enviamos los correos
            // NOTA: Si esto falla, el catch hará rollback y el carrito NO se borrará
            await this.mailService.sendClientOrderEmail(cart.items, total);
            await this.mailService.sendAdminOrderEmail(userEmail, cart.items, total);

            await queryRunner.commitTransaction();

            return {
                message: 'Order placed successfully.',
                orderId: cart.id
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
