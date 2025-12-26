import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme, NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, AppStateStatus, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MessageBannerProvider, useMessageBanner } from '../context/MessageBannerContext';
import MessageBanner, { MessageNotification } from '../components/common/MessageBanner';
import IncomingCallOverlay from '../components/common/IncomingCallOverlay';
import biometricService from '../services/biometricService';
import BiometricLockScreen from '../screens/shared/BiometricLockScreen';
import { notificationService } from '../services/notificationService';
import { setNotificationSettings } from '../store/slices/notificationSettingsSlice';
import { authService } from '../services/authService';
import { updateUser } from '../store/slices/authSlice';

import { AuthNavigator } from './AuthNavigator';
import { BuyerNavigator } from './BuyerNavigator';
import { FarmerNavigator } from './FarmerNavigator';
import { RiderNavigator } from './RiderNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['handwork://', 'https://handwork.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          // Buyer screens
          ProductDetail: 'product/:productId',
          OrderTracking: 'order/:orderId',
          FarmerProfile: 'farmer/:farmerId',
        },
      },
    },
  },
};

export function RootNavigator() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const appState = useRef(AppState.currentState);
  
  // Biometric lock state
  const [isLocked, setIsLocked] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Refresh user profile from server on app startup to sync avatar and other data
  useEffect(() => {
    const refreshUserProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log('[RootNavigator] Refreshing user profile from server...');
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data) {
          console.log('[RootNavigator] User profile refreshed, avatar:', response.data.avatar);
          // Update local Redux state with fresh data from server
          dispatch(updateUser(response.data));
        }
      } catch (error) {
        console.error('[RootNavigator] Failed to refresh user profile:', error);
        // Don't logout on error - just use persisted data
      }
    };
    
    refreshUserProfile();
  }, [isAuthenticated, dispatch]);

  // Sync user profile address to local storage when authenticated
  useEffect(() => {
    const syncUserAddress = async () => {
      if (isAuthenticated && user?.address) {
        const { selectAddresses } = await import('../store/slices/addressSlice');
        const state = await import('../store').then(m => m.store.getState());
        const addresses = selectAddresses(state);
        
        // Only add if no addresses exist locally
        if (addresses.length === 0) {
          const { addAddress } = await import('../store/slices/addressSlice');
          dispatch(addAddress({
            id: `profile_addr_${user.id}`,
            label: 'Home',
            addressLine1: user.address,
            city: user.city || '',
            state: user.state || '',
            postalCode: '',
            country: 'Nigeria',
            isDefault: true,
            lat: user.latitude,
            lng: user.longitude,
          }));
          console.log('[RootNavigator] Synced user profile address to local storage');
        }
      }
    };
    
    syncUserAddress();
  }, [isAuthenticated, user, dispatch]);

  // Load notification settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotificationSettings()
        .then((settings) => {
          dispatch(setNotificationSettings(settings));
        })
        .catch((error) => {
          console.error('Failed to load notification settings:', error);
        });
    }
  }, [isAuthenticated, dispatch]);

  // Check if biometric lock is needed on mount and app state changes
  const checkBiometricLock = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLocked(false);
      setCheckingBiometric(false);
      return;
    }

    try {
      const info = await biometricService.getBiometricInfo();
      if (info.isAvailable && info.isEnabled) {
        const shouldLock = await biometricService.shouldRequireAuth();
        setIsLocked(shouldLock);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error checking biometric lock:', error);
      setIsLocked(false);
    } finally {
      setCheckingBiometric(false);
    }
  }, [isAuthenticated]);

  // Check biometric on mount
  useEffect(() => {
    checkBiometricLock();
  }, [checkBiometricLock]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App coming to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkBiometricLock();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkBiometricLock]);

  // Update last auth time when user successfully logs in
  useEffect(() => {
    if (isAuthenticated) {
      biometricService.updateLastAuth();
    }
  }, [isAuthenticated]);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    await biometricService.updateLastAuth();
    setIsLocked(false);
    // Brief delay to allow navigation to mount before removing loading state
    setTimeout(() => setIsUnlocking(false), 300);
  };

  // Create custom navigation theme based on our theme
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
    fonts: isDark ? DarkTheme.fonts : DefaultTheme.fonts,
  };

  const getNavigator = () => {
    if (!isAuthenticated || !user) {
      return <Stack.Screen name="Auth" component={AuthNavigator} />;
    }

    switch (user.role) {
      case 'farmer':
        return <Stack.Screen name="Main" component={FarmerNavigator} />;
      case 'rider':
        return <Stack.Screen name="Main" component={RiderNavigator} />;
      case 'buyer':
      default:
        return <Stack.Screen name="Main" component={BuyerNavigator} />;
    }
  };

  // Show biometric lock screen if needed
  if (isAuthenticated && isLocked && !checkingBiometric) {
    return (
      <BiometricLockScreen
        onUnlock={handleUnlock}
        userName={user?.name}
        userAvatar={user?.avatar}
      />
    );
  }

  // Show loading while checking biometric status or during unlock transition
  if ((checkingBiometric || isUnlocking) && isAuthenticated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <MessageBannerProvider>
        <NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            {getNavigator()}
          </Stack.Navigator>
          <MessageBannerOverlay navigationRef={navigationRef as any} userRole={user?.role} />
          <IncomingCallOverlay />
        </NavigationContainer>
      </MessageBannerProvider>
    </View>
  );
}

// Separate component to use the context inside the provider
function MessageBannerOverlay({ navigationRef, userRole }: { navigationRef: any; userRole?: string }) {
  const { currentNotification, dismissNotification } = useMessageBanner();

  const handleNotificationPress = (notification: MessageNotification) => {
    // Navigate to the chat screen based on user role
    if (navigationRef?.current) {
      try {
        // Determine which chat screen to navigate to based on user role and sender role
        let screenName: string;
        let params: any = {
          conversationId: notification.conversationId,
          recipientName: notification.senderName,
          senderId: notification.senderId,
          senderAvatar: notification.senderAvatar,
          senderRole: notification.senderRole,
        };

        if (userRole === 'farmer') {
          // Farmer receives messages from buyers
          screenName = 'BuyerChat';
          params.buyerId = notification.senderId;
          params.buyerName = notification.senderName;
        } else if (userRole === 'rider') {
          // Rider receives messages about deliveries
          screenName = 'DeliveryChat';
          params.contactId = notification.senderId;
          params.contactName = notification.senderName;
          params.contactRole = notification.senderRole || 'buyer';
        } else {
          // Buyer receives messages from farmers or riders
          if (notification.senderRole === 'farmer') {
            screenName = 'FarmerChat';
            params.farmerId = notification.senderId;
            params.farmerName = notification.senderName;
          } else if (notification.senderRole === 'rider') {
            screenName = 'RiderChat';
            params.riderId = notification.senderId;
            params.riderName = notification.senderName;
          } else {
            // Default to FarmerChat
            screenName = 'FarmerChat';
            params.farmerId = notification.senderId;
            params.farmerName = notification.senderName;
          }
        }

        // Navigate directly to the chat screen
        navigationRef.current.dispatch(
          CommonActions.navigate({
            name: screenName,
            params,
          })
        );
      } catch (error) {
        console.log('Navigation error:', error);
      }
    }
  };

  return (
    <MessageBanner
      notification={currentNotification}
      onDismiss={dismissNotification}
      onPress={handleNotificationPress}
    />
  );
}
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});