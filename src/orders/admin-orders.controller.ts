import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { UpdateOrderStatusDto, OrderStatus } from './dto/order.dto';

@Controller('admin/orders')
@UseGuards(AdminJwtAuthGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Получить все заказы (с опциональной фильтрацией по статусу)
  @Get()
  getAllOrders(@Query('status') status?: OrderStatus) {
    if (status) {
      return this.ordersService.getOrdersByStatus(status);
    }
    return this.ordersService.getAllOrders();
  }

  // Получить конкретный заказ
  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  // Обновить статус заказа
  @Patch(':orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }
}
