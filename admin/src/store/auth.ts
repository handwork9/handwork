import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export type AdminRole = 'superadmin' | 'operations' | 'finance' | 'support' | 'admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  permissions: string[];
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setAuth: (user: AdminUser, token: string, refreshToken?: string) => void;
  checkAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      login: (user, token) => {
        Cookies.set('admin_token', token, { expires: 7 });
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        Cookies.remove('admin_token');
        Cookies.remove('admin_refresh_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setAuth: (user, token, refreshToken) => {
        Cookies.set('admin_token', token, { expires: 7 });
        if (refreshToken) {
          Cookies.set('admin_refresh_token', refreshToken, { expires: 30 });
        }
        set({ user, isAuthenticated: true, isLoading: false });
      },
      checkAuth: () => {
        // This is now handled by persist rehydration
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Permission checking utilities
export const PERMISSIONS = {
  // Orders
  VIEW_ORDERS: 'view_orders',
  MANAGE_ORDERS: 'manage_orders',
  CANCEL_ORDERS: 'cancel_orders',
  REASSIGN_ORDERS: 'reassign_orders',
  
  // Users
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  SUSPEND_USERS: 'suspend_users',
  
  // Riders
  VIEW_RIDERS: 'view_riders',
  VERIFY_RIDERS: 'verify_riders',
  
  // Products
  VIEW_PRODUCTS: 'view_products',
  MANAGE_PRODUCTS: 'manage_products',
  
  // Dispatch
  VIEW_DISPATCH: 'view_dispatch',
  MANAGE_DISPATCH: 'manage_dispatch',
  
  // Finance
  VIEW_FINANCE: 'view_finance',
  PROCESS_REFUNDS: 'process_refunds',
  
  // Notifications
  SEND_NOTIFICATIONS: 'send_notifications',
  
  // Admin
  MANAGE_ADMINS: 'manage_admins',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_CONFIG: 'manage_config',
} as const;

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS), // Admin has same permissions as superadmin
  operations: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    PERMISSIONS.REASSIGN_ORDERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_RIDERS,
    PERMISSIONS.VERIFY_RIDERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_DISPATCH,
    PERMISSIONS.MANAGE_DISPATCH,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  finance: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.PROCESS_REFUNDS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  support: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_RIDERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.SEND_NOTIFICATIONS,
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hasPermission = (_user: AdminUser | null, _permission: string): boolean => {
  // Skip permission check for development
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const usePermission = (_permission: string): boolean => {
  // Skip permission check for development
  return true;
};
