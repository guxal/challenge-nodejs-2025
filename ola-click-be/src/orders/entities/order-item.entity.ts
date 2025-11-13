import {
  Table,
  Model,
  Column,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { Order } from './order.entity';

export interface OrderItemAttributes {
  id: number;
  orderId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderItemCreationAttributes = Pick<
  OrderItemAttributes,
  'orderId' | 'description' | 'quantity' | 'unitPrice'
>;

@Table({ tableName: 'order_items' })
export class OrderItem extends Model<
  OrderItemAttributes,
  OrderItemCreationAttributes
> {
  @ForeignKey(() => Order)
  @Column({ allowNull: false })
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @Column({ allowNull: false })
  declare description: string;

  @Column(DataType.INTEGER)
  declare quantity: number;

  @Column(DataType.DECIMAL)
  declare unitPrice: number;
}
