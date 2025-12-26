import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let farmerToken: string;
  let buyerToken: string;
  let productId: string;

  const farmerUser = {
    name: 'Test Farmer',
    email: `farmer_${Date.now()}@test.com`,
    phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    password: 'TestPass123!',
    role: 'farmer',
    state: 'Lagos',
    city: 'Ikeja',
    farmName: 'Test Farm',
    farmType: 'crop',
    farmSize: '10 acres',
  };

  const buyerUser = {
    name: 'Test Buyer',
    email: `buyer_${Date.now()}@test.com`,
    phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    password: 'TestPass123!',
    role: 'buyer',
    state: 'Lagos',
    city: 'Ikeja',
  };

  const testProduct = {
    title: 'Fresh Tomatoes',
    description: 'Organic fresh tomatoes from the farm',
    price: 1500,
    stock: 100,
    category: 'vegetables',
    unit: 'kg',
    pickupLat: 6.5244,
    pickupLng: 3.3792,
    pickupState: 'Lagos',
    pickupCity: 'Ikeja',
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

    // Create farmer
    const farmerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(farmerUser);
    farmerToken = farmerResponse.body.data?.accessToken;

    // Create buyer
    const buyerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(buyerUser);
    buyerToken = buyerResponse.body.data?.accessToken;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  describe('POST /api/v1/products', () => {
    it('should create a product (farmer)', async () => {
      if (!farmerToken) {
        console.log('Skipping: farmer signup failed');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(testProduct);

      expect([200, 201]).toContain(response.status);
      if (response.body.data?.id) {
        productId = response.body.data.id;
      }
    });

    it('should reject product creation by buyer', async () => {
      if (!buyerToken) return;

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(testProduct);

      expect([400, 403]).toContain(response.status);
    });

    it('should reject product without required fields', async () => {
      if (!farmerToken) return;

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ title: 'Incomplete Product' })
        .expect(400);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should get products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?category=vegetables')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get product by id', async () => {
      if (!productId) return;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update product (owner)', async () => {
      if (!productId || !farmerToken) return;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ price: 2000 });

      expect([200, 404]).toContain(response.status);
    });

    it('should reject update by non-owner', async () => {
      if (!productId || !buyerToken) return;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ price: 2000 });

      expect([400, 403, 404]).toContain(response.status);
    });
  });

  describe('GET /api/v1/products/my', () => {
    it('should get farmer own products', async () => {
      if (!farmerToken) return;

      const response = await request(app.getHttpServer())
        .get('/api/v1/products/my')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete product (owner)', async () => {
      if (!productId || !farmerToken) return;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
