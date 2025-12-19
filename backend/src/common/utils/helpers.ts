/**
 * Calculate the distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmh Average speed in km/h (default: 30 for urban areas)
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(distanceKm: number, averageSpeedKmh: number = 30): number {
  return Math.ceil((distanceKm / averageSpeedKmh) * 60);
}

/**
 * Generate a random OTP code
 * @param length Length of the OTP (default: 6)
 * @returns OTP string
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Generate a unique order number
 * @returns Order number string
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HW-${timestamp}-${random}`;
}

/**
 * Format currency in Naira
 * @param amount Amount in kobo
 * @returns Formatted string
 */
export function formatNaira(amount: number): string {
  return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

/**
 * Convert amount to kobo (Stripe's smallest currency unit)
 * @param amount Amount in naira
 * @returns Amount in kobo
 */
export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert amount from kobo to naira
 * @param kobo Amount in kobo
 * @returns Amount in naira
 */
export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/**
 * Check if two locations are in the same state (for same-day delivery)
 * @param state1 First state
 * @param state2 Second state
 * @returns boolean
 */
export function isSameState(state1: string, state2: string): boolean {
  return state1.toLowerCase().trim() === state2.toLowerCase().trim();
}

/**
 * Mask phone number for privacy
 * @param phone Phone number
 * @returns Masked phone number
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

/**
 * Slugify a string
 * @param text Text to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique reference for transactions
 * @param prefix Prefix for the reference (e.g., 'WLT', 'TXN')
 * @returns Reference string
 */
export function generateReference(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
