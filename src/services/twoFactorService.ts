import { apiClient } from './apiClient';
import { ApiResponse, User } from '../types';
import { MOCK_MODE } from '../constants/config';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Types for 2FA responses
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
}

export interface TwoFactorStatusResponse {
  isEnabled: boolean;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
}

export interface LoginSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: false;
}

export type LoginResponse = LoginSuccessResponse | TwoFactorRequiredResponse;

export const twoFactorService = {
  /**
   * Generate a new 2FA secret and QR code
   * Call this when user wants to enable 2FA
   */
  async generateSecret(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          otpauthUrl: 'otpauth://totp/Handwork:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Handwork',
        },
      };
    }
    return apiClient.post('/auth/2fa/generate');
  },

  /**
   * Enable 2FA after user scans QR code and enters verification code
   */
  async enable(code: string): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      // Accept code "123456" in mock mode
      if (code === '123456') {
        return {
          success: true,
          data: { message: 'Two-factor authentication enabled successfully' },
        };
      }
      return {
        success: false,
        data: { message: '' },
        message: 'Invalid verification code',
      };
    }
    return apiClient.post('/auth/2fa/enable', { code });
  },

  /**
   * Disable 2FA (requires current 2FA code)
   */
  async disable(code: string): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      if (code === '123456') {
        return {
          success: true,
          data: { message: 'Two-factor authentication disabled successfully' },
        };
      }
      return {
        success: false,
        data: { message: '' },
        message: 'Invalid verification code',
      };
    }
    return apiClient.post('/auth/2fa/disable', { code });
  },

  /**
   * Get current 2FA status
   */
  async getStatus(): Promise<ApiResponse<TwoFactorStatusResponse>> {
    if (MOCK_MODE) {
      await delay(300);
      return {
        success: true,
        data: { isEnabled: false },
      };
    }
    return apiClient.get('/auth/2fa/status');
  },

  /**
   * Complete login with 2FA code after initial login returned tempToken
   */
  async verifyLogin(
    tempToken: string,
    code: string
  ): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      if (code === '123456') {
        return {
          success: true,
          data: {
            user: {
              id: 'user_mock_1',
              name: 'Test User',
              email: 'test@example.com',
              phone: '+234123456789',
              role: 'buyer',
              state: 'Lagos',
              city: 'Ikeja',
              rating: 4.8,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
          },
        };
      }
      return {
        success: false,
        data: {
          user: {} as User,
          accessToken: '',
          refreshToken: '',
        },
        message: 'Invalid two-factor authentication code',
      };
    }
    return apiClient.post('/auth/2fa/verify-login', { tempToken, code });
  },

  /**
   * Check if a login response requires 2FA
   */
  requiresTwoFactor(response: LoginResponse): response is TwoFactorRequiredResponse {
    return 'requiresTwoFactor' in response && response.requiresTwoFactor === true;
  },
};
