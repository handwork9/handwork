import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, LogBox, View, Text } from 'react-native';
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
import { loadAddresses } from './src/store/slices/addressSlice';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator } from 'react-native';

// Initialize i18n
import './src/i18n';

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
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  
  // Load saved addresses on app start
  useEffect(() => {
    dispatch(loadAddresses());
  }, [dispatch]);
  
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <Provider store={store}>
        <PersistGate loading={<ActivityIndicator size="large" color="#4CAF50" />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </StripeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
