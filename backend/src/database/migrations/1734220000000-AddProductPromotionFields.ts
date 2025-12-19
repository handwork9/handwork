import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddProductPromotionFields1734220000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isPromoted column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'isPromoted',
        type: 'boolean',
        default: false,
      }),
    );

    // Add promotionExpiresAt column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'promotionExpiresAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add isAdminProduct column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'isAdminProduct',
        type: 'boolean',
        default: false,
      }),
    );

    // Add recommendationScore column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'recommendationScore',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
      }),
    );

    // Add indexes for better query performance
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_isPromoted',
        columnNames: ['isPromoted'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_isAdminProduct',
        columnNames: ['isAdminProduct'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('products', 'IDX_products_isPromoted');
    await queryRunner.dropIndex('products', 'IDX_products_isAdminProduct');

    // Drop columns
    await queryRunner.dropColumn('products', 'recommendationScore');
    await queryRunner.dropColumn('products', 'isAdminProduct');
    await queryRunner.dropColumn('products', 'promotionExpiresAt');
    await queryRunner.dropColumn('products', 'isPromoted');
  }
}
