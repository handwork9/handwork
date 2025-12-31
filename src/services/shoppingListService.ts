import apiClient from './apiClient';

export interface ShoppingListItem {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    unit?: string;
    stock?: number;
    farmer?: {
      id: string;
      businessName: string;
    };
  };
  quantity: number;
  notes?: string;
  isPurchased: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  visibility: 'private' | 'shared';
  shareCode?: string;
  userId: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListStatistics {
  totalItems: number;
  purchasedItems: number;
  estimatedTotal: number;
  categories: { name: string; count: number }[];
}

class ShoppingListService {
  // Get all shopping lists
  async getAll(): Promise<ShoppingList[]> {
    return apiClient.get<ShoppingList[]>('/shopping-lists');
  }

  // Get or create default shopping list
  async getOrCreateDefault(): Promise<ShoppingList> {
    return apiClient.get<ShoppingList>('/shopping-lists/default');
  }

  // Get a specific shopping list
  async getById(id: string): Promise<ShoppingList> {
    return apiClient.get<ShoppingList>(`/shopping-lists/${id}`);
  }

  // Get shared list by share code
  async getByShareCode(shareCode: string): Promise<ShoppingList> {
    return apiClient.get<ShoppingList>(`/shopping-lists/shared/${shareCode}`);
  }

  // Create a new shopping list
  async create(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
    visibility?: 'private' | 'shared';
  }): Promise<ShoppingList> {
    return apiClient.post<ShoppingList>('/shopping-lists', data);
  }

  // Update a shopping list
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
      visibility?: 'private' | 'shared';
    }
  ): Promise<ShoppingList> {
    return apiClient.patch<ShoppingList>(`/shopping-lists/${id}`, data);
  }

  // Delete a shopping list
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/shopping-lists/${id}`);
  }

  // Duplicate a shopping list
  async duplicate(id: string, newName?: string): Promise<ShoppingList> {
    return apiClient.post<ShoppingList>(`/shopping-lists/${id}/duplicate`, { name: newName });
  }

  // Get list statistics
  async getStatistics(id: string): Promise<ShoppingListStatistics> {
    return apiClient.get<ShoppingListStatistics>(`/shopping-lists/${id}/statistics`);
  }

  // Add item to shopping list
  async addItem(
    listId: string,
    data: {
      productId: string;
      quantity?: number;
      notes?: string;
    }
  ): Promise<ShoppingListItem> {
    return apiClient.post<ShoppingListItem>(`/shopping-lists/${listId}/items`, data);
  }

  // Add multiple items
  async addItems(
    listId: string,
    items: { productId: string; quantity?: number; notes?: string }[]
  ): Promise<ShoppingListItem[]> {
    return apiClient.post<ShoppingListItem[]>(`/shopping-lists/${listId}/items/bulk`, { items });
  }

  // Update item
  async updateItem(
    listId: string,
    itemId: string,
    data: {
      quantity?: number;
      notes?: string;
      isPurchased?: boolean;
    }
  ): Promise<ShoppingListItem> {
    return apiClient.patch<ShoppingListItem>(`/shopping-lists/${listId}/items/${itemId}`, data);
  }

  // Remove item
  async removeItem(listId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/shopping-lists/${listId}/items/${itemId}`);
  }

  // Reorder items
  async reorderItems(listId: string, itemIds: string[]): Promise<void> {
    await apiClient.post(`/shopping-lists/${listId}/items/reorder`, { itemIds });
  }

  // Mark all items as purchased
  async markAllPurchased(listId: string): Promise<void> {
    await apiClient.post(`/shopping-lists/${listId}/items/mark-all-purchased`);
  }

  // Unmark all items
  async unmarkAll(listId: string): Promise<void> {
    await apiClient.post(`/shopping-lists/${listId}/items/unmark-all`);
  }

  // Clear purchased items
  async clearPurchased(listId: string): Promise<void> {
    await apiClient.delete(`/shopping-lists/${listId}/items/purchased`);
  }

  // Add items from order
  async addFromOrder(
    listId: string,
    orderItems: { productId: string; quantity: number }[]
  ): Promise<ShoppingListItem[]> {
    return apiClient.post<ShoppingListItem[]>(`/shopping-lists/${listId}/from-order`, {
      items: orderItems,
    });
  }

  // Quick add to default list
  async quickAdd(productId: string, quantity: number = 1): Promise<ShoppingListItem> {
    const defaultList = await this.getOrCreateDefault();
    return this.addItem(defaultList.id, { productId, quantity });
  }

  // Calculate estimated total for a list
  calculateEstimatedTotal(items: ShoppingListItem[]): number {
    return items.reduce((total, item) => {
      if (item.product && !item.isPurchased) {
        return total + Number(item.product.price) * item.quantity;
      }
      return total;
    }, 0);
  }

  // Get progress percentage
  getProgress(items: ShoppingListItem[]): number {
    if (items.length === 0) return 0;
    const purchased = items.filter((item) => item.isPurchased).length;
    return Math.round((purchased / items.length) * 100);
  }
}

export const shoppingListService = new ShoppingListService();
export default shoppingListService;
