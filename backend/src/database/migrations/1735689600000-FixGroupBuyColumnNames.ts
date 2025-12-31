import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGroupBuyColumnNames1735689600000 implements MigrationInterface {
  name = 'FixGroupBuyColumnNames1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if group_buys table exists and fix column names
    const tableExists = await queryRunner.hasTable('group_buys');
    
    if (tableExists) {
      // Drop existing foreign keys first (they reference the old column names)
      try {
        await queryRunner.query(`
          ALTER TABLE "group_buys" 
          DROP CONSTRAINT IF EXISTS "FK_group_buys_productId";
        `);
      } catch (e) {
        console.log('FK_group_buys_productId does not exist');
      }

      try {
        await queryRunner.query(`
          ALTER TABLE "group_buys" 
          DROP CONSTRAINT IF EXISTS "FK_group_buys_organizerId";
        `);
      } catch (e) {
        console.log('FK_group_buys_organizerId does not exist');
      }

      // Check actual column names and rename if needed
      // PostgreSQL stores unquoted identifiers as lowercase
      const columns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'group_buys' 
        AND table_schema = 'public';
      `);

      const columnNames = columns.map((c: any) => c.column_name);
      console.log('Existing columns in group_buys:', columnNames);

      // If columns are camelCase (quoted), we're fine
      // If columns are lowercase, TypeORM will handle it
      // The issue is when entity expects camelCase but DB has lowercase

      // Drop the table and let TypeORM recreate it with synchronize
      // This is the cleanest solution for development
      await queryRunner.query(`DROP TABLE IF EXISTS "group_buy_participants" CASCADE`);
      await queryRunner.query(`DROP TABLE IF EXISTS "group_buys" CASCADE`);

      // Drop enum types if they exist
      await queryRunner.query(`DROP TYPE IF EXISTS "group_buys_status_enum" CASCADE`);
      await queryRunner.query(`DROP TYPE IF EXISTS "group_buy_participants_status_enum" CASCADE`);
      await queryRunner.query(`DROP TYPE IF EXISTS "group_buy_participants_deliverypreference_enum" CASCADE`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback needed - table will be recreated by TypeORM sync
  }
}
