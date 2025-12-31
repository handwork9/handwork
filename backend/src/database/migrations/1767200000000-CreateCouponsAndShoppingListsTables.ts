import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCouponsAndShoppingListsTables1767200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create coupons table
    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['percentage', 'fixed_amount', 'free_delivery'],
            default: "'percentage'",
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'minOrderAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maxDiscountAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'startDate',
            type: 'timestamp',
          },
          {
            name: 'endDate',
            type: 'timestamp',
          },
          {
            name: 'usageLimit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'usageLimitPerUser',
            type: 'int',
            default: 1,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'expired', 'disabled'],
            default: "'active'",
          },
          {
            name: 'firstOrderOnly',
            type: 'boolean',
            default: false,
          },
          {
            name: 'newUsersOnly',
            type: 'boolean',
            default: false,
          },
          {
            name: 'applicableCategories',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'applicableProductIds',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'excludedProductIds',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on coupon code
    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        name: 'IDX_COUPON_CODE',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    // Create coupon_usages table
    await queryRunner.createTable(
      new Table({
        name: 'coupon_usages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'couponId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'discountApplied',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on coupon_usages
    await queryRunner.createIndex(
      'coupon_usages',
      new TableIndex({
        name: 'IDX_COUPON_USAGE_COUPON_USER',
        columnNames: ['couponId', 'userId'],
      }),
    );

    // Create foreign key for coupon_usages.couponId
    await queryRunner.createForeignKey(
      'coupon_usages',
      new TableForeignKey({
        columnNames: ['couponId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupons',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key for coupon_usages.userId
    await queryRunner.createForeignKey(
      'coupon_usages',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create shopping_lists table
    await queryRunner.createTable(
      new Table({
        name: 'shopping_lists',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
          },
          {
            name: 'visibility',
            type: 'enum',
            enum: ['private', 'shared'],
            default: "'private'",
          },
          {
            name: 'shareCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key for shopping_lists.userId
    await queryRunner.createForeignKey(
      'shopping_lists',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create shopping_list_items table
    await queryRunner.createTable(
      new Table({
        name: 'shopping_list_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'shoppingListId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isPurchased',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on shopping_list_items
    await queryRunner.createIndex(
      'shopping_list_items',
      new TableIndex({
        name: 'IDX_SHOPPING_LIST_ITEM_LIST',
        columnNames: ['shoppingListId'],
      }),
    );

    // Create foreign key for shopping_list_items.shoppingListId
    await queryRunner.createForeignKey(
      'shopping_list_items',
      new TableForeignKey({
        columnNames: ['shoppingListId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shopping_lists',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key for shopping_list_items.productId
    await queryRunner.createForeignKey(
      'shopping_list_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop shopping_list_items table
    await queryRunner.dropTable('shopping_list_items', true);

    // Drop shopping_lists table
    await queryRunner.dropTable('shopping_lists', true);

    // Drop coupon_usages table
    await queryRunner.dropTable('coupon_usages', true);

    // Drop coupons table
    await queryRunner.dropTable('coupons', true);
  }
}
