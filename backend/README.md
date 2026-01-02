# Handwork Marketplace Backend

A comprehensive NestJS backend for the Handwork agricultural marketplace platform, featuring real-time order tracking, intelligent dispatch, and secure payments.

## 🚀 Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with PostGIS (geospatial queries)
- **Cache/Queue**: Redis + BullMQ
- **Realtime**: Socket.io (WebSockets)
- **Payments**: Stripe (with Paystack support for NGN)
- **Auth**: JWT + Refresh Tokens + OTP via Twilio
- **Push Notifications**: Firebase Cloud Messaging
- **Documentation**: Swagger/OpenAPI

## 📁 Project Structure

```
src/
├── admin/           # Admin dashboard APIs
├── auth/            # Authentication (JWT, OTP, strategies)
├── cart/            # Shopping cart management
├── common/          # Shared utilities, guards, decorators
├── config/          # Configuration modules
├── database/        # Entities, migrations, seeds
├── dispatch/        # Rider matching algorithm
├── health/          # Health check endpoints
├── notifications/   # Push & SMS notifications
├── orders/          # Order lifecycle management
├── payments/        # Stripe integration, webhooks
├── products/        # Product CRUD with geo queries
├── riders/          # Rider management & location tracking
└── users/           # User CRUD
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# With development tools (PGAdmin, Bull Board)
docker-compose --profile dev up -d

# Run migrations
npm run migration:run

# Seed sample data
npm run seed
```

### Manual Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Start development server
npm run start:dev
```

## 📋 API Documentation

Once running, access Swagger UI at: `http://localhost:3000/api/docs`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/otp/send` | Send OTP verification |
| GET | `/products` | Browse products |
| POST | `/cart/items` | Add to cart |
| POST | `/orders` | Create order |
| POST | `/payments/intent` | Create payment |
| POST | `/dispatch/order/:id` | Dispatch order |
| GET | `/admin/dashboard` | Admin metrics |

## 🔌 WebSocket Endpoints

| Port | Namespace | Purpose |
|------|-----------|---------|
| 3001 | `/riders` | Rider location tracking |
| 3002 | `/dispatch` | Order offers & acceptance |
| 3003 | `/notifications` | Real-time notifications |

### Rider Location Events

```javascript
// Connect to riders namespace
const socket = io('http://localhost:3001/riders');

// Join as rider
socket.emit('rider:join', { riderId: 'uuid' });

// Send location update
socket.emit('location:update', {
  riderId: 'uuid',
  latitude: 6.5244,
  longitude: 3.3792
});
```

### Dispatch Events

```javascript
// Connect to dispatch namespace
const socket = io('http://localhost:3002/dispatch');

// Rider joins
socket.emit('rider:join', { riderId: 'uuid' });

// Listen for order offers
socket.on('order:offer', (offer) => {
  console.log('New order offer:', offer);
});

// Accept order
socket.emit('offer:accept', { orderId: 'uuid', riderId: 'uuid' });
```

## 🧮 Dispatch Algorithm

The intelligent dispatch system uses the following logic:

1. **State Constraint**: Only matches riders in the same state
2. **Location Freshness**: Riders must have updated location within 60 seconds
3. **Distance Calculation**: Uses PostGIS for efficient geo queries
4. **ETA Estimation**: Based on distance with average speed of 25 km/h
5. **Scoring**: Weighted formula: `ETA (50%) + Distance (30%) + Rating (20%)`
6. **Offer Cascade**: Offers to top 3 riders with 30-second timeout each
7. **Fallback**: Schedules for later if no riders available after 5 attempts

### Configuration

```typescript
// src/config/dispatch.config.ts
export const dispatchConfig = {
  maxDeliveryTimeMinutes: 45,
  quickDeliveryThresholdMinutes: 30,
  riderAcceptTimeoutSeconds: 30,
  maxDispatchAttempts: 5,
  locationStaleThresholdSeconds: 60,
  searchRadiusKm: 15,
  maxRidersToOffer: 3,
  retryDelaySeconds: 10,
};
```

## 💳 Payment Flow

1. **Create Payment Intent**: `POST /payments/intent`
2. **Client-side Stripe Confirmation**
3. **Webhook Verification**: `POST /webhooks/stripe`
4. **Order Confirmation**: Automatic on successful payment

### Wallet Payments

```bash
# Top up wallet
POST /payments/wallet/topup
{ "amount": 10000 }

# Pay with wallet
POST /payments/wallet/pay
{ "orderId": "uuid" }
```

## 🔐 Authentication

### JWT Tokens

- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry

### OTP Verification

```bash
# Send OTP
POST /auth/otp/send
{ "phone": "+2348012345678" }

# Verify OTP
POST /auth/otp/verify
{ "phone": "+2348012345678", "code": "123456" }
```

## 📦 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=handwork

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (for push notifications)
FIREBASE_CREDENTIALS={"type":"service_account",...}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Liveness Probe**: `GET /health/live`
- **Readiness Probe**: `GET /health/ready`
- **Bull Dashboard**: `http://localhost:3100` (dev profile)

## 🚢 Deployment

### Production Docker

```bash
docker build -t handwork-api .
docker run -p 3000:3000 --env-file .env.prod handwork-api
```

### Kubernetes

The `/health/live` and `/health/ready` endpoints are designed for K8s probes.

## 📝 License

MIT License - Handwork Team
# Deployment trigger - Fri Jan  2 05:46:32 PST 2026
