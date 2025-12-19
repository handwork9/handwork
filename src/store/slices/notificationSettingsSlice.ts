import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the type locally to avoid circular dependency with notificationService
export interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  orderUpdatesEnabled: boolean;
  deliveryAlertsEnabled: boolean;
  paymentAlertsEnabled: boolean;
  promotionsEnabled: boolean;
  newProductsEnabled: boolean;
  priceDropsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
}

interface NotificationSettingsState {
  settings: NotificationSettings;
  isLoaded: boolean;
}

const initialState: NotificationSettingsState = {
  settings: {
    pushNotificationsEnabled: true,
    orderUpdatesEnabled: true,
    deliveryAlertsEnabled: true,
    paymentAlertsEnabled: true,
    promotionsEnabled: false,
    newProductsEnabled: true,
    priceDropsEnabled: true,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
  },
  isLoaded: false,
};

const notificationSettingsSlice = createSlice({
  name: 'notificationSettings',
  initialState,
  reducers: {
    setNotificationSettings: (state, action: PayloadAction<NotificationSettings>) => {
      state.settings = action.payload;
      state.isLoaded = true;
    },
    updateNotificationSetting: (
      state,
      action: PayloadAction<{ key: keyof NotificationSettings; value: boolean }>
    ) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
    },
    resetNotificationSettings: (state) => {
      state.settings = initialState.settings;
      state.isLoaded = false;
    },
  },
});

export const {
  setNotificationSettings,
  updateNotificationSetting,
  resetNotificationSettings,
} = notificationSettingsSlice.actions;

export default notificationSettingsSlice.reducer;
