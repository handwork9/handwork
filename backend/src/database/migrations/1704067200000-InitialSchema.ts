import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Try to enable PostGIS extension (optional - for geospatial features)
    // This won't fail if PostGIS is not installed
    await queryRunner.query(`
      DO $$ 
      BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available. Geospatial features will be limited.';
      END $$;
    `);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'rider', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM (
          'pending', 'confirmed', 'assigned', 'picked_up', 
          'in_transit', 'delivered', 'cancelled', 'refunded'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'wallet', 'cash');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE rider_status AS ENUM ('available', 'busy', 'offline', 'suspended');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE dispatch_status AS ENUM (
          'pending', 'searching', 'offered', 'matched', 
          'failed', 'scheduled', 'cancelled'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE premium_tier AS ENUM ('none', 'basic', 'plus', 'pro');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "phone" VARCHAR(20) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "role" user_role NOT NULL DEFAULT 'buyer',
        "avatar_url" VARCHAR(500),
        "is_verified" BOOLEAN DEFAULT FALSE,
        "is_active" BOOLEAN DEFAULT TRUE,
        "fcm_token" VARCHAR(255),
        "wallet_balance" DECIMAL(12, 2) DEFAULT 0,
        "premium_tier" premium_tier DEFAULT 'none',
        "premium_expires_at" TIMESTAMP,
        "refresh_token" VARCHAR(500),
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "farmer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "price" DECIMAL(12, 2) NOT NULL,
        "unit" VARCHAR(50) NOT NULL,
        "quantity_available" INTEGER NOT NULL DEFAULT 0,
        "category" VARCHAR(100) NOT NULL,
        "images" TEXT[] DEFAULT '{}',
        "state" VARCHAR(100) NOT NULL,
        "address" TEXT,
        "pickup_latitude" DECIMAL(10, 7),
        "pickup_longitude" DECIMAL(10, 7),
        "pickup_location" GEOMETRY(POINT, 4326),
        "is_available" BOOLEAN DEFAULT TRUE,
        "is_featured" BOOLEAN DEFAULT FALSE,
        "rating" DECIMAL(3, 2) DEFAULT 0,
        "review_count" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create riders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "riders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "vehicle_type" VARCHAR(50),
        "vehicle_number" VARCHAR(50),
        "license_number" VARCHAR(100),
        "status" rider_status DEFAULT 'offline',
        "is_verified" BOOLEAN DEFAULT FALSE,
        "current_state" VARCHAR(100),
        "current_latitude" DECIMAL(10, 7),
        "current_longitude" DECIMAL(10, 7),
        "current_location" GEOMETRY(POINT, 4326),
        "current_order_id" UUID,
        "location_updated_at" TIMESTAMP,
        "rating" DECIMAL(3, 2) DEFAULT 0,
        "total_deliveries" INTEGER DEFAULT 0,
        "total_earnings" DECIMAL(12, 2) DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "buyer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rider_id" UUID REFERENCES "riders"("id") ON DELETE SET NULL,
        "status" order_status DEFAULT 'pending',
        "payment_status" payment_status DEFAULT 'pending',
        "subtotal" DECIMAL(12, 2) NOT NULL,
        "delivery_fee" DECIMAL(12, 2) DEFAULT 0,
        "service_fee" DECIMAL(12, 2) DEFAULT 0,
        "total_amount" DECIMAL(12, 2) NOT NULL,
        "delivery_state" VARCHAR(100) NOT NULL,
        "delivery_address" TEXT NOT NULL,
        "delivery_latitude" DECIMAL(10, 7),
        "delivery_longitude" DECIMAL(10, 7),
        "delivery_notes" TEXT,
        "estimated_delivery_time" TIMESTAMP,
        "confirmed_at" TIMESTAMP,
        "assigned_at" TIMESTAMP,
        "picked_up_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "cancellation_reason" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "quantity" INTEGER NOT NULL,
        "unit_price" DECIMAL(12, 2) NOT NULL,
        "subtotal" DECIMAL(12, 2) NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create carts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create cart_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cart_id" UUID NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE ("cart_id", "product_id")
      );
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "order_id" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
        "amount" DECIMAL(12, 2) NOT NULL,
        "currency" VARCHAR(10) DEFAULT 'ngn',
        "payment_method" payment_method NOT NULL,
        "status" payment_status DEFAULT 'pending',
        "stripe_payment_intent_id" VARCHAR(255),
        "paystack_reference" VARCHAR(255),
        "metadata" JSONB,
        "paid_at" TIMESTAMP,
        "refunded_amount" DECIMAL(12, 2) DEFAULT 0,
        "refunded_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create dispatch_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dispatch_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "rider_id" UUID REFERENCES "riders"("id") ON DELETE SET NULL,
        "status" dispatch_status DEFAULT 'pending',
        "attempt_count" INTEGER DEFAULT 0,
        "metadata" JSONB,
        "matched_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create otp_codes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "otp_codes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" VARCHAR(20) NOT NULL,
        "code" VARCHAR(10) NOT NULL,
        "is_used" BOOLEAN DEFAULT FALSE,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
      CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users"("phone");
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

      CREATE INDEX IF NOT EXISTS "idx_products_farmer" ON "products"("farmer_id");
      CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products"("category");
      CREATE INDEX IF NOT EXISTS "idx_products_state" ON "products"("state");
      CREATE INDEX IF NOT EXISTS "idx_products_available" ON "products"("is_available");
      CREATE INDEX IF NOT EXISTS "idx_products_location" ON "products" USING GIST("pickup_location");

      CREATE INDEX IF NOT EXISTS "idx_orders_buyer" ON "orders"("buyer_id");
      CREATE INDEX IF NOT EXISTS "idx_orders_rider" ON "orders"("rider_id");
      CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
      CREATE INDEX IF NOT EXISTS "idx_orders_created" ON "orders"("created_at" DESC);

      CREATE INDEX IF NOT EXISTS "idx_riders_user" ON "riders"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_riders_status" ON "riders"("status");
      CREATE INDEX IF NOT EXISTS "idx_riders_state" ON "riders"("current_state");
      CREATE INDEX IF NOT EXISTS "idx_riders_location" ON "riders" USING GIST("current_location");

      CREATE INDEX IF NOT EXISTS "idx_payments_user" ON "payments"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_payments_order" ON "payments"("order_id");
      CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");

      CREATE INDEX IF NOT EXISTS "idx_dispatch_order" ON "dispatch_logs"("order_id");
      CREATE INDEX IF NOT EXISTS "idx_dispatch_rider" ON "dispatch_logs"("rider_id");

      CREATE INDEX IF NOT EXISTS "idx_otp_phone" ON "otp_codes"("phone");
      CREATE INDEX IF NOT EXISTS "idx_otp_expires" ON "otp_codes"("expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dispatch_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "riders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS premium_tier;`);
    await queryRunner.query(`DROP TYPE IF EXISTS dispatch_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS rider_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role;`);
  }
}
