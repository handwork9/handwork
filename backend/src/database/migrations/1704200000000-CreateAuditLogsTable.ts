import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1704200000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1704200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."audit_logs_action_enum" AS ENUM(
        'user_create',
        'user_update',
        'user_delete',
        'user_suspend',
        'user_unsuspend',
        'farmer_verify',
        'farmer_reject',
        'rider_approve',
        'rider_reject',
        'rider_update',
        'product_create',
        'product_update',
        'product_delete',
        'product_approve',
        'product_reject',
        'order_update',
        'order_cancel',
        'order_assign_rider',
        'admin_login',
        'admin_logout',
        'settings_update',
        'dispatch_create',
        'dispatch_update',
        'support_ticket_update',
        'support_ticket_close'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."audit_logs_category_enum" AS ENUM(
        'user',
        'farmer',
        'rider',
        'product',
        'order',
        'system',
        'dispatch',
        'support'
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" "public"."audit_logs_action_enum" NOT NULL,
        "category" "public"."audit_logs_category_enum" NOT NULL,
        "targetId" character varying,
        "targetType" character varying,
        "description" text,
        "oldValues" jsonb,
        "newValues" jsonb,
        "metadata" jsonb,
        "ipAddress" character varying,
        "userAgent" character varying,
        "adminId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_category" ON "audit_logs" ("category")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "FK_audit_logs_admin" 
      FOREIGN KEY ("adminId") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_admin"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_category"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_action"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "audit_logs"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."audit_logs_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
  }
}
