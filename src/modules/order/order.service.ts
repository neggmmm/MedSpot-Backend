import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/orderItem.entity';
import { OrderResponseDto } from './dto/orderResponse.dto';
import { orderMethods, orderStatus } from './entity/order.entity';
import { GetCart } from '../cart/application/use-case/get-cart.use-case';
import { DeleteCart } from '../cart/application/use-case/delete-cart.use-case';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly getCart : GetCart,
    private readonly deleteCart : DeleteCart,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async createOrder(
    userId: number,
    paymentMethod: string,
  ): Promise<OrderResponseDto | { orderId: number; paymentRequired: boolean }> {
    const cart = await this.getCart.execute(userId);
    if (!cart || !cart.items?.length) {
      throw new NotFoundException('Cart not found or empty');
    }

    const items = cart.items.map((item) =>
      this.orderItemRepository.create({
        product: item.product,
        quantity: item.quantity,
        price: item.product.price,
      }),
    );

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );

    const order = this.orderRepository.create({
      name: `Order for user ${userId}`,
      userId,
      totalPrice,
      items,
      method: paymentMethod === 'COD' ? orderMethods.COD : orderMethods.ONLINE,
      status: paymentMethod === 'COD' ? orderStatus.ACCEPTED : orderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    if (paymentMethod === 'COD') {
      await this.deleteCart.execute(userId);
      return this.toOrderResponse(savedOrder);
    }

    return {
      orderId: savedOrder.id,
      paymentRequired: true,
    };
  }

  // Get all orders with pagination for admin
  async getAllOrders(query: OrderQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders,
      total,
    };
  }

  async getMyOrders(userId: number) {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async getOrder(userId: number, orderId: number) {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.userId = :userId', { userId })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    return order;
  }

  private toOrderResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }

  // Returns revenue and completed orders/items for a given provider (userId on product)
  async getProviderStats(providerId: number) {
    const raw = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.product', 'product')
      .innerJoin('oi.order', 'order')
      .where('product.userId = :providerId', { providerId })
      .andWhere('order.status = :status', { status: orderStatus.DELIVERED })
      .select('COUNT(DISTINCT order.id)', 'completedOrders')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'totalItems')
      .addSelect('COALESCE(SUM(oi.quantity * oi.price), 0)', 'revenue')
      .getRawOne();

    return {
      providerId,
      completedOrders: Number(raw?.completedOrders ?? 0),
      totalItems: Number(raw?.totalItems ?? 0),
      revenue: Number(raw?.revenue ?? 0),
    };
  }

  // Returns global totals for completed orders and revenue across the whole project
  async getGlobalStats() {
    const totalCompletedOrders = await this.orderRepository.count({
      where: { status: orderStatus.DELIVERED },
    });

    const revenueRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalPrice), 0)', 'revenue')
      .where('order.status = :status', { status: orderStatus.DELIVERED })
      .getRawOne();

    return {
      totalCompletedOrders: Number(totalCompletedOrders ?? 0),
      totalRevenue: Number(revenueRaw?.revenue ?? 0),
    };
  }
}
