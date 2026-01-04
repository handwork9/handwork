import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FeatureFlagsController],
  exports: [],
})
export class FeatureFlagsModule {}
