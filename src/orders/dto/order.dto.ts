import { IsEnum, IsOptional } from 'class-validator';

export enum OrderStatus {
  PROCESSING = 'PROCESSING',  // В обработке
  ACCEPTED = 'ACCEPTED',      // Принято
  SHIPPED = 'SHIPPED',        // Отправлено
  DELIVERED = 'DELIVERED',    // Доставлено
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
