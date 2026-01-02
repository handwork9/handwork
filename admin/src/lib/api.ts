import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Normalize image URLs to use the correct backend host
 * Handles URLs stored with various IPs/hosts and rewrites them to use the configured backend
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder-product.png';
  
  // If it's a relative path starting with /uploads/, prefix with backend URL
  if (url.startsWith('/uploads/')) {
    return `${BACKEND_URL}${url}`;
  }
  
  // If it's already a relative path or placeholder, return as-is
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  
  // If it contains /uploads/, extract and rewrite to correct host
  if (url.includes('/uploads/')) {
    const uploadsPath = url.match(/\/uploads\/.+$/);
    if (uploadsPath) {
      return `${BACKEND_URL}${uploadsPath[0]}`;
    }
  }
  
  // Return original URL for external images
  return url;
}

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

// Two-Factor Authentication API
export const twoFactorApi = {
  // Generate 2FA secret and QR code
  generate: () => api.post('/auth/2fa/generate'),
  // Enable 2FA after verifying setup code
  enable: (code: string) => api.post('/auth/2fa/enable', { code }),
  // Disable 2FA with verification code
  disable: (code: string) => api.post('/auth/2fa/disable', { code }),
  // Get current 2FA status
  getStatus: () => api.get('/auth/2fa/status'),
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/admin/dashboard', { params }),
  
  // Dashboard additional data
  getTopFarmers: (limit?: number) => api.get('/admin/top-farmers', { params: { limit } }),
  getTopRiders: (limit?: number) => api.get('/admin/top-riders', { params: { limit } }),
  getRevenueMetrics: (startDate: string, endDate: string) => 
    api.get('/admin/metrics/revenue', { params: { startDate, endDate } }),
  getOrderMetrics: (startDate: string, endDate: string) =>
    api.get('/admin/metrics/orders', { params: { startDate, endDate } }),

  // Notification image upload
  uploadNotificationImage: (formData: FormData) =>
    api.post('/uploads/notifications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // General image upload (base64)
  uploadImage: (base64: string, folder: string = 'support') =>
    api.post('/uploads/image', { base64, folder }),
  
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
    state?: string; // Filter riders by state for state-by-state delivery
  }) => api.get('/admin/available-riders', { params }),
  getRider: (id: string) => api.get(`/riders/${id}`),
  updateRider: (id: string, data: Record<string, unknown>) => api.patch(`/admin/riders/${id}`, data),
  setRiderBoost: (id: string, data: { boost: number; expiresInHours?: number; reason: string }) => 
    api.patch(`/admin/riders/${id}/boost`, data),
  removeRiderBoost: (id: string) => api.delete(`/admin/riders/${id}/boost`),
  
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
    state?: string;
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
    imageUrl?: string;
  }) => api.post('/admin/notifications/broadcast', data),
  sendIndividualNotification: (data: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    imageUrl?: string;
  }) => api.post('/notifications/send', data),
  
  // Promotional Emails
  sendPromotionalEmail: (data: {
    subject: string;
    content: string;
    template: 'announcement' | 'promotion' | 'newsletter' | 'update';
    targetAudience: 'all' | 'buyers' | 'farmers' | 'riders';
    ctaButton?: { text: string; url: string };
    imageUrl?: string;
  }) => api.post('/admin/emails/promotional', data),
  
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
  sendSupportMessage: (ticketId: string, content: string, type?: string, attachments?: { url: string; type: string; name: string; size?: number }[]) =>
    api.post(`/support/admin/tickets/${ticketId}/messages`, { content, type, attachments }),
  assignSupportTicket: (ticketId: string, adminId?: string) =>
    api.post(`/support/admin/tickets/${ticketId}/assign`, { adminId }),
  updateSupportTicketStatus: (ticketId: string, status: string) =>
    api.patch(`/support/admin/tickets/${ticketId}/status`, { status }),
  getSupportStatistics: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/support/admin/statistics', { params }),
  getSupportTeam: () => api.get('/support/admin/team'),

  // Support Reports
  getSupportReports: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => api.get('/support/admin/reports', { params }),
  getSupportReport: (id: string) => api.get(`/support/admin/reports/${id}`),
  updateSupportReport: (id: string, data: { status?: string; adminNotes?: string }) =>
    api.patch(`/support/admin/reports/${id}`, data),
  getSupportReportStats: () => api.get('/support/admin/reports/stats/overview'),
  
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
    rejectionReason?: string;
  }) => api.post(`/admin/deletion-requests/${requestId}/review`, {
    approve: data.action === 'approve',
    adminNotes: data.adminNotes,
    rejectionReason: data.action === 'reject' ? (data.rejectionReason || data.adminNotes) : undefined,
  }),

  // Withdrawals Management
  getWithdrawals: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    ownerType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/withdrawals', { params }),
  getWithdrawalStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/withdrawals/stats', { params }),
  getWithdrawal: (id: string) => api.get(`/admin/withdrawals/${id}`),
  retryWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/retry`),
  updateWithdrawalStatus: (id: string, data: { status: string; reason?: string }) =>
    api.patch(`/admin/withdrawals/${id}/status`, data),
  refundWithdrawal: (id: string, reason?: string) =>
    api.post(`/admin/withdrawals/${id}/refund`, { reason }),

  // Buyer Premium Management
  getBuyerPremiumStats: () => api.get('/admin/buyer-premium/stats'),
  getBuyerPremiumSubscribers: (params?: {
    page?: number;
    limit?: number;
    tier?: string;
    status?: string;
    search?: string;
  }) => api.get('/admin/buyer-premium/subscribers', { params }),
  getBuyerPremiumTransactions: (params?: {
    page?: number;
    limit?: number;
    tier?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/buyer-premium/transactions', { params }),
  getBuyerPremiumSubscriber: (id: string) => api.get(`/admin/buyer-premium/subscribers/${id}`),
  extendBuyerPremium: (id: string, days: number, reason?: string) =>
    api.post(`/admin/buyer-premium/subscribers/${id}/extend`, { days, reason }),
  cancelBuyerPremium: (id: string, reason?: string) =>
    api.post(`/admin/buyer-premium/subscribers/${id}/cancel`, { reason }),
  changeBuyerPremiumTier: (id: string, tier: string, reason?: string) =>
    api.patch(`/admin/buyer-premium/subscribers/${id}/tier`, { tier, reason }),

  // Disputes Management
  getDisputes: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }) => api.get('/disputes/admin/all', { params }),
  getDisputeStats: () => api.get('/disputes/admin/stats'),
  updateDispute: (id: string, data: { status?: string; priority?: string; adminNotes?: string }) =>
    api.patch(`/disputes/admin/${id}`, data),
  assignDispute: (id: string, assignedToId: string) =>
    api.patch(`/disputes/admin/${id}/assign`, { assignedToId }),
  resolveDispute: (id: string, data: { resolution: string; refundedAmount?: number; resolutionNotes: string }) =>
    api.patch(`/disputes/admin/${id}/resolve`, data),
  sendDisputeMessage: (id: string, content: string) =>
    api.post(`/disputes/${id}/messages`, { content }),

  // Team Management
  getTeamMembers: () => api.get('/admin/team'),
  getPendingInvites: () => api.get('/admin/team/invites'),
  inviteTeamMember: (data: { email: string; role: string }) =>
    api.post('/admin/team/invite', data),
  verifyInviteToken: (token: string) =>
    api.get('/admin/team/invite/verify', { params: { token } }),
  acceptInvite: (data: { token: string; name: string; password: string; phone?: string }) =>
    api.post('/admin/team/invite/accept', data),
  resendInvite: (inviteId: string) =>
    api.post(`/admin/team/invite/${inviteId}/resend`),
  cancelInvite: (inviteId: string) =>
    api.delete(`/admin/team/invite/${inviteId}`),
  updateTeamMember: (memberId: string, data: { role?: string; isActive?: boolean }) =>
    api.patch(`/admin/team/${memberId}`, data),
  removeTeamMember: (memberId: string) =>
    api.delete(`/admin/team/${memberId}`),

  // Coupons Management
  getCoupons: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => api.get('/coupons/admin/all', { params }),
  getCoupon: (id: string) => api.get(`/coupons/admin/${id}`),
  createCoupon: (data: {
    code: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed_amount' | 'free_delivery';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    startDate: string;
    endDate: string;
    firstOrderOnly?: boolean;
    newUsersOnly?: boolean;
    applicableCategories?: string[];
    applicableProductIds?: string[];
  }) => api.post('/coupons', data),
  updateCoupon: (id: string, data: Record<string, unknown>) =>
    api.patch(`/coupons/admin/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/coupons/admin/${id}`),
  getCouponUsage: (id: string) => api.get(`/coupons/admin/${id}/usage`),

  // Group Buying Management
  getGroupBuyingSessions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/group-buying', { params }),
  getGroupBuyingSession: (id: string) => api.get(`/group-buying/${id}`),
  getGroupBuyingStats: () => api.get('/group-buying/admin/stats'),

  // Subscription Boxes Management
  getSubscriptionBoxTemplates: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) => api.get('/subscription-boxes/templates', { params }),
  getSubscriptionBoxTemplate: (id: string) => api.get(`/subscription-boxes/templates/${id}`),
  createSubscriptionBoxTemplate: (data: {
    name: string;
    description: string;
    price: number;
    frequency: 'weekly' | 'bi-weekly' | 'monthly';
    contents?: string;
    imageUrl?: string;
    category?: string;
    isActive?: boolean;
  }) => api.post('/subscription-boxes/templates', data),
  updateSubscriptionBoxTemplate: (id: string, data: Record<string, unknown>) =>
    api.patch(`/subscription-boxes/templates/${id}`, data),
  deleteSubscriptionBoxTemplate: (id: string) => api.delete(`/subscription-boxes/templates/${id}`),
  getSubscriptionBoxSubscriptions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/subscription-boxes/admin/subscriptions', { params }),
  getSubscriptionBoxStats: () => api.get('/subscription-boxes/admin/stats'),

  // Shopping Lists (Read Only for Admin)
  getShoppingListsStats: () => api.get('/shopping-lists/admin/stats'),

  // Pickup Locations Management
  getPickupLocations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    city?: string;
  }) => api.get('/pickup-locations/admin/all', { params }),
  getPickupLocation: (id: string) => api.get(`/pickup-locations/${id}`),
  createPickupLocation: (data: {
    name: string;
    code: string;
    type: 'locker' | 'pickup_point' | 'partner_store' | 'hub';
    status?: 'active' | 'inactive' | 'maintenance';
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    supportsRefrigeration?: boolean;
    deliveryDiscount?: number;
  }) => api.post('/pickup-locations', data),
  updatePickupLocation: (id: string, data: Record<string, unknown>) =>
    api.patch(`/pickup-locations/${id}`, data),
  deletePickupLocation: (id: string) => api.delete(`/pickup-locations/${id}`),
};

// Sessions API
export const sessionsApi = {
  getSessions: () => api.get('/sessions'),
  getLoginHistory: () => api.get('/sessions/login-history'),
  endSession: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
  endAllSessions: () => api.post('/sessions/end-all-others'),
};

export default api;
