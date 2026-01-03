import apiClient from './apiClient';

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
  const response = await apiClient.get(
    `/price-alerts/drops?days=${days}`
  );
  return (response as any).data || [];
};

/**
 * Get price history for a specific product
 */
export const getPriceHistory = async (
  productId: string,
  limit: number = 30
): Promise<PriceHistory[]> => {
  const response = await apiClient.get(
    `/price-alerts/history/${productId}?limit=${limit}`
  );
  return (response as any).data || [];
};

export const priceAlertService = {
  getPriceDrops,
  getPriceHistory,
};
