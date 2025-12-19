/**
 * Security Settings Service
 * Handles security-related settings: login alerts, 2FA status, PIN status
 */

import apiClient from './apiClient';

export interface SecuritySettings {
  loginAlertsEnabled: boolean;
  isTwoFactorEnabled: boolean;
  isPinEnabled: boolean;
}

interface ApiSecuritySettingsResponse {
  loginAlertsEnabled: boolean;
  isTwoFactorEnabled: boolean;
  isPinEnabled: boolean;
}

interface ApiMessageResponse {
  message: string;
  loginAlertsEnabled?: boolean;
}

export const securitySettingsService = {
  /**
   * Get current security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const response = await apiClient.get<ApiSecuritySettingsResponse>('/users/settings/security');
      return {
        loginAlertsEnabled: response.loginAlertsEnabled ?? true,
        isTwoFactorEnabled: response.isTwoFactorEnabled ?? false,
        isPinEnabled: response.isPinEnabled ?? false,
      };
    } catch (error) {
      console.error('Failed to get security settings:', error);
      // Return defaults on error
      return {
        loginAlertsEnabled: true,
        isTwoFactorEnabled: false,
        isPinEnabled: false,
      };
    }
  },

  /**
   * Update login alerts setting
   */
  async updateLoginAlerts(enabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<ApiMessageResponse>('/users/settings/security/login-alerts', { enabled });
      return {
        success: true,
        message: response.message || (enabled ? 'Login alerts enabled' : 'Login alerts disabled'),
      };
    } catch (error: any) {
      console.error('Failed to update login alerts:', error);
      const message = error.response?.data?.message || 'Failed to update login alerts';
      return { success: false, message };
    }
  },
};

export default securitySettingsService;
