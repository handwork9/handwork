import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList, ShoppingListItem } from '../database/entities/shopping-list.entity';
import { Product } from '../database/entities/product.entity';
import {
  CreateShoppingListDto,
  UpdateShoppingListDto,
  AddItemDto,
  UpdateItemDto,
} from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShoppingListsService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private shoppingListItemRepository: Repository<ShoppingListItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Create a new shopping list
  async create(userId: string, dto: CreateShoppingListDto): Promise<ShoppingList> {
    // If this list is set as default, unset other defaults
    if (dto.isDefault) {
      await this.shoppingListRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const shoppingList = this.shoppingListRepository.create({
      ...dto,
      userId,
      shareCode: dto.visibility === 'shared' ? this.generateShareCode() : undefined,
    });

    return this.shoppingListRepository.save(shoppingList);
  }

  // Get all shopping lists for a user
  async findAll(userId: string): Promise<ShoppingList[]> {
    return this.shoppingListRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { isDefault: 'DESC', updatedAt: 'DESC' },
    });
  }

  // Get a single shopping list by ID
  async findOne(userId: string, listId: string): Promise<ShoppingList> {
    const list = await this.shoppingListRepository.findOne({
      where: { id: listId },
      relations: ['items', 'items.product', 'items.product.farmer'],
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    // Check ownership or shared access
    if (list.userId !== userId && list.visibility !== 'shared') {
      throw new ForbiddenException('You do not have access to this shopping list');
    }

    // Sort items by sortOrder
    list.items.sort((a, b) => a.sortOrder - b.sortOrder);

    return list;
  }

  // Get shopping list by share code
  async findByShareCode(shareCode: string): Promise<ShoppingList> {
    const list = await this.shoppingListRepository.findOne({
      where: { shareCode, visibility: 'shared' },
      relations: ['items', 'items.product', 'user'],
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found or not shared');
    }

    return list;
  }

  // Update a shopping list
  async update(userId: string, listId: string, dto: UpdateShoppingListDto): Promise<ShoppingList> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only edit your own shopping lists');
    }

    // If setting this as default, unset other defaults
    if (dto.isDefault) {
      await this.shoppingListRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    // Handle visibility change
    if (dto.visibility === 'shared' && !list.shareCode) {
      (dto as any).shareCode = this.generateShareCode();
    } else if (dto.visibility === 'private') {
      (dto as any).shareCode = null;
    }

    await this.shoppingListRepository.update(listId, dto);
    return this.findOne(userId, listId);
  }

  // Delete a shopping list
  async remove(userId: string, listId: string): Promise<void> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only delete your own shopping lists');
    }

    await this.shoppingListRepository.remove(list);
  }

  // Add item to shopping list
  async addItem(userId: string, listId: string, dto: AddItemDto): Promise<ShoppingListItem> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only add items to your own shopping lists');
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already exists in list
    const existingItem = await this.shoppingListItemRepository.findOne({
      where: { shoppingListId: listId, productId: dto.productId },
    });

    if (existingItem) {
      // Update quantity instead of creating duplicate
      existingItem.quantity += dto.quantity || 1;
      if (dto.notes) existingItem.notes = dto.notes;
      return this.shoppingListItemRepository.save(existingItem);
    }

    // Get max sort order
    const maxSortOrderResult = await this.shoppingListItemRepository
      .createQueryBuilder('item')
      .where('item.shopping_list_id = :listId', { listId })
      .select('MAX(item.sortOrder)', 'max')
      .getRawOne();

    const nextSortOrder = (maxSortOrderResult?.max || 0) + 1;

    const item = this.shoppingListItemRepository.create({
      shoppingListId: listId,
      productId: dto.productId,
      quantity: dto.quantity || 1,
      notes: dto.notes,
      sortOrder: nextSortOrder,
    });

    return this.shoppingListItemRepository.save(item);
  }

  // Add multiple items to shopping list
  async addItems(userId: string, listId: string, items: AddItemDto[]): Promise<ShoppingListItem[]> {
    const results: ShoppingListItem[] = [];
    for (const item of items) {
      const result = await this.addItem(userId, listId, item);
      results.push(result);
    }
    return results;
  }

  // Update item in shopping list
  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<ShoppingListItem> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only update items in your own shopping lists');
    }

    const item = await this.shoppingListItemRepository.findOne({
      where: { id: itemId, shoppingListId: listId },
      relations: ['product'],
    });

    if (!item) {
      throw new NotFoundException('Item not found in shopping list');
    }

    Object.assign(item, dto);
    return this.shoppingListItemRepository.save(item);
  }

  // Remove item from shopping list
  async removeItem(userId: string, listId: string, itemId: string): Promise<void> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only remove items from your own shopping lists');
    }

    const item = await this.shoppingListItemRepository.findOne({
      where: { id: itemId, shoppingListId: listId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in shopping list');
    }

    await this.shoppingListItemRepository.remove(item);
  }

  // Reorder items
  async reorderItems(userId: string, listId: string, itemIds: string[]): Promise<void> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only reorder items in your own shopping lists');
    }

    for (let i = 0; i < itemIds.length; i++) {
      await this.shoppingListItemRepository.update(
        { id: itemIds[i], shoppingListId: listId },
        { sortOrder: i },
      );
    }
  }

  // Mark all items as purchased/unpurchased
  async markAllItems(userId: string, listId: string, isPurchased: boolean): Promise<void> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own shopping lists');
    }

    await this.shoppingListItemRepository.update(
      { shoppingListId: listId },
      { isPurchased },
    );
  }

  // Clear purchased items
  async clearPurchasedItems(userId: string, listId: string): Promise<void> {
    const list = await this.findOne(userId, listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own shopping lists');
    }

    await this.shoppingListItemRepository.delete({
      shoppingListId: listId,
      isPurchased: true,
    });
  }

  // Get default shopping list or create one
  async getOrCreateDefault(userId: string): Promise<ShoppingList> {
    let defaultList = await this.shoppingListRepository.findOne({
      where: { userId, isDefault: true },
      relations: ['items', 'items.product'],
    });

    if (!defaultList) {
      defaultList = await this.create(userId, {
        name: 'My Shopping List',
        isDefault: true,
      });
    }

    return defaultList;
  }

  // Duplicate a shopping list
  async duplicate(userId: string, listId: string, newName?: string): Promise<ShoppingList> {
    const originalList = await this.findOne(userId, listId);

    const newList = await this.create(userId, {
      name: newName || `${originalList.name} (Copy)`,
      description: originalList.description,
      visibility: 'private',
      isDefault: false,
    });

    // Copy items
    for (const item of originalList.items) {
      await this.addItem(userId, newList.id, {
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      });
    }

    return this.findOne(userId, newList.id);
  }

  // Add items from order to shopping list (for reordering)
  async addFromOrder(userId: string, listId: string, orderItems: { productId: string; quantity: number }[]): Promise<ShoppingListItem[]> {
    return this.addItems(
      userId,
      listId,
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
  }

  // Get shopping list statistics
  async getStatistics(userId: string, listId: string): Promise<{
    totalItems: number;
    purchasedItems: number;
    estimatedTotal: number;
    categories: { name: string; count: number }[];
  }> {
    const list = await this.findOne(userId, listId);

    let estimatedTotal = 0;
    const categoryCount: Record<string, number> = {};

    for (const item of list.items) {
      if (item.product) {
        estimatedTotal += Number(item.product.price) * item.quantity;
        const categoryName = (item.product as any).category?.name || 'Uncategorized';
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      }
    }

    return {
      totalItems: list.items.length,
      purchasedItems: list.items.filter((item) => item.isPurchased).length,
      estimatedTotal,
      categories: Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
      })),
    };
  }

  private generateShareCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }
}
