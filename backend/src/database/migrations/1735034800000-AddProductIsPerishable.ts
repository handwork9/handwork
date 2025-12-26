import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIsPerishable1735034800000 implements MigrationInterface {
  name = 'AddProductIsPerishable1735034800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isPerishable column with default true (most agro products are perishable)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "isPerishable" boolean NOT NULL DEFAULT true
    `);

    // Set non-perishable for known dry goods categories
    // These can be shipped interstate safely
    await queryRunner.query(`
      UPDATE "products" 
      SET "isPerishable" = false 
      WHERE category IN ('grains', 'spices', 'dried_goods', 'nuts', 'seeds', 'honey', 'oils')
         OR subcategory IN ('rice', 'beans', 'maize', 'wheat', 'millet', 'sorghum', 'groundnut', 'palm_oil', 'dried_fish', 'dried_pepper', 'garri', 'yam_flour', 'cassava_flour')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "isPerishable"
    `);
  }
}
