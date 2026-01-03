import apiClient from './apiClient';

export interface DeliverySlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  additionalFee: number;
  availableCapacity: number;
  isAvailable: boolean;
  displayTime: string;
}

export interface ScheduledDelivery {
  id: string;
  orderId: string;
  orderNumber?: string;
  scheduledDate: string;
  slot: {
    id: string;
    name: string;
    displayTime: string;
  };
  status: string;
  specialInstructions?: string;
  isExpress: boolean;
  schedulingFee: number;
}

export interface ScheduleDeliveryRequest {
  orderId: string;
  slotId: string;
  scheduledDate: string;
  specialInstructions?: string;
  isExpress?: boolean;
}

class DeliverySchedulingService {
  /**
   * Get available delivery slots for a specific date
   */
  async getAvailableSlots(date: string, state?: string, city?: string): Promise<DeliverySlot[]> {
    try {
      const params = new URLSearchParams({ date });
      if (state) params.append('state', state);
      if (city) params.append('city', city);
      
      const response = await apiClient.get(`/delivery-scheduling/slots?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch delivery slots:', error);
      return [];
    }
  }

  /**
   * Get available slots for multiple dates (for UI display)
   */
  async getSlotsForDateRange(dates: string[], state?: string, city?: string): Promise<Map<string, DeliverySlot[]>> {
    const slotsMap = new Map<string, DeliverySlot[]>();
    
    // Fetch slots for each date in parallel
    const results = await Promise.all(
      dates.map(async (date) => {
        const slots = await this.getAvailableSlots(date, state, city);
        return { date, slots };
      })
    );
    
    results.forEach(({ date, slots }) => {
      slotsMap.set(date, slots);
    });
    
    return slotsMap;
  }

  /**
   * Schedule a delivery for an order
   */
  async scheduleDelivery(request: ScheduleDeliveryRequest): Promise<ScheduledDelivery> {
    const response = await apiClient.post('/delivery-scheduling', request);
    return response.data.data;
  }

  /**
   * Get scheduled delivery for an order
   */
  async getScheduledDelivery(orderId: string): Promise<ScheduledDelivery | null> {
    try {
      const response = await apiClient.get(`/delivery-scheduling/order/${orderId}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's upcoming scheduled deliveries
   */
  async getUpcomingDeliveries(): Promise<ScheduledDelivery[]> {
    try {
      const response = await apiClient.get('/delivery-scheduling/upcoming');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch upcoming deliveries:', error);
      return [];
    }
  }

  /**
   * Update a scheduled delivery
   */
  async updateScheduledDelivery(
    scheduledDeliveryId: string,
    updates: Partial<ScheduleDeliveryRequest>
  ): Promise<ScheduledDelivery> {
    const response = await apiClient.put(`/delivery-scheduling/${scheduledDeliveryId}`, updates);
    return response.data.data;
  }

  /**
   * Cancel a scheduled delivery
   */
  async cancelScheduledDelivery(scheduledDeliveryId: string): Promise<void> {
    await apiClient.delete(`/delivery-scheduling/${scheduledDeliveryId}`);
  }

  /**
   * Initialize default slots (admin use)
   */
  async initializeSlots(): Promise<{ message: string; count?: number }> {
    const response = await apiClient.post('/delivery-scheduling/init-slots');
    return response.data.data;
  }

  /**
   * Generate date strings for the next N days
   */
  getNextDays(count: number = 3): { date: string; label: string; isoDate: string }[] {
    const days: { date: string; label: string; isoDate: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 
        date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      days.push({
        date: dateStr,
        label,
        isoDate: date.toISOString(),
      });
    }
    
    return days;
  }

  /**
   * Check if a slot is available for current time (for today)
   */
  isSlotAvailableNow(slot: DeliverySlot, isToday: boolean): boolean {
    if (!isToday) return slot.isAvailable;
    
    const now = new Date();
    const [hours] = slot.startTime.split(':').map(Number);
    
    // Slot must start at least 2 hours from now
    return slot.isAvailable && hours > now.getHours() + 2;
  }
}

export const deliverySchedulingService = new DeliverySchedulingService();
export default deliverySchedulingService;
