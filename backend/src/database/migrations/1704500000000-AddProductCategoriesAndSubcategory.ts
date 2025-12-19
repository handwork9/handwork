import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoriesAndSubcategory1704500000000 implements MigrationInterface {
  name = 'AddProductCategoriesAndSubcategory1704500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new categories to the product_category enum
    // First, we need to add the new enum values
    await queryRunner.query(`
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'eggs';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'seafood';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'herbs_spices';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'honey';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'nuts';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'tubers';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'oils';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'legumes';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'processed';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'livestock';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'seeds';
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'beverages';
    `);

    // Migrate old 'fish' category to 'seafood'
    await queryRunner.query(`
      UPDATE products SET category = 'seafood' WHERE category = 'fish';
    `);

    // Migrate old 'spices' category to 'herbs_spices'
    await queryRunner.query(`
      UPDATE products SET category = 'herbs_spices' WHERE category = 'spices';
    `);

    // Add subcategory column
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);
    `);

    // Create index on subcategory
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop subcategory index and column
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_subcategory;`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS subcategory;`);

    // Migrate back 'seafood' to 'fish'
    await queryRunner.query(`
      UPDATE products SET category = 'fish' WHERE category = 'seafood';
    `);

    // Migrate back 'herbs_spices' to 'spices'
    await queryRunner.query(`
      UPDATE products SET category = 'spices' WHERE category = 'herbs_spices';
    `);

    // Note: PostgreSQL doesn't support removing enum values easily
    // The new enum values will remain but won't be used
  }
}
