import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductApprovalStatus1767300000000 implements MigrationInterface {
  name = 'AddProductApprovalStatus1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for product approval status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."products_approvalstatus_enum" AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns to products table
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "approvalStatus" "public"."products_approvalstatus_enum" NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "rejectionReason" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "approvedById" uuid
    `);

    // Create index on approvalStatus for faster queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_approvalStatus" ON "products" ("approvalStatus")
    `);

    // Auto-approve all existing products so they remain visible
    await queryRunner.query(`
      UPDATE "products" 
      SET "approvalStatus" = 'approved', "approvedAt" = NOW() 
      WHERE "approvalStatus" = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_approvalStatus"`);

    // Remove columns
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "approvedById"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "approvedAt"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "approvalStatus"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."products_approvalstatus_enum"`);
  }
}
