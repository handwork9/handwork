/**
 * Map utilities for opening navigation apps
 */

import { Platform, Linking, Alert } from 'react-native';

/**
 * Opens native maps app with directions to the specified coordinates
 * Tries multiple map apps and falls back to Google Maps in browser
 * 
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Label for the destination (optional)
 */
export const openMapsWithDirections = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  // Check if coordinates are valid
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    Alert.alert('Location Unavailable', 'The location coordinates are not available.');
    return;
  }

  const encodedLabel = encodeURIComponent(label || 'Destination');

  // Try different map apps in order of preference
  const mapUrls = Platform.select({
    ios: [
      // Apple Maps with driving directions
      `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
      // Google Maps app (if installed)
      `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
      // Waze (if installed)
      `waze://?ll=${latitude},${longitude}&navigate=yes`,
      // Google Maps web fallback
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    ],
    android: [
      // Google Maps navigation mode
      `google.navigation:q=${latitude},${longitude}`,
      // Google Maps geo intent with label
      `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
      // Waze (if installed)
      `waze://?ll=${latitude},${longitude}&navigate=yes`,
      // Google Maps web fallback
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    ],
    default: [
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    ],
  }) || [`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`];

  // Try each URL until one works
  for (const url of mapUrls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch (error) {
      // Continue to next URL
      console.log(`Failed to open map URL: ${url}`, error);
    }
  }

  // If all else fails, open Google Maps in browser
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  try {
    await Linking.openURL(fallbackUrl);
  } catch {
    Alert.alert(
      'Maps Unavailable',
      'Unable to open maps. Please check if you have a maps app installed.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Opens native maps app to show a location (without directions)
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param label - Label for the location (optional)
 */
export const openMapsLocation = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  // Check if coordinates are valid
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    Alert.alert('Location Unavailable', 'The location coordinates are not available.');
    return;
  }

  const encodedLabel = encodeURIComponent(label || 'Location');

  const mapUrls = Platform.select({
    ios: [
      // Apple Maps showing location
      `maps://?ll=${latitude},${longitude}&q=${encodedLabel}`,
      // Google Maps app
      `comgooglemaps://?center=${latitude},${longitude}&q=${latitude},${longitude}`,
      // Web fallback
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    ],
    android: [
      // Google Maps geo intent
      `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
      // Web fallback
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    ],
    default: [
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    ],
  }) || [`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`];

  // Try each URL until one works
  for (const url of mapUrls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch (error) {
      console.log(`Failed to open map URL: ${url}`, error);
    }
  }

  // Fallback to Google Maps web
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  try {
    await Linking.openURL(fallbackUrl);
  } catch {
    Alert.alert(
      'Maps Unavailable',
      'Unable to open maps. Please check if you have a maps app installed.',
      [{ text: 'OK' }]
    );
  }
};
