import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerMediumHaptic } from '../../utils/haptics';
import { useAppSelector } from '../../store';
import { formatCurrency } from '../../utils/formatters';
import {
  AirtimeIllustration,
  DataIllustration,
  ElectricityIllustration,
  TvIllustration,
  InternetIllustration,
  BettingIllustration,
  BillsHeroIllustration,
} from '../../assets/illustrations/bills';
import { WalletHeroIllustration } from '../../assets/illustrations/stats';
import {
  BillType,
  Biller,
  BillerPackage,
  getBillers,
  getBillerPackages,
  buyAirtime,
  buyData,
  payBill,
  getBillHistory,
  BillHistoryItem,
} from '../../services/billsService';
import { walletService } from '../../services/walletService';

const { width } = Dimensions.get('window');

// Bill Categories Configuration
interface BillCategory {
  id: BillType;
  name: string;
  description: string;
  Illustration: React.FC<{ width?: number; height?: number; color?: string }>;
  color: string;
}

const BILL_CATEGORIES: BillCategory[] = [
  {
    id: BillType.AIRTIME,
    name: 'Airtime',
    description: 'Buy airtime instantly',
    Illustration: AirtimeIllustration,
    color: '#34C759',
  },
  {
    id: BillType.DATA,
    name: 'Data Bundle',
    description: 'Buy data plans',
    Illustration: DataIllustration,
    color: '#007AFF',
  },
  {
    id: BillType.ELECTRICITY,
    name: 'Electricity',
    description: 'Pay electricity bills',
    Illustration: ElectricityIllustration,
    color: '#FF9500',
  },
  {
    id: BillType.TV,
    name: 'TV Subscription',
    description: 'Pay cable TV bills',
    Illustration: TvIllustration,
    color: '#AF52DE',
  },
  {
    id: BillType.INTERNET,
    name: 'Internet',
    description: 'Pay internet bills',
    Illustration: InternetIllustration,
    color: '#5856D6',
  },
  {
    id: BillType.BETTING,
    name: 'Betting',
    description: 'Fund betting wallets',
    Illustration: BettingIllustration,
    color: '#FF2D55',
  },
];

