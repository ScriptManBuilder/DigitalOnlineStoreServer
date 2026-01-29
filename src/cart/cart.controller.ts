import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Получить корзину текущего пользователя
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.sub);
  }

  // Добавить товар в корзину
  @Post('add')
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.sub, dto);
  }

  // Обновить количество товара в корзине
  @Patch('item/:itemId')
  updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.sub, itemId, dto);
  }

  // Удалить товар из корзины
  @Delete('item/:itemId')
  removeFromCart(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(req.user.sub, itemId);
  }

  // Очистить корзину
  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.sub);
  }
}
