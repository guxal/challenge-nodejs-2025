import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    private redis: RedisService,
  ) {}

  async findAll() {
    const cacheKey = 'orders:list';
    const cached = await this.redis.get(cacheKey);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    const orders = await this.orderModel.findAll({
      where: { status: { [Op.ne]: 'delivered' } },
      include: [OrderItem],
    });

    await this.redis.set(cacheKey, JSON.stringify(orders), 30);
    return orders;
  }

  async findOne(id: number) {
    const order = await this.orderModel.findByPk(id, { include: [OrderItem] });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    const order = await this.orderModel.create(
      { clientName: dto.clientName },
      { include: [OrderItem] },
    );

    for (const item of dto.items) {
      await this.orderItemModel.create({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        orderId: order.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    await this.redis.del('orders:list');
    return this.findOne(order.id);
  }

  async advance(id: number) {
    const order = await this.findOne(id);

    if (order.status === 'initiated') {
      order.status = 'sent';
      await order.save();
      await this.redis.del('orders:list');
      return order;
    }

    if (order.status === 'sent') {
      order.status = 'delivered';
      await order.save();

      await this.orderItemModel.destroy({ where: { orderId: id } });
      await this.orderModel.destroy({ where: { id } });

      await this.redis.del('orders:list');
      await this.redis.del(`order:${id}`);

      return { message: 'Order delivered and deleted' };
    }

    return order;
  }
}