// Quick amounts only for airtime (variable amount)
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function PayBillScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  
  // State for wallet balance - fetched from API
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // State
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [packages, setPackages] = useState<BillerPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<BillerPackage | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBillers, setIsLoadingBillers] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recentBills, setRecentBills] = useState<BillHistoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [pendingContactsOpen, setPendingContactsOpen] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    loadWalletBalance();
    loadRecentBills();
  }, []);

  // Handle opening contacts modal after payment modal closes
  useEffect(() => {
    if (pendingContactsOpen && !showPaymentModal) {
      const timer = setTimeout(() => {
        setShowContactsModal(true);
        setPendingContactsOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingContactsOpen, showPaymentModal]);

  const loadWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      console.log('[PayBillScreen] Loading wallet balance...');
      const response = await walletService.getBalance();
      console.log('[PayBillScreen] Raw balance response:', JSON.stringify(response));
      
      // Handle different response structures: { available } or { balance }
      let availableBalance = (response as any)?.available ?? (response as any)?.balance ?? 0;
      if (typeof availableBalance === 'string') {
        availableBalance = parseFloat(availableBalance) || 0;
      }
      console.log('[PayBillScreen] Parsed balance:', availableBalance);
      setWalletBalance(availableBalance);
    } catch (error) {
      console.error('[PayBillScreen] Failed to load wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadRecentBills = async () => {
    try {
      const history = await getBillHistory(1, 5);
      setRecentBills(history.data || []);
    } catch (error) {
      console.log('Failed to load bill history:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadWalletBalance(), loadRecentBills()]);
    setIsRefreshing(false);
  };

  // Dynamic styles
  const dynamicStyles = useMemo(() => ({
    container: isDark ? '#000000' : '#F2F2F7',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    secondaryCard: isDark ? '#2C2C2E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#38383A' : '#E5E5EA',
    inputBg: isDark ? '#2C2C2E' : '#F2F2F7',
    groupBg: isDark ? '#1C1C1E' : '#FFFFFF',
  }), [isDark]);

  const resetForm = useCallback(() => {
    setSelectedBiller(null);
    setPackages([]);
    setSelectedPackage(null);
    setPhoneNumber('');
    setAccountNumber('');
    setAmount('');
  }, []);

  // Load billers when category is selected
  const handleCategoryPress = useCallback(async (category: BillCategory) => {
    triggerHaptic();
    setSelectedCategory(category);
    resetForm();
    setShowPaymentModal(true);
    
    // Load billers from Paystack API
    setIsLoadingBillers(true);
    try {
      const fetchedBillers = await getBillers(category.id);
      setBillers(fetchedBillers);
    } catch (error) {
      console.error('Failed to load billers:', error);
      Alert.alert('Error', 'Failed to load providers. Please try again.');
    } finally {
      setIsLoadingBillers(false);
    }
  }, [resetForm]);

  // Load packages when biller is selected (for non-airtime categories)
  const handleBillerSelect = useCallback(async (biller: Biller) => {
    triggerHaptic();
    setSelectedBiller(biller);
    setSelectedPackage(null);
    setAmount('');
    
    // For data, TV, electricity, internet - load packages from Paystack
    if (selectedCategory?.id !== BillType.AIRTIME) {
      setIsLoadingPackages(true);
      try {
        const fetchedPackages = await getBillerPackages(biller.code);
        setPackages(fetchedPackages);
      } catch (error) {
        console.error('Failed to load packages:', error);
        setPackages([]);
      } finally {
        setIsLoadingPackages(false);
      }
    }
  }, [selectedCategory]);

  // Handle package selection - set amount from package
  const handlePackageSelect = useCallback((pkg: BillerPackage) => {
    triggerHaptic();
    setSelectedPackage(pkg);
    // Paystack returns amount in kobo, convert to naira
    const amountInNaira = pkg.amount / 100;
    setAmount(amountInNaira.toString());
  }, []);

  const handlePayBill = useCallback(async () => {
    if (!selectedCategory || !selectedBiller) {
      Alert.alert('Error', 'Please select a provider');
      return;
    }

    const isAirtime = selectedCategory.id === BillType.AIRTIME;
    const isData = selectedCategory.id === BillType.DATA;
    const identifier = (isAirtime || isData) ? phoneNumber : accountNumber;

    if (!identifier) {
      Alert.alert('Error', (isAirtime || isData) ? 'Please enter phone number' : 'Please enter account/meter number');
      return;
    }

    // For data, package must be selected
    if (isData && !selectedPackage) {
      Alert.alert('Error', 'Please select a data plan');
      return;
    }

    // For other categories (TV, electricity, internet), package must be selected
    if (!isAirtime && !selectedPackage) {
      Alert.alert('Error', 'Please select a package');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > walletBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to complete this transaction.');
      return;
    }

    triggerMediumHaptic();
    setIsProcessing(true);

    try {
      let result;

      if (isAirtime) {
        result = await buyAirtime({
          phoneNumber: identifier,
          amount: amountNum,
          provider: selectedBiller.code,
        });
      } else if (isData) {
        result = await buyData({
          phoneNumber: identifier,
          billerCode: selectedBiller.code,
          packageCode: selectedPackage!.code,
          amount: amountNum,
        });
      } else {
        result = await payBill({
          type: selectedCategory.id,
          billerCode: selectedBiller.code,
          itemCode: selectedPackage?.code || '',
          customerId: identifier,
          amount: amountNum,
        });
      }

      setShowPaymentModal(false);
      resetForm();
      setSelectedCategory(null);
      
      Alert.alert(
        'Payment Successful! ✓',
        `Your ${selectedCategory.name} payment of ${formatCurrency(amountNum)} was successful.\nRef: ${result.reference}`,
        [{ text: 'Done', style: 'default' }]
      );
      
      // Reload recent bills
      loadRecentBills();
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Unable to process your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCategory, selectedBiller, selectedPackage, phoneNumber, accountNumber, amount, walletBalance, resetForm]);

  const getCategoryForBill = (type: string) => {
    return BILL_CATEGORIES.find(c => c.id === type);
  };

  // Render category card
  const renderCategoryCard = (category: BillCategory) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: dynamicStyles.card }]}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}15` }]}>
        <category.Illustration width={32} height={32} color={category.color} />
      </View>
      <View style={styles.categoryContent}>
        <Text style={[styles.categoryName, { color: dynamicStyles.text }]}>
          {category.name}
        </Text>
        <Text style={[styles.categoryDescription, { color: dynamicStyles.textSecondary }]}>
          {category.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={dynamicStyles.textSecondary} />
    </TouchableOpacity>
  );

  // Render recent bill
  const renderRecentBill = (bill: BillHistoryItem) => {
    const category = getCategoryForBill(bill.type);
    if (!category) return null;

    const isSuccess = bill.status === 'completed' || bill.status === 'success';

    return (
      <TouchableOpacity
        key={bill.id}
        style={[styles.recentBillCard, { backgroundColor: dynamicStyles.card }]}
        activeOpacity={0.7}
      >
        <View style={[styles.recentBillIcon, { backgroundColor: `${category.color}15` }]}>
          <category.Illustration width={24} height={24} color={category.color} />
        </View>
        <View style={styles.recentBillContent}>
          <Text style={[styles.recentBillProvider, { color: dynamicStyles.text }]}>
            {bill.customerName || category.name}
          </Text>
          <Text style={[styles.recentBillAccount, { color: dynamicStyles.textSecondary }]}>
            {bill.customerId}
          </Text>
        </View>
        <View style={styles.recentBillRight}>
          <Text style={[styles.recentBillAmount, { color: dynamicStyles.text }]}>
            {formatCurrency(bill.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: isSuccess ? '#34C75915' : '#FF3B3015' }]}>
            <View style={[styles.statusDot, { backgroundColor: isSuccess ? '#34C759' : '#FF3B30' }]} />
            <Text style={[styles.statusText, { color: isSuccess ? '#34C759' : '#FF3B30' }]}>
              {isSuccess ? 'Paid' : 'Failed'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render biller item
  const renderBillerItem = (biller: Biller) => (
    <TouchableOpacity
      key={biller.code}
      style={[
        styles.billerItem,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' },
        selectedBiller?.code === biller.code && { 
          backgroundColor: '#F0FDF4', 
          borderColor: '#16A34A', 
          borderWidth: 2 
        },
      ]}
      onPress={() => handleBillerSelect(biller)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.billerName,
        { color: dynamicStyles.text },
        selectedBiller?.code === biller.code && { color: '#16A34A', fontWeight: '600' },
      ]}>
        {biller.shortName || biller.name}
      </Text>
      {selectedBiller?.code === biller.code && (
        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
      )}
    </TouchableOpacity>
  );

  // Render package item (for data plans, TV packages, etc.)
  const renderPackageItem = (pkg: BillerPackage, index: number) => {
    // Paystack returns amount in kobo, convert to naira
    const amountInNaira = pkg.amount / 100;
    const isSelected = selectedPackage?.code === pkg.code;
    
    return (
      <TouchableOpacity
        key={`${pkg.code}-${index}`}
        style={[
          styles.packageItem,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' },
          isSelected && { 
            backgroundColor: '#F0FDF4', 
            borderColor: '#16A34A', 
            borderWidth: 2 
          },
        ]}
        onPress={() => handlePackageSelect(pkg)}
        activeOpacity={0.7}
      >
        <View style={styles.packageInfo}>
          <Text style={[
            styles.packageName,
            { color: dynamicStyles.text },
            isSelected && { color: '#16A34A', fontWeight: '600' },
          ]}>
            {pkg.name}
          </Text>
          <Text style={[styles.packagePrice, { color: dynamicStyles.textSecondary }]}>
            {formatCurrency(amountInNaira)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: dynamicStyles.container }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={() => {
              triggerHaptic();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: dynamicStyles.text }]}>Pay Bills</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('TransactionHistory');
            }}
          >
            <Ionicons name="time-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Wallet Balance Card */}
        <View style={[styles.walletCard, { backgroundColor: dynamicStyles.card }]}>
          <View style={styles.walletIconContainer}>
            <WalletHeroIllustration width={32} height={32} color="#FFFFFF" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={[styles.walletLabel, { color: dynamicStyles.textSecondary }]}>
              Wallet Balance
            </Text>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color="#16A34A" style={{ marginTop: 8 }} />
            ) : (
              <Text style={[styles.walletBalance, { color: dynamicStyles.text }]}>
                {formatCurrency(walletBalance)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.topUpButton}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('TopUp');
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.topUpText}>Top Up</Text>
          </TouchableOpacity>
          <View style={styles.balanceDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
        </View>

        {/* Hero Illustration */}
        <View style={styles.heroContainer}>
          <BillsHeroIllustration width={width - 48} height={120} />
        </View>

        {/* Bill Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: dynamicStyles.textSecondary }]}>
            BILL CATEGORIES
          </Text>
          <View style={[styles.categoriesGroup, { backgroundColor: dynamicStyles.groupBg }]}>
            {BILL_CATEGORIES.map((category, index) => (
              <React.Fragment key={category.id}>
                {renderCategoryCard(category)}
                {index < BILL_CATEGORIES.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: dynamicStyles.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        {recentBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: dynamicStyles.textSecondary }]}>
                RECENT TRANSACTIONS
              </Text>
              <TouchableOpacity onPress={() => {
                triggerHaptic();
                (navigation as any).navigate('TransactionHistory');
              }}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.recentGroup, { backgroundColor: dynamicStyles.groupBg }]}>
              {recentBills.map((bill, index) => (
                <React.Fragment key={bill.id}>
                  {renderRecentBill(bill)}
                  {index < recentBills.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: dynamicStyles.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowPaymentModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: dynamicStyles.container }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: dynamicStyles.border }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                triggerHaptic();
                setShowPaymentModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={dynamicStyles.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              {selectedCategory && (
                <View style={[styles.modalIconContainer, { backgroundColor: `${selectedCategory.color}15` }]}>
                  <selectedCategory.Illustration width={24} height={24} color={selectedCategory.color} />
                </View>
              )}
              <Text style={[styles.modalTitle, { color: dynamicStyles.text }]}>
                {selectedCategory?.name || 'Pay Bill'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Select Provider */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: dynamicStyles.textSecondary }]}>
                SELECT PROVIDER
              </Text>
              {isLoadingBillers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={selectedCategory?.color} />
                  <Text style={[styles.loadingText, { color: dynamicStyles.textSecondary }]}>
                    Loading providers...
                  </Text>
                </View>
              ) : billers.length > 0 ? (
                <View style={[styles.billersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  <View style={styles.billersGrid}>
                    {billers.map(renderBillerItem)}
                  </View>
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: dynamicStyles.textSecondary }]}>
                  No providers available
                </Text>
              )}
            </View>

            {/* Phone/Account Number Input */}
            {selectedBiller && (
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: dynamicStyles.textSecondary }]}>
                  {selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA 
                    ? 'PHONE NUMBER' 
                    : selectedCategory?.id === BillType.BETTING
                    ? 'USER ID'
                    : 'METER/SMARTCARD NUMBER'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: dynamicStyles.groupBg }]}>
                  <TextInput
                    style={[styles.input, { color: dynamicStyles.text }]}
                    value={selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA ? phoneNumber : accountNumber}
                    onChangeText={selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA ? setPhoneNumber : setAccountNumber}
                    placeholder={selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA 
                      ? 'Enter phone number' 
                      : selectedCategory?.id === BillType.BETTING
                      ? 'Enter your betting user ID'
                      : 'Enter meter/smartcard number'}
                    placeholderTextColor={dynamicStyles.textSecondary}
                    keyboardType={selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA ? 'phone-pad' : 'default'}
                    maxLength={selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA ? 11 : 20}
                  />
                  {(selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.DATA) && (
                    <TouchableOpacity
                      style={[styles.contactButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' }]}
                      onPress={async () => {
                        console.log('[PayBillScreen] Contact button pressed');
                        triggerHaptic();
                        try {
                          const { status } = await Contacts.requestPermissionsAsync();
                          console.log('[PayBillScreen] Contacts permission status:', status);
                          if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Please grant contacts permission to select a contact.');
                            return;
                          }
                          console.log('[PayBillScreen] Fetching contacts...');
                          const { data } = await Contacts.getContactsAsync({
                            fields: [Contacts.Fields.PhoneNumbers],
                          });
                          console.log('[PayBillScreen] Contacts fetched:', data.length);
                          if (data.length > 0) {
                            const contactsWithPhones = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
                            console.log('[PayBillScreen] Contacts with phones:', contactsWithPhones.length);
                            if (contactsWithPhones.length === 0) {
                              Alert.alert('No Contacts', 'No contacts with phone numbers found.');
                              return;
                            }
                            // Sort contacts alphabetically
                            contactsWithPhones.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                            setContactsList(contactsWithPhones);
                            setContactSearch('');
                            // Close payment modal first, then open contacts modal
                            setShowPaymentModal(false);
                            setPendingContactsOpen(true);
                          } else {
                            Alert.alert('No Contacts', 'No contacts found.');
                          }
                        } catch (error) {
                          console.error('[PayBillScreen] Error fetching contacts:', error);
                          Alert.alert('Error', 'Failed to load contacts. Please try again.');
                        }
                      }}
                    >
                      <Ionicons name="person-add" size={20} color="#16A34A" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Data Plans / Packages (for non-airtime and non-betting categories) */}
            {selectedBiller && selectedCategory?.id !== BillType.AIRTIME && selectedCategory?.id !== BillType.BETTING && (
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: dynamicStyles.textSecondary }]}>
                  {selectedCategory?.id === BillType.DATA ? 'SELECT DATA PLAN' : 
                   selectedCategory?.id === BillType.TV ? 'SELECT BOUQUET' :
                   selectedCategory?.id === BillType.ELECTRICITY ? 'SELECT METER TYPE' :
                   'SELECT PACKAGE'}
                </Text>
                {isLoadingPackages ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={selectedCategory?.color} />
                    <Text style={[styles.loadingText, { color: dynamicStyles.textSecondary }]}>
                      Loading {selectedCategory?.id === BillType.DATA ? 'data plans' : 'packages'}...
                    </Text>
                  </View>
                ) : packages.length > 0 ? (
                  <View style={[styles.packagesCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                    <ScrollView 
                      style={styles.packagesScrollView}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.packagesContainer}>
                        {packages.map(renderPackageItem)}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: dynamicStyles.textSecondary }]}>
                    No {selectedCategory?.id === BillType.DATA ? 'data plans' : 'packages'} available
                  </Text>
                )}
              </View>
            )}

            {/* Amount - For Airtime and Betting (manual entry with quick amounts) */}
            {selectedBiller && (selectedCategory?.id === BillType.AIRTIME || selectedCategory?.id === BillType.BETTING) && (
              <>
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: dynamicStyles.textSecondary }]}>
                    AMOUNT
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: dynamicStyles.groupBg }]}>
                    <Text style={[styles.currencySymbol, { color: dynamicStyles.textSecondary }]}>₦</Text>
                    <TextInput
                      style={[styles.input, styles.amountInput, { color: dynamicStyles.text }]}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor={dynamicStyles.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Quick Amounts - Only for Airtime */}
                <View style={[styles.quickAmountsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  <View style={styles.quickAmountsContainer}>
                    {QUICK_AMOUNTS.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.quickAmountBtn,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' },
                          amount === amt.toString() && { 
                            backgroundColor: '#F0FDF4', 
                            borderColor: '#16A34A', 
                            borderWidth: 2 
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setAmount(amt.toString());
                        }}
                      >
                        <Text style={[
                          styles.quickAmountText,
                          { color: dynamicStyles.text },
                          amount === amt.toString() && { color: '#16A34A', fontWeight: '600' },
                        ]}>
                          ₦{amt.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Summary */}
            {amount && selectedBiller && parseFloat(amount) > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: dynamicStyles.groupBg }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: dynamicStyles.textSecondary }]}>Provider</Text>
                  <Text style={[styles.summaryValue, { color: dynamicStyles.text }]}>{selectedBiller.shortName || selectedBiller.name}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: dynamicStyles.border }]} />
                {selectedPackage && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: dynamicStyles.textSecondary }]}>Plan</Text>
                      <Text style={[styles.summaryValue, { color: dynamicStyles.text }]} numberOfLines={1}>{selectedPackage.name}</Text>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: dynamicStyles.border }]} />
                  </>
                )}
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: dynamicStyles.textSecondary }]}>Amount</Text>
                  <Text style={[styles.summaryValue, { color: dynamicStyles.text }]}>
                    {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: dynamicStyles.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: dynamicStyles.textSecondary }]}>Fee</Text>
                  <Text style={[styles.summaryValue, { color: '#34C759' }]}>FREE</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: dynamicStyles.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryTotalLabel, { color: dynamicStyles.text }]}>Total</Text>
                  <Text style={[styles.summaryTotalValue, { color: selectedCategory?.color }]}>
                    {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* Pay Button */}
            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: selectedCategory?.color || colors.primary },
                (isProcessing || !selectedBiller || !amount || parseFloat(amount) <= 0) && styles.payButtonDisabled,
              ]}
              onPress={handlePayBill}
              disabled={isProcessing || !selectedBiller || !amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={14} color={dynamicStyles.textSecondary} />
              <Text style={[styles.securityText, { color: dynamicStyles.textSecondary }]}>
                Secured with bank-level encryption
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contacts Modal */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowContactsModal(false);
          setTimeout(() => setShowPaymentModal(true), 300);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: dynamicStyles.container }]}>
          <View style={[styles.modalHeader, { borderBottomColor: dynamicStyles.border }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                triggerHaptic();
                setShowContactsModal(false);
                // Reopen payment modal after a short delay
                setTimeout(() => setShowPaymentModal(true), 300);
              }}
            >
              <Ionicons name="close" size={24} color={dynamicStyles.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: dynamicStyles.text }]}>Select Contact</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {/* Search Bar */}
          <View style={[styles.contactSearchContainer, { backgroundColor: dynamicStyles.groupBg }]}>
            <Ionicons name="search" size={20} color={dynamicStyles.textSecondary} />
            <TextInput
              style={[styles.contactSearchInput, { color: dynamicStyles.text }]}
              placeholder="Search contacts..."
              placeholderTextColor={dynamicStyles.textSecondary}
              value={contactSearch}
              onChangeText={setContactSearch}
            />
            {contactSearch.length > 0 && (
              <TouchableOpacity onPress={() => setContactSearch('')}>
                <Ionicons name="close-circle" size={20} color={dynamicStyles.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Contacts List */}
          <FlatList
            data={contactsList.filter(c => 
              contactSearch.length === 0 || 
              (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
              (c.phoneNumbers?.[0]?.number || '').includes(contactSearch)
            )}
            keyExtractor={(item, index) => `contact-${index}`}
            style={[styles.contactsList, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            ItemSeparatorComponent={() => (
              <View style={[styles.contactDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            )}
            renderItem={({ item: contact }) => (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => {
                  triggerHaptic();
                  if (contact.phoneNumbers && contact.phoneNumbers[0]) {
                    let phone = contact.phoneNumbers[0].number || '';
                    // Clean the phone number - remove spaces, dashes, and country code
                    phone = phone.replace(/[\s\-\(\)]/g, '');
                    if (phone.startsWith('+234')) phone = '0' + phone.slice(4);
                    if (phone.startsWith('234')) phone = '0' + phone.slice(3);
                    setPhoneNumber(phone.slice(0, 11));
                  }
                  setShowContactsModal(false);
                  // Reopen payment modal after a short delay
                  setTimeout(() => setShowPaymentModal(true), 300);
                }}
              >
                <View style={[styles.contactAvatar, { backgroundColor: '#16A34A' }]}>
                  <Text style={styles.contactAvatarText}>
                    {(contact.name || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: dynamicStyles.text }]}>
                    {contact.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.contactPhone, { color: dynamicStyles.textSecondary }]}>
                    {contact.phoneNumbers?.[0]?.number || 'No phone'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={dynamicStyles.textSecondary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContactsContainer}>
                <Text style={[styles.emptyText, { color: dynamicStyles.textSecondary }]}>
                  No contacts found
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  historyButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  walletCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  walletIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    zIndex: 1,
  },
  walletLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '700',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    zIndex: 1,
  },
  topUpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceDecoration: {
    position: 'absolute' as const,
    top: -20,
    right: -20,
  },
  decorationCircle: {
    position: 'absolute' as const,
    borderRadius: 100,
    backgroundColor: '#16A34A',
    opacity: 0.08,
  },
  decorationCircle1: {
    width: 120,
    height: 120,
    top: 0,
    right: 0,
  },
  decorationCircle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 60,
    opacity: 0.05,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
  },
  recentGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentBillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recentBillIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentBillContent: {
    flex: 1,
  },
  recentBillProvider: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  recentBillAccount: {
    fontSize: 13,
  },
  recentBillRight: {
    alignItems: 'flex-end',
  },
  recentBillAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  billersCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  billersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  billerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: '47%',
    flex: 1,
  },
  billerName: {
    fontSize: 14,
    flex: 1,
  },
  packagesCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  packagesScrollView: {
    maxHeight: 250,
  },
  packagesContainer: {
    gap: 10,
    padding: 16,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageInfo: {
    flex: 1,
    marginRight: 10,
  },
  packageName: {
    fontSize: 14,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '500',
    marginRight: 4,
  },
  quickAmountsCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
    justifyContent: 'space-between',
  },
  quickAmountBtn: {
    width: '31.5%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 16,
  },
  contactsList: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  emptyContactsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
