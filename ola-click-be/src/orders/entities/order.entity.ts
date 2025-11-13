import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 1,
    description: 'Identificador único del pedido',
  })
  declare id: number;

  @Column({ allowNull: false })
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre del cliente',
  })
  declare clientName: string;

  @Column({
    type: DataType.ENUM('initiated', 'sent', 'delivered'),
    allowNull: false,
    defaultValue: 'initiated',
  })
  @ApiProperty({
    example: 'initiated',
    enum: ['initiated', 'sent', 'delivered'],
    description: 'Estado actual del pedido',
  })
  declare status: OrderStatus;

  @HasMany(() => OrderItem)
  @ApiProperty({
    type: () => [OrderItem],
    required: false,
    description: 'Listado de ítems asociados al pedido',
  })
  declare items: OrderItem[];

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
  })
  declare readonly createdAt?: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T01:00:00.000Z',
  })
  declare readonly updatedAt?: Date;
}
