import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto, OrderStatus } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Создать заказ из корзины (для пользователя)
  async createOrderFromCart(userId: string) {
    // Получаем корзину пользователя с товарами
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Рассчитываем общую сумму
    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Создаём заказ с товарами
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalPrice,
        status: 'PROCESSING',
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Очищаем корзину после создания заказа
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.formatOrder(order);
  }

  // Получить все заказы пользователя (для пользователя)
  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.formatOrder(order));
  }

  // Получить один заказ пользователя (для пользователя)
  async getUserOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  // ============ АДМИНСКИЕ МЕТОДЫ ============

  // Получить все заказы (для админа)
  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.formatOrderForAdmin(order));
  }

  // Получить заказы по статусу (для админа)
  async getOrdersByStatus(status: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.formatOrderForAdmin(order));
  }

  // Получить один заказ (для админа)
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderForAdmin(order);
  }

  // Обновить статус заказа (для админа)
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return this.formatOrderForAdmin(order);
  }

  // Форматирование заказа для пользователя
  private formatOrder(order: any) {
    return {
      id: order.id,
      status: order.status,
      statusText: this.getStatusText(order.status),
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        productImageUrl: item.product?.imageUrl,
        quantity: item.quantity,
        totalPrice: item.productPrice * item.quantity,
      })),
    };
  }

  // Форматирование заказа для админа (с данными пользователя)
  private formatOrderForAdmin(order: any) {
    return {
      ...this.formatOrder(order),
      user: order.user,
    };
  }

  // Получить текстовое описание статуса
  private getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      PROCESSING: 'В обработке',
      ACCEPTED: 'Принято',
      SHIPPED: 'Отправлено',
      DELIVERED: 'Доставлено',
    };
    return statusTexts[status] || status;
  }
}
