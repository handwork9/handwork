import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Modal,
  FlatList,
  StatusBar,
  TextInput as RNTextInput,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList, UserRole } from '../../types';
import { TextInput, DocumentUpload } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { useAppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { addPaymentMethod } from '../../store/slices/paymentSlice';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import { 
  NIGERIAN_BANKS,
  paymentService, 
  formatCardNumber, 
  formatExpiryDate, 
  detectCardBrand,
  getCardBrandColor,
  maskCardNumber,
  maskAccountNumber,
} from '../../services/paymentService';
import { useTheme } from '../../context/ThemeContext';
import { BuyerIllustration, FarmerIllustration, RiderIllustration } from '../../assets/illustrations/roles';
import { CardIllustration, BankIllustration } from '../../assets/illustrations/payment';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const { width } = Dimensions.get('window');

// Floating Label Input Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  icon?: string;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}

const FloatingInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  icon,
  rightIcon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  multiline,
  numberOfLines,
  maxLength,
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', '#16A34A'],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={floatingStyles.floatingInputContainer}>
      <View style={[floatingStyles.inputRow, error && floatingStyles.inputRowError]}>
        <View style={floatingStyles.inputContent}>
          <Animated.Text style={[labelStyle, { fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif' }]}>{label}</Animated.Text>
          <RNTextInput
            style={[
              floatingStyles.floatingInput,
              { color: colors.text },
              multiline && { height: (numberOfLines || 2) * 24, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur();
            }}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            placeholderTextColor="transparent"
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
          />
        </View>
        {(icon || rightIcon) && (
          <View style={floatingStyles.inputIcons}>
            {rightIcon || (
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
              />
            )}
          </View>
        )}
      </View>
      <View style={[floatingStyles.inputLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, isFocused && floatingStyles.inputLineFocused, error && floatingStyles.inputLineError]} />
      {error && <Text style={floatingStyles.errorText}>{error}</Text>}
    </View>
  );
};

// Floating Label Dropdown Component
interface FloatingDropdownProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: string;
  error?: string;
  disabled?: boolean;
}

const FloatingDropdown = ({
  label,
  value,
  onPress,
  icon,
  error,
  disabled,
}: FloatingDropdownProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', '#16A34A'],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={floatingStyles.floatingInputContainer}>
      <TouchableOpacity
        style={[floatingStyles.inputRow, disabled && { opacity: 0.5 }]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={floatingStyles.inputContent}>
          <Animated.Text style={[labelStyle, { fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif' }]}>{label}</Animated.Text>
          <Text
            style={[
              floatingStyles.floatingInput,
              { color: value ? colors.text : 'transparent', paddingTop: 4 },
            ]}
          >
            {value || label}
          </Text>
        </View>
        <View style={floatingStyles.inputIcons}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={value ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
              style={{ marginRight: 8 }}
            />
          )}
          <Ionicons
            name="chevron-down"
            size={22}
            color={value ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
          />
        </View>
      </TouchableOpacity>
      <View style={[floatingStyles.inputLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, value && floatingStyles.inputLineFocused, error && floatingStyles.inputLineError]} />
      {error && <Text style={floatingStyles.errorText}>{error}</Text>}
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  floatingInputContainer: {
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  inputRowError: {},
  inputContent: {
    flex: 1,
    position: 'relative',
  },
  floatingInput: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  inputIcons: {
    marginLeft: 12,
  },
  inputLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  inputLineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
  inputLineError: {
    backgroundColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});

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
  const [paymentType, setPaymentType] = useState<'card' | 'bank'>('card');
  const [showProductCategoryPicker, setShowProductCategoryPicker] = useState(false);
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>(NIGERIAN_BANKS);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankPickerOnChange, setBankPickerOnChange] = useState<((value: string) => void) | null>(null);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Fetch banks from API on mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const fetchedBanks = await paymentService.getBanks();
        if (fetchedBanks.length > 0) {
          setBanks(fetchedBanks);
        }
      } catch (error) {
        console.error('Error loading banks:', error);
        // Keep using fallback NIGERIAN_BANKS
      }
    };
    loadBanks();
  }, []);

  // Filtered banks for search
  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery) return banks;
    return banks.filter((bank) =>
      bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
    );
  }, [banks, bankSearchQuery]);

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: colors.card },
    roleCard: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#E5E7EB' },
    roleCardSelected: { borderColor: '#16A34A', backgroundColor: isDark ? '#1A3D2B' : '#F0FDF4' },
    roleIconContainer: { backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' },
    roleIconSelected: { backgroundColor: isDark ? '#2E5E45' : '#E8F5E9' },
    roleLabel: { color: isDark ? '#F9FAFB' : '#1F2937' },
    roleLabelSelected: { color: '#16A34A' },
    roleDescription: { color: isDark ? '#9CA3AF' : '#6B7280' },
    roleDescriptionSelected: { color: isDark ? '#4ADE80' : '#15803D' },
    checkmarkOuter: { borderColor: isDark ? '#4B5563' : '#D1D5DB', backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    expandedContent: { borderTopColor: isDark ? '#2E5E45' : '#D1FAE5' },
    longDescription: { color: isDark ? '#D1D5DB' : '#4B5563' },
    featureIcon: { backgroundColor: isDark ? '#2E5E45' : '#DCFCE7' },
    featureText: { color: isDark ? '#D1D5DB' : '#374151' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    pickerButton: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    inputLabel: { color: colors.text },
  }), [colors, isDark]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header title opacity based on scroll
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
    getValues,
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

  // Handle skip payment - submit without payment validation
  const handleSkipPayment = async () => {
    const values = getValues();
    // Clear payment fields to ensure we don't partially save
    values.paymentCardNumber = '';
    values.paymentCardExpiry = '';
    values.paymentCardCvv = '';
    values.paymentCardholderName = '';
    values.paymentBankName = '';
    values.paymentAccountNumber = '';
    values.paymentAccountName = '';
    await onSubmit(values);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Basic signup data only - no riderData or farmerData
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

      const response = await authService.signup(signupData);

      if (response?.success && response?.data?.user) {
        dispatch(setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));

        // Register rider profile if role is rider
        if (selectedRole === 'rider') {
          try {
            await apiClient.post('/riders/register', {
              state: data.state,
              city: data.city,
              vehicleType: 'motorcycle',
              vehicleModel: data.bikeModel,
              vehiclePlate: data.bikePlateNumber,
              licenseNumber: data.driversLicense,
            });
          } catch (riderError: any) {
            console.warn('Failed to register rider profile:', riderError?.response?.data?.message || riderError?.message);
            // Don't fail the signup if rider registration fails - they can complete it later
          }
        }

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
              icon: 'credit-card-outline',
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
      console.error('Signup error response:', JSON.stringify(error?.response?.data, null, 2));
      const message = error?.response?.data?.message 
        || error?.message 
        || 'An error occurred. Please try again.';
      Alert.alert('Signup Failed', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current step title
  const getStepTitle = () => {
    if (currentStep === 1) return 'Choose Role';
    if (currentStep === 2) return 'Personal Info';
    if (currentStep === 3) return 'Location & Security';
    if (currentStep === 4 && selectedRole === 'rider') return 'Bike Details';
    if (currentStep === 5 && selectedRole === 'rider') return 'Guarantors';
    if (currentStep === 4 && selectedRole === 'farmer') return 'Farm Details';
    if (currentStep === 5 && selectedRole === 'farmer') return 'Verification';
    if (currentStep === 4 && selectedRole === 'buyer') return 'Payment';
    return '';
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getStepTitle()}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 20, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
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
                          isSelected && [styles.roleCardSelected, dynamicStyles.roleCardSelected],
                        ]}
                        onPress={() => setSelectedRole(role.value)}
                        activeOpacity={0.8}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.roleCardHeader}>
                          {/* Role Illustration */}
                          <View
                            style={[
                              styles.roleIconContainer,
                              dynamicStyles.roleIconContainer,
                              isSelected && [styles.roleIconSelected, dynamicStyles.roleIconSelected],
                            ]}
                          >
                            {role.value === 'buyer' && (
                              <BuyerIllustration 
                                width={56} 
                                height={56} 
                                color={isSelected ? '#FFFFFF' : '#8E8E93'} 
                              />
                            )}
                            {role.value === 'farmer' && (
                              <FarmerIllustration 
                                width={56} 
                                height={56} 
                                color={isSelected ? '#FFFFFF' : '#8E8E93'} 
                              />
                            )}
                            {role.value === 'rider' && (
                              <RiderIllustration 
                                width={56} 
                                height={56} 
                                color={isSelected ? '#FFFFFF' : '#8E8E93'} 
                              />
                            )}
                          </View>

                          {/* Role Info */}
                          <View style={styles.roleCardInfo}>
                            <Text
                              style={[
                                styles.roleLabel,
                                dynamicStyles.roleLabel,
                                isSelected && [styles.roleLabelSelected, dynamicStyles.roleLabelSelected],
                              ]}
                            >
                              {role.label}
                            </Text>
                            <Text style={[
                              styles.roleDescription,
                              dynamicStyles.roleDescription,
                              isSelected && [styles.roleDescriptionSelected, dynamicStyles.roleDescriptionSelected],
                            ]}>
                              {role.description}
                            </Text>
                          </View>

                          {/* Checkmark indicator */}
                          <View
                            style={[
                              styles.checkmarkOuter,
                              dynamicStyles.checkmarkOuter,
                              isSelected && styles.checkmarkOuterSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                          </View>
                        </View>

                        {/* Expanded Content when selected */}
                        {isSelected && (
                          <View style={[styles.expandedContent, dynamicStyles.expandedContent]}>
                            <Text style={[styles.longDescription, dynamicStyles.longDescription]}>{role.longDescription}</Text>
                            
                            <View style={styles.featuresSection}>
                              <Text style={styles.featuresTitle}>What you can do:</Text>
                              {role.features.map((feature, idx) => (
                                <View key={idx} style={styles.featureRow}>
                                  <View style={[styles.featureIcon, dynamicStyles.featureIcon]}>
                                    <Ionicons
                                      name="checkmark"
                                      size={12}
                                      color="#16A34A"
                                    />
                                  </View>
                                  <Text style={[styles.featureText, dynamicStyles.featureText]}>
                                    {feature}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Continue Button for Step 1 */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-outline"
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Email Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="phone-outline"
                    keyboardType="phone-pad"
                    error={errors.phone?.message}
                  />
                )}
              />

              {/* Continue Button for Step 2 */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 3: Location & Security */}
          {currentStep === 3 && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, value } }) => (
                  <FloatingDropdown
                    label="State"
                    value={value}
                    onPress={() => setShowStatePicker(true)}
                    error={errors.state?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <FloatingDropdown
                    label="City/LGA"
                    value={value}
                    onPress={() => {
                      if (selectedState) {
                        setShowCityPicker(true);
                      } else {
                        Alert.alert('Select State First', 'Please select a state before choosing a city.');
                      }
                    }}
                    error={errors.city?.message}
                    disabled={!selectedState}
                  />
                )}
              />

              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Street Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="map-marker-outline"
                    error={errors.address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Security</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    error={errors.password?.message}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Confirm Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    error={errors.confirmPassword?.message}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              {/* All roles continue to step 4 */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(4)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 4: Payment Method (Buyers Only) */}
          {currentStep === 4 && selectedRole === 'buyer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <View style={[styles.paymentInfo, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.1)' : '#F0FDF4' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.success} />
                <Text style={[styles.paymentInfoText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>
                  Your payment information is secure. You can skip this step and add a payment method later.
                </Text>
              </View>

              {/* Payment Type Switcher */}
              <View style={styles.paymentSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : COLORS.border },
                    paymentType === 'card' && [styles.paymentOptionActive, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.08)' : '#34C75908' }],
                  ]}
                  onPress={() => setPaymentType('card')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentOptionIcon,
                    { backgroundColor: isDark ? '#3A3A3C' : '#F8F9FA' },
                    paymentType === 'card' && [styles.paymentOptionIconActive, { backgroundColor: isDark ? '#1A3D2B' : '#E8F9ED' }],
                  ]}>
                    <CardIllustration 
                      width={36} 
                      height={36} 
                      color={paymentType === 'card' ? '#34C759' : isDark ? '#9CA3AF' : '#34C759'} 
                    />
                  </View>
                  <View style={styles.paymentOptionText}>
                    <Text style={[
                      styles.paymentOptionTitle,
                      { color: isDark ? '#F9FAFB' : COLORS.textPrimary },
                      paymentType === 'card' && styles.paymentOptionTitleActive,
                    ]}>Debit/Credit Card</Text>
                    <Text style={[styles.paymentOptionSubtitle, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>Visa, Mastercard, Verve</Text>
                  </View>
                  {paymentType === 'card' && (
                    <View style={styles.paymentOptionCheck}>
                      <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : COLORS.border },
                    paymentType === 'bank' && [styles.paymentOptionActive, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.08)' : '#34C75908' }],
                  ]}
                  onPress={() => setPaymentType('bank')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentOptionIcon,
                    { backgroundColor: isDark ? '#3A3A3C' : '#F8F9FA' },
                    paymentType === 'bank' && [styles.paymentOptionIconActive, { backgroundColor: isDark ? '#1A3D2B' : '#E8F9ED' }],
                  ]}>
                    <BankIllustration 
                      width={36} 
                      height={36} 
                      color={paymentType === 'bank' ? '#34C759' : isDark ? '#9CA3AF' : '#34C759'} 
                    />
                  </View>
                  <View style={styles.paymentOptionText}>
                    <Text style={[
                      styles.paymentOptionTitle,
                      { color: isDark ? '#F9FAFB' : COLORS.textPrimary },
                      paymentType === 'bank' && styles.paymentOptionTitleActive,
                    ]}>Bank Account</Text>
                    <Text style={[styles.paymentOptionSubtitle, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>Direct bank transfer</Text>
                  </View>
                  {paymentType === 'bank' && (
                    <View style={styles.paymentOptionCheck}>
                      <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Card Payment Fields */}
              {paymentType === 'card' && (
                <View style={styles.paymentFields}>
                  <Controller
                    control={control}
                    name="paymentCardNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FloatingInput
                        label="Card Number"
                        value={formatCardNumber(value || '')}
                        onChangeText={(text: string) => onChange(text.replace(/\s/g, ''))}
                        onBlur={onBlur}
                        icon="card-outline"
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
                          <FloatingInput
                            label="Expiry Date"
                            value={formatExpiryDate(value || '')}
                            onChangeText={(text: string) => onChange(text.replace(/[^\d\/]/g, ''))}
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
                          <FloatingInput
                            label="CVV"
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
                    <FloatingInput
                      label="Cardholder Name"
                      value={value}
                      onChangeText={(text: string) => onChange(text.toUpperCase())}
                      onBlur={onBlur}
                      icon="account-outline"
                      autoCapitalize="characters"
                      error={errors.paymentCardholderName?.message}
                    />
                  )}
                />
                </View>
              )}

              {/* Bank Account Fields */}
              {paymentType === 'bank' && (
                <View style={styles.paymentFields}>
                <Controller
                  control={control}
                  name="paymentBankName"
                  render={({ field: { onChange, value } }) => (
                    <FloatingDropdown
                      label="Bank Name"
                      value={value}
                      onPress={() => {
                        setBankPickerOnChange(() => onChange);
                        setShowBankPicker(true);
                      }}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="paymentAccountNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FloatingInput
                      label="Account Number"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      icon="bank-outline"
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
                    <FloatingInput
                      label="Account Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      icon="account-outline"
                      error={errors.paymentAccountName?.message}
                    />
                  )}
                />
                </View>
              )}

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed" size={16} color={isDark ? '#9CA3AF' : COLORS.textSecondary} />
                <Text style={[styles.securityNoteText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>
                  We use bank-level encryption to protect your data
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipPayment}
                disabled={isLoading}
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
              <Controller
                control={control}
                name="bikeModel"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Bike Model"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="motorbike"
                    error={errors.bikeModel?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bikePlateNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Plate Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="card-text-outline"
                    autoCapitalize="characters"
                    error={errors.bikePlateNumber?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bikeColor"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Bike Color"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="palette-outline"
                    error={errors.bikeColor?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
                <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>Documents</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
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

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(5)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue to Guarantors</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 4: Farm Details (Farmers Only) */}
          {currentStep === 4 && selectedRole === 'farmer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <Controller
                control={control}
                name="farmName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Farm Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="barn"
                    error={errors.farmName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmType"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Type of Farm"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="sprout-outline"
                    error={errors.farmType?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmSize"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Farm Size"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="ruler-square"
                    error={errors.farmSize?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="farmAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Farm Location/Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="map-marker-outline"
                    error={errors.farmAddress?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="primaryProducts"
                render={({ field: { onChange, value } }) => (
                  <FloatingDropdown
                    label="Primary Products"
                    value={selectedProductCategories.length > 0 
                      ? selectedProductCategories.map(id => 
                          PRODUCT_CATEGORIES.find(c => c.id === id)?.name
                        ).join(', ')
                      : ''
                    }
                    onPress={() => setShowProductCategoryPicker(true)}
                    error={errors.primaryProducts?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="yearsOfExperience"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Years of Farming Experience"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="calendar-clock"
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
                    <Text style={[styles.radioLabel, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>Do you have your own transportation?</Text>
                    <View style={styles.radioOptions}>
                      <TouchableOpacity
                        style={[
                          styles.radioOption,
                          { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : COLORS.border },
                          value === 'yes' && [styles.radioOptionSelected, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#34C75910' }],
                        ]}
                        onPress={() => onChange('yes')}
                      >
                        <Text style={[
                          styles.radioText,
                          { color: isDark ? '#9CA3AF' : COLORS.textSecondary },
                          value === 'yes' && styles.radioTextSelected,
                        ]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.radioOption,
                          { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : COLORS.border },
                          value === 'no' && [styles.radioOptionSelected, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#34C75910' }],
                        ]}
                        onPress={() => onChange('no')}
                      >
                        <Text style={[
                          styles.radioText,
                          { color: isDark ? '#9CA3AF' : COLORS.textSecondary },
                          value === 'no' && styles.radioTextSelected,
                        ]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(5)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue to Verification</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 5: Business & ID Verification (Farmers Only) */}
          {currentStep === 5 && selectedRole === 'farmer' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              <Controller
                control={control}
                name="businessRegistrationNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Business Registration Number (Optional)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="briefcase-outline"
                    error={errors.businessRegistrationNumber?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
                <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>Bank Details</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
              </View>

              <Controller
                control={control}
                name="bankName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Bank Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="bank-outline"
                    error={errors.bankName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bankAccountNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Account Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="numeric"
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
                  <FloatingInput
                    label="Account Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-outline"
                    error={errors.bankAccountName?.message}
                  />
                )}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
                <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>Verification Documents</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : COLORS.border }]} />
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

              <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : COLORS.warning + '15' }]}>
                <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : COLORS.textSecondary }]}>
                  Your application will be reviewed by our team. Once approved, you can start listing products.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Creating Account...' : 'Submit Application'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 5: Guarantors (Riders Only) */}
          {currentStep === 5 && selectedRole === 'rider' && (
            <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
              {/* Guarantor 1 */}
              <View style={[styles.sectionHeader, { borderBottomColor: isDark ? '#374151' : COLORS.border }]}>
                <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>First Guarantor</Text>
              </View>

              <Controller
                control={control}
                name="guarantor1Name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-outline"
                    error={errors.guarantor1Name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="phone-outline"
                    keyboardType="phone-pad"
                    error={errors.guarantor1Phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Occupation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Occupation"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="briefcase-outline"
                    error={errors.guarantor1Occupation?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Relationship"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Relationship"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-multiple-outline"
                    error={errors.guarantor1Relationship?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Home/Work Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="map-marker-outline"
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
              <View style={[styles.sectionHeader, { marginTop: SPACING.lg, borderBottomColor: isDark ? '#374151' : COLORS.border }]}>
                <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>Second Guarantor</Text>
              </View>

              <Controller
                control={control}
                name="guarantor2Name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-outline"
                    error={errors.guarantor2Name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="phone-outline"
                    keyboardType="phone-pad"
                    error={errors.guarantor2Phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Occupation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Occupation"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="briefcase-outline"
                    error={errors.guarantor2Occupation?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Relationship"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Relationship"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="account-multiple-outline"
                    error={errors.guarantor2Relationship?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2Address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Home/Work Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="map-marker-outline"
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

              <View style={[styles.riderNotice, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : COLORS.accent + '15' }]}>
                <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                <Text style={[styles.riderNoticeText, { color: isDark ? '#D1D5DB' : COLORS.textSecondary }]}>
                  Your application will be reviewed by our team. You'll be notified once approved.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </Text>
              </TouchableOpacity>

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
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
            </View>
            
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select State</Text>
              <TouchableOpacity
                onPress={() => setShowStatePicker(false)}
                style={styles.modalCloseButton}
              >
                <View style={[styles.modalCloseIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.1)' }]}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* List */}
            <FlatList
              data={STATES}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' },
                        value === item && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        onChange(item);
                        setSelectedState(item);
                        setAvailableCities(NIGERIAN_STATES[item] || []);
                        control._formValues.city = '';
                        setShowStatePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: colors.text },
                          value === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      <Ionicons
                        name={value === item ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={value === item ? "#34C759" : isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'}
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCityPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
            </View>
            
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select City/LGA</Text>
              <TouchableOpacity
                onPress={() => setShowCityPicker(false)}
                style={styles.modalCloseButton}
              >
                <View style={[styles.modalCloseIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.1)' }]}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* List */}
            <FlatList
              data={availableCities}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' },
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
                          { color: colors.text },
                          value === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      <Ionicons
                        name={value === item ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={value === item ? "#34C759" : isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'}
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                    No cities available.{"\n"}Please select a state first.
                  </Text>
                </View>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Product Category Picker Modal (Multi-select) */}
      <Modal
        visible={showProductCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductCategoryPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowProductCategoryPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
            </View>
            
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Product Categories</Text>
              <TouchableOpacity
                onPress={() => setShowProductCategoryPicker(false)}
                style={styles.modalCloseButton}
              >
                <View style={[styles.modalCloseIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.1)' }]}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Selected Count */}
            {selectedProductCategories.length > 0 && (
              <View style={styles.selectedCountContainer}>
                <Text style={[styles.selectedCountText, { color: colors.textSecondary }]}>
                  {selectedProductCategories.length} selected
                </Text>
                <TouchableOpacity onPress={() => setSelectedProductCategories([])}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* List */}
            <FlatList
              data={PRODUCT_CATEGORIES}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => {
                const isSelected = selectedProductCategories.includes(item.id);
                return (
                  <Controller
                    control={control}
                    name="primaryProducts"
                    render={({ field: { onChange } }) => (
                      <TouchableOpacity
                        style={[
                          styles.pickerItem,
                          { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' },
                          isSelected && styles.pickerItemSelected,
                        ]}
                        onPress={() => {
                          let newSelected: string[];
                          if (isSelected) {
                            newSelected = selectedProductCategories.filter(id => id !== item.id);
                          } else {
                            newSelected = [...selectedProductCategories, item.id];
                          }
                          setSelectedProductCategories(newSelected);
                          onChange(newSelected.map(id => 
                            PRODUCT_CATEGORIES.find(c => c.id === id)?.name
                          ).join(', '));
                        }}
                      >
                        <View style={styles.categoryItemContent}>
                          <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                          <Text
                            style={[
                              styles.pickerItemText,
                              { color: colors.text },
                              isSelected && styles.pickerItemTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={24}
                          color={isSelected ? "#34C759" : isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'}
                        />
                      </TouchableOpacity>
                    )}
                  />
                );
              }}
              showsVerticalScrollIndicator={false}
            />

            {/* Done Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setShowProductCategoryPicker(false)}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Bank Picker Modal - Full Page */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowBankPicker(false);
          setBankSearchQuery('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingTop: insets.top + 16, 
            paddingBottom: 16, 
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
            <TouchableOpacity
              onPress={() => {
                setShowBankPicker(false);
                setBankSearchQuery('');
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ 
              flex: 1, 
              textAlign: 'center', 
              fontSize: 18, 
              fontWeight: '600', 
              color: colors.text,
              marginRight: 40,
            }}>
              Select Bank
            </Text>
          </View>

          {/* Search Input */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={[styles.bankSearchContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <RNTextInput
                style={[styles.bankSearchInput, { color: colors.text }]}
                placeholder="Search banks..."
                placeholderTextColor="#9CA3AF"
                value={bankSearchQuery}
                onChangeText={setBankSearchQuery}
                autoCapitalize="none"
              />
              {bankSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBankSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.bankCount, { color: colors.textSecondary }]}>
              {filteredBanks.length} banks available
            </Text>
          </View>
          
          {/* List */}
          <FlatList
            data={filteredBanks}
            keyExtractor={(item, index) => `${item.code}-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' },
                ]}
                onPress={() => {
                  if (bankPickerOnChange) {
                    bankPickerOnChange(item.name);
                  }
                  setShowBankPicker(false);
                  setBankSearchQuery('');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.bankIconContainer}>
                    <MaterialCommunityIcons name="bank-outline" size={20} color="#16A34A" />
                  </View>
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: colors.text, flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'}
                />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                No banks found
              </Text>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  headerPlaceholder: {
    width: 40,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
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
  roleSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#8E8E93',
    marginBottom: SPACING.lg,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  roleIconSelected: {
    backgroundColor: '#E8F5E9',
  },
  roleCardInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: FONT_SIZES.lg,
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  roleLabelSelected: {
    color: '#16A34A',
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  roleDescriptionSelected: {
    color: '#15803D',
  },
  checkmarkOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkmarkOuterSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
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
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
  },
  longDescription: {
    fontSize: FONT_SIZES.sm,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  featuresSection: {
    marginTop: SPACING.sm,
  },
  featuresContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.sm,
    color: '#16A34A',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.semiBold,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingVertical: 2,
  },
  featureIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: '#374151',
    flex: 1,
    fontFamily: FONTS.regular,
  },
  form: {
    paddingTop: 40,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '75%',
    paddingBottom: 34,
    backgroundColor: '#DEDEE0',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  selectedCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedCountText: {
    fontSize: 14,
  },
  clearAllText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
  },
  modalDoneButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60, 60, 67, 0.2)',
  },
  pickerItemSelected: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  pickerItemText: {
    fontSize: 17,
  },
  pickerItemTextSelected: {
    color: '#34C759',
    fontWeight: '500',
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
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
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.medium,
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
  sectionHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
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
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  footerLink: {
    fontSize: 15,
    color: '#16A34A',
    fontFamily: FONTS.bold,
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
  paymentSwitcher: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  paymentOptionActive: {
    borderColor: '#34C759',
    backgroundColor: '#34C75908',
  },
  paymentOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  paymentOptionIconActive: {
    backgroundColor: '#E8F9ED',
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  paymentOptionTitleActive: {
    color: '#34C759',
  },
  paymentOptionSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentOptionCheck: {
    marginLeft: SPACING.sm,
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
  // iOS Inset Grouped List styles
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 13,
  },
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  // Button styles
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Bank Picker styles
  bankSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  bankSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  bankCount: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  bankIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
