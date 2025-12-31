/**
 * Shared formatting utilities for numbers and currency
 */

import { API_CONFIG } from '../constants/config';

/**
 * Fix image URL to use current API host
 * This handles IP changes during development and supports S3 URLs
 * @param url - The image URL to fix
 * @returns Fixed URL with current host or null if invalid
 */
export const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }
  
  // Clean up the URL string
  const cleanUrl = url.trim();
  
  // Validate that it looks like a reasonable URL
  // Reject URLs that are clearly malformed
  if (cleanUrl.includes('undefined') || cleanUrl.includes('null') || cleanUrl.includes('[object')) {
    return null;
  }
  
  // S3 URLs are already valid, just return them as-is
  if (cleanUrl.includes('.s3.amazonaws.com') || cleanUrl.includes('s3.amazonaws.com')) {
    try {
      new URL(cleanUrl); // Validate it parses correctly
      return cleanUrl;
    } catch {
      return null;
    }
  }
  
  // If it's already a valid http/https URL with /uploads/, rewrite the host
  if (cleanUrl.includes('/uploads/')) {
    try {
      const urlObj = new URL(cleanUrl);
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
      const uploadPath = cleanUrl.match(/\/uploads\/.+$/);
      if (uploadPath) {
        try {
          const apiUrl = new URL(API_CONFIG.BASE_URL);
          return `${apiUrl.protocol}//${apiUrl.host}${uploadPath[0]}`;
        } catch {
          return null;
        }
      }
    }
  }
  
  // If it's a relative path starting with /uploads
  if (cleanUrl.startsWith('/uploads/')) {
    try {
      const apiUrl = new URL(API_CONFIG.BASE_URL);
      return `${apiUrl.protocol}//${apiUrl.host}${cleanUrl}`;
    } catch {
      return null;
    }
  }
  
  // Validate other URLs before returning
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      new URL(cleanUrl); // Validate it parses correctly
      return cleanUrl;
    } catch {
      return null;
    }
  }
  
  // Invalid URL format
  return null;
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
    // Skip invalid entries
    if (!img || typeof img !== 'string') {
      continue;
    }
    
    const fixed = fixImageUrl(img);
    if (fixed) {
      // Final validation - ensure it's a proper URL
      try {
        new URL(fixed);
        return fixed;
      } catch {
        continue;
      }
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
