import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWalletTransactionsTable1704400000000 implements MigrationInterface {
  name = 'CreateWalletTransactionsTable1704400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create wallet_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'wallet_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ownerId',
            type: 'uuid',
          },
          {
            name: 'ownerType',
            type: 'enum',
            enum: ['farmer', 'rider', 'buyer'],
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['credit', 'debit'],
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'order_earnings',
              'delivery_earnings',
              'commission_deduction',
              'withdrawal',
              'refund',
              'bonus',
              'penalty',
              'wallet_topup',
              'transfer',
            ],
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'balanceBefore',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'balanceAfter',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'NGN'",
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'orderNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'reference',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_ownerId',
        columnNames: ['ownerId'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_ownerType',
        columnNames: ['ownerType'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_orderId',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_reference',
        columnNames: ['reference'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('wallet_transactions');
  }
}
