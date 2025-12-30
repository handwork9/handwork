import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { walletService } from '../../services/walletService';
import billsService, { BillType } from '../../services/billsService';

const { width } = Dimensions.get('window');

interface BillCategory {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicon' | 'material';
  color: string;
  bgColor: string;
  providers: Provider[];
}

interface Provider {
  id: string;
  name: string;
  logo?: string;
  color: string;
}

interface RecentBill {
  id: string;
  category: string;
  provider: string;
  accountNumber: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
}

const BILL_CATEGORIES: BillCategory[] = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: 'bulb',
    iconType: 'ionicon',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    providers: [
      { id: 'ekedc', name: 'EKEDC', color: '#1E40AF' },
      { id: 'ikedc', name: 'IKEDC', color: '#059669' },
      { id: 'aedc', name: 'AEDC', color: '#DC2626' },
      { id: 'phedc', name: 'PHEDC', color: '#7C3AED' },
    ],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    icon: 'phone-portrait',
    iconType: 'ionicon',
    color: '#10B981',
    bgColor: '#D1FAE5',
    providers: [
      { id: 'mtn', name: 'MTN', color: '#FBBF24' },
      { id: 'glo', name: 'Glo', color: '#22C55E' },
      { id: 'airtel', name: 'Airtel', color: '#EF4444' },
      { id: '9mobile', name: '9Mobile', color: '#059669' },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    icon: 'wifi',
    iconType: 'ionicon',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    providers: [
      { id: 'mtn', name: 'MTN', color: '#FBBF24' },
      { id: 'glo', name: 'Glo', color: '#22C55E' },
      { id: 'airtel', name: 'Airtel', color: '#EF4444' },
      { id: '9mobile', name: '9Mobile', color: '#059669' },
    ],
  },
  {
    id: 'cable',
    name: 'Cable TV',
    icon: 'tv',
    iconType: 'ionicon',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    providers: [
      { id: 'dstv', name: 'DStv', color: '#1E3A8A' },
      { id: 'gotv', name: 'GOtv', color: '#16A34A' },
      { id: 'startimes', name: 'StarTimes', color: '#EA580C' },
    ],
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: 'globe',
    iconType: 'ionicon',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    providers: [
      { id: 'spectranet', name: 'Spectranet', color: '#0EA5E9' },
      { id: 'smile', name: 'Smile', color: '#F97316' },
      { id: 'swift', name: 'Swift', color: '#6366F1' },
    ],
  },
  {
    id: 'betting',
    name: 'Betting',
    icon: 'game-controller',
    iconType: 'ionicon',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    providers: [
      { id: 'bet9ja', name: 'Bet9ja', color: '#1E40AF' },
      { id: 'sportybet', name: 'SportyBet', color: '#DC2626' },
      { id: 'betking', name: 'BetKing', color: '#059669' },
      { id: '1xbet', name: '1xBet', color: '#0EA5E9' },
    ],
  },
];

const RECENT_BILLS: RecentBill[] = [
  {
    id: '1',
    category: 'Electricity',
    provider: 'EKEDC',
    accountNumber: '****4521',
    amount: 15000,
    date: 'Dec 8, 2025',
    status: 'paid',
  },
  {
    id: '2',
    category: 'Airtime',
    provider: 'MTN',
    accountNumber: '0801****234',
    amount: 2000,
    date: 'Dec 5, 2025',
    status: 'paid',
  },
  {
    id: '3',
    category: 'Cable TV',
    provider: 'DStv',
    accountNumber: '****7890',
    amount: 24500,
    date: 'Dec 1, 2025',
    status: 'paid',
  },
];

