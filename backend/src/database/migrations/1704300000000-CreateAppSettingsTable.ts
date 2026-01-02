import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppSettingsTable1704300000000 implements MigrationInterface {
  name = 'CreateAppSettingsTable1704300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create app_settings table
    await queryRunner.query(`
      CREATE TABLE "app_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL UNIQUE,
        "value" jsonb NOT NULL,
        "description" character varying,
        "category" character varying NOT NULL DEFAULT 'general',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id")
      )
    `);

    // Create index on key for faster lookups
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_app_settings_key" ON "app_settings" ("key")
    `);

    // Create index on category
    await queryRunner.query(`
      CREATE INDEX "IDX_app_settings_category" ON "app_settings" ("category")
    `);

    // Insert default settings
    const defaultSettings = [
      {
        key: 'settings_general',
        category: 'general',
        description: 'General application settings',
        value: JSON.stringify({
          data: {
            appName: 'Handwork Marketplace',
            supportEmail: 'support@handwork.com',
            supportPhone: '+234 706 210 3875',
            currency: 'NGN',
            timezone: 'Africa/Lagos',
          }
        }),
      },
      {
        key: 'settings_business',
        category: 'business',
        description: 'Business settings',
        value: JSON.stringify({
          data: {
            commissionRate: 10,
            minOrderAmount: 500,
            maxOrderAmount: 1000000,
            defaultDeliveryFee: 500,
            freeDeliveryThreshold: 10000,
          }
        }),
      },
      {
        key: 'settings_notifications',
        category: 'notifications',
        description: 'Notification settings',
        value: JSON.stringify({
          data: {
            enableEmailNotifications: true,
            enableSmsNotifications: true,
            enablePushNotifications: true,
            orderNotificationEmails: 'orders@handwork.com',
          }
        }),
      },
      {
        key: 'settings_security',
        category: 'security',
        description: 'Security settings',
        value: JSON.stringify({
          data: {
            maxLoginAttempts: 5,
            sessionTimeout: 30,
            requireEmailVerification: true,
            require2FA: false,
          }
        }),
      },
      {
        key: 'settings_operational',
        category: 'operational',
        description: 'Operational settings',
        value: JSON.stringify({
          data: {
            operatingHoursStart: '08:00',
            operatingHoursEnd: '22:00',
            enableMaintenanceMode: false,
            maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
            allowNewRegistrations: true,
          }
        }),
      },
    ];

    for (const setting of defaultSettings) {
      await queryRunner.query(`
        INSERT INTO "app_settings" ("key", "category", "description", "value")
        VALUES ($1, $2, $3, $4)
      `, [setting.key, setting.category, setting.description, setting.value]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_app_settings_category"`);
    await queryRunner.query(`DROP INDEX "IDX_app_settings_key"`);
    await queryRunner.query(`DROP TABLE "app_settings"`);
  }
}
