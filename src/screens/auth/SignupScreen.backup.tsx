import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList, UserRole } from '../../types';
import { Button, TextInput, DocumentUpload } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { addPaymentMethod } from '../../store/slices/paymentSlice';
import { authService } from '../../services/authService';
import { 
  NIGERIAN_BANKS, 
  formatCardNumber, 
  formatExpiryDate, 
  detectCardBrand,
  getCardBrandColor,
  maskCardNumber,
  maskAccountNumber,
} from '../../services/paymentService';
import { useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().min(10, 'Invalid phone number').required('Phone is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
  state: yup.string().required('State is required'),
  city: yup.string().required('City is required'),
  address: yup.string().min(5, 'Address must be at least 5 characters').required('Address is required'),
  // Rider-specific fields (all optional - validated manually for riders)
  bikeModel: yup.string().optional(),
  bikePlateNumber: yup.string().optional(),
  bikeColor: yup.string().optional(),
  driversLicense: yup.string().optional(),
  // Guarantor 1
  guarantor1Name: yup.string().optional(),
  guarantor1Phone: yup.string().optional(),
  guarantor1Address: yup.string().optional(),
  guarantor1Occupation: yup.string().optional(),
  guarantor1Relationship: yup.string().optional(),
  guarantor1IdImage: yup.string().optional(),
  // Guarantor 2
  guarantor2Name: yup.string().optional(),
  guarantor2Phone: yup.string().optional(),
  guarantor2Address: yup.string().optional(),
  guarantor2Occupation: yup.string().optional(),
  guarantor2Relationship: yup.string().optional(),
  guarantor2IdImage: yup.string().optional(),
  // Farmer-specific fields (all optional - validated manually for farmers)
  farmName: yup.string().optional(),
  farmSize: yup.string().optional(),
  farmAddress: yup.string().optional(),
  farmType: yup.string().optional(),
  yearsOfExperience: yup.string().optional(),
  primaryProducts: yup.string().optional(),
  hasTransportation: yup.string().optional(),
  businessRegistrationNumber: yup.string().optional(),
  bankName: yup.string().optional(),
  bankAccountNumber: yup.string().optional(),
  bankAccountName: yup.string().optional(),
  farmerId: yup.string().optional(),
  farmPhotos: yup.string().optional(),
  // Buyer-specific payment fields
  paymentCardNumber: yup.string().optional(),
  paymentCardExpiry: yup.string().optional(),
  paymentCardCvv: yup.string().optional(),
  paymentCardholderName: yup.string().optional(),
  paymentBankName: yup.string().optional(),
  paymentAccountNumber: yup.string().optional(),
  paymentAccountName: yup.string().optional(),
});

type FormData = yup.InferType<typeof schema>;

const roles: {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  longDescription: string;
  color: string;
  gradient: [string, string];
  features: string[];
}[] = [
  {
    value: 'buyer',
    label: 'Buyer',
    icon: 'cart',
    description: 'Shop fresh farm produce',
    longDescription: 'Get access to fresh, locally-sourced produce directly from verified farmers. Enjoy competitive prices and doorstep delivery.',
    color: COLORS.primary,
    gradient: [COLORS.primary, COLORS.primaryDark],
    features: [
      'Browse thousands of fresh products',
      'Track your orders in real-time',
      'Chat directly with farmers',
      'Secure payment options',
      'Schedule convenient deliveries',
    ],
  },
  {
    value: 'farmer',
    label: 'Farmer',
    icon: 'leaf',
    description: 'Sell your harvest directly',
    longDescription: 'Connect directly with buyers and grow your business. No middlemen, better profits, and full control over your sales.',
    color: COLORS.success,
    gradient: ['#10B981', '#059669'],
    features: [
      'List unlimited products',
      'Manage orders efficiently',
      'Access sales analytics dashboard',
      'Set your own prices',
      'Build customer relationships',
    ],
  },
  {
    value: 'rider',
    label: 'Rider',
    icon: 'bicycle',
    description: 'Earn money delivering orders',
    longDescription: 'Join our delivery network and earn on your own schedule. Pick up orders from farmers and deliver fresh produce to buyers.',
    color: COLORS.accent,
    gradient: [COLORS.accent, '#D97706'],
    features: [
      'Flexible working hours',
      'Competitive pay per delivery',
      'Real-time navigation support',
      'Weekly payouts to your account',
      'Grow with performance bonuses',
    ],
  },
];

