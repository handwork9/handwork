import { apiClient } from './api';

export interface PriceDrop {
  product: {
    id: string;
    title: string;
    currentPrice: number;
    images: string[];
    farmerName: string;
  };
  priceChange: {
    oldPrice: number;
    newPrice: number;
    percentageOff: number;
    changedAt: string;
  };
}

export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  createdAt: string;
}

/**
 * Get recent price drops for user's favorited products
 */
export const getPriceDrops = async (days: number = 7): Promise<PriceDrop[]> => {
  const response = await apiClient.get<{ success: boolean; data: PriceDrop[] }>(
    `/price-alerts/drops?days=${days}`
  );
  return response.data.data;
};

/**
 * Get price history for a specific product
 */
export const getPriceHistory = async (
  productId: string,
  limit: number = 30
): Promise<PriceHistory[]> => {
  const response = await apiClient.get<{ success: boolean; data: PriceHistory[] }>(
    `/price-alerts/history/${productId}?limit=${limit}`
  );
  return response.data.data;
};

export const priceAlertService = {
  getPriceDrops,
  getPriceHistory,
};
