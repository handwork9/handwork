import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { WalletTransaction, User } from '../database/entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WalletTransaction, User]),
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
// Bills module v2 - Tue Dec 30 17:32:02 PST 2025
