import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECURITY_SETTINGS_KEY = '@security_settings';
const BIOMETRIC_LAST_AUTH_KEY = '@biometric_last_auth';

export interface BiometricInfo {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: string;
  isEnabled: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

class BiometricService {
  /**
   * Check if device supports biometric authentication
   */
  async hasHardware(): Promise<boolean> {
    return await LocalAuthentication.hasHardwareAsync();
  }

  /**
   * Check if user has enrolled biometrics on device
   */
  async isEnrolled(): Promise<boolean> {
    return await LocalAuthentication.isEnrolledAsync();
  }

  /**
   * Get supported biometric types
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  /**
   * Get human-readable biometric type name
   */
  async getBiometricTypeName(): Promise<string> {
    const types = await this.getSupportedTypes();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    
    return 'Biometric';
  }

  /**
   * Get full biometric info
   */
  async getBiometricInfo(): Promise<BiometricInfo> {
    const [hasHardware, isEnrolled, biometricType, isEnabled] = await Promise.all([
      this.hasHardware(),
      this.isEnrolled(),
      this.getBiometricTypeName(),
      this.isBiometricEnabled(),
    ]);

    return {
      isAvailable: hasHardware && isEnrolled,
      isEnrolled,
      biometricType,
      isEnabled,
    };
  }

  /**
   * Check if biometric login is enabled in app settings
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.biometrics === true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check biometric setting:', error);
      return false;
    }
  }

  /**
   * Enable biometric login
   */
  async enableBiometric(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};
      settings.biometrics = true;
      await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric login
   */
  async disableBiometric(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};
      settings.biometrics = false;
      await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      return false;
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(promptMessage?: string): Promise<AuthenticationResult> {
    try {
      const hasHardware = await this.hasHardware();
      const isEnrolled = await this.isEnrolled();

      if (!hasHardware) {
        return {
          success: false,
          error: 'Biometric hardware not available',
          errorCode: 'no_hardware',
        };
      }

      if (!isEnrolled) {
        return {
          success: false,
          error: 'No biometrics enrolled on device',
          errorCode: 'not_enrolled',
        };
      }

      const biometricType = await this.getBiometricTypeName();
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${biometricType}`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Store last successful auth time
        await AsyncStorage.setItem(BIOMETRIC_LAST_AUTH_KEY, Date.now().toString());
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
        errorCode: result.error,
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'An error occurred during authentication',
        errorCode: 'unknown',
      };
    }
  }

  /**
   * Check if biometric auth is needed (app coming to foreground)
   * Returns true if more than 1 minute since last auth
   */
  async shouldRequireAuth(): Promise<boolean> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) return false;

      const lastAuth = await AsyncStorage.getItem(BIOMETRIC_LAST_AUTH_KEY);
      if (!lastAuth) return true;

      const lastAuthTime = parseInt(lastAuth, 10);
      const now = Date.now();
      const oneMinute = 60 * 1000;
      
      // Require auth if more than 1 minute has passed
      return (now - lastAuthTime) > oneMinute;
    } catch (error) {
      console.error('Failed to check auth requirement:', error);
      return false;
    }
  }

  /**
   * Reset last auth time (e.g., when user logs out)
   */
  async resetLastAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_LAST_AUTH_KEY);
    } catch (error) {
      console.error('Failed to reset last auth:', error);
    }
  }

  /**
   * Update last auth time to now (e.g., after successful password login)
   */
  async updateLastAuth(): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_LAST_AUTH_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update last auth:', error);
    }
  }
}

export const biometricService = new BiometricService();
export default biometricService;
