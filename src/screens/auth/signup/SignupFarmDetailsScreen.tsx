import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  TextInput as RNTextInput,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupFarmDetails'>;

// Nigerian Banks List
const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '999', name: 'Other' },
];

// Farm types
const FARM_TYPES = [
  { id: 'crop', label: 'Crop Farming', icon: 'sprout' },
  { id: 'livestock', label: 'Livestock', icon: 'cow' },
  { id: 'poultry', label: 'Poultry', icon: 'bird' },
  { id: 'fishery', label: 'Fishery', icon: 'fish' },
  { id: 'mixed', label: 'Mixed Farming', icon: 'leaf' },
];

// Product categories
const PRODUCT_CATEGORIES = [
  'Vegetables', 'Fruits', 'Grains', 'Legumes', 'Tubers',
  'Dairy', 'Meat', 'Poultry', 'Fish', 'Eggs',
  'Spices', 'Herbs', 'Honey', 'Nuts', 'Oil Seeds',
];

// Floating Input Component
const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  keyboardType = 'default',
  isDark,
  colors,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  error?: string;
  keyboardType?: 'default' | 'number-pad';
  isDark: boolean;
  colors: any;
  multiline?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 44,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 14 : 18, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    backgroundColor: isDark ? colors.card : '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.inputWrapper}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: error ? '#EF4444' : isFocused ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
            height: multiline ? 100 : 56,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={isFocused ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280')}
          style={[styles.inputIcon, multiline && { marginTop: 16 }]}
        />
        <RNTextInput
          style={[
            styles.input,
            { color: colors.text },
            multiline && { height: 80, textAlignVertical: 'top', paddingTop: 16 },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          multiline={multiline}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function SignupFarmDetailsScreen({ navigation, route }: Props) {
  const params = route.params;
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!farmName.trim()) newErrors.farmName = 'Farm name is required';
    if (!farmType) newErrors.farmType = 'Please select a farm type';
    if (!farmSize.trim()) newErrors.farmSize = 'Farm size is required';
    if (selectedCategories.length === 0) newErrors.categories = 'Select at least one category';
    if (!bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!accountName.trim()) newErrors.accountName = 'Account name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigation.navigate('SignupFarmVerification', {
      ...params,
      farmName: farmName.trim(),
      farmType,
      farmSize: farmSize.trim(),
      productCategories: selectedCategories,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['77%', '88%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step 7 of 8
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <Animated.View
          style={[styles.progressBar, { width: progressWidth, backgroundColor: COLORS.primary }]}
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Farm Details 🌾</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Tell us about your farm
          </Text>
        </View>

        {/* Farm Info */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Farm Information</Text>
          
          <FloatingInput
            label="Farm Name"
            value={farmName}
            onChangeText={setFarmName}
            icon="barn"
            error={errors.farmName}
            isDark={isDark}
            colors={colors}
          />

          {/* Farm Type Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Farm Type</Text>
          <View style={styles.farmTypeContainer}>
            {FARM_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.farmTypeButton,
                  {
                    backgroundColor: farmType === type.id
                      ? COLORS.primary
                      : (isDark ? '#374151' : '#F3F4F6'),
                    borderColor: farmType === type.id ? COLORS.primary : (isDark ? '#4B5563' : '#E5E7EB'),
                  },
                ]}
                onPress={() => setFarmType(type.id)}
              >
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={20}
                  color={farmType === type.id ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
                />
                <Text
                  style={[
                    styles.farmTypeText,
                    { color: farmType === type.id ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.farmType && <Text style={styles.errorText}>{errors.farmType}</Text>}

          <FloatingInput
            label="Farm Size (in acres/hectares)"
            value={farmSize}
            onChangeText={setFarmSize}
            icon="ruler-square"
            error={errors.farmSize}
            isDark={isDark}
            colors={colors}
          />
        </View>

        {/* Product Categories */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Categories</Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Select the products you grow/produce
          </Text>
          
          <View style={styles.categoriesContainer}>
            {PRODUCT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategories.includes(category)
                      ? COLORS.primary
                      : (isDark ? '#374151' : '#F3F4F6'),
                    borderColor: selectedCategories.includes(category)
                      ? COLORS.primary
                      : (isDark ? '#4B5563' : '#E5E7EB'),
                  },
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategories.includes(category) ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') },
                  ]}
                >
                  {category}
                </Text>
                {selectedCategories.includes(category) && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {errors.categories && <Text style={styles.errorText}>{errors.categories}</Text>}
        </View>

        {/* Bank Details */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bank Details</Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            For receiving payments
          </Text>
          
          <FloatingInput
            label="Bank Name"
            value={bankName}
            onChangeText={setBankName}
            icon="bank"
            error={errors.bankName}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Account Number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            icon="numeric"
            error={errors.accountNumber}
            keyboardType="number-pad"
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Account Name"
            value={accountName}
            onChangeText={setAccountName}
            icon="account-check-outline"
            error={errors.accountName}
            isDark={isDark}
            colors={colors}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: COLORS.primary }]} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  progressContainer: {
    height: 3,
    marginHorizontal: SPACING.lg,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  titleContainer: { marginBottom: SPACING.lg },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  farmTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  farmTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  farmTypeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  inputWrapper: { marginBottom: SPACING.md },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
