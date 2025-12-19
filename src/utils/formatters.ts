/**
 * Shared formatting utilities for numbers and currency
 */

import { API_CONFIG } from '../constants/config';

/**
 * Fix image URL to use current API host
 * This handles IP changes during development
 * @param url - The image URL to fix
 * @returns Fixed URL with current host or null if invalid
 */
export const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }
  
  // If it's already a valid http/https URL with /uploads/, rewrite the host
  if (url.includes('/uploads/')) {
    try {
      const urlObj = new URL(url);
      // Extract the current API host from config
      const apiUrl = new URL(API_CONFIG.BASE_URL);
      // Replace the host with the current API host
      urlObj.host = apiUrl.host;
      urlObj.protocol = apiUrl.protocol;
      // Remove /api/v1 from path if present in uploads URL
      return urlObj.href;
    } catch {
      // URL parsing failed, try simple string replacement
      // Match any IP:port or localhost:port pattern
      const uploadPath = url.match(/\/uploads\/.+$/);
      if (uploadPath) {
        const apiUrl = new URL(API_CONFIG.BASE_URL);
        return `${apiUrl.protocol}//${apiUrl.host}${uploadPath[0]}`;
      }
    }
  }
  
  // If it's a relative path starting with /uploads
  if (url.startsWith('/uploads/')) {
    const apiUrl = new URL(API_CONFIG.BASE_URL);
    return `${apiUrl.protocol}//${apiUrl.host}${url}`;
  }
  
  // Return as-is for other URLs (external CDN, etc.)
  return url;
};

/**
 * Get the first valid image URL from an array
 * @param images - Array of image URLs
 * @returns First valid fixed URL or null
 */
export const getFirstValidImageUrl = (images: string[] | null | undefined): string | null => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  for (const img of images) {
    const fixed = fixImageUrl(img);
    if (fixed) {
      return fixed;
    }
  }
  
  return null;
};

/**
 * Format a number with K/M suffixes for large values
 * @param num - The number to format
 * @returns Formatted string (e.g., "1K", "2.5M", "999")
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const val = num / 1000000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const val = num / 1000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return num.toLocaleString();
};

/**
 * Format currency with K/M suffixes for large values
 * @param num - The number to format
 * @param symbol - Currency symbol (default: '₦')
 * @returns Formatted currency string (e.g., "₦1K", "₦2.5M", "₦999")
 */
export const formatCurrency = (num: number, symbol = '₦'): string => {
  if (num >= 1000000) {
    const val = num / 1000000;
    return `${symbol}${val % 1 === 0 ? val : val.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const val = num / 1000;
    return `${symbol}${val % 1 === 0 ? val : val.toFixed(1)}K`;
  }
  return `${symbol}${num.toLocaleString()}`;
};

/**
 * Format currency with full display (comma separated, no abbreviation)
 * Use for exact amounts like prices, checkout totals, etc.
 * @param num - The number to format
 * @param symbol - Currency symbol (default: '₦')
 * @returns Formatted currency string (e.g., "₦1,000", "₦2,500,000")
 */
export const formatCurrencyFull = (num: number, symbol = '₦'): string => {
  return `${symbol}${num.toLocaleString()}`;
};

/**
 * Format a rating number to one decimal place
 * @param rating - The rating to format
 * @returns Formatted rating string (e.g., "4.5")
 */
export const formatRating = (rating: number | undefined | null): string => {
  if (rating === undefined || rating === null) return '0.0';
  return Number(rating).toFixed(1);
};

/**
 * Format distance in km
 * @param distance - Distance in km
 * @returns Formatted distance string (e.g., "2.5 km")
 */
export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(1)} km`;
};

/**
 * Format duration in minutes
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "30 min", "1h 30min")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};
