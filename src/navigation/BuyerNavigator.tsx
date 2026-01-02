import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { BuyerTabParamList, BuyerStackParamList } from '../types';
import { COLORS, FONT_SIZES, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';

// Buyer Screens
import HomeScreen from '../screens/buyer/HomeScreen';
import SearchScreen from '../screens/buyer/SearchScreen';
import MessagesScreen from '../screens/buyer/MessagesScreen';
import OrdersScreen from '../screens/buyer/OrdersScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import FarmerProfileScreen from '../screens/buyer/FarmerProfileScreen';
import CartScreen from '../screens/buyer/CartScreen';
import CheckoutScreen from '../screens/buyer/CheckoutScreen';
import OrderTrackingScreen from '../screens/buyer/OrderTrackingScreen';
import OrderDisputeScreen from '../screens/buyer/OrderDisputeScreen';
import MyDisputesScreen from '../screens/buyer/MyDisputesScreen';
import WriteReviewScreen from '../screens/buyer/WriteReviewScreen';
import OrderConfirmationScreen from '../screens/buyer/OrderConfirmationScreen';
import OrderCompletedScreen from '../screens/buyer/OrderCompletedScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import NotificationDetailScreen from '../screens/shared/NotificationDetailScreen';

// Shared Profile Screens
import WalletScreen from '../screens/shared/WalletScreen';
import TopUpScreen from '../screens/shared/TopUpScreen';
import WithdrawScreen from '../screens/shared/WithdrawScreen';
import WithdrawalHistoryScreen from '../screens/shared/WithdrawalHistoryScreen';
import BankAccountsScreen from '../screens/shared/BankAccountsScreen';
import TransferScreen from '../screens/shared/TransferScreen';
import RewardsScreen from '../screens/shared/RewardsScreen';
import RewardHistoryScreen from '../screens/shared/RewardHistoryScreen';
import RewardDetailScreen from '../screens/shared/RewardDetailScreen';
import RewardTransactionDetailScreen from '../screens/shared/RewardTransactionDetailScreen';
import HowToEarnScreen from '../screens/shared/HowToEarnScreen';
import LeaderboardScreen from '../screens/shared/LeaderboardScreen';
import DailyChallengesScreen from '../screens/shared/DailyChallengesScreen';
import BecomeFarmerInfoScreen from '../screens/shared/BecomeFarmerInfoScreen';
import FarmerOnboardingScreen from '../screens/shared/FarmerOnboardingScreen';
import InviteHistoryScreen from '../screens/shared/InviteHistoryScreen';
import InviteDetailScreen from '../screens/shared/InviteDetailScreen';
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
import LoginActivityScreen from '../screens/shared/LoginActivityScreen';
import ActiveSessionsScreen from '../screens/shared/ActiveSessionsScreen';
import LanguageScreen from '../screens/shared/LanguageScreen';
import HelpTranslateScreen from '../screens/shared/HelpTranslateScreen';
import HelpCenterScreen from '../screens/shared/HelpCenterScreen';
import ContactUsScreen from '../screens/shared/ContactUsScreen';
import RateAppScreen from '../screens/shared/RateAppScreen';
import TermsPrivacyScreen from '../screens/shared/TermsPrivacyScreen';
import LiveChatScreen from '../screens/shared/LiveChatScreen';
import AIChatbotScreen from '../screens/shared/AIChatbotScreen';
import MyReportsScreen from '../screens/shared/MyReportsScreen';
import PayBillScreen from '../screens/shared/PayBillScreen';
import PaymentHistoryScreen from '../screens/shared/PaymentHistoryScreen';
import PaymentDetailScreen from '../screens/shared/PaymentDetailScreen';
import TransactionHistoryScreen from '../screens/shared/TransactionHistoryScreen';
import TransactionDetailScreen from '../screens/shared/TransactionDetailScreen';
import FarmerChatScreen from '../screens/buyer/FarmerChatScreen';
import RiderChatScreen from '../screens/buyer/RiderChatScreen';
import GoPremiumScreen from '../screens/buyer/GoPremiumScreen';
import GoPremiumLearnMoreScreen from '../screens/buyer/GoPremiumLearnMoreScreen';
import VerifiedSellersLearnMoreScreen from '../screens/buyer/VerifiedSellersLearnMoreScreen';
import NearbyFarmersMapScreen from '../screens/buyer/NearbyFarmersMapScreen';
import CategoriesScreen from '../screens/buyer/CategoriesScreen';
import NotificationSettingsScreen from '../screens/shared/NotificationSettingsScreen';
import AppearanceScreen from '../screens/shared/AppearanceScreen';
import DeleteAccountScreen from '../screens/shared/DeleteAccountScreen';
import VideoCallScreen from '../screens/shared/VideoCallScreen';
import VoiceCallScreen from '../screens/shared/VoiceCallScreen';
import SubscriptionBoxScreen from '../screens/buyer/SubscriptionBoxScreen';
import GroupBuyingScreen from '../screens/buyer/GroupBuyingScreen';
import CreateGroupBuyScreen from '../screens/buyer/CreateGroupBuyScreen';
import GroupBuyDetailScreen from '../screens/buyer/GroupBuyDetailScreen';
import ShoppingListsScreen from '../screens/buyer/ShoppingListsScreen';
import CouponsScreen from '../screens/buyer/CouponsScreen';

// Social Feature Screens
import SocialFeedScreen from '../screens/shared/SocialFeedScreen';
import StoriesScreen from '../screens/shared/StoriesScreen';
import LiveStreamsScreen from '../screens/shared/LiveStreamsScreen';
import SavedPostsScreen from '../screens/shared/SavedPostsScreen';
import CreateStoryScreen from '../screens/shared/CreateStoryScreen';

const Tab = createBottomTabNavigator<BuyerTabParamList>();
const Stack = createNativeStackNavigator<BuyerStackParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Orders: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
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
        const label = route.name;
        const isFocused = state.index === index;
        const iconConfig = TAB_ICONS[route.name];
        const iconName = isFocused ? iconConfig.active : iconConfig.inactive;
        const color = isFocused ? colors.primary : colors.textSecondary;

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

function BuyerTabs() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function BuyerNavigator() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Connect to notification WebSocket for real-time updates
  const handleNotification = useCallback((notification: any) => {
    console.log('[BuyerNavigator] Received notification:', notification);
    
    // Handle different notification types
    if (notification.type === 'order_update' || notification.type === 'order_status') {
      // Invalidate orders query to refetch updated orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    }
    
    if (notification.type === 'new_message') {
      // Invalidate conversations query
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }

    // Show toast banner for notifications
    if (notification.title && notification.body) {
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
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="BuyerTabs"
        component={BuyerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FarmerProfile"
        component={FarmerProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDispute"
        component={OrderDisputeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyDisputes"
        component={MyDisputesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WriteReview"
        component={WriteReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="OrderCompleted"
        component={OrderCompletedScreen}
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
        name="BankAccounts"
        component={BankAccountsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardHistory"
        component={RewardHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardDetail"
        component={RewardDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RewardTransactionDetail"
        component={RewardTransactionDetailScreen}
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
        name="BecomeFarmerInfo"
        component={BecomeFarmerInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FarmerOnboarding"
        component={FarmerOnboardingScreen}
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
        name="InviteHistory"
        component={InviteHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InviteDetail"
        component={InviteDetailScreen}
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
        name="Language"
        component={LanguageScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpTranslate"
        component={HelpTranslateScreen}
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
        name="FarmerChat"
        component={FarmerChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RiderChat"
        component={RiderChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoPremium"
        component={GoPremiumScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoPremiumLearnMore"
        component={GoPremiumLearnMoreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerifiedSellersLearnMore"
        component={VerifiedSellersLearnMoreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NearbyFarmersMap"
        component={NearbyFarmersMapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
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
        name="SubscriptionBox"
        component={SubscriptionBoxScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupBuying"
        component={GroupBuyingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateGroupBuy"
        component={CreateGroupBuyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupBuyDetail"
        component={GroupBuyDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShoppingLists"
        component={ShoppingListsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Coupons"
        component={CouponsScreen}
        options={{ headerShown: false }}
      />
      {/* Social Feature Screens */}
      <Stack.Screen
        name="SocialFeed"
        component={SocialFeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Stories"
        component={StoriesScreen}
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="LiveStreams"
        component={LiveStreamsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateStory"
        component={CreateStoryScreen}
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
