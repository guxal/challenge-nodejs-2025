import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Listar pedidos pendientes' })
  @ApiOkResponse({ description: 'Listado de pedidos pendientes' })
  @Get()
  getOrders() {
    return this.ordersService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un pedido por ID' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiOkResponse({ description: 'Pedido encontrado' })
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  @ApiCreatedResponse({ description: 'Pedido creado correctamente' })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @ApiOperation({ summary: 'Avanzar el estado de un pedido' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiOkResponse({ description: 'Pedido actualizado' })
  @Post(':id/advance')
  advance(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.advance(id);
  }
}
