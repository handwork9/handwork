import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShoppingListsService } from './shopping-lists.service';
import {
  CreateShoppingListDto,
  UpdateShoppingListDto,
  AddItemDto,
  UpdateItemDto,
  AddMultipleItemsDto,
  ReorderItemsDto,
} from './dto';
import { AuthenticatedRequest } from '../auth/interfaces';

@Controller('shopping-lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  // Create a new shopping list
  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateShoppingListDto,
  ) {
    return this.shoppingListsService.create(req.user.id, createDto);
  }

  // Get all shopping lists
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.shoppingListsService.findAll(req.user.id);
  }

  // Get or create default shopping list
  @Get('default')
  getOrCreateDefault(@Request() req: AuthenticatedRequest) {
    return this.shoppingListsService.getOrCreateDefault(req.user.id);
  }

  // Get shared list by share code
  @Get('shared/:shareCode')
  findByShareCode(@Param('shareCode') shareCode: string) {
    return this.shoppingListsService.findByShareCode(shareCode);
  }

  // Get a specific shopping list
  @Get(':id')
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.shoppingListsService.findOne(req.user.id, id);
  }

  // Update a shopping list
  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateShoppingListDto,
  ) {
    return this.shoppingListsService.update(req.user.id, id, updateDto);
  }

  // Delete a shopping list
  @Delete(':id')
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.shoppingListsService.remove(req.user.id, id);
  }

  // Duplicate a shopping list
  @Post(':id/duplicate')
  duplicate(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { name?: string },
  ) {
    return this.shoppingListsService.duplicate(req.user.id, id, body.name);
  }

  // Get list statistics
  @Get(':id/statistics')
  getStatistics(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.shoppingListsService.getStatistics(req.user.id, id);
  }

  // Add item to shopping list
  @Post(':id/items')
  addItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() addItemDto: AddItemDto,
  ) {
    return this.shoppingListsService.addItem(req.user.id, id, addItemDto);
  }

  // Add multiple items
  @Post(':id/items/bulk')
  addItems(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AddMultipleItemsDto,
  ) {
    return this.shoppingListsService.addItems(req.user.id, id, dto.items);
  }

  // Update item in shopping list
  @Patch(':id/items/:itemId')
  updateItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.shoppingListsService.updateItem(req.user.id, id, itemId, updateItemDto);
  }

  // Remove item from shopping list
  @Delete(':id/items/:itemId')
  removeItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.shoppingListsService.removeItem(req.user.id, id, itemId);
  }

  // Reorder items
  @Post(':id/items/reorder')
  reorderItems(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.shoppingListsService.reorderItems(req.user.id, id, dto.itemIds);
  }

  // Mark all items as purchased
  @Post(':id/items/mark-all-purchased')
  markAllPurchased(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.shoppingListsService.markAllItems(req.user.id, id, true);
  }

  // Mark all items as unpurchased
  @Post(':id/items/unmark-all')
  unmarkAll(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.shoppingListsService.markAllItems(req.user.id, id, false);
  }

  // Clear purchased items
  @Delete(':id/items/purchased')
  clearPurchased(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.shoppingListsService.clearPurchasedItems(req.user.id, id);
  }

  // Add items from order
  @Post(':id/from-order')
  addFromOrder(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { items: { productId: string; quantity: number }[] },
  ) {
    return this.shoppingListsService.addFromOrder(req.user.id, id, body.items);
  }
}
