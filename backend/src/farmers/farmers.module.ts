import { Module, forwardRef } from '@nestjs/common';
import { FarmersController } from './farmers.controller';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [FarmersController],
})
export class FarmersModule {}
