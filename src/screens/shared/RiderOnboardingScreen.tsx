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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#FF6B00';

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
}

const VEHICLE_TYPES: VehicleType[] = [
  { id: 'bicycle', name: 'Bicycle', icon: 'bicycle', iconType: 'ionicons' },
  { id: 'motorcycle', name: 'Motorcycle', icon: 'motorbike', iconType: 'material' },
  { id: 'car', name: 'Car', icon: 'car-outline', iconType: 'ionicons' },
  { id: 'van', name: 'Van/Truck', icon: 'truck-outline', iconType: 'material' },
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function RiderOnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStateList, setShowStateList] = useState(false);
  const [formData, setFormData] = useState({
    state: '',
    city: '',
    vehicleType: '',
    vehiclePlate: '',
    vehicleModel: '',
    vehicleColor: '',
    licenseNumber: '',
    licenseImage: null as string | null,
    idCardImage: null as string | null,
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
    guarantorRelationship: '',
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
        if (!formData.state) {
          Alert.alert('Required', 'Please select your state');
          return false;
        }
        if (!formData.city.trim()) {
          Alert.alert('Required', 'Please enter your city');
          return false;
        }
        return true;
      case 1:
        if (!formData.vehicleType) {
          Alert.alert('Required', 'Please select your vehicle type');
          return false;
        }
        if (formData.vehicleType !== 'bicycle') {
          if (!formData.vehiclePlate.trim()) {
            Alert.alert('Required', 'Please enter your vehicle plate number');
            return false;
          }
          if (!formData.vehicleModel.trim()) {
            Alert.alert('Required', 'Please enter your vehicle model');
            return false;
          }
        }
        return true;
      case 2:
        if (!formData.idCardImage) {
          Alert.alert('Required', 'Please upload your ID card');
          return false;
        }
        if (formData.vehicleType !== 'bicycle' && !formData.licenseImage) {
          Alert.alert('Required', 'Please upload your driver\'s license');
          return false;
        }
        return true;
      case 3:
        if (!formData.guarantorName.trim()) {
          Alert.alert('Required', 'Please enter your guarantor\'s name');
          return false;
        }
        if (!formData.guarantorPhone.trim()) {
          Alert.alert('Required', 'Please enter your guarantor\'s phone number');
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

  const pickImage = async (type: 'license' | 'idCard') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        [type === 'license' ? 'licenseImage' : 'idCardImage']: result.assets[0].uri,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    triggerHaptic();
    setIsSubmitting(true);

    try {
      // Create form data for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('state', formData.state);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('vehicleType', formData.vehicleType);
      formDataToSend.append('vehiclePlate', formData.vehiclePlate);
      formDataToSend.append('vehicleModel', formData.vehicleModel);
      formDataToSend.append('vehicleColor', formData.vehicleColor);
      formDataToSend.append('licenseNumber', formData.licenseNumber);
      formDataToSend.append('guarantorName', formData.guarantorName);
      formDataToSend.append('guarantorPhone', formData.guarantorPhone);
      formDataToSend.append('guarantorAddress', formData.guarantorAddress);
      formDataToSend.append('guarantorRelationship', formData.guarantorRelationship);

      if (formData.idCardImage) {
        const idCardUri = formData.idCardImage;
        const idCardName = idCardUri.split('/').pop() || 'idcard.jpg';
        formDataToSend.append('idCardImage', {
          uri: idCardUri,
          name: idCardName,
          type: 'image/jpeg',
        } as any);
      }

      if (formData.licenseImage) {
        const licenseUri = formData.licenseImage;
        const licenseName = licenseUri.split('/').pop() || 'license.jpg';
        formDataToSend.append('licenseImage', {
          uri: licenseUri,
          name: licenseName,
          type: 'image/jpeg',
        } as any);
      }

      const response = await api.post('/users/rider/apply', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Application Submitted! 🎉',
        response.data?.message || 'Your rider application has been submitted. We\'ll review it within 2-3 days and notify you of the result.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
        {['Location', 'Vehicle', 'Documents', 'Guarantor'].map((label, index) => (
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
      <Text style={[styles.stepTitle, { color: colors.text }]}>Where will you deliver?</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select your operating location. You'll be assigned deliveries in this area.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>State *</Text>
        <TouchableOpacity
          style={[styles.selectInput, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          onPress={() => setShowStateList(!showStateList)}
        >
          <Text style={[styles.selectText, { color: formData.state ? colors.text : colors.textSecondary }]}>
            {formData.state || 'Select your state'}
          </Text>
          <Ionicons name={showStateList ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {showStateList && (
          <View style={[styles.stateList, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {NIGERIAN_STATES.map(state => (
                <TouchableOpacity
                  key={state}
                  style={[styles.stateOption, formData.state === state && { backgroundColor: `${PRIMARY_COLOR}15` }]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, state }));
                    setShowStateList(false);
                  }}
                >
                  <Text style={[styles.stateOptionText, { color: colors.text }]}>{state}</Text>
                  {formData.state === state && (
                    <Ionicons name="checkmark" size={18} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>City *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Enter your city"
          placeholderTextColor={colors.textSecondary}
          value={formData.city}
          onChangeText={text => setFormData(prev => ({ ...prev, city: text }))}
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Your Vehicle</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Tell us about the vehicle you'll use for deliveries.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Vehicle Type *</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleOption,
                { 
                  backgroundColor: isDark ? colors.card : '#F5F5F5',
                  borderColor: formData.vehicleType === vehicle.id ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
                  borderWidth: formData.vehicleType === vehicle.id ? 2 : 1,
                }
              ]}
              onPress={() => {
                triggerHaptic();
                setFormData(prev => ({ ...prev, vehicleType: vehicle.id }));
              }}
            >
              {vehicle.iconType === 'material' ? (
                <MaterialCommunityIcons 
                  name={vehicle.icon as any} 
                  size={32} 
                  color={formData.vehicleType === vehicle.id ? PRIMARY_COLOR : colors.textSecondary} 
                />
              ) : (
                <Ionicons 
                  name={vehicle.icon as any} 
                  size={32} 
                  color={formData.vehicleType === vehicle.id ? PRIMARY_COLOR : colors.textSecondary} 
                />
              )}
              <Text style={[
                styles.vehicleLabel,
                { color: formData.vehicleType === vehicle.id ? PRIMARY_COLOR : colors.text }
              ]}>
                {vehicle.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.vehicleType && formData.vehicleType !== 'bicycle' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Plate Number *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text,
                borderColor: isDark ? colors.border : '#E5E5E5',
              }]}
              placeholder="e.g. ABC-123-XY"
              placeholderTextColor={colors.textSecondary}
              value={formData.vehiclePlate}
              onChangeText={text => setFormData(prev => ({ ...prev, vehiclePlate: text.toUpperCase() }))}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Vehicle Model *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text,
                borderColor: isDark ? colors.border : '#E5E5E5',
              }]}
              placeholder="e.g. Honda CG 125"
              placeholderTextColor={colors.textSecondary}
              value={formData.vehicleModel}
              onChangeText={text => setFormData(prev => ({ ...prev, vehicleModel: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Vehicle Color</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text,
                borderColor: isDark ? colors.border : '#E5E5E5',
              }]}
              placeholder="e.g. Black"
              placeholderTextColor={colors.textSecondary}
              value={formData.vehicleColor}
              onChangeText={text => setFormData(prev => ({ ...prev, vehicleColor: text }))}
            />
          </View>
        </>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Upload Documents</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        We need these to verify your identity. All documents are kept secure.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>ID Card (NIN/Voter's Card/Int'l Passport) *</Text>
        <TouchableOpacity
          style={[styles.uploadBox, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            borderColor: formData.idCardImage ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
          }]}
          onPress={() => pickImage('idCard')}
        >
          {formData.idCardImage ? (
            <View style={styles.uploadedImageContainer}>
              <Image source={{ uri: formData.idCardImage }} style={styles.uploadedImage} />
              <View style={styles.uploadedOverlay}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.uploadedText}>Uploaded</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Tap to upload ID card</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {formData.vehicleType && formData.vehicleType !== 'bicycle' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Driver's License *</Text>
            <TouchableOpacity
              style={[styles.uploadBox, { 
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                borderColor: formData.licenseImage ? PRIMARY_COLOR : (isDark ? colors.border : '#E5E5E5'),
              }]}
              onPress={() => pickImage('license')}
            >
              {formData.licenseImage ? (
                <View style={styles.uploadedImageContainer}>
                  <Image source={{ uri: formData.licenseImage }} style={styles.uploadedImage} />
                  <View style={styles.uploadedOverlay}>
                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    <Text style={styles.uploadedText}>Uploaded</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Tap to upload license</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>License Number</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text,
                borderColor: isDark ? colors.border : '#E5E5E5',
              }]}
              placeholder="Enter license number"
              placeholderTextColor={colors.textSecondary}
              value={formData.licenseNumber}
              onChangeText={text => setFormData(prev => ({ ...prev, licenseNumber: text }))}
            />
          </View>
        </>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Guarantor Information</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Provide details of someone who can vouch for you. This helps us maintain trust.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Guarantor Full Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Enter guarantor's full name"
          placeholderTextColor={colors.textSecondary}
          value={formData.guarantorName}
          onChangeText={text => setFormData(prev => ({ ...prev, guarantorName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Guarantor Phone Number *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="e.g. 08012345678"
          placeholderTextColor={colors.textSecondary}
          value={formData.guarantorPhone}
          onChangeText={text => setFormData(prev => ({ ...prev, guarantorPhone: text }))}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Guarantor Address</Text>
        <TextInput
          style={[styles.input, styles.textArea, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="Enter guarantor's address"
          placeholderTextColor={colors.textSecondary}
          value={formData.guarantorAddress}
          onChangeText={text => setFormData(prev => ({ ...prev, guarantorAddress: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Relationship</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDark ? colors.card : '#F5F5F5',
            color: colors.text,
            borderColor: isDark ? colors.border : '#E5E5E5',
          }]}
          placeholder="e.g. Brother, Friend, Colleague"
          placeholderTextColor={colors.textSecondary}
          value={formData.guarantorRelationship}
          onChangeText={text => setFormData(prev => ({ ...prev, guarantorRelationship: text }))}
        />
      </View>

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => {
          triggerHaptic();
          setFormData(prev => ({ ...prev, agreedToTerms: !prev.agreedToTerms }));
        }}
      >
        <View style={[
          styles.checkbox, 
          { 
            borderColor: formData.agreedToTerms ? PRIMARY_COLOR : colors.border,
            backgroundColor: formData.agreedToTerms ? PRIMARY_COLOR : 'transparent',
          }
        ]}>
          {formData.agreedToTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={[styles.termsText, { color: colors.text }]}>
          I agree to the <Text style={{ color: PRIMARY_COLOR }}>Terms of Service</Text> and{' '}
          <Text style={{ color: PRIMARY_COLOR }}>Rider Agreement</Text>
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
      default: return renderStep0();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 0) {
              navigation.goBack();
            } else {
              prevStep();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rider Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}
          {renderCurrentStep()}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
          {currentStep < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextStep}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Submit Application</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepIndicatorContainer: {
    marginBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
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
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
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
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  selectInput: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  stateList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stateOptionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleOption: {
    width: (width - 52) / 2,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: 8,
  },
  uploadBox: {
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: 8,
  },
  uploadedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  nextButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
