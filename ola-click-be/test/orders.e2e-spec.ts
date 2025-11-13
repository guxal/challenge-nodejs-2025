import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import request from 'supertest';
import { OrdersModule } from '../src/orders/orders.module';
import { RedisService } from '../src/redis/redis.service';

class RedisServiceMock {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('Orders API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        OrdersModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(new RedisServiceMock())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /orders should return an empty array initially', async () => {
    const response = await request(app.getHttpServer()).get('/orders').expect(200);

    expect(response.body).toEqual([]);
  });

  it('POST /orders should create an order and list it', async () => {
    const payload = {
      clientName: 'Juan Pérez',
      items: [
        {
          description: 'Combo hamburguesa',
          quantity: 2,
          unitPrice: 25.5,
        },
        {
          description: 'Refresco',
          quantity: 2,
          unitPrice: 5.75,
        },
      ],
    };

    const createResponse = await request(app.getHttpServer())
      .post('/orders')
      .send(payload)
      .expect(201);

    expect(createResponse.body).toMatchObject({
      clientName: payload.clientName,
      status: 'initiated',
      items: [
        expect.objectContaining({
          description: 'Combo hamburguesa',
          quantity: 2,
        }),
        expect.objectContaining({
          description: 'Refresco',
          quantity: 2,
        }),
      ],
    });

    const listResponse = await request(app.getHttpServer()).get('/orders').expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      clientName: payload.clientName,
      status: 'initiated',
    });
  });

  it('POST /orders/:id/advance should transition status and eventually delete order', async () => {
    const payload = {
      clientName: 'Ana Gómez',
      items: [
        {
          description: 'Pizza',
          quantity: 1,
          unitPrice: 30,
        },
      ],
    };

    const { body: created } = await request(app.getHttpServer())
      .post('/orders')
      .send(payload)
      .expect(201);

    expect(created.status).toBe('initiated');

    const advanceToSent = await request(app.getHttpServer())
      .post(`/orders/${created.id}/advance`)
      .expect(201);

    expect(advanceToSent.body.status).toBe('sent');

    const advanceToDelivered = await request(app.getHttpServer())
      .post(`/orders/${created.id}/advance`)
      .expect(201);

    expect(advanceToDelivered.body).toEqual({
      message: 'Order delivered and deleted',
    });

    await request(app.getHttpServer()).get(`/orders/${created.id}`).expect(404);

    const listResponse = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(listResponse.body).toEqual([]);
  });
});

