/**
 * Delivery Pricing Service
 * Calculates delivery fees for buyers and earnings for riders
 */

// Pricing configuration (in Naira)
export const DELIVERY_PRICING = {
  // Base fees
  BASE_FEE: 300, // Minimum delivery fee
  BASE_RIDER_EARNINGS: 250, // Minimum rider earnings per delivery
  
  // Distance-based pricing (per km)
  PRICE_PER_KM: 50, // Additional fee per kilometer
  RIDER_EARNINGS_PER_KM: 40, // Additional rider earnings per km
  
  // Distance tiers for graduated pricing
  DISTANCE_TIERS: [
    { maxKm: 3, pricePerKm: 50, riderPerKm: 40 },
    { maxKm: 7, pricePerKm: 45, riderPerKm: 38 },
    { maxKm: 15, pricePerKm: 40, riderPerKm: 35 },
    { maxKm: Infinity, pricePerKm: 35, riderPerKm: 30 },
  ],
  
  // Time-based multipliers
  PEAK_HOURS: {
    morning: { start: 7, end: 9, multiplier: 1.2 }, // 7am - 9am
    lunch: { start: 12, end: 14, multiplier: 1.15 }, // 12pm - 2pm
    evening: { start: 17, end: 20, multiplier: 1.25 }, // 5pm - 8pm
  },
  
  // Weather multipliers
  WEATHER_MULTIPLIERS: {
    clear: 1.0,
    cloudy: 1.0,
    rain: 1.3,
    heavy_rain: 1.5,
    storm: 1.75,
  },
  
  // Order value tiers (optional percentage-based delivery)
  ORDER_VALUE_DISCOUNT: {
    minOrderForFreeDelivery: 20000, // Orders above ₦20,000 get free delivery
    minOrderForDiscountedDelivery: 10000, // Orders above ₦10,000 get 20% off delivery
    discountPercentage: 0.2,
  },
  
  // Platform fee (percentage taken by platform from delivery fee)
  PLATFORM_FEE_PERCENTAGE: 0.15, // 15% platform commission
  
  // Express delivery premium
  EXPRESS_MULTIPLIER: 1.5, // 50% extra for express delivery
  
  // Scheduled delivery discount
  SCHEDULED_DISCOUNT: 0.9, // 10% discount for scheduled deliveries
};

export interface DeliveryPriceInput {
  distanceKm: number;
  orderTotal?: number;
  isExpress?: boolean;
  isScheduled?: boolean;
  weatherCondition?: keyof typeof DELIVERY_PRICING.WEATHER_MULTIPLIERS;
  scheduledTime?: Date;
}

export interface DeliveryPriceResult {
  deliveryFee: number;
  riderEarnings: number;
  platformFee: number;
  breakdown: {
    baseFee: number;
    distanceFee: number;
    peakHourSurcharge: number;
    weatherSurcharge: number;
    expressPremium: number;
    scheduledDiscount: number;
    orderValueDiscount: number;
  };
  estimatedTime: number; // in minutes
  distanceKm: number;
}

/**
 * Get the current peak hour multiplier based on time
 */
function getPeakHourMultiplier(date: Date = new Date()): number {
  const hour = date.getHours();
  const { PEAK_HOURS } = DELIVERY_PRICING;
  
  if (hour >= PEAK_HOURS.morning.start && hour < PEAK_HOURS.morning.end) {
    return PEAK_HOURS.morning.multiplier;
  }
  if (hour >= PEAK_HOURS.lunch.start && hour < PEAK_HOURS.lunch.end) {
    return PEAK_HOURS.lunch.multiplier;
  }
  if (hour >= PEAK_HOURS.evening.start && hour < PEAK_HOURS.evening.end) {
    return PEAK_HOURS.evening.multiplier;
  }
  
  return 1.0;
}

/**
 * Calculate distance-based fee using graduated tiers
 */
function calculateDistanceFee(distanceKm: number, isForRider: boolean = false): number {
  const { DISTANCE_TIERS } = DELIVERY_PRICING;
  let totalFee = 0;
  let remainingDistance = distanceKm;
  let previousMaxKm = 0;
  
  for (const tier of DISTANCE_TIERS) {
    if (remainingDistance <= 0) break;
    
    const tierDistance = Math.min(remainingDistance, tier.maxKm - previousMaxKm);
    const rate = isForRider ? tier.riderPerKm : tier.pricePerKm;
    totalFee += tierDistance * rate;
    
    remainingDistance -= tierDistance;
    previousMaxKm = tier.maxKm;
  }
  
  return Math.round(totalFee);
}

/**
 * Calculate estimated delivery time based on distance
 */
function calculateEstimatedTime(distanceKm: number, isExpress: boolean = false): number {
  // Average speed assumptions
  const avgSpeedKmPerHour = 25; // Average delivery speed in urban areas
  const baseTimeMinutes = 10; // Fixed time for pickup/handover
  
  const travelTimeMinutes = (distanceKm / avgSpeedKmPerHour) * 60;
  let totalTime = baseTimeMinutes + travelTimeMinutes;
  
  // Express delivery is faster (prioritized routing)
  if (isExpress) {
    totalTime *= 0.75;
  }
  
  return Math.round(totalTime);
}

/**
 * Main function to calculate delivery pricing
 */
