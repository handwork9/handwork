import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeProductImagesToTextArray1734445000000 implements MigrationInterface {
  name = 'ChangeProductImagesToTextArray1734445000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists and what type it is
    const tableInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'images'
    `);

    if (tableInfo.length > 0 && tableInfo[0].data_type !== 'ARRAY') {
      // Backup existing data
      await queryRunner.query(`
        ALTER TABLE products ADD COLUMN images_backup text
      `).catch(() => {});
      
      await queryRunner.query(`
        UPDATE products SET images_backup = images WHERE images IS NOT NULL
      `).catch(() => {});

      // Drop the old column and create new one as text array
      await queryRunner.query(`
        ALTER TABLE products DROP COLUMN IF EXISTS images
      `);
      
      await queryRunner.query(`
        ALTER TABLE products ADD COLUMN images text[] DEFAULT '{}'
      `);

      // Migrate data from backup if exists
      await queryRunner.query(`
        UPDATE products 
        SET images = string_to_array(images_backup, ',')
        WHERE images_backup IS NOT NULL AND images_backup != ''
      `).catch(() => {});

      // Clean up backup column
      await queryRunner.query(`
        ALTER TABLE products DROP COLUMN IF EXISTS images_backup
      `).catch(() => {});
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to simple text column
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN IF EXISTS images
    `);
    
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN images text
    `);
  }
}
