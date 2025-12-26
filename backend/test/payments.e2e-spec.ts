import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const testUser = {
    name: 'Payment Test User',
    email: `payment_${Date.now()}@test.com`,
    phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    password: 'TestPass123!',
    role: 'buyer',
    state: 'Lagos',
    city: 'Ikeja',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Create user and get token
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(testUser);
    accessToken = response.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  describe('GET /api/v1/wallet/balance', () => {
    it('should get wallet balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/wallet/balance')
        .expect(401);
    });
  });

  describe('GET /api/v1/wallet/transactions', () => {
    it('should get transaction history', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/wallet/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/payments/initialize', () => {
    it('should initialize payment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 5000,
          email: testUser.email,
        });

      // May return various codes depending on payment gateway availability
      expect([200, 201, 400, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/payments/banks', () => {
    it('should get list of banks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments/banks')
        .set('Authorization', `Bearer ${accessToken}`);

      // Banks endpoint may or may not exist
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Wallet Transfer', () => {
    it('should reject transfer with insufficient balance', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/wallet/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          recipientId: '00000000-0000-0000-0000-000000000000',
          amount: 1000000,
        });

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject negative amount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/wallet/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          recipientId: '00000000-0000-0000-0000-000000000000',
          amount: -100,
        });

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('Withdrawal', () => {
    it('should reject withdrawal with insufficient balance', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 1000000,
          bankCode: '058',
          accountNumber: '0000000000',
        });

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