export function calculateDeliveryPrice(input: DeliveryPriceInput): DeliveryPriceResult {
  const {
    distanceKm,
    orderTotal = 0,
    isExpress = false,
    isScheduled = false,
    weatherCondition = 'clear',
    scheduledTime,
  } = input;
  
  const { BASE_FEE, BASE_RIDER_EARNINGS, PLATFORM_FEE_PERCENTAGE, ORDER_VALUE_DISCOUNT } = DELIVERY_PRICING;
  
  // 1. Calculate base fees
  let deliveryBaseFee = BASE_FEE;
  let riderBaseEarnings = BASE_RIDER_EARNINGS;
  
  // 2. Calculate distance fees
  const deliveryDistanceFee = calculateDistanceFee(distanceKm, false);
  const riderDistanceFee = calculateDistanceFee(distanceKm, true);
  
  // 3. Get peak hour multiplier
  const timeToCheck = scheduledTime || new Date();
  const peakMultiplier = getPeakHourMultiplier(timeToCheck);
  const peakSurcharge = peakMultiplier > 1 
    ? Math.round((deliveryBaseFee + deliveryDistanceFee) * (peakMultiplier - 1))
    : 0;
  
  // 4. Weather surcharge
  const weatherMultiplier = DELIVERY_PRICING.WEATHER_MULTIPLIERS[weatherCondition] || 1.0;
  const weatherSurcharge = weatherMultiplier > 1
    ? Math.round((deliveryBaseFee + deliveryDistanceFee) * (weatherMultiplier - 1))
    : 0;
  
  // 5. Express premium
  let expressPremium = 0;
  if (isExpress) {
    expressPremium = Math.round((deliveryBaseFee + deliveryDistanceFee) * (DELIVERY_PRICING.EXPRESS_MULTIPLIER - 1));
  }
  
  // 6. Scheduled discount
  let scheduledDiscount = 0;
  if (isScheduled && !isExpress) {
    scheduledDiscount = Math.round((deliveryBaseFee + deliveryDistanceFee) * (1 - DELIVERY_PRICING.SCHEDULED_DISCOUNT));
  }
  
  // 7. Order value discount
  let orderValueDiscount = 0;
  if (orderTotal >= ORDER_VALUE_DISCOUNT.minOrderForFreeDelivery) {
    // Free delivery for large orders (rider still gets paid)
    orderValueDiscount = deliveryBaseFee + deliveryDistanceFee + peakSurcharge + weatherSurcharge + expressPremium - scheduledDiscount;
  } else if (orderTotal >= ORDER_VALUE_DISCOUNT.minOrderForDiscountedDelivery) {
    // Discounted delivery
    const subtotal = deliveryBaseFee + deliveryDistanceFee + peakSurcharge + weatherSurcharge + expressPremium - scheduledDiscount;
    orderValueDiscount = Math.round(subtotal * ORDER_VALUE_DISCOUNT.discountPercentage);
  }
  
  // 8. Calculate final delivery fee
  let deliveryFee = deliveryBaseFee + deliveryDistanceFee + peakSurcharge + weatherSurcharge + expressPremium - scheduledDiscount - orderValueDiscount;
  deliveryFee = Math.max(deliveryFee, 0); // Ensure non-negative
  
  // 9. Calculate rider earnings (riders benefit from peak/weather too)
  let riderEarnings = riderBaseEarnings + riderDistanceFee;
  
  // Riders get bonus for peak hours and bad weather
  if (peakMultiplier > 1) {
    riderEarnings += Math.round(riderEarnings * (peakMultiplier - 1) * 0.5); // Riders get 50% of peak bonus
  }
  if (weatherMultiplier > 1) {
    riderEarnings += Math.round(riderEarnings * (weatherMultiplier - 1) * 0.7); // Riders get 70% of weather bonus
  }
  if (isExpress) {
    riderEarnings += Math.round(riderEarnings * 0.3); // 30% express bonus for rider
  }
  
  riderEarnings = Math.round(riderEarnings);
  
  // 10. Calculate platform fee
  const platformFee = Math.round(deliveryFee * PLATFORM_FEE_PERCENTAGE);
  
  // 11. Estimated delivery time
  const estimatedTime = calculateEstimatedTime(distanceKm, isExpress);
  
  return {
    deliveryFee: Math.round(deliveryFee),
    riderEarnings,
    platformFee,
    breakdown: {
      baseFee: deliveryBaseFee,
      distanceFee: deliveryDistanceFee,
      peakHourSurcharge: peakSurcharge,
      weatherSurcharge: weatherSurcharge,
      expressPremium: expressPremium,
      scheduledDiscount: scheduledDiscount,
      orderValueDiscount: orderValueDiscount,
    },
    estimatedTime,
    distanceKm,
  };
}

/**
 * Format delivery fee for display
 */
export function formatDeliveryFee(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Get delivery fee estimate for a given distance (quick calculation)
 */
export function getQuickDeliveryEstimate(distanceKm: number): { fee: number; time: number } {
  const result = calculateDeliveryPrice({ distanceKm });
  return {
    fee: result.deliveryFee,
    time: result.estimatedTime,
  };
}

/**
 * Check if order qualifies for free delivery
 */
export function qualifiesForFreeDelivery(orderTotal: number): boolean {
  return orderTotal >= DELIVERY_PRICING.ORDER_VALUE_DISCOUNT.minOrderForFreeDelivery;
}

/**
 * Get amount needed for free delivery
 */
export function getAmountForFreeDelivery(currentTotal: number): number {
  const threshold = DELIVERY_PRICING.ORDER_VALUE_DISCOUNT.minOrderForFreeDelivery;
  return Math.max(0, threshold - currentTotal);
}

export default {
  calculateDeliveryPrice,
  formatDeliveryFee,
  getQuickDeliveryEstimate,
  qualifiesForFreeDelivery,
  getAmountForFreeDelivery,
  DELIVERY_PRICING,
};
