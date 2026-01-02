/**
 * Delivery Service
 * Handles delivery options, time slots, pickup locations, and delivery speed calculations
 */

import { apiClient } from './apiClient';
import { 
  DeliverySpeed, 
  DeliverySpeedOption, 
  DeliveryTimeSlot, 
  PickupLocationOption 
} from '../types';

// Delivery speed configurations
export const DELIVERY_SPEEDS: DeliverySpeedOption[] = [
  {
    speed: 'express',
    label: 'Express',
    description: 'Delivered within 1-2 hours',
    estimatedTime: '1-2 hours',
    priceMultiplier: 1.5,
    icon: 'flash',
    available: true,
  },
  {
    speed: 'same_day',
    label: 'Same Day',
    description: 'Delivered today before 9 PM',
    estimatedTime: 'Today',
    priceMultiplier: 1.25,
    icon: 'today',
    available: true,
  },
  {
    speed: 'next_day',
    label: 'Next Day',
    description: 'Delivered tomorrow',
    estimatedTime: 'Tomorrow',
    priceMultiplier: 1.1,
    icon: 'calendar-outline',
    available: true,
  },
  {
    speed: 'standard',
    label: 'Standard',
    description: 'Delivered in 2-3 days',
    estimatedTime: '2-3 days',
    priceMultiplier: 1.0,
    icon: 'cube-outline',
    available: true,
  },
  {
    speed: 'economy',
    label: 'Economy',
    description: 'Delivered in 3-5 days',
    estimatedTime: '3-5 days',
    priceMultiplier: 0.85,
    icon: 'wallet-outline',
    available: true,
  },
];

/**
 * Get available delivery speeds based on time of day
 */
export function getAvailableDeliverySpeeds(): DeliverySpeedOption[] {
  const now = new Date();
  const hour = now.getHours();
  
  return DELIVERY_SPEEDS.map(speed => {
    let available = true;
    
    // Express not available after 7 PM
    if (speed.speed === 'express' && hour >= 19) {
      available = false;
    }
    
    // Same-day not available after 4 PM
    if (speed.speed === 'same_day' && hour >= 16) {
      available = false;
    }
    
    return { ...speed, available };
  });
}

/**
 * Get delivery speed price multiplier
 */
export function getDeliverySpeedMultiplier(speed: DeliverySpeed): number {
  const option = DELIVERY_SPEEDS.find(s => s.speed === speed);
  return option?.priceMultiplier || 1.0;
}

/**
 * Generate time slots for scheduled delivery
 */
export function generateTimeSlots(daysAhead: number = 7): DeliveryTimeSlot[] {
  const slots: DeliveryTimeSlot[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  // Time windows
  const windows = [
    { start: 9, end: 12, label: '9 AM - 12 PM' },
    { start: 12, end: 15, label: '12 PM - 3 PM' },
    { start: 15, end: 18, label: '3 PM - 6 PM' },
    { start: 18, end: 21, label: '6 PM - 9 PM' },
  ];
  
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const dateLabel = dayOffset === 0 ? 'Today' : 
      dayOffset === 1 ? 'Tomorrow' : 
      date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    const dateString = date.toISOString().split('T')[0];
    
    windows.forEach((window, idx) => {
      // Skip past time slots for today
      if (dayOffset === 0 && currentHour >= window.start - 1) {
        return;
      }
      
      // Create ISO date for the slot start time
      const slotDate = new Date(date);
      slotDate.setHours(window.start, 0, 0, 0);
      
      slots.push({
        id: `${dayOffset}-${idx}`,
        date: dateString,
        startTime: `${window.start.toString().padStart(2, '0')}:00`,
        endTime: `${window.end.toString().padStart(2, '0')}:00`,
        label: `${dateLabel}, ${window.label}`,
        isoDate: slotDate.toISOString(),
        available: true,
      });
    });
  }
  
  return slots;
}

/**
 * Get pickup locations near user
 */
export async function getPickupLocations(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  city?: string;
  state?: string;
  hasRefrigeration?: boolean;
}): Promise<PickupLocationOption[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.latitude) queryParams.append('latitude', params.latitude.toString());
    if (params.longitude) queryParams.append('longitude', params.longitude.toString());
    if (params.radiusKm) queryParams.append('radiusKm', params.radiusKm.toString());
    if (params.city) queryParams.append('city', params.city);
    if (params.state) queryParams.append('state', params.state);
    if (params.hasRefrigeration !== undefined) {
      queryParams.append('hasRefrigeration', params.hasRefrigeration.toString());
    }
    
    const response = await apiClient.get<{ success: boolean; data: PickupLocationOption[] }>(
      `/pickup-locations/nearby?${queryParams.toString()}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return [];
  }
}

/**
 * Get all pickup locations for a state/city
 */
export async function getPickupLocationsByArea(state: string, city?: string): Promise<PickupLocationOption[]> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('state', state);
    if (city) queryParams.append('city', city);
    
    const response = await apiClient.get<{ success: boolean; data: PickupLocationOption[] }>(
      `/pickup-locations?${queryParams.toString()}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return [];
  }
}

/**
 * Get pickup location details
 */
export async function getPickupLocationDetails(id: string): Promise<PickupLocationOption | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: PickupLocationOption }>(
      `/pickup-locations/${id}`
    );
    
    if (response.success) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching pickup location details:', error);
    return null;
  }
}

/**
 * Calculate delivery fee with speed option
 */
export function calculateDeliveryFeeWithSpeed(
  baseDeliveryFee: number, 
  speed: DeliverySpeed
): number {
  const multiplier = getDeliverySpeedMultiplier(speed);
  return Math.round(baseDeliveryFee * multiplier);
}

/**
 * Calculate pickup point discount
 */
export function calculatePickupPointDiscount(
  deliveryFee: number,
  pickupPoint: PickupLocationOption
): number {
  if (pickupPoint.deliveryDiscount > 0) {
    return pickupPoint.deliveryDiscount;
  }
  
  if (pickupPoint.deliveryDiscountPercent > 0) {
    return Math.round(deliveryFee * (pickupPoint.deliveryDiscountPercent / 100));
  }
  
  // Default 20% discount for pickup points
  return Math.round(deliveryFee * 0.2);
}

/**
 * Format delivery time estimate based on speed
 */
export function getDeliveryEstimate(speed: DeliverySpeed, scheduledTime?: string): string {
  if (scheduledTime) {
    const date = new Date(scheduledTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  
  const option = DELIVERY_SPEEDS.find(s => s.speed === speed);
  return option?.estimatedTime || 'Standard delivery';
}

/**
 * Check if a time slot is still available (not passed)
 */
export function isTimeSlotAvailable(slot: DeliveryTimeSlot): boolean {
  const now = new Date();
  const slotDate = new Date(slot.isoDate);
  
  // Slot should be at least 2 hours from now
  const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return slotDate >= minTime;
}

/**
 * Get the next available time slot
 */
export function getNextAvailableSlot(slots: DeliveryTimeSlot[]): DeliveryTimeSlot | null {
  const availableSlots = slots.filter(isTimeSlotAvailable);
  return availableSlots[0] || null;
}

export const deliveryService = {
  getAvailableDeliverySpeeds,
  getDeliverySpeedMultiplier,
  generateTimeSlots,
  getPickupLocations,
  getPickupLocationsByArea,
  getPickupLocationDetails,
  calculateDeliveryFeeWithSpeed,
  calculatePickupPointDiscount,
  getDeliveryEstimate,
  isTimeSlotAvailable,
  getNextAvailableSlot,
  DELIVERY_SPEEDS,
};