// Nigerian States and their major cities/LGAs
const NIGERIAN_STATES: { [key: string]: string[] } = {
  'Abia': ['Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa', 'Obioma Ngwa', 'Osisioma', 'Ugwunagbo'],
  'Adamawa': ['Yola', 'Mubi', 'Jimeta', 'Numan', 'Ganye', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Michika'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak', 'Ikot Abasi', 'Etinan', 'Essien Udim', 'Itu', 'Uruan'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata', 'Ihiala', 'Ogidi', 'Oraifite', 'Nnobi', 'Ozubulu'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum', 'Dass', 'Tafawa Balewa', 'Ningi', 'Toro', 'Alkaleri'],
  'Bayelsa': ['Yenagoa', 'Ogbia', 'Sagbama', 'Brass', 'Nembe', 'Ekeremor', 'Kolokuma/Opokuma', 'Southern Ijaw'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya', 'Okpokwu', 'Oju', 'Obi', 'Ado', 'Agatu'],
  'Borno': ['Maiduguri', 'Biu', 'Bama', 'Dikwa', 'Gwoza', 'Konduga', 'Monguno', 'Ngala', 'Damboa', 'Chibok'],
  'Cross River': ['Calabar', 'Ogoja', 'Ikom', 'Obudu', 'Ugep', 'Akamkpa', 'Biase', 'Bekwarra', 'Boki', 'Obubra'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor', 'Ozoro', 'Oleh', 'Kwale', 'Bomadi', 'Burutu'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Edda', 'Ezza', 'Ikwo', 'Ishielu', 'Ohaozara', 'Onicha', 'Ohaukwu'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua', 'Ubiaja', 'Igarra', 'Okada', 'Sabongida-Ora', 'Fugar'],
  'Ekiti': ['Ado-Ekiti', 'Ikere', 'Oye', 'Ikole', 'Ijero', 'Emure', 'Ise', 'Aramoko', 'Efon-Alaaye', 'Omuo'],
  'Enugu': ['Enugu', 'Nsukka', 'Agbani', 'Udi', 'Oji River', 'Awgu', 'Nkanu', 'Igbo-Eze', 'Ezeagu', 'Aninri'],
  'FCT': ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kwali', 'Abaji'],
  'Gombe': ['Gombe', 'Billiri', 'Kaltungo', 'Bajoga', 'Dukku', 'Nafada', 'Funakaye', 'Akko', 'Yamaltu/Deba', 'Balanga'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise', 'Nkwerre', 'Ideato', 'Mbaitoli', 'Ikeduru', 'Ahiazu Mbaise'],
  'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Ringim', 'Birnin Kudu', 'Babura', 'Garki', 'Kiyawa', 'Malam Madori'],
  'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Zonkwa', 'Sanga', 'Jema\'a', 'Kaura', 'Lere', 'Kachia'],
  'Kano': ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Bichi', 'Karaye', 'Bagwai', 'Danbatta', 'Gaya', 'Sumaila'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Kankia', 'Dutsin-Ma', 'Bakori', 'Mashi', 'Mani', 'Jibia'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Jega', 'Bagudo', 'Kalgo', 'Bunza', 'Gwandu', 'Aleiro'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Ankpa', 'Dekina', 'Omala', 'Ofu', 'Igalamela-Odolu', 'Ibaji'],
  'Kwara': ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba', 'Lafiagi', 'Pategi', 'Share', 'Kaiama', 'Baruten', 'Edu'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Lekki', 'Victoria Island', 'Ikoyi', 'Surulere', 'Yaba', 'Oshodi', 'Agege', 'Alimosho', 'Badagry', 'Epe', 'Ikorodu', 'Ajah', 'Mushin', 'Apapa', 'Festac'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Doma', 'Wamba', 'Keana', 'Awe', 'Obi', 'Toto'],
  'Niger': ['Minna', 'Bida', 'Suleja', 'Kontagora', 'New Bussa', 'Lapai', 'Agaie', 'Mokwa', 'Wushishi', 'Kagara'],
  'Ogun': ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota', 'Ilaro', 'Ifo', 'Iperu', 'Ogere', 'Ayetoro', 'Owode'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Ikare', 'Okitipupa', 'Ore', 'Idanre', 'Ilaje', 'Odigbo', 'Irele'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo', 'Ikire', 'Ejigbo', 'Ila Orangun', 'Ilobu', 'Inisa'],
  'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki', 'Eruwa', 'Igboho', 'Kishi', 'Igbo-Ora', 'Fiditi'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Langtang', 'Barkin Ladi', 'Bassa', 'Bokkos', 'Mangu', 'Riyom'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Degema', 'Okrika', 'Omoku', 'Ahoada', 'Eleme', 'Oyigbo', 'Ogu/Bolo'],
  'Sokoto': ['Sokoto', 'Wamakko', 'Bodinga', 'Tambuwal', 'Goronyo', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Takum', 'Gembu', 'Zing', 'Yorro', 'Gassol', 'Ibi', 'Donga'],
  'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam', 'Bade', 'Jakusko', 'Machina', 'Yusufari', 'Fika'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Bungudu', 'Maru', 'Tsafe', 'Zurmi', 'Shinkafi', 'Bakura'],
};

