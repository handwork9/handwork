import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { RiderTabParamList, RiderStackParamList } from '../types';
import { COLORS, FONT_SIZES, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';

// Rider Screens
import AvailableJobsScreen from '../screens/rider/AvailableJobsScreen';
import ActiveDeliveryScreen from '../screens/rider/ActiveDeliveryScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import DeliveryConfirmationScreen from '../screens/rider/DeliveryConfirmationScreen';
import DeliveryChatScreen from '../screens/rider/DeliveryChatScreen';
import DeliveryReceiptScreen from '../screens/rider/DeliveryReceiptScreen';
import RiderSubscriptionScreen from '../screens/rider/RiderSubscriptionScreen';
import RiderDisputesScreen from '../screens/rider/RiderDisputesScreen';
import RiderDisputeDetailScreen from '../screens/rider/RiderDisputeDetailScreen';
import RiderPerformanceScreen from '../screens/rider/RiderPerformanceScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import GoPremiumScreen from '../screens/buyer/GoPremiumScreen';

// Shared Profile Screens
import WalletScreen from '../screens/shared/WalletScreen';
import TopUpScreen from '../screens/shared/TopUpScreen';
import RewardsScreen from '../screens/shared/RewardsScreen';
import FavoritesScreen from '../screens/shared/FavoritesScreen';
import InviteScreen from '../screens/shared/InviteScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import MyAddressScreen from '../screens/shared/MyAddressScreen';
import PaymentMethodsScreen from '../screens/shared/PaymentMethodsScreen';
import SecurityScreen from '../screens/shared/SecurityScreen';
import TwoFactorSetupScreen from '../screens/shared/TwoFactorSetupScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import ChangePinScreen from '../screens/shared/ChangePinScreen';
import SetPinScreen from '../screens/shared/SetPinScreen';
import ResetPinScreen from '../screens/shared/ResetPinScreen';
import DeleteAccountScreen from '../screens/shared/DeleteAccountScreen';
import LoginActivityScreen from '../screens/shared/LoginActivityScreen';
import ActiveSessionsScreen from '../screens/shared/ActiveSessionsScreen';
import TransferScreen from '../screens/shared/TransferScreen';
import InviteHistoryScreen from '../screens/shared/InviteHistoryScreen';
import RewardDetailScreen from '../screens/shared/RewardDetailScreen';
import HowToEarnScreen from '../screens/shared/HowToEarnScreen';
import LeaderboardScreen from '../screens/shared/LeaderboardScreen';
import DailyChallengesScreen from '../screens/shared/DailyChallengesScreen';
import RewardHistoryScreen from '../screens/shared/RewardHistoryScreen';
import RewardTransactionDetailScreen from '../screens/shared/RewardTransactionDetailScreen';
import LanguageScreen from '../screens/shared/LanguageScreen';
import HelpCenterScreen from '../screens/shared/HelpCenterScreen';
import ContactUsScreen from '../screens/shared/ContactUsScreen';
import RateAppScreen from '../screens/shared/RateAppScreen';
import TermsPrivacyScreen from '../screens/shared/TermsPrivacyScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import NotificationDetailScreen from '../screens/shared/NotificationDetailScreen';
import LiveChatScreen from '../screens/shared/LiveChatScreen';
import AIChatbotScreen from '../screens/shared/AIChatbotScreen';
import MyReportsScreen from '../screens/shared/MyReportsScreen';
import PayBillScreen from '../screens/shared/PayBillScreen';
import PaymentHistoryScreen from '../screens/shared/PaymentHistoryScreen';
import PaymentDetailScreen from '../screens/shared/PaymentDetailScreen';
import TransactionHistoryScreen from '../screens/shared/TransactionHistoryScreen';
import TransactionDetailScreen from '../screens/shared/TransactionDetailScreen';
import BankAccountsScreen from '../screens/shared/BankAccountsScreen';
import WithdrawScreen from '../screens/shared/WithdrawScreen';
import WithdrawalHistoryScreen from '../screens/shared/WithdrawalHistoryScreen';
import WithdrawalDetailScreen from '../screens/shared/WithdrawalDetailScreen';
import NotificationSettingsScreen from '../screens/shared/NotificationSettingsScreen';
import AppearanceScreen from '../screens/shared/AppearanceScreen';
import VideoCallScreen from '../screens/shared/VideoCallScreen';
import VoiceCallScreen from '../screens/shared/VoiceCallScreen';

const Tab = createBottomTabNavigator<RiderTabParamList>();
const Stack = createNativeStackNavigator<RiderStackParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  AvailableJobs: { active: 'briefcase', inactive: 'briefcase-outline' },
  ActiveDelivery: { active: 'map', inactive: 'map-outline' },
  Earnings: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const TAB_LABELS: Record<string, string> = {
  AvailableJobs: 'Jobs',
  ActiveDelivery: 'Active',
  Earnings: 'Earnings',
  Profile: 'Profile',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        backgroundColor: colors.card,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
        borderTopColor: colors.border,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = TAB_LABELS[route.name] || route.name;
        const isFocused = state.index === index;
        const iconConfig = TAB_ICONS[route.name];
        const iconName = isFocused ? iconConfig.active : iconConfig.inactive;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabCard,
              { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' }
            ]}>
              <Ionicons name={iconName} size={28} color={isFocused ? '#34C759' : colors.textSecondary} />
              <Text style={[styles.tabLabel, { color: isFocused ? '#34C759' : colors.textSecondary }]}>{label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function RiderTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="AvailableJobs" component={AvailableJobsScreen} />
      <Tab.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RiderNavigator() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Connect to notification WebSocket for real-time updates
  const handleNotification = useCallback((notification: any) => {
    console.log('[RiderNavigator] Received notification:', notification);
    
    // If it's an order assignment, invalidate query and show toast
    if (notification.type === 'order_assigned' && notification.data?.orderId) {
      // Invalidate the active-delivery query to refetch new order
      queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
      
      showToast({
        title: notification.title || 'New Order Assigned',
        message: notification.body || 'You have been assigned a new order. Go to the Active tab to view it.',
        type: 'success',
      });
    } else if (notification.title && notification.body) {
      // Show toast for other notifications
      const toastType = notification.data?.broadcastType === 'promo' ? 'promo' 
        : notification.data?.broadcastType === 'warning' ? 'warning'
        : notification.data?.broadcastType === 'success' ? 'success'
        : 'info';
      
      showToast({
        title: notification.title,
        message: notification.body,
        type: toastType,
      });
    }
  }, [queryClient, showToast]);

  useNotificationSocket(handleNotification);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="RiderTabs"
        component={RiderTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ 
          title: 'Delivery Complete',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeliveryReceipt"
        component={DeliveryReceiptScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeliveryChat"
        component={DeliveryChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopUp"
        component={TopUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoPremium"
        component={GoPremiumScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RiderSubscription"
        component={RiderSubscriptionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Invite"
        component={InviteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyAddress"
        component={MyAddressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TwoFactorSetup"
        component={TwoFactorSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RateApp"
        component={RateAppScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TermsPrivacy"
        component={TermsPrivacyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LiveChat"
        component={LiveChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIChatbot"
        component={AIChatbotScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PayBill"
        component={PayBillScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentDetail"
        component={PaymentDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BankAccounts"
        component={BankAccountsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePin"
        component={ChangePinScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SetPin"
        component={SetPinScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ResetPin"
        component={ResetPinScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginActivity"
        component={LoginActivityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActiveSessions"
        component={ActiveSessionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InviteHistory"
        component={InviteHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardDetail"
        component={RewardDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HowToEarn"
        component={HowToEarnScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyChallenges"
        component={DailyChallengesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardHistory"
        component={RewardHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardTransactionDetail"
        component={RewardTransactionDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WithdrawalHistory"
        component={WithdrawalHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WithdrawalDetail"
        component={WithdrawalDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="VoiceCall"
        component={VoiceCallScreen}
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="MyDisputes"
        component={RiderDisputesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RiderDisputeDetail"
        component={RiderDisputeDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RiderPerformance"
        component={RiderPerformanceScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 72,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: FONTS.semiBold,
  },
});
