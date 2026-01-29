import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Создать заказ из корзины
  @Post('checkout')
  createOrder(@Request() req) {
    return this.ordersService.createOrderFromCart(req.user.sub);
  }

  // Получить все заказы текущего пользователя
  @Get()
  getMyOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.sub);
  }

  // Получить конкретный заказ
  @Get(':orderId')
  getOrder(@Request() req, @Param('orderId') orderId: string) {
    return this.ordersService.getUserOrder(req.user.sub, orderId);
  }
}