const STATES = Object.keys(NIGERIAN_STATES).sort();

export default function SignupScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: colors.card },
    roleCard: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    roleCardSelected: { borderColor: '#34C759' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    pickerButton: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    inputLabel: { color: colors.text },
  }), [colors, isDark]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animation refs for each role card
  const scaleAnims = useRef(roles.map(() => new Animated.Value(1))).current;
  const checkAnims = useRef(roles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate the selected role
    roles.forEach((role, index) => {
      const isSelected = role.value === selectedRole;
      Animated.parallel([
        Animated.spring(scaleAnims[index], {
          toValue: isSelected ? 1.02 : 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(checkAnims[index], {
          toValue: isSelected ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [selectedRole]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      state: '',
      city: '',
      address: '',
      // Rider fields
      bikeModel: '',
      bikePlateNumber: '',
      bikeColor: '',
      driversLicense: '',
      // Guarantor 1
      guarantor1Name: '',
      guarantor1Phone: '',
      guarantor1Address: '',
      guarantor1Occupation: '',
      guarantor1Relationship: '',
      guarantor1IdImage: '',
      // Guarantor 2
      guarantor2Name: '',
      guarantor2Phone: '',
      guarantor2Address: '',
      guarantor2Occupation: '',
      guarantor2Relationship: '',
      guarantor2IdImage: '',
      // Farmer fields
      farmName: '',
      farmSize: '',
      farmAddress: '',
      farmType: '',
      yearsOfExperience: '',
      primaryProducts: '',
      hasTransportation: '',
      businessRegistrationNumber: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
      farmerId: '',
      farmPhotos: '',
      // Buyer payment fields
      paymentCardNumber: '',
      paymentCardExpiry: '',
      paymentCardCvv: '',
      paymentCardholderName: '',
      paymentBankName: '',
      paymentAccountNumber: '',
      paymentAccountName: '',
    },
  });

  // Total steps depends on role (riders/farmers: 5, buyers: 4)
  const totalSteps = selectedRole === 'rider' || selectedRole === 'farmer' ? 5 : 4;

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const signupData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: selectedRole,
        state: data.state,
        city: data.city,
        address: data.address,
      };

      // Add rider-specific data
      if (selectedRole === 'rider') {
        signupData.riderData = {
          bikeModel: data.bikeModel,
          bikePlateNumber: data.bikePlateNumber,
          bikeColor: data.bikeColor,
          driversLicense: data.driversLicense,
          guarantors: [
            {
              name: data.guarantor1Name,
              phone: data.guarantor1Phone,
              address: data.guarantor1Address,
              occupation: data.guarantor1Occupation,
              relationship: data.guarantor1Relationship,
              idImage: data.guarantor1IdImage,
            },
            {
              name: data.guarantor2Name,
              phone: data.guarantor2Phone,
              address: data.guarantor2Address,
              occupation: data.guarantor2Occupation,
              relationship: data.guarantor2Relationship,
              idImage: data.guarantor2IdImage,
            },
          ],
        };
      }

      // Add farmer-specific data
      if (selectedRole === 'farmer') {
        signupData.farmerData = {
          farmName: data.farmName,
          farmSize: data.farmSize,
          farmAddress: data.farmAddress,
          farmType: data.farmType,
          yearsOfExperience: data.yearsOfExperience,
          primaryProducts: data.primaryProducts,
          hasTransportation: data.hasTransportation === 'yes',
          businessRegistrationNumber: data.businessRegistrationNumber,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber,
          bankAccountName: data.bankAccountName,
          farmerId: data.farmerId,
          farmPhotos: data.farmPhotos,
        };
      }

      const response = await authService.signup(signupData);

      if (response?.success && response?.data?.user) {
        dispatch(setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));

        // Save buyer payment method to store if provided
        if (selectedRole === 'buyer') {
          // Save card if provided
          if (data.paymentCardNumber && data.paymentCardExpiry) {
            const brand = detectCardBrand(data.paymentCardNumber);
            const colors = getCardBrandColor(brand);
            dispatch(addPaymentMethod({
              id: `card_${Date.now()}`,
              type: 'card',
              label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${data.paymentCardNumber.slice(-4)}`,
              details: `Expires ${data.paymentCardExpiry}`,
              icon: 'card',
              iconColor: colors.color,
              iconBg: colors.bg,
              isDefault: true,
              cardNumber: maskCardNumber(data.paymentCardNumber),
              cardExpiry: data.paymentCardExpiry,
              cardholderName: data.paymentCardholderName,
              cardBrand: brand,
            }));
          }
          // Save bank account if provided
          else if (data.paymentBankName && data.paymentAccountNumber) {
            dispatch(addPaymentMethod({
              id: `bank_${Date.now()}`,
              type: 'bank',
              label: data.paymentBankName,
              details: `Account ending in ${data.paymentAccountNumber.slice(-4)}`,
              icon: 'storefront-outline',
              iconColor: '#FF6B00',
              iconBg: '#FFF3E0',
              isDefault: true,
              bankName: data.paymentBankName,
              accountNumber: maskAccountNumber(data.paymentAccountNumber),
              accountName: data.paymentAccountName,
            }));
          }
        }
      } else {
        Alert.alert('Signup Failed', response?.message || 'Please try again');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.response?.data?.message 
        || error?.message 
        || 'An error occurred. Please try again.';
      Alert.alert('Signup Failed', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* iOS-style Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {currentStep === 1 && 'Choose Role'}
            {currentStep === 2 && 'Personal Info'}
            {currentStep === 3 && 'Location & Security'}
            {currentStep === 4 && selectedRole === 'rider' && 'Bike Details'}
            {currentStep === 5 && selectedRole === 'rider' && 'Guarantors'}
            {currentStep === 4 && selectedRole === 'farmer' && 'Farm Details'}
            {currentStep === 5 && selectedRole === 'farmer' && 'Verification'}
            {currentStep === 4 && selectedRole === 'buyer' && 'Payment'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={styles.stepWrapper}>
              <View style={[
                styles.stepDot,
                { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' },
                i + 1 <= currentStep && { backgroundColor: '#34C759' },
              ]}>
                {i + 1 < currentStep ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    i + 1 <= currentStep && styles.stepNumberActive,
                  ]}>{i + 1}</Text>
                )}
              </View>
              {i < totalSteps - 1 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' },
                  i + 1 < currentStep && { backgroundColor: '#34C759' },
                ]} />
              )}
            </View>
          ))}
        </View>
        
        {/* Step Description */}
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {currentStep === 1 && 'Select how you want to use Handwork'}
          {currentStep === 2 && 'Tell us a bit about yourself'}
          {currentStep === 3 && 'Add your location and create password'}
          {currentStep === 4 && selectedRole === 'rider' && 'Enter your bike and license details'}
          {currentStep === 5 && selectedRole === 'rider' && 'Add 2 guarantors with their information'}
          {currentStep === 4 && selectedRole === 'farmer' && 'Tell us about your farm'}
          {currentStep === 5 && selectedRole === 'farmer' && 'Business info and ID verification'}
          {currentStep === 4 && selectedRole === 'buyer' && 'Add your payment method (optional)'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.roleContainer}>
            {roles.map((role, index) => {
              const isSelected = selectedRole === role.value;
              return (
                <Animated.View
                  key={role.value}
                  style={[{ transform: [{ scale: scaleAnims[index] }] }]}
                >
                  <TouchableOpacity
                    style={[
                      styles.roleCard,
                      dynamicStyles.roleCard,
                      isSelected && [styles.roleCardSelected, { borderColor: '#34C759' }],
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.roleCardHeader}>
                      {/* Role Icon */}
                      <View
                        style={[
                          styles.roleIconContainer,
                          isSelected && { backgroundColor: '#34C75920' },
                        ]}
                      >
                        <Ionicons
                          name={role.icon}
                          size={24}
                          color={isSelected ? '#34C759' : colors.textSecondary}
                        />
                      </View>

                      {/* Role Info */}
                      <View style={styles.roleCardInfo}>
                        <Text
                          style={[
                            styles.roleLabel,
                            { color: colors.text },
                            isSelected && { color: '#34C759' },
                          ]}
                        >
                          {role.label}
                        </Text>
                        <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>{role.description}</Text>
                      </View>

                      {/* Radio indicator */}
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && { borderColor: '#34C759' },
                        ]}
                      >
                        {isSelected && (
                          <View style={[styles.radioInner, { backgroundColor: '#34C759' }]} />
                        )}
                      </View>
                    </View>

                    {/* Expanded Content when selected */}
                    {isSelected && (
                      <View style={[styles.expandedContent, { borderTopColor: '#34C75930' }]}>
                        <Text style={[styles.longDescription, { color: colors.textSecondary }]}>{role.longDescription}</Text>
                        
                        <Text style={[styles.featuresTitle, { color: '#34C759' }]}>What you can do:</Text>
                        {role.features.map((feature, idx) => (
                          <View key={idx} style={styles.featureRow}>
                            <View style={[styles.featureIcon, { backgroundColor: '#34C75920' }]}>
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color="#34C759"
                              />
                            </View>
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
              </View>

              {/* Continue Button for Step 1 */}
              <Button
                title="Continue"
                onPress={() => setCurrentStep(2)}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email Address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number"
                    placeholder="08012345678"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                  />
                )}
              />

              {/* Continue Button for Step 2 */}
              <Button
                title="Continue"
                onPress={() => setCurrentStep(3)}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 3: Location & Security */}
          {currentStep === 3 && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field: { onChange, value } }) => (
                      <View>
                        <Text style={styles.inputLabel}>State</Text>
                        <TouchableOpacity
                          style={[
                            styles.pickerButton,
                            errors.state && styles.pickerButtonError,
                          ]}
                          onPress={() => setShowStatePicker(true)}
                        >
                          <Text
                            style={[
                              styles.pickerButtonText,
                              !value && styles.pickerPlaceholder,
                            ]}
                          >
                            {value || 'Select state'}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={20}
                            color={COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                        {errors.state && (
                          <Text style={styles.errorText}>{errors.state.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="city"
                    render={({ field: { onChange, value } }) => (
                      <View>
                        <Text style={styles.inputLabel}>City/LGA</Text>
                        <TouchableOpacity
                        style={[
                          styles.pickerButton,
                          errors.city && styles.pickerButtonError,
                          !selectedState && styles.pickerButtonDisabled,
                        ]}
                        onPress={() => {
                          if (selectedState) {
                            setShowCityPicker(true);
                          } else {
                            Alert.alert('Select State First', 'Please select a state before choosing a city.')
                          }
                        }}
                        disabled={!selectedState}
                      >
                        <Text
                          style={[
                            styles.pickerButtonText,
                            !value && styles.pickerPlaceholder,
                          ]}
                        >
                          {value || 'Select city'}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={selectedState ? COLORS.textSecondary : COLORS.border}
                        />
                      </TouchableOpacity>
                      {errors.city && (
                        <Text style={styles.errorText}>{errors.city.message}</Text>
                      )}
                    </View>
                  )}
                />
              </View>
            </View>

              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Street Address"
                    placeholder="Enter your full address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Security</Text>
                <View style={styles.dividerLine} />
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    placeholder="Create a strong password"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    rightIcon={
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color={COLORS.textSecondary}
                      />
                    }
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    rightIcon={
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color={COLORS.textSecondary}
                      />
                    }
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />
                )}
              />

              {/* Password hint */}
              <View style={styles.passwordHint}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.passwordHintText}>
                  Password must be at least 6 characters
                </Text>
              </View>

              {/* All roles continue to step 4 */}
              <Button
                title="Continue"
                onPress={() => setCurrentStep(4)}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 4: Payment Method (Buyers Only) */}
          {currentStep === 4 && selectedRole === 'buyer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Payment Method</Text>
              </View>

              <View style={styles.paymentInfo}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.success} />
                <Text style={styles.paymentInfoText}>
                  Your payment information is secure. You can skip this step and add a payment method later.
                </Text>
              </View>

              {/* Payment Type Tabs */}
              <View style={styles.paymentTabs}>
                <TouchableOpacity
                  style={[
                    styles.paymentTab,
                    !control._formValues.paymentBankName && styles.paymentTabActive,
                  ]}
                  onPress={() => {
                    // Clear bank fields when switching to card
                    control._formValues.paymentBankName = '';
                    control._formValues.paymentAccountNumber = '';
                    control._formValues.paymentAccountName = '';
                  }}
                >
                  <Text style={[
                    styles.paymentTabText,
                    !control._formValues.paymentBankName && styles.paymentTabTextActive,
                  ]}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentTab,
                    !!control._formValues.paymentBankName && styles.paymentTabActive,
                  ]}
                  onPress={() => {
                    // Clear card fields when switching to bank
                    control._formValues.paymentCardNumber = '';
                    control._formValues.paymentCardExpiry = '';
                    control._formValues.paymentCardCvv = '';
                    control._formValues.paymentCardholderName = '';
                  }}
                >
                  <Text style={[
                    styles.paymentTabText,
                    !!control._formValues.paymentBankName && styles.paymentTabTextActive,
                  ]}>Bank Account</Text>
                </TouchableOpacity>
              </View>

              {/* Card Payment Fields */}
              <View style={styles.paymentFields}>
                <Controller
                  control={control}
                  name="paymentCardNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      value={formatCardNumber(value || '')}
                      onChangeText={(text) => onChange(text.replace(/\s/g, ''))}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      maxLength={19}
                      error={errors.paymentCardNumber?.message}
                    />
                  )}
                />

                <View style={styles.cardRow}>
                  <View style={styles.cardRowHalf}>
                    <Controller
                      control={control}
                      name="paymentCardExpiry"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          label="Expiry Date"
                          placeholder="MM/YY"
                          value={formatExpiryDate(value || '')}
                          onChangeText={(text) => onChange(text.replace(/[^\d\/]/g, ''))}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          maxLength={5}
                          error={errors.paymentCardExpiry?.message}
                        />
                      )}
                    />
                  </View>
                  <View style={styles.cardRowHalf}>
                    <Controller
                      control={control}
                      name="paymentCardCvv"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          label="CVV"
                          placeholder="123"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          error={errors.paymentCardCvv?.message}
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={control}
                  name="paymentCardholderName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Cardholder Name"
                      placeholder="Name as shown on card"
                      value={value}
                      onChangeText={(text) => onChange(text.toUpperCase())}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                      error={errors.paymentCardholderName?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Bank Account Fields */}
              <View style={styles.paymentFields}>
                <Controller
                  control={control}
                  name="paymentBankName"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.bankPickerContainer}>
                      <Text style={styles.inputLabel}>Bank Name</Text>
                      <TouchableOpacity
                        style={styles.bankPicker}
                        onPress={() => {
                          // Show bank picker modal
                          Alert.alert(
                            'Select Bank',
                            'Choose your bank',
                            NIGERIAN_BANKS.slice(0, 15).map((bank) => ({
                              text: bank.name,
                              onPress: () => onChange(bank.name),
                            })),
                          );
                        }}
                      >
                        <Text style={[styles.bankPickerText, !value && styles.bankPickerPlaceholder]}>
                          {value || 'Select your bank'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="paymentAccountNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Account Number"
                      placeholder="10-digit account number"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      maxLength={10}
                      error={errors.paymentAccountNumber?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="paymentAccountName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Account Name"
                      placeholder="Name on the account"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.paymentAccountName?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                <Text style={styles.securityNoteText}>
                  We use bank-level encryption to protect your data
                </Text>
              </View>

              <Button
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                style={styles.continueButton}
              />

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          )}

          {/* Step 4: Bike Information (Riders Only) */}
          {currentStep === 4 && selectedRole === 'rider' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="motorbike" size={24} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Bike Details</Text>
              </View>

              <Controller
                control={control}
                name="bikeModel"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Bike Model"
                    placeholder="e.g., Honda CG 125, Bajaj Boxer"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bikeModel?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bikePlateNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Plate Number"
                    placeholder="e.g., ABC-123-XY"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bikePlateNumber?.message}
                    autoCapitalize="characters"
                  />
                )}
              />

              <Controller
                control={control}
                name="bikeColor"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Bike Color"
                    placeholder="e.g., Red, Black, Blue"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bikeColor?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Documents</Text>
                <View style={styles.dividerLine} />
              </View>

              <Controller
                control={control}
                name="driversLicense"
                render={({ field: { onChange, value } }) => (
                  <DocumentUpload
                    label="Driver's License"
                    description="Upload a clear photo of your valid driver's license"
                    value={value}
                    onChange={onChange}
                    placeholder="Upload driver's license"
                    icon="card-outline"
                  />
                )}
              />

              <Button
                title="Continue to Guarantors"
                onPress={() => setCurrentStep(5)}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 4: Farm Details (Farmers Only) */}
          {currentStep === 4 && selectedRole === 'farmer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf" size={24} color={COLORS.success} />
                <Text style={styles.sectionTitle}>Farm Information</Text>
              </View>

              <Controller
                control={control}
                name="farmName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Farm Name"
                    placeholder="e.g., Green Valley Farms"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.farmName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmType"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Type of Farm"
                    placeholder="e.g., Crop Farm, Poultry, Livestock, Mixed"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.farmType?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmSize"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Farm Size"
                    placeholder="e.g., 2 hectares, 5 acres"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.farmSize?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Farm Location/Address"
                    placeholder="Enter your farm's full address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.farmAddress?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="primaryProducts"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Primary Products"
                    placeholder="e.g., Tomatoes, Peppers, Maize, Eggs"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.primaryProducts?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="yearsOfExperience"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Years of Farming Experience"
                    placeholder="e.g., 5 years"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={errors.yearsOfExperience?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="hasTransportation"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.radioGroup}>
                    <Text style={styles.radioLabel}>Do you have your own transportation?</Text>
                    <View style={styles.radioOptions}>
                      <TouchableOpacity
                        style={[styles.radioOption, value === 'yes' && styles.radioOptionSelected]}
                        onPress={() => onChange('yes')}
                      >
                        <Text style={[styles.radioText, value === 'yes' && styles.radioTextSelected]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.radioOption, value === 'no' && styles.radioOptionSelected]}
                        onPress={() => onChange('no')}
                      >
                        <Text style={[styles.radioText, value === 'no' && styles.radioTextSelected]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              <Button
                title="Continue to Verification"
                onPress={() => setCurrentStep(5)}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 5: Business & ID Verification (Farmers Only) */}
          {currentStep === 5 && selectedRole === 'farmer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Business Information</Text>
              </View>

              <Controller
                control={control}
                name="businessRegistrationNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Business Registration Number (Optional)"
                    placeholder="CAC registration number if available"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.businessRegistrationNumber?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Bank Details</Text>
                <View style={styles.dividerLine} />
              </View>

              <Controller
                control={control}
                name="bankName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Bank Name"
                    placeholder="e.g., First Bank, GTBank, Access Bank"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bankName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bankAccountNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Account Number"
                    placeholder="10-digit account number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={10}
                    error={errors.bankAccountNumber?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bankAccountName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Account Name"
                    placeholder="Name on the bank account"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bankAccountName?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Verification Documents</Text>
                <View style={styles.dividerLine} />
              </View>

              <Controller
                control={control}
                name="farmerId"
                render={({ field: { onChange, value } }) => (
                  <DocumentUpload
                    label="Valid ID (NIN, Voter's Card, Driver's License)"
                    description="Upload a clear photo of your valid government-issued ID"
                    value={value}
                    onChange={onChange}
                    placeholder="Upload your ID"
                    icon="card-outline"
                  />
                )}
              />

              <Controller
                control={control}
                name="farmPhotos"
                render={({ field: { onChange, value } }) => (
                  <DocumentUpload
                    label="Farm Photo"
                    description="Upload a photo of your farm or produce"
                    value={value}
                    onChange={onChange}
                    placeholder="Upload farm photo"
                    icon="image-outline"
                  />
                )}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                <Text style={styles.infoText}>
                  Your application will be reviewed by our team. Once approved, you can start listing products.
                </Text>
              </View>

              <Button
                title={isLoading ? 'Creating Account...' : 'Submit Application'}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                style={styles.continueButton}
              />
            </Animated.View>
          )}

          {/* Step 5: Guarantors (Riders Only) */}
          {currentStep === 5 && selectedRole === 'rider' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              {/* Guarantor 1 */}
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>First Guarantor</Text>
              </View>

              <Controller
                control={control}
                name="guarantor1Name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Full Name"
                    placeholder="Guarantor's full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor1Name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number"
                    placeholder="e.g., 08012345678"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor1Phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Occupation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Occupation"
                    placeholder="e.g., Teacher, Engineer, Trader"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor1Occupation?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Relationship"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Relationship"
                    placeholder="e.g., Brother, Colleague, Friend"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor1Relationship?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Home/Work Address"
                    placeholder="Enter full address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor1Address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1IdImage"
                render={({ field: { onChange, value } }) => (
                  <DocumentUpload
                    label="Guarantor's ID Card"
                    description="Upload a photo of their valid ID (NIN, Voter's Card, etc.)"
                    value={value}
                    onChange={onChange}
                    placeholder="Upload ID document"
                    icon="id-card-outline"
                  />
                )}
              />

              {/* Guarantor 2 */}
              <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
                <Ionicons name="person-circle-outline" size={24} color={COLORS.success} />
                <Text style={styles.sectionTitle}>Second Guarantor</Text>
              </View>

              <Controller
                control={control}
                name="guarantor2Name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Full Name"
                    placeholder="Guarantor's full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor2Name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number"
                    placeholder="e.g., 08012345678"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor2Phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Occupation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Occupation"
                    placeholder="e.g., Teacher, Engineer, Trader"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor2Occupation?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Relationship"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Relationship"
                    placeholder="e.g., Brother, Colleague, Friend"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor2Relationship?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Home/Work Address"
                    placeholder="Enter full address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.guarantor2Address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2IdImage"
                render={({ field: { onChange, value } }) => (
                  <DocumentUpload
                    label="Guarantor's ID Card"
                    description="Upload a photo of their valid ID (NIN, Voter's Card, etc.)"
                    value={value}
                    onChange={onChange}
                    placeholder="Upload ID document"
                    icon="id-card-outline"
                  />
                )}
              />

              <View style={styles.riderNotice}>
                <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                <Text style={styles.riderNoticeText}>
                  Your application will be reviewed by our team. You'll be notified once approved.
                </Text>
              </View>

              <Button
                title="Submit Application"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                style={styles.submitButton}
              />

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity
                onPress={() => setShowStatePicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        value === item && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        onChange(item);
                        setSelectedState(item);
                        setAvailableCities(NIGERIAN_STATES[item] || []);
                        // Reset city when state changes
                        control._formValues.city = '';
                        setShowStatePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          value === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {value === item && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity
                onPress={() => setShowCityPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        value === item && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        onChange(item);
                        setShowCityPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          value === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {value === item && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  No cities available. Please select a state first.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepHeader: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  roleContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  roleCardSelected: {
    backgroundColor: COLORS.white,
    borderColor: '#34C759',
    ...SHADOWS.medium,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  roleCardInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  expandedContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  longDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  featuresContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  pickerButtonError: {
    borderColor: COLORS.error,
  },
  pickerButtonDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickerPlaceholder: {
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  pickerItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyListText: {
    textAlign: 'center',
    padding: SPACING.xl,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  continueButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  submitButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  passwordHintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  termsText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  riderNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.md,
  },
  riderNoticeText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  radioGroup: {
    marginBottom: SPACING.md,
  },
  radioLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  radioOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  radioOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: '#34C759',
    backgroundColor: '#34C75910',
  },
  radioText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  radioTextSelected: {
    color: '#34C759',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: FONT_SIZES.md,
    color: '#34C759',
    fontWeight: '600',
  },
  // Payment method styles
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#34C75915',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  paymentTabs: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
  },
  paymentTabActive: {
    backgroundColor: '#34C759',
  },
  paymentTabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  paymentTabTextActive: {
    color: COLORS.white,
  },
  paymentFields: {
    gap: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cardRowHalf: {
    flex: 1,
  },
  bankPickerContainer: {
    marginBottom: SPACING.sm,
  },
  bankPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    minHeight: 48,
  },
  bankPickerText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  bankPickerPlaceholder: {
    color: COLORS.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  securityNoteText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  skipButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
