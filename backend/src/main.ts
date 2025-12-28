import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { initSentry } from './common/utils/sentry';
import { validateEnv } from './config/env.validation';

// WebSocket gateways run on same port as HTTP server (required for Railway/cloud deployment)

async function bootstrap() {
  // Validate environment variables before starting
  validateEnv();
  
  // Initialize Sentry for error tracking (before app creation)
  initSentry();
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Increase body size limit for image uploads (50MB)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Security - configure helmet to allow cross-origin image loading
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', '*'],
      },
    },
  }));

  // CORS - Allow all origins in development for mobile app access
  const isDev = configService.get('NODE_ENV') !== 'production';
  app.enableCors({
    origin: isDev ? true : configService.get('FRONTEND_URL', 'https://handwork.com'),
    credentials: true,
  });

  // API Prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  // Root endpoint (outside of API prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req: any, res: any) => {
    res.json({
      service: 'Handwork API',
      status: 'running',
      version: '1.0.0',
      documentation: '/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Global Response Interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global Exception Filter (catches all unhandled errors)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints ? Object.values(error.constraints) : [];
          return `${error.property}: ${constraints.join(', ')}`;
        });
        console.error('Validation errors:', messages);
        return new BadRequestException(messages);
      },
    }),
  );

  // WebSocket Adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Handwork Marketplace API')
      .setDescription(
        'API documentation for Handwork Marketplace - connecting farmers, buyers, and riders',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Products', 'Product catalog endpoints')
      .addTag('Cart', 'Shopping cart endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Riders', 'Rider management endpoints')
      .addTag('Dispatch', 'Dispatch and delivery endpoints')
      .addTag('Payments', 'Payment processing endpoints')
      .addTag('Notifications', 'Notification endpoints')
      .addTag('Admin', 'Administrative endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Handwork API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
