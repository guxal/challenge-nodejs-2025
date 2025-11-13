import { Table, Model, Column, DataType, HasMany } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'initiated' | 'sent' | 'delivered';

export interface OrderAttributes {
  id: number;
  clientName: string;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  items?: OrderItem[];
}

export type OrderCreationAttributes = Pick<OrderAttributes, 'clientName'> &
  Partial<Pick<OrderAttributes, 'status'>>;

@Table({ tableName: 'orders' })
export class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  @Column({ allowNull: false })
  declare clientName: string;

  @Column({
    type: DataType.ENUM('initiated', 'sent', 'delivered'),
    allowNull: false,
    defaultValue: 'initiated',
  })
  declare status: OrderStatus;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];
}
