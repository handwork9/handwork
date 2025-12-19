import { registerAs } from '@nestjs/config';

export const dispatchConfig = registerAs('dispatch', () => ({
  // Maximum total delivery time allowed (pickup + transit + delivery)
  maxDeliveryMinutes: parseInt(process.env.DISPATCH_MAX_DELIVERY_MINUTES || '45', 10),
  
  // Quick delivery threshold for priority matching
  quickDeliveryMinutes: parseInt(process.env.DISPATCH_QUICK_DELIVERY_MINUTES || '30', 10),
  
  // Time riders have to accept an offer
  riderOfferTimeoutSeconds: parseInt(process.env.DISPATCH_RIDER_OFFER_TIMEOUT_SECONDS || '30', 10),
  
  // Max number of riders to offer to simultaneously
  maxRiderOffers: parseInt(process.env.DISPATCH_MAX_RIDER_OFFERS || '5', 10),
  
  // Search radius for finding available riders (km)
  riderSearchRadiusKm: parseInt(process.env.DISPATCH_RIDER_SEARCH_RADIUS_KM || '15', 10),
  
  // How old a rider's location can be before considered stale (seconds)
  locationStaleSeconds: parseInt(process.env.DISPATCH_LOCATION_STALE_SECONDS || '120', 10),
}));
