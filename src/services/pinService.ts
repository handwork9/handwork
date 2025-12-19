/**
 * PIN Service
 * Handles transaction PIN operations: set, change, verify, and check status
 * Uses backend API for secure PIN storage and verification
 */

import apiClient from './apiClient';

export interface PinResponse {
  success: boolean;
  message: string;
}

export interface HasPinResponse {
  hasPin: boolean;
  isPinEnabled?: boolean;
}

interface ApiPinStatusResponse {
  hasPin: boolean;
  isPinEnabled: boolean;
}

interface ApiMessageResponse {
  success?: boolean;
  message: string;
}

interface ApiToggleResponse {
  isPinEnabled: boolean;
}

export const pinService = {
  /**
   * Check if user has a PIN set
   */
  async hasPin(): Promise<HasPinResponse> {
    try {
      const response = await apiClient.get<ApiPinStatusResponse>('/pin/status');
      return {
        hasPin: response.hasPin,
        isPinEnabled: response.isPinEnabled,
      };
    } catch (error) {
      console.error('Failed to check PIN status:', error);
      return { hasPin: false, isPinEnabled: false };
    }
  },

  /**
   * Set a new transaction PIN (first time)
   */
  async setPin(pin: string): Promise<PinResponse> {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, message: 'PIN must be exactly 4 digits' };
    }

    try {
      console.log('Calling API to set PIN...');
      const response = await apiClient.post<ApiMessageResponse>('/pin/set', { pin });
      console.log('API response:', response);
      return {
        success: true,
        message: response.message || 'Transaction PIN set successfully',
      };
    } catch (error: any) {
      console.error('API error setting PIN:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to set PIN';
      return { success: false, message };
    }
  },

  /**
   * Change existing PIN
   */
  async changePin(currentPin: string, newPin: string): Promise<PinResponse> {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, message: 'New PIN must be exactly 4 digits' };
    }

    try {
      const response = await apiClient.post<ApiMessageResponse>('/pin/change', { currentPin, newPin });
      return {
        success: true,
        message: response.message || 'Transaction PIN changed successfully',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change PIN';
      return { success: false, message };
    }
  },

  /**
   * Verify PIN for transactions
   */
  async verifyPin(pin: string): Promise<PinResponse> {
    if (pin.length !== 4) {
      return { success: false, message: 'Invalid PIN format' };
    }

    try {
      const response = await apiClient.post<ApiMessageResponse>('/pin/verify', { pin });
      return {
        success: true,
        message: response.message || 'PIN verified',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Incorrect PIN';
      return { success: false, message };
    }
  },

  /**
   * Reset PIN using password verification
   */
  async resetPin(password: string, newPin: string): Promise<PinResponse> {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, message: 'PIN must be exactly 4 digits' };
    }

    try {
      const response = await apiClient.post<ApiMessageResponse>('/pin/reset', { password, newPin });
      return {
        success: true,
        message: response.message || 'Transaction PIN reset successfully',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset PIN';
      return { success: false, message };
    }
  },

  /**
   * Remove PIN (disable transaction PIN)
   */
  async removePin(currentPin: string): Promise<PinResponse> {
    try {
      const response = await apiClient.post<ApiMessageResponse>('/pin/remove', { pin: currentPin });
      return {
        success: true,
        message: response.message || 'Transaction PIN removed',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove PIN';
      return { success: false, message };
    }
  },

  /**
   * Toggle PIN requirement for transactions
   */
  async togglePinEnabled(enabled: boolean): Promise<{ success: boolean; isPinEnabled: boolean }> {
    try {
      const response = await apiClient.post<ApiToggleResponse>('/pin/toggle', { enabled });
      return {
        success: true,
        isPinEnabled: response.isPinEnabled,
      };
    } catch (error: any) {
      console.error('Failed to toggle PIN:', error);
      return { success: false, isPinEnabled: false };
    }
  },
};

export default pinService;