export default function PayBillScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackActivated, setCashbackActivated] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [recentBills, setRecentBills] = useState<RecentBill[]>(RECENT_BILLS);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Fetch real wallet balance on screen focus
  useFocusEffect(
    useCallback(() => {
      const fetchBalance = async () => {
        try {
          setIsLoadingBalance(true);
          const balance = await walletService.getBalance();
          setWalletBalance(balance.available);
        } catch (error) {
          console.error('Failed to fetch wallet balance:', error);
        } finally {
          setIsLoadingBalance(false);
        }
      };
      fetchBalance();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedProvider(null);
    setAccountNumber('');
    setAmount('');
    setPhoneNumber('');
  };

  const handleCategorySelect = (category: BillCategory) => {
    setSelectedCategory(category);
    setSelectedProvider(null);
    setShowPaymentModal(true);
  };

  const handlePayBill = () => {
    if (!selectedProvider) {
      Alert.alert('Select Provider', 'Please select a service provider');
      return;
    }
    
    if (selectedCategory?.id === 'airtime' || selectedCategory?.id === 'data') {
      if (!phoneNumber || phoneNumber.length < 11) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number');
        return;
      }
    } else {
      if (!accountNumber) {
        Alert.alert('Missing Info', 'Please enter your account/meter number');
        return;
      }
    }
    
    const paymentAmount = parseInt(amount);
    
    if (!amount || paymentAmount < 100) {
      Alert.alert('Invalid Amount', 'Minimum amount is ₦100');
      return;
    }
    
    if (paymentAmount > walletBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₦${(walletBalance ?? 0).toLocaleString()}) is less than the payment amount. Please top up your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', onPress: () => {
            setShowPaymentModal(false);
            setShowTopUpModal(true);
          }},
        ]
      );
      return;
    }
    
    Alert.alert(
      'Confirm Payment',
      `Pay ₦${(paymentAmount ?? 0).toLocaleString()} to ${selectedProvider.name}?\n\nWallet Balance: ₦${(walletBalance ?? 0).toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: processPayment,
        },
      ]
    );
  };
  
  const processPayment = async () => {
    setIsProcessing(true);
    
    const paymentAmount = parseInt(amount);
    
    try {
      let result;
      
      // Map category to Paystack bill type
      const categoryToBillType: Record<string, BillType> = {
        'airtime': BillType.AIRTIME,
        'data': BillType.DATA,
        'electricity': BillType.ELECTRICITY,
        'cable': BillType.TV,
        'internet': BillType.INTERNET,
      };
      
      const billType = categoryToBillType[selectedCategory?.id || ''];
      
      // For airtime, use the quick buy endpoint
      if (billType === BillType.AIRTIME) {
        result = await billsService.buyAirtime({
          phoneNumber: phoneNumber,
          amount: paymentAmount,
          provider: selectedProvider?.id || 'mtn',
        });
      } else {
        // For other bills, use the generic pay bill endpoint
        // Map local provider IDs to Paystack biller codes
        const providerBillerCodes: Record<string, { billerCode: string; itemCode: string }> = {
          // Electricity providers
          'ekedc': { billerCode: 'BIL113', itemCode: 'UNI_EA' },
          'ikedc': { billerCode: 'BIL114', itemCode: 'UNI_IA' },
          'aedc': { billerCode: 'BIL115', itemCode: 'UNI_AA' },
          'phedc': { billerCode: 'BIL116', itemCode: 'UNI_PA' },
          // Cable TV providers
          'dstv': { billerCode: 'BIL121', itemCode: 'CB_DSTV' },
          'gotv': { billerCode: 'BIL122', itemCode: 'CB_GOTV' },
          'startimes': { billerCode: 'BIL123', itemCode: 'CB_STAR' },
          // Data providers
          'mtn': { billerCode: 'BIL099', itemCode: 'MD099' },
          'airtel': { billerCode: 'BIL100', itemCode: 'MD100' },
          'glo': { billerCode: 'BIL102', itemCode: 'MD102' },
          '9mobile': { billerCode: 'BIL103', itemCode: 'MD103' },
        };
        
        const providerInfo = providerBillerCodes[selectedProvider?.id || ''];
        const customerId = selectedCategory?.id === 'data' ? phoneNumber : accountNumber;
        
        result = await billsService.payBill({
          type: billType,
          billerCode: providerInfo?.billerCode || 'BIL099',
          itemCode: providerInfo?.itemCode || 'AT099',
          customerId: customerId,
          amount: paymentAmount,
          customerName: customerId,
        });
      }
      
      if (result.success) {
        // Update local wallet balance after successful payment
        setWalletBalance(result.newBalance || (walletBalance - paymentAmount));
        
        // Create new transaction record for UI
        const newBill: RecentBill = {
          id: result.reference || Date.now().toString(),
          category: selectedCategory?.name || '',
          provider: selectedProvider?.name || '',
          accountNumber: selectedCategory?.id === 'airtime' || selectedCategory?.id === 'data' 
            ? phoneNumber.slice(0, 4) + '****' + phoneNumber.slice(-3)
            : '****' + accountNumber.slice(-4),
          amount: paymentAmount,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'paid',
        };
        
        // Add to recent bills
        setRecentBills(prev => [newBill, ...prev]);
        
        Alert.alert(
          'Payment Successful! 🎉',
          `You have successfully paid ₦${paymentAmount.toLocaleString()} to ${selectedProvider?.name}.\n\nReference: ${result.reference}\nNew Balance: ₦${(result.newBalance ?? 0).toLocaleString()}`,
          [
            { text: 'Done', onPress: () => {
              setShowPaymentModal(false);
              resetForm();
            }}
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.message || 'Payment failed. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTopUp = async () => {
    const topUpValue = parseInt(topUpAmount);
    
    if (!topUpAmount || topUpValue < 100) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₦100');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call actual top-up API
      const result = await walletService.topUp({ amount: topUpValue, paymentMethodId: 'card_default' });
      
      if (result.status === 'completed') {
        setWalletBalance(prev => prev + topUpValue);
        
        Alert.alert(
          'Top-Up Successful! 🎉',
          `₦${topUpValue.toLocaleString()} has been added to your wallet.\n\nReference: ${result.reference}\nNew Balance: ₦${(walletBalance + topUpValue).toLocaleString()}`,
          [
            { text: 'Done', onPress: () => {
              setShowTopUpModal(false);
              setTopUpAmount('');
            }}
          ]
        );
      } else {
        Alert.alert('Top-Up Pending', 'Your top-up is being processed. You will be notified once completed.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Top-up failed. Please try again.';
      Alert.alert('Top-Up Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderCategoryCard = (category: BillCategory, index: number) => (
    <Animated.View
      key={category.id}
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30 + index * 10, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        activeOpacity={0.7}
        onPress={() => handleCategorySelect(category)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={category.color}
          />
        </View>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecentBill = (bill: RecentBill) => (
    <TouchableOpacity
      key={bill.id}
      style={styles.recentBillCard}
      activeOpacity={0.7}
      onPress={() => {
        (navigation as any).navigate('PaymentDetail', { payment: bill });
      }}
    >
      <View style={styles.recentBillLeft}>
        <View style={[styles.recentBillIcon, { backgroundColor: '#F3E8FF' }]}>
          <Ionicons name="document-text" size={20} color="#7C3AED" />
        </View>
        <View style={styles.recentBillInfo}>
          <Text style={styles.recentBillProvider}>{bill.provider}</Text>
          <Text style={styles.recentBillAccount}>{bill.accountNumber}</Text>
        </View>
      </View>
      <View style={styles.recentBillRight}>
        <Text style={styles.recentBillAmount}>₦{(bill.amount ?? 0).toLocaleString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bill.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(bill.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(bill.status) }]}>
            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={['#7C3AED', '#9333EA', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pay Bills</Text>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => (navigation as any).navigate('PaymentHistory', { payments: recentBills })}
            >
              <Ionicons name="time" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Wallet Balance Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <View>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletBalance}>₦{(walletBalance ?? 0).toLocaleString()}.00</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => setShowTopUpModal(true)}>
              <Ionicons name="add" size={18} color="#7C3AED" />
              <Text style={styles.topUpText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {BILL_CATEGORIES.slice(0, 4).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={() => handleCategorySelect(category)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: category.bgColor }]}>
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={category.color}
                  />
                </View>
                <Text style={styles.quickActionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>All Services</Text>
          <View style={styles.categoriesGrid}>
            {BILL_CATEGORIES.map((category, index) => renderCategoryCard(category, index))}
          </View>
        </View>

        {/* Recent Bills */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('PaymentHistory', { payments: recentBills })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentBills}>
            {recentBills.slice(0, 5).map(renderRecentBill)}
          </View>
        </View>

        {/* Promo Banner */}
        <TouchableOpacity 
          style={styles.promoBanner} 
          activeOpacity={0.8}
          onPress={() => setShowCashbackModal(true)}
        >
          <LinearGradient
            colors={cashbackActivated ? ['#7C3AED', '#9333EA'] : ['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBannerGradient}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoIconContainer}>
                <Ionicons name={cashbackActivated ? "checkmark-circle" : "gift"} size={32} color="#FFF" />
              </View>
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>
                  {cashbackActivated ? 'Cashback Activated! ✨' : 'Earn 5% Cashback! 🎉'}
                </Text>
                <Text style={styles.promoDesc}>
                  {cashbackActivated 
                    ? 'Your next bill payment earns 5% back' 
                    : 'On your first bill payment this month'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              setShowPaymentModal(false);
              resetForm();
            }}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {/* Modal Header */}
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {selectedCategory && (
                  <View style={[styles.modalHeaderIcon, { backgroundColor: selectedCategory.bgColor }]}>
                    <Ionicons 
                      name={selectedCategory.icon as keyof typeof Ionicons.glyphMap}
                      size={24} 
                      color={selectedCategory.color}
                    />
                  </View>
                )}
                <View>
                  <Text style={styles.modalTitle}>
                    Pay {selectedCategory?.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Select provider and enter details
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowPaymentModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Provider Selection Dropdown */}
              <Text style={styles.formSectionTitle}>Select Provider</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowProviderDropdown(!showProviderDropdown)}
                  activeOpacity={0.7}
                >
                  {selectedProvider ? (
                    <View style={styles.dropdownSelected}>
                      <View style={[styles.dropdownProviderIcon, { backgroundColor: selectedProvider.color }]}>
                        <Text style={styles.dropdownProviderInitial}>
                          {selectedProvider.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.dropdownSelectedText}>{selectedProvider.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Choose a provider</Text>
                  )}
                  <Ionicons 
                    name={showProviderDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                
                {showProviderDropdown && (
                  <View style={styles.dropdownList}>
                    {selectedCategory?.providers.map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        style={[
                          styles.dropdownItem,
                          selectedProvider?.id === provider.id && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedProvider(provider);
                          setShowProviderDropdown(false);
                        }}
                      >
                        <View style={[styles.dropdownProviderIcon, { backgroundColor: provider.color }]}>
                          <Text style={styles.dropdownProviderInitial}>
                            {provider.name.charAt(0)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.dropdownItemText,
                          selectedProvider?.id === provider.id && styles.dropdownItemTextSelected,
                        ]}>
                          {provider.name}
                        </Text>
                        {selectedProvider?.id === provider.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Form Fields */}
              <Text style={styles.formSectionTitle}>Payment Details</Text>
              
              {(selectedCategory?.id === 'airtime' || selectedCategory?.id === 'data') ? (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Phone Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.formInputWrapper}>
                    <View style={styles.formInputIcon}>
                      <Ionicons name="call-outline" size={18} color="#7C3AED" />
                    </View>
                    <TextInput
                      style={styles.formInput}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Enter phone number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Account/Meter Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.formInputWrapper}>
                    <View style={styles.formInputIcon}>
                      <Ionicons name="card-outline" size={18} color="#7C3AED" />
                    </View>
                    <TextInput
                      style={styles.formInput}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      placeholder="Enter account number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="default"
                    />
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Amount <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.formInputWrapper}>
                  <View style={styles.formInputIcon}>
                    <Text style={styles.currencyIcon}>₦</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Quick Amount Selection */}
              {(selectedCategory?.id === 'airtime' || selectedCategory?.id === 'data') && (
                <View style={styles.quickAmounts}>
                  {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.quickAmountBtn,
                        amount === amt.toString() && styles.quickAmountBtnSelected,
                      ]}
                      onPress={() => setAmount(amt.toString())}
                    >
                      <Text style={[
                        styles.quickAmountText,
                        amount === amt.toString() && styles.quickAmountTextSelected,
                      ]}>
                        ₦{(amt ?? 0).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Payment Summary */}
              {amount && selectedProvider && (
                <View style={styles.summaryCard}>
                  <LinearGradient
                    colors={['#F3E8FF', '#EDE9FE']}
                    style={styles.summaryGradient}
                  >
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Provider</Text>
                      <Text style={styles.summaryValue}>{selectedProvider.name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Amount</Text>
                      <Text style={styles.summaryValue}>₦{parseInt(amount || '0').toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Fee</Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>FREE</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryTotalLabel}>Total</Text>
                      <Text style={styles.summaryTotalValue}>₦{parseInt(amount || '0').toLocaleString()}</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Pay Button */}
              <TouchableOpacity 
                style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
                onPress={handlePayBill}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={isProcessing ? ['#9CA3AF', '#9CA3AF'] : ['#7C3AED', '#9333EA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={styles.payText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                      <Text style={styles.payText}>Pay Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                <Text style={styles.securityText}>
                  Your payment is secured with bank-level encryption
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Top-Up Modal */}
      <Modal
        visible={showTopUpModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowTopUpModal(false);
          setTopUpAmount('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              setShowTopUpModal(false);
              setTopUpAmount('');
            }}
          />
          <View style={[styles.topUpModalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View>
                  <Text style={styles.modalTitle}>Top Up Wallet</Text>
                  <Text style={styles.modalSubtitle}>Add funds to your wallet</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount('');
                }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Current Balance */}
            <View style={styles.currentBalanceCard}>
              <Text style={styles.currentBalanceLabel}>Current Balance</Text>
              <Text style={styles.currentBalanceAmount}>₦{walletBalance.toLocaleString()}.00</Text>
            </View>

            {/* Amount Input */}
            <Text style={styles.formSectionTitle}>Enter Amount</Text>
            <View style={styles.formGroup}>
              <View style={styles.formInputWrapper}>
                <View style={styles.formInputIcon}>
                  <Text style={styles.currencySymbol}>₦</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {[1000, 2000, 5000, 10000, 20000, 50000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountBtn,
                    topUpAmount === amt.toString() && styles.quickAmountBtnSelected,
                  ]}
                  onPress={() => setTopUpAmount(amt.toString())}
                >
                  <Text style={[
                    styles.quickAmountText,
                    topUpAmount === amt.toString() && styles.quickAmountTextSelected,
                  ]}>
                    ₦{amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Top Up Button */}
            <TouchableOpacity 
              style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
              onPress={handleTopUp}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={isProcessing ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payGradient}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.payText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle" size={22} color="#FFF" />
                    <Text style={styles.payText}>Top Up Wallet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cashback Modal */}
      <Modal
        visible={showCashbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCashbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowCashbackModal(false)}
          />
          <View style={[styles.cashbackModalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {/* Cashback Header */}
            <View style={styles.cashbackHeader}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cashbackHeaderGradient}
              >
                <View style={styles.cashbackIconBig}>
                  <Ionicons name="gift" size={48} color="#FFF" />
                </View>
                <Text style={styles.cashbackHeaderTitle}>5% Cashback Offer</Text>
                <Text style={styles.cashbackHeaderSubtitle}>Limited time offer for bill payments</Text>
              </LinearGradient>
            </View>

            {/* Offer Details */}
            <View style={styles.cashbackDetails}>
              <Text style={styles.cashbackSectionTitle}>How it works</Text>
              
              <View style={styles.cashbackStep}>
                <View style={styles.cashbackStepIcon}>
                  <Text style={styles.cashbackStepNumber}>1</Text>
                </View>
                <View style={styles.cashbackStepContent}>
                  <Text style={styles.cashbackStepTitle}>Activate the Offer</Text>
                  <Text style={styles.cashbackStepDesc}>Tap the button below to activate cashback</Text>
                </View>
              </View>

              <View style={styles.cashbackStep}>
                <View style={styles.cashbackStepIcon}>
                  <Text style={styles.cashbackStepNumber}>2</Text>
                </View>
                <View style={styles.cashbackStepContent}>
                  <Text style={styles.cashbackStepTitle}>Pay Any Bill</Text>
                  <Text style={styles.cashbackStepDesc}>Complete a bill payment of ₦1,000 or more</Text>
                </View>
              </View>

              <View style={styles.cashbackStep}>
                <View style={styles.cashbackStepIcon}>
                  <Text style={styles.cashbackStepNumber}>3</Text>
                </View>
                <View style={styles.cashbackStepContent}>
                  <Text style={styles.cashbackStepTitle}>Get 5% Back</Text>
                  <Text style={styles.cashbackStepDesc}>Cashback is credited to your wallet instantly</Text>
                </View>
              </View>

              {/* Terms */}
              <View style={styles.cashbackTerms}>
                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                <Text style={styles.cashbackTermsText}>
                  Maximum cashback of ₦2,500 per transaction. Valid till Dec 31, 2025.
                </Text>
              </View>
            </View>

            {/* Activate Button */}
            <TouchableOpacity 
              style={styles.cashbackActivateBtn} 
              onPress={() => {
                setCashbackActivated(true);
                setShowCashbackModal(false);
                Alert.alert(
                  '🎉 Cashback Activated!',
                  'Your next bill payment will earn 5% cashback. Maximum cashback: ₦2,500.',
                  [{ text: 'Got it!', style: 'default' }]
                );
              }}
              disabled={cashbackActivated}
            >
              <LinearGradient
                colors={cashbackActivated ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cashbackActivateGradient}
              >
                {cashbackActivated ? (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={styles.cashbackActivateText}>Already Activated</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="gift" size={22} color="#FFF" />
                    <Text style={styles.cashbackActivateText}>Activate Cashback</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.cashbackCloseBtn}
              onPress={() => setShowCashbackModal(false)}
            >
              <Text style={styles.cashbackCloseBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 80,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1F2937',
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  topUpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  scrollView: {
    flex: 1,
    marginTop: -50,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  recentBills: {
    gap: 12,
  },
  recentBillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentBillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentBillIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentBillInfo: {},
  recentBillProvider: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  recentBillAccount: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  recentBillRight: {
    alignItems: 'flex-end',
  },
  recentBillAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  promoBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  promoBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoText: {},
  promoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  promoDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  dropdownContainer: {
    marginBottom: 24,
    zIndex: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownProviderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownProviderInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  dropdownSelectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  formInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  formInputIcon: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    alignSelf: 'stretch',
    paddingVertical: 14,
  },
  currencyIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  formInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    color: '#1F2937',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickAmountBtn: {
    width: '31%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountBtnSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickAmountTextSelected: {
    color: '#7C3AED',
  },
  summaryCard: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
  },
  payButton: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  payText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  topUpModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  currentBalanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  currentBalanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  currentBalanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  cashbackModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: '85%',
  },
  cashbackHeader: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  cashbackHeaderGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  cashbackIconBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cashbackHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  cashbackHeaderSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cashbackDetails: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cashbackSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  cashbackStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cashbackStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cashbackStepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  cashbackStepContent: {
    flex: 1,
  },
  cashbackStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cashbackStepDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cashbackTerms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  cashbackTermsText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  cashbackActivateBtn: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cashbackActivateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  cashbackActivateText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  cashbackCloseBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 24,
  },
  cashbackCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
