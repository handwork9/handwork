import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import farmerApplicationService from '../../services/farmerApplicationService';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#4CAF50';

interface FarmCategory {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
}

const FARM_CATEGORIES: FarmCategory[] = [
  { id: 'vegetables', name: 'Vegetables', icon: 'sprout', iconType: 'material' },
  { id: 'fruits', name: 'Fruits', icon: 'fruit-cherries', iconType: 'material' },
  { id: 'grains', name: 'Grains', icon: 'barley', iconType: 'material' },
  { id: 'dairy', name: 'Dairy', icon: 'cup', iconType: 'material' },
  { id: 'eggs', name: 'Eggs', icon: 'egg', iconType: 'material' },
  { id: 'meat', name: 'Meat', icon: 'food-steak', iconType: 'material' },
  { id: 'poultry', name: 'Poultry', icon: 'turkey', iconType: 'material' },
  { id: 'seafood', name: 'Seafood', icon: 'fish', iconType: 'material' },
  { id: 'herbs', name: 'Herbs & Spices', icon: 'leaf', iconType: 'ionicons' },
  { id: 'honey', name: 'Honey', icon: 'beehive-outline', iconType: 'material' },
  { id: 'nuts', name: 'Nuts', icon: 'peanut', iconType: 'material' },
  { id: 'processed', name: 'Processed', icon: 'food-variant', iconType: 'material' },
];

export default function FarmerOnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    farmDescription: '',
    farmAddress: '',
    farmCity: '',
    farmState: '',
    selectedCategories: [] as string[],
    bankName: '',
    accountNumber: '',
    accountName: '',
    agreedToTerms: false,
  });

  const TOTAL_STEPS = 4;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animateProgress = (step: number) => {
    Animated.spring(progressAnim, {
      toValue: step / (TOTAL_STEPS - 1),
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      // Validate current step
      if (!validateStep(currentStep)) return;
      
      triggerHaptic();
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      animateProgress(newStep);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      triggerHaptic();
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      animateProgress(newStep);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.farmName.trim()) {
          Alert.alert('Required', 'Please enter your farm name');
          return false;
        }
        if (!formData.farmDescription.trim()) {
          Alert.alert('Required', 'Please describe your farm');
          return false;
        }
        return true;
      case 1:
        if (!formData.farmAddress.trim() || !formData.farmCity.trim() || !formData.farmState.trim()) {
          Alert.alert('Required', 'Please enter your complete farm address');
          return false;
        }
        return true;
      case 2:
        if (formData.selectedCategories.length === 0) {
          Alert.alert('Required', 'Please select at least one category');
          return false;
        }
        return true;
      case 3:
        if (!formData.bankName.trim() || !formData.accountNumber.trim() || !formData.accountName.trim()) {
          Alert.alert('Required', 'Please enter your bank details');
          return false;
        }
        if (!formData.agreedToTerms) {
          Alert.alert('Required', 'Please agree to the terms and conditions');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    triggerHaptic();
    setIsSubmitting(true);

    try {
      const response = await farmerApplicationService.applyAsFarmer({
        farmName: formData.farmName,
        farmDescription: formData.farmDescription,
        farmAddress: formData.farmAddress,
        farmCity: formData.farmCity,
        farmState: formData.farmState,
        categories: formData.selectedCategories,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      });

      Alert.alert(
        'Application Submitted! 🎉',
        response.message || 'Your farmer application has been submitted. We\'ll review it within 24-48 hours and notify you of the result.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    triggerHaptic();
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.border : '#E5E5E5' }]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { width: progressWidth, backgroundColor: PRIMARY_COLOR }
          ]} 
        />
      </View>
      <View style={styles.stepsRow}>
        {['Farm Info', 'Location', 'Categories', 'Payment'].map((label, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              { 
                backgroundColor: index <= currentStep ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
                borderColor: index <= currentStep ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
              }
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepNumber, { color: index <= currentStep ? '#FFFFFF' : colors.textSecondary }]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel, 
              { color: index <= currentStep ? colors.text : colors.textSecondary }
            ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Tell us about your farm</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        This information will be shown to buyers on your store page.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Farm Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="e.g. Green Valley Farms"
          placeholderTextColor={colors.textSecondary}
          value={formData.farmName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, farmName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Farm Description *</Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Tell buyers about your farm, what makes your produce special..."
          placeholderTextColor={colors.textSecondary}
          value={formData.farmDescription}
          onChangeText={(text) => setFormData(prev => ({ ...prev, farmDescription: text }))}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Farm Location</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Where is your farm located? This helps buyers find local produce.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Street Address *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Enter street address"
          placeholderTextColor={colors.textSecondary}
          value={formData.farmAddress}
          onChangeText={(text) => setFormData(prev => ({ ...prev, farmAddress: text }))}
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>City *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? colors.card : '#F5F5F5',
              color: colors.text,
              borderColor: isDark ? colors.border : '#E5E5E5',
            }]}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            value={formData.farmCity}
            onChangeText={(text) => setFormData(prev => ({ ...prev, farmCity: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>State *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? colors.card : '#F5F5F5',
              color: colors.text,
              borderColor: isDark ? colors.border : '#E5E5E5',
            }]}
            placeholder="State"
            placeholderTextColor={colors.textSecondary}
            value={formData.farmState}
            onChangeText={(text) => setFormData(prev => ({ ...prev, farmState: text }))}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>What do you sell?</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select all categories that apply to your farm products.
      </Text>

      <View style={styles.categoriesGrid}>
        {FARM_CATEGORIES.map((category) => {
          const isSelected = formData.selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { 
                  backgroundColor: isSelected ? `${PRIMARY_COLOR}15` : (isDark ? colors.card : '#F5F5F5'),
                  borderColor: isSelected ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
                }
              ]}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.7}
            >
              {category.iconType === 'material' ? (
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={28} 
                  color={isSelected ? PRIMARY_COLOR : colors.textSecondary} 
                />
              ) : (
                <Ionicons 
                  name={category.icon as any} 
                  size={28} 
                  color={isSelected ? PRIMARY_COLOR : colors.textSecondary} 
                />
              )}
              <Text style={[
                styles.categoryName,
                { color: isSelected ? PRIMARY_COLOR : colors.text }
              ]}>
                {category.name}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Payment Details</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Add your bank account to receive payments for your sales.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Bank Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="e.g. First Bank"
          placeholderTextColor={colors.textSecondary}
          value={formData.bankName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bankName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Account Number *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Enter 10-digit account number"
          placeholderTextColor={colors.textSecondary}
          value={formData.accountNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Account Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Name on account"
          placeholderTextColor={colors.textSecondary}
          value={formData.accountName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text }))}
        />
      </View>

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => {
          triggerHaptic();
          setFormData(prev => ({ ...prev, agreedToTerms: !prev.agreedToTerms }));
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          { 
            backgroundColor: formData.agreedToTerms ? PRIMARY_COLOR : 'transparent',
            borderColor: formData.agreedToTerms ? PRIMARY_COLOR : colors.textSecondary,
          }
        ]}>
          {formData.agreedToTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          I agree to the <Text style={{ color: PRIMARY_COLOR }}>Terms & Conditions</Text> and{' '}
          <Text style={{ color: PRIMARY_COLOR }}>Seller Agreement</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: isDark ? colors.border : '#E5E5E5' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 0) {
              prevStep();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Become a Farmer</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        {currentStep < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: PRIMARY_COLOR, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>Submitting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Submit Application</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  stepIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  stepContent: {
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 16,
    fontFamily: FONTS.regular,
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: (width - 32 - 24) / 3,
    marginHorizontal: 6,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  categoryName: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 8,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
