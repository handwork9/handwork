import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { User } from '../database/entities';

@Module({
  imports: [TerminusModule, TypeOrmModule.forFeature([User]), ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
