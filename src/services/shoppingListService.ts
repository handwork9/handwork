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
  // Helper to unwrap API response
  private unwrap<T>(response: any): T {
    if (response && response.success !== undefined && response.data !== undefined) {
      return response.data;
    }
    return response;
  }

  // Get all shopping lists
  async getAll(): Promise<ShoppingList[]> {
    const response = await apiClient.get<any>('/shopping-lists');
    return this.unwrap<ShoppingList[]>(response);
  }

  // Get or create default shopping list
  async getOrCreateDefault(): Promise<ShoppingList> {
    const response = await apiClient.get<any>('/shopping-lists/default');
    return this.unwrap<ShoppingList>(response);
  }

  // Get a specific shopping list
  async getById(id: string): Promise<ShoppingList> {
    const response = await apiClient.get<any>(`/shopping-lists/${id}`);
    return this.unwrap<ShoppingList>(response);
  }

  // Get shared list by share code
  async getByShareCode(shareCode: string): Promise<ShoppingList> {
    const response = await apiClient.get<any>(`/shopping-lists/shared/${shareCode}`);
    return this.unwrap<ShoppingList>(response);
  }

  // Create a new shopping list
  async create(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
    visibility?: 'private' | 'shared';
  }): Promise<ShoppingList> {
    const response = await apiClient.post<any>('/shopping-lists', data);
    return this.unwrap<ShoppingList>(response);
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
    const response = await apiClient.patch<any>(`/shopping-lists/${id}`, data);
    return this.unwrap<ShoppingList>(response);
  }

  // Delete a shopping list
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/shopping-lists/${id}`);
  }

  // Duplicate a shopping list
  async duplicate(id: string, newName?: string): Promise<ShoppingList> {
    const response = await apiClient.post<any>(`/shopping-lists/${id}/duplicate`, { name: newName });
    return this.unwrap<ShoppingList>(response);
  }

  // Get list statistics
  async getStatistics(id: string): Promise<ShoppingListStatistics> {
    const response = await apiClient.get<any>(`/shopping-lists/${id}/statistics`);
    return this.unwrap<ShoppingListStatistics>(response);
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
    const response = await apiClient.post<any>(`/shopping-lists/${listId}/items`, data);
    return this.unwrap<ShoppingListItem>(response);
  }

  // Add multiple items
  async addItems(
    listId: string,
    items: { productId: string; quantity?: number; notes?: string }[]
  ): Promise<ShoppingListItem[]> {
    const response = await apiClient.post<any>(`/shopping-lists/${listId}/items/bulk`, { items });
    return this.unwrap<ShoppingListItem[]>(response);
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
    const response = await apiClient.patch<any>(`/shopping-lists/${listId}/items/${itemId}`, data);
    return this.unwrap<ShoppingListItem>(response);
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
    const response = await apiClient.post<any>(`/shopping-lists/${listId}/from-order`, {
      items: orderItems,
    });
    return this.unwrap<ShoppingListItem[]>(response);
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
