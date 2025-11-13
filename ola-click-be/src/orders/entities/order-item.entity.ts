import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 1, description: 'Identificador único del ítem' })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ allowNull: false })
  @ApiProperty({ example: 1, description: 'Identificador del pedido asociado' })
  declare orderId: number;

  @BelongsTo(() => Order)
  @ApiProperty({
    type: () => Order,
    description: 'Pedido al que pertenece el ítem',
  })
  declare order: Order;

  @Column({ allowNull: false })
  @ApiProperty({
    example: 'Combo hamburguesa',
    description: 'Descripción del ítem',
  })
  declare description: string;

  @Column(DataType.INTEGER)
  @ApiProperty({ example: 2, description: 'Cantidad solicitada' })
  declare quantity: number;

  @Column(DataType.DECIMAL)
  @ApiProperty({ example: 25.5, description: 'Precio unitario' })
  declare unitPrice: number;

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
