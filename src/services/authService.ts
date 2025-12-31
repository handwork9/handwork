import { apiClient } from './apiClient';
import {
  User,
  LoginCredentials,
  SignupData,
  ApiResponse,
  UserRole,
} from '../types';
import { MOCK_MODE } from '../constants/config';

// 2FA response types
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

// Mock user data for development
const createMockUser = (data: SignupData): User => ({
  id: `user_${Date.now()}`,
  name: data.name,
  email: data.email,
  phone: data.phone,
  role: data.role,
  state: data.state,
  city: data.city,
  rating: 4.5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const mockTokens = {
  accessToken: 'mock_access_token_' + Date.now(),
  refreshToken: 'mock_refresh_token_' + Date.now(),
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Login with email or phone
   * Returns either login success or 2FA required response
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    if (MOCK_MODE) {
      await delay(800);
      // Mock login - accept any credentials in dev mode
      const mockUser: User = {
        id: 'user_mock_1',
        name: 'Test User',
        email: credentials.email || 'test@example.com',
        phone: credentials.phone || '+234123456789',
        role: 'buyer', // Default to buyer, can change for testing
        state: 'Lagos',
        city: 'Ikeja',
        rating: 4.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: {
          user: mockUser,
          ...mockTokens,
          requiresTwoFactor: false,
        },
      };
    }
    // Backend expects 'identifier' for email/phone
    const loginPayload = {
      identifier: credentials.email || credentials.phone,
      password: credentials.password,
    };
    return apiClient.post('/auth/login', loginPayload);
  },

  /**
   * Check if login response requires 2FA
   */
  requiresTwoFactor(response: LoginResponse): response is TwoFactorRequiredResponse {
    return 'requiresTwoFactor' in response && response.requiresTwoFactor === true;
  },

  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<ApiResponse<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }>> {
    if (MOCK_MODE) {
      await delay(1000);
      const mockUser = createMockUser(data);
      return {
        success: true,
        data: {
          user: mockUser,
          ...mockTokens,
        },
      };
    }
    return apiClient.post('/auth/signup', data);
  },

  /**
   * Login with Google ID token
   */
  async googleLogin(idToken: string, role?: UserRole): Promise<ApiResponse<LoginSuccessResponse>> {
    if (MOCK_MODE) {
      await delay(800);
      const mockUser: User = {
        id: 'user_google_1',
        name: 'Google User',
        email: 'google.user@gmail.com',
        phone: '',
        role: role || 'buyer',
        state: '',
        city: '',
        rating: 5.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: {
          user: mockUser,
          ...mockTokens,
          requiresTwoFactor: false,
        },
      };
    }
    return apiClient.post('/auth/google', { idToken, role });
  },

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<ApiResponse<{ otpId: string; expiresIn: number }>> {
    if (MOCK_MODE) {
      await delay(500);
      console.log(`[MOCK] OTP sent to ${phone}: 123456`);
      return {
        success: true,
        data: { otpId: 'mock-otp-id', expiresIn: 300 },
      };
    }
    return apiClient.post('/auth/otp/request', { phone });
  },

  /**
   * Verify OTP
   */
  async verifyOTP(otpId: string, code: string): Promise<ApiResponse<{
    verified?: boolean;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  }>> {
    if (MOCK_MODE) {
      await delay(500);
      // Accept "123456" as valid OTP in mock mode
      const isValid = code === '123456';
      return {
        success: isValid,
        data: { verified: isValid },
        message: isValid ? 'OTP verified' : 'Invalid OTP',
      };
    }
    return apiClient.post('/auth/otp/verify', { otpId, code });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ otpId: string; message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        data: { otpId: 'mock-otp-id', message: 'Password reset code sent' },
      };
    }
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with OTP code
   */
  async resetPassword(
    otpId: string,
    code: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        data: { message: 'Password reset successfully' },
      };
    }
    return apiClient.post('/auth/reset-password', { otpId, code, newPassword });
  },

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        data: { message: 'Password changed successfully' },
      };
    }
    return apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(300);
      return {
        success: true,
        data: { message: 'Logged out successfully' },
      };
    }
    return apiClient.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (MOCK_MODE) {
      await delay(300);
      return {
        success: true,
        data: {
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
      };
    }
    return apiClient.get('/auth/me');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        data: {
          id: 'user_mock_1',
          name: data.name || 'Test User',
          email: data.email || 'test@example.com',
          phone: data.phone || '+234123456789',
          role: 'buyer',
          state: data.state || 'Lagos',
          city: data.city || 'Ikeja',
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }
    try {
      const user = await apiClient.put<User>('/users/profile', data);
      return { success: true, data: user };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.response?.data?.message || error?.message || 'Failed to update profile' 
      };
    }
  },

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(token: string): Promise<ApiResponse<{ message: string }>> {
    if (MOCK_MODE) {
      await delay(200);
      console.log(`[MOCK] Device token registered: ${token.substring(0, 20)}...`);
      return {
        success: true,
        data: { message: 'Device token registered' },
      };
    }
    return apiClient.post('/auth/device-token', { token });
  },

  /**
   * Request OTP for phone login
   */
  async requestLoginOTP(phone: string): Promise<ApiResponse<{ otpId: string; expiresIn: number }>> {
    if (MOCK_MODE) {
      await delay(500);
      console.log(`[MOCK] Login OTP sent to ${phone}: 123456`);
      return {
        success: true,
        data: { 
          otpId: 'mock_otp_id_' + Date.now(),
          expiresIn: 300,
        },
      };
    }
    return apiClient.post('/auth/otp/request', { phone });
  },

  /**
   * Verify OTP and login
   */
  async verifyLoginOTP(otpId: string, code: string): Promise<ApiResponse<LoginResponse>> {
    if (MOCK_MODE) {
      await delay(500);
      const isValid = code === '123456';
      if (!isValid) {
        return {
          success: false,
          data: {} as LoginResponse,
          message: 'Invalid OTP',
        };
      }
      const mockUser: User = {
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
      };
      return {
        success: true,
        data: {
          user: mockUser,
          ...mockTokens,
          requiresTwoFactor: false,
        },
      };
    }
    return apiClient.post('/auth/otp/verify', { otpId, code });
  },

  // ==================== Email OTP Methods (Login/Signup) ====================

  /**
   * Request OTP via email for login/signup
   */
  async requestEmailOTP(email: string, purpose: 'login' | 'signup' = 'login'): Promise<ApiResponse<{ otpId: string; expiresIn: number; message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      console.log(`[MOCK] Email OTP sent to ${email}: 123456 (purpose: ${purpose})`);
      return {
        success: true,
        data: { 
          otpId: 'mock_email_otp_id_' + Date.now(),
          expiresIn: 600,
          message: `Verification code sent to ${email}`,
        },
      };
    }
    return apiClient.post('/auth/otp/email/request', { email, purpose });
  },

  /**
   * Verify email OTP and login/signup
   */
  async verifyEmailOTP(otpId: string, code: string, email: string): Promise<ApiResponse<LoginResponse>> {
    if (MOCK_MODE) {
      await delay(500);
      const isValid = code === '123456';
      if (!isValid) {
        return {
          success: false,
          data: {} as LoginResponse,
          message: 'Invalid verification code',
        };
      }
      const mockUser: User = {
        id: 'user_mock_1',
        name: email.split('@')[0],
        email: email,
        phone: '',
        role: 'buyer',
        state: 'Lagos',
        city: 'Ikeja',
        rating: 4.8,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: {
          user: mockUser,
          ...mockTokens,
          requiresTwoFactor: false,
        },
      };
    }
    return apiClient.post('/auth/otp/email/verify', { otpId, code, email });
  },

  // ==================== Phone OTP Methods (Profile Verification) ====================

  /**
   * Request SMS OTP for phone verification (profile update)
   * Requires authentication
   */
  async requestPhoneOTP(phone: string): Promise<ApiResponse<{ otpId: string; expiresIn: number; message: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      console.log(`[MOCK] Phone OTP sent to ${phone}: 123456`);
      return {
        success: true,
        data: { 
          otpId: 'mock_phone_otp_id_' + Date.now(),
          expiresIn: 600,
          message: `Verification code sent to ${phone}`,
        },
      };
    }
    return apiClient.post('/auth/otp/phone/request', { phone });
  },

  /**
   * Verify phone SMS OTP and update profile
   * Requires authentication
   */
  async verifyPhoneOTP(otpId: string, code: string): Promise<ApiResponse<{ success: boolean; message: string; phone?: string }>> {
    if (MOCK_MODE) {
      await delay(500);
      const isValid = code === '123456';
      if (!isValid) {
        return {
          success: false,
          data: { success: false, message: 'Invalid verification code' },
          message: 'Invalid verification code',
        };
      }
      return {
        success: true,
        data: { success: true, message: 'Phone number verified successfully', phone: '+234xxxxxxxxxx' },
      };
    }
    return apiClient.post('/auth/otp/phone/verify', { otpId, code });
  },
};
