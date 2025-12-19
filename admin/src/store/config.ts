import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DispatchConfig {
  riderSearchRadiusKm: number;
  maxEtaMinutes: number;
  offerTimeoutSeconds: number;
  maxDispatchAttempts: number;
  locationStaleSeconds: number;
  autoDispatchEnabled: boolean;
}

interface ConfigState {
  dispatchConfig: DispatchConfig;
  featureFlags: Record<string, boolean>;
  updateDispatchConfig: (config: Partial<DispatchConfig>) => void;
  setFeatureFlag: (flag: string, enabled: boolean) => void;
}

const defaultDispatchConfig: DispatchConfig = {
  riderSearchRadiusKm: 15,
  maxEtaMinutes: 60,
  offerTimeoutSeconds: 120,
  maxDispatchAttempts: 5,
  locationStaleSeconds: 120,
  autoDispatchEnabled: true,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      dispatchConfig: defaultDispatchConfig,
      featureFlags: {
        liveTracking: true,
        bulkNotifications: true,
        advancedReports: false,
        riderChat: false,
      },
      updateDispatchConfig: (config) =>
        set((state) => ({
          dispatchConfig: { ...state.dispatchConfig, ...config },
        })),
      setFeatureFlag: (flag, enabled) =>
        set((state) => ({
          featureFlags: { ...state.featureFlags, [flag]: enabled },
        })),
    }),
    {
      name: 'admin-config',
    }
  )
);
