import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, LogBox, View, Text, Platform } from 'react-native';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor, useAppDispatch } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { STRIPE_PUBLISHABLE_KEY } from './src/constants/config';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { loadAddresses } from './src/store/slices/addressSlice';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator } from 'react-native';
import { AnimatedSplashScreen } from './src/components/common/AnimatedSplashScreen';
import { initSentry, setUserContext } from './src/utils/sentry';

// Initialize i18n
import './src/i18n';

// Initialize Sentry for crash reporting (before anything else)
initSentry();

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings (remove in production)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    },
  },
});

function AppContent() {
  const { isDark, colors } = useTheme();
  const dispatch = useAppDispatch();
  const user = store.getState().auth.user;
  const addresses = store.getState().address.addresses;

  // Configure status bar for edge-to-edge mode on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

  // Set Sentry user context when user changes
  useEffect(() => {
    if (user?.id) {
      setUserContext(user.id, { role: user.role });
    } else {
      setUserContext(null);
    }
  }, [user?.id, user?.role]);
  
  // Load saved addresses on app start and sync user profile address
  useEffect(() => {
    const syncAddresses = async () => {
      // First load from local storage
      await dispatch(loadAddresses());
      
      // Get updated state after loading
      const currentAddresses = store.getState().address.addresses;
      const currentUser = store.getState().auth.user;
      
      // If no addresses saved locally but user has profile address, create one
      if (currentAddresses.length === 0 && currentUser?.address) {
        const { addAddress } = require('./src/store/slices/addressSlice');
        dispatch(addAddress({
          id: `profile_addr_${currentUser.id}`,
          label: 'Home',
          addressLine1: currentUser.address,
          city: currentUser.city || '',
          state: currentUser.state || '',
          postalCode: '',
          country: 'Nigeria',
          isDefault: true,
          lat: currentUser.latitude,
          lng: currentUser.longitude,
        }));
        console.log('[App] Created address from user profile');
      }
    };
    
    syncAddresses();
  }, [dispatch]);
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Billabong': require('./assets/fonts/Billabong.otf'),
  });

  const [showSplash, setShowSplash] = useState(true);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<ActivityIndicator size="large" color="#4CAF50" />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
                <ThemeProvider>
                  <ToastProvider>
                    <AppContent />
                    {showSplash && (
                      <AnimatedSplashScreen onAnimationComplete={handleSplashComplete} />
                    )}
                  </ToastProvider>
                </ThemeProvider>
              </StripeProvider>
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
