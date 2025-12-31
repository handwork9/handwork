import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSubscriptionBoxAndGroupBuyTables1767182600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_boxes table
    await queryRunner.createTable(
      new Table({
        name: 'subscription_boxes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['weekly', 'biweekly', 'monthly'],
            default: "'weekly'",
          },
          {
            name: 'size',
            type: 'enum',
            enum: ['small', 'medium', 'large', 'family'],
            default: "'medium'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'paused', 'cancelled'],
            default: "'active'",
          },
          {
            name: 'preferredCategories',
            type: 'text',
            isArray: true,
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'excludedProducts',
            type: 'text',
            isArray: true,
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'deliveryAddress',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'deliveryCity',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'deliveryState',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'deliveryLatitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'deliveryLongitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'preferredDeliveryDay',
            type: 'int',
            default: 6,
          },
          {
            name: 'preferredDeliveryTime',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'specialInstructions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '50',
            default: "'wallet'",
          },
          {
            name: 'autoRenew',
            type: 'boolean',
            default: true,
          },
          {
            name: 'nextDeliveryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'pausedUntil',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'deliveriesCompleted',
            type: 'int',
            default: 0,
          },
          {
            name: 'averageRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'subscription_boxes',
      new TableIndex({
        name: 'IDX_subscription_boxes_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_boxes',
      new TableIndex({
        name: 'IDX_subscription_boxes_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'subscription_boxes',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create subscription_box_deliveries table
    await queryRunner.createTable(
      new Table({
        name: 'subscription_box_deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'subscriptionId',
            type: 'uuid',
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deliveryNumber',
            type: 'int',
          },
          {
            name: 'scheduledDate',
            type: 'date',
          },
          {
            name: 'actualDeliveryDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
            default: "'scheduled'",
          },
          {
            name: 'contents',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'totalValue',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'rating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'feedback',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'subscription_box_deliveries',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'subscription_boxes',
        onDelete: 'CASCADE',
      }),
    );

    // Create group_buys table
    await queryRunner.createTable(
      new Table({
        name: 'group_buys',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'organizerId',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'originalPrice',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'currentDiscount',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'minParticipants',
            type: 'int',
            default: 3,
          },
          {
            name: 'maxParticipants',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'currentParticipants',
            type: 'int',
            default: 0,
          },
          {
            name: 'startDate',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'endDate',
            type: 'timestamp',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'successful', 'failed', 'cancelled'],
            default: "'active'",
          },
          {
            name: 'shareCode',
            type: 'varchar',
            length: '10',
            isUnique: true,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: true,
          },
          {
            name: 'quantityPerPerson',
            type: 'int',
            default: 1,
          },
          {
            name: 'deliveryArea',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'productSnapshot',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'group_buys',
      new TableIndex({
        name: 'IDX_group_buys_productId',
        columnNames: ['productId'],
      }),
    );

    await queryRunner.createIndex(
      'group_buys',
      new TableIndex({
        name: 'IDX_group_buys_organizerId',
        columnNames: ['organizerId'],
      }),
    );

    await queryRunner.createIndex(
      'group_buys',
      new TableIndex({
        name: 'IDX_group_buys_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'group_buys',
      new TableIndex({
        name: 'IDX_group_buys_shareCode',
        columnNames: ['shareCode'],
      }),
    );

    await queryRunner.createForeignKey(
      'group_buys',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'group_buys',
      new TableForeignKey({
        columnNames: ['organizerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create group_buy_participants table
    await queryRunner.createTable(
      new Table({
        name: 'group_buy_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'groupBuyId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'hasPaid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deliveryAddress',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'deliveryCity',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'deliveryState',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refunded',
            type: 'boolean',
            default: false,
          },
          {
            name: 'refundedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'group_buy_participants',
      new TableIndex({
        name: 'IDX_group_buy_participants_groupBuyId',
        columnNames: ['groupBuyId'],
      }),
    );

    await queryRunner.createIndex(
      'group_buy_participants',
      new TableIndex({
        name: 'IDX_group_buy_participants_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'group_buy_participants',
      new TableIndex({
        name: 'IDX_group_buy_participants_unique',
        columnNames: ['groupBuyId', 'userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'group_buy_participants',
      new TableForeignKey({
        columnNames: ['groupBuyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_buys',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'group_buy_participants',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('group_buy_participants', true);
    await queryRunner.dropTable('group_buys', true);
    await queryRunner.dropTable('subscription_box_deliveries', true);
    await queryRunner.dropTable('subscription_boxes', true);
  }
}
