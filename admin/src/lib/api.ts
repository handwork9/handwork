import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');
      Cookies.remove('admin_refresh_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { identifier, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/admin/dashboard', { params }),
  
  // Users (includes farmers)
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  updateUser: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  verifyFarmer: (id: string) => api.patch(`/admin/users/${id}/verify`),
  suspendUser: (id: string) => api.patch(`/admin/users/${id}/suspend`),
  unsuspendUser: (id: string) => api.patch(`/admin/users/${id}/unsuspend`),
  
  // Orders
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/orders/${id}/status`, { status, reason }),
  assignRider: (orderId: string, riderId: string) =>
    api.patch(`/orders/${orderId}/assign-rider`, { riderId }),
  
  // Riders
  getRiders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/admin/users', { params: { ...params, role: 'rider' } }),
  getAvailableRiders: (params?: {
    page?: number;
    limit?: number;
  }) => api.get('/admin/available-riders', { params }),
  getRider: (id: string) => api.get(`/riders/${id}`),
  updateRider: (id: string, data: Record<string, unknown>) => api.patch(`/admin/riders/${id}`, data),
  
  // Rider Applications
  getRiderApplications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/admin/rider-applications', { params }),
  getRiderApplication: (id: string) => api.get(`/admin/rider-applications/${id}`),
  approveRiderApplication: (id: string) => api.patch(`/admin/rider-applications/${id}/approve`),
  rejectRiderApplication: (id: string, reason: string) => 
    api.patch(`/admin/rider-applications/${id}/reject`, { reason }),

  // Farmer Applications
  getFarmerApplications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/admin/farmer-applications', { params }),
  getFarmerApplication: (id: string) => api.get(`/admin/farmer-applications/${id}`),
  approveFarmerApplication: (id: string) => api.patch(`/admin/farmer-applications/${id}/approve`),
  rejectFarmerApplication: (id: string, reason: string) => 
    api.patch(`/admin/farmer-applications/${id}/reject`, { reason }),
  
  // Products (use public endpoint for listing, admin endpoint for updates)
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    farmerId?: string;
  }) => api.get('/products', { params }),
  createProduct: (data: {
    farmerId: string;
    title: string;
    description?: string;
    price: number;
    unit?: string;
    stock: number;
    category: string;
    images?: string[];
  }) => api.post('/admin/products', data),
  updateProduct: (id: string, data: Record<string, unknown>) => api.patch(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  
  // Product Promotion Management
  toggleProductPromotion: (productId: string, isPromoted: boolean, promotionDays?: number) =>
    api.patch(`/admin/products/${productId}/promote`, { isPromoted, promotionDays }),
  toggleAdminProduct: (productId: string, isAdminProduct: boolean) =>
    api.patch(`/admin/products/${productId}/admin-product`, { isAdminProduct }),
  updateRecommendationScore: (productId: string, score: number) =>
    api.patch(`/admin/products/${productId}/recommendation-score`, { score }),
  getPromotedProducts: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/products/promoted', { params }),
  getAdminCuratedProducts: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/products/admin-products', { params }),
  
  // Farmers dropdown for product creation
  getFarmersForDropdown: () => api.get('/admin/farmers/dropdown'),
  
  // Dispatch Config
  getDispatchConfig: () => api.get('/admin/dispatch/config'),
  updateDispatchConfig: (config: Record<string, unknown>) => api.patch('/admin/dispatch/config', config),
  
  // Notifications
  getNotificationHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/notifications', { params }),
  sendBroadcastNotification: (data: {
    title: string;
    message: string;
    type: string;
    targetAudience: string;
  }) => api.post('/admin/notifications/broadcast', data),
  
  // Reports
  getReport: (params: {
    type: string;
    startDate: string;
    endDate: string;
  }) => api.get('/admin/reports', { params }),
  exportReport: (params: {
    type: string;
    format: string;
    startDate: string;
    endDate: string;
  }) => api.get('/admin/reports/export', { params, responseType: 'blob' }),
  
  // Support Tickets
  getSupportTickets: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    assignedToId?: string;
    search?: string;
  }) => api.get('/support/admin/tickets', { params }),
  getSupportTicket: (id: string) => api.get(`/support/admin/tickets/${id}`),
  getSupportMessages: (ticketId: string, params?: { page?: number; limit?: number }) => 
    api.get(`/support/admin/tickets/${ticketId}/messages`, { params }),
  sendSupportMessage: (ticketId: string, content: string, type?: string) =>
    api.post(`/support/admin/tickets/${ticketId}/messages`, { content, type }),
  assignSupportTicket: (ticketId: string, adminId?: string) =>
    api.post(`/support/admin/tickets/${ticketId}/assign`, { adminId }),
  updateSupportTicketStatus: (ticketId: string, status: string) =>
    api.patch(`/support/admin/tickets/${ticketId}/status`, { status }),
  getSupportStatistics: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/support/admin/statistics', { params }),
  
  // Audit Logs
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    category?: string;
    adminId?: string;
    targetId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/audit-logs', { params }),
  getAuditLog: (id: string) => api.get(`/admin/audit-logs/${id}`),
  getAuditLogStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/audit-logs/stats', { params }),
  getAdminsForDropdown: () => api.get('/admin/audit-logs/admins'),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (category: string, data: Record<string, unknown>) =>
    api.patch(`/admin/settings/${category}`, data),
  initializeSettings: () => api.post('/admin/settings/initialize'),
  
  // Revenue
  getRevenueDashboard: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/revenue/dashboard', { params }),
  getRevenueTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/revenue/transactions', { params }),
  getRevenueSummary: (params?: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) =>
    api.get('/admin/revenue/summary', { params }),
  
  // Referrals
  getReferrals: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/referrals/admin', { params }),
  getReferralStats: () => api.get('/referrals/admin/stats'),
  
  // Rewards & Loyalty
  getRewardsStats: () => api.get('/rewards/admin/stats'),
  getAllRewards: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: boolean;
  }) => api.get('/rewards/admin/rewards', { params }),
  getReward: (id: string) => api.get(`/rewards/admin/rewards/${id}`),
  createReward: (data: {
    name: string;
    description: string;
    pointsCost: number;
    type: 'discount' | 'free_delivery' | 'cashback' | 'product' | 'voucher';
    value?: number;
    imageUrl?: string;
    requiredTier?: string;
    stock: number;
    maxPerUser?: number;
    terms?: string[];
    startsAt?: string;
    expiresAt?: string;
  }) => api.post('/rewards/admin/rewards', data),
  updateReward: (id: string, data: Record<string, unknown>) => api.patch(`/rewards/admin/rewards/${id}`, data),
  deleteReward: (id: string) => api.delete(`/rewards/admin/rewards/${id}`),
  getLoyaltyAccounts: (params?: {
    page?: number;
    limit?: number;
    tier?: string;
    search?: string;
  }) => api.get('/rewards/admin/accounts', { params }),
  adjustUserPoints: (userId: string, data: {
    points: number;
    reason: string;
  }) => api.post(`/rewards/admin/adjust-points/${userId}`, data),
  getRedemptions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/rewards/admin/redemptions', { params }),
  
  // Subscriptions
  getSubscriptionsDashboard: () => api.get('/admin/subscriptions/dashboard'),
  getFarmerSubscriptions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
    search?: string;
  }) => api.get('/admin/subscriptions/farmers', { params }),
  getRiderSubscriptions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
    search?: string;
  }) => api.get('/admin/subscriptions/riders', { params }),
  getRecentSubscriptions: (params?: { limit?: number }) =>
    api.get('/admin/subscriptions/recent', { params }),
  getSubscriptionRevenueChart: (params?: { days?: number }) =>
    api.get('/admin/subscriptions/revenue-chart', { params }),
  
  // Account Deletion Requests
  getDeletionRequests: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/admin/deletion-requests', { params }),
  getDeletionRequestStats: () => api.get('/admin/deletion-requests/stats'),
  reviewDeletionRequest: (requestId: string, data: {
    action: 'approve' | 'reject';
    adminNotes?: string;
  }) => api.post(`/admin/deletion-requests/${requestId}/review`, data),
};

export default api;
