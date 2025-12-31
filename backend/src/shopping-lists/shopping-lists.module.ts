import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList, ShoppingListItem } from '../database/entities/shopping-list.entity';
import { Product } from '../database/entities/product.entity';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingListItem, Product]),
  ],
  providers: [ShoppingListsService],
  controllers: [ShoppingListsController],
  exports: [ShoppingListsService],
})
export class ShoppingListsModule {}
