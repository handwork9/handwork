import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_CONFIG } from '../constants/config';

// Lazy import to avoid require cycle
// store/index.ts -> favoritesSlice.ts -> favoritesService.ts -> apiClient.ts -> store/index.ts
let storeModule: typeof import('../store') | null = null;
let authSliceModule: typeof import('../store/slices/authSlice') | null = null;
let paymentSliceModule: typeof import('../store/slices/paymentSlice') | null = null;
let cartSliceModule: typeof import('../store/slices/cartSlice') | null = null;
let addressSliceModule: typeof import('../store/slices/addressSlice') | null = null;
let favoritesSliceModule: typeof import('../store/slices/favoritesSlice') | null = null;
let farmerSliceModule: typeof import('../store/slices/farmerSlice') | null = null;
let riderSliceModule: typeof import('../store/slices/riderSlice') | null = null;
let buyerSliceModule: typeof import('../store/slices/buyerSlice') | null = null;

const getStore = () => {
  if (!storeModule) {
    storeModule = require('../store');
  }
  return storeModule!.store;
};

const getAuthActions = () => {
  if (!authSliceModule) {
    authSliceModule = require('../store/slices/authSlice');
  }
  return authSliceModule!;
};

// Get offline cache service lazily
let offlineCacheModule: typeof import('./offlineCacheService') | null = null;
const getOfflineCacheService = () => {
  if (!offlineCacheModule) {
    offlineCacheModule = require('./offlineCacheService');
  }
  return offlineCacheModule!.offlineCacheService;
};

// Clear all user-specific state on logout to prevent data leaking between users
const clearAllUserState = async () => {
  const store = getStore();
  
  if (!paymentSliceModule) paymentSliceModule = require('../store/slices/paymentSlice');
  if (!cartSliceModule) cartSliceModule = require('../store/slices/cartSlice');
  if (!addressSliceModule) addressSliceModule = require('../store/slices/addressSlice');
  if (!favoritesSliceModule) favoritesSliceModule = require('../store/slices/favoritesSlice');
  if (!farmerSliceModule) farmerSliceModule = require('../store/slices/farmerSlice');
  if (!riderSliceModule) riderSliceModule = require('../store/slices/riderSlice');
  if (!buyerSliceModule) buyerSliceModule = require('../store/slices/buyerSlice');
  
  store.dispatch(paymentSliceModule.clearPaymentMethods());
  store.dispatch(cartSliceModule.clearCart());
  store.dispatch(addressSliceModule.clearAddresses());
  store.dispatch(favoritesSliceModule.resetFavorites());
  store.dispatch(farmerSliceModule.clearFarmerState());
  store.dispatch(riderSliceModule.clearRiderState());
  store.dispatch(buyerSliceModule.clearBuyerState());
  
  // Clear offline caches on logout
  try {
    await getOfflineCacheService().clearUserCaches();
  } catch (error) {
    console.error('Error clearing offline caches:', error);
  }
};

// Build a user agent string with device info
const buildUserAgent = (): string => {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const osName = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const osVersion = Platform.Version;
  const deviceName = Device.modelName || Device.deviceName || 'Unknown';
  const deviceBrand = Device.brand || '';
  
  // Format: Handwork/1.0.0 (iOS 17.0; iPhone 15 Pro) Expo
  return `Handwork/${appVersion} (${osName} ${osVersion}; ${deviceBrand} ${deviceName}) Expo`;
};

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;
  private userAgent: string;

  constructor() {
    this.userAgent = buildUserAgent();
    
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const store = getStore();
        const state = store.getState();
        const token = state.auth.accessToken;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Ensure User-Agent is always set
        config.headers['User-Agent'] = this.userAgent;
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // If a refresh is already in progress, wait for it
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshAccessToken();
            }

            const newAccessToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear all user state and logout
            const store = getStore();
            const { logout } = getAuthActions();
            clearAllUserState();
            store.dispatch(logout());
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const store = getStore();
    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Update tokens in store
    const { setTokens } = getAuthActions();
    store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

    return accessToken;
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Upload file with multipart/form-data
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
