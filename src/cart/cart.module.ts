import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, Client])
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule { }
