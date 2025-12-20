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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { useAppDispatch } from '../../../store';
import { setAuth } from '../../../store/slices/authSlice';
import { authService } from '../../../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupFarmVerification'>;

// Floating Input Component
const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  isDark,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  error?: string;
  isDark: boolean;
  colors: any;
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
      outputRange: [18, -8],
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
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={isFocused ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280')}
          style={styles.inputIcon}
        />
        <RNTextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function SignupFarmVerificationScreen({ navigation, route }: Props) {
  const params = route.params;
  const [nin, setNin] = useState('');
  const [farmDocument, setFarmDocument] = useState<string | null>(null);
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [cacDocument, setCacDocument] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload documents');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const takePhoto = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const showImageOptions = (setter: (uri: string) => void) => {
    Alert.alert('Upload Document', 'Choose an option', [
      { text: 'Take Photo', onPress: () => takePhoto(setter) },
      { text: 'Choose from Gallery', onPress: () => pickImage(setter) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nin.trim()) newErrors.nin = 'NIN is required';
    else if (nin.length !== 11) newErrors.nin = 'NIN must be 11 digits';
    if (!idDocument) newErrors.idDocument = 'ID document is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const signupData = {
        name: `${params.firstName} ${params.lastName}`,
        email: params.email,
        phone: params.phone,
        password: params.password,
        role: params.role,
        state: params.state,
        city: params.city,
        address: params.address,
        nationality: params.nationality,
        nationalityCode: params.nationalityCode,
        // Farmer specific
        farmName: params.farmName,
        farmType: params.farmType,
        farmSize: params.farmSize,
        productCategories: params.productCategories,
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        nin: nin.trim(),
        farmDocument,
        idDocument,
        cacDocument,
      };

      const response = await authService.signup(signupData);

      if (response?.success && response?.data?.user) {
        dispatch(setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));
      } else {
        Alert.alert('Signup Failed', response?.message || 'Please try again');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.response?.data?.message || error?.message || 'An error occurred';
      Alert.alert('Signup Failed', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['88%', '100%'],
  });

  const renderDocumentUpload = (
    title: string,
    description: string,
    value: string | null,
    setter: (uri: string) => void,
    error?: string,
    optional = false
  ) => (
    <View style={styles.documentSection}>
      <View style={styles.documentHeader}>
        <Text style={[styles.documentTitle, { color: colors.text }]}>
          {title}
          {optional && <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}> (Optional)</Text>}
        </Text>
        <Text style={[styles.documentDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          {description}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.uploadBox,
          {
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderColor: error ? '#EF4444' : (isDark ? '#4B5563' : '#E5E7EB'),
          },
        ]}
        onPress={() => showImageOptions(setter)}
      >
        {value ? (
          <View style={styles.uploadedContainer}>
            <Image source={{ uri: value }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setter('')}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={40}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={[styles.uploadText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Tap to upload
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step 8 of 8
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
          <Text style={[styles.title, { color: colors.text }]}>Verification 📋</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Upload documents for verification
          </Text>
        </View>

        {/* NIN Input */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>National Identification</Text>
          
          <FloatingInput
            label="NIN (National ID Number)"
            value={nin}
            onChangeText={(text) => setNin(text.replace(/[^0-9]/g, '').slice(0, 11))}
            icon="card-account-details-outline"
            error={errors.nin}
            isDark={isDark}
            colors={colors}
          />
        </View>

        {/* Document Uploads */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Documents</Text>
          
          {renderDocumentUpload(
            'Valid ID',
            'National ID, Driver\'s License, or International Passport',
            idDocument,
            setIdDocument,
            errors.idDocument
          )}

          {renderDocumentUpload(
            'Farm Ownership Document',
            'Land certificate or lease agreement',
            farmDocument,
            setFarmDocument,
            undefined,
            true
          )}

          {renderDocumentUpload(
            'CAC Registration',
            'Business registration certificate',
            cacDocument,
            setCacDocument,
            undefined,
            true
          )}
        </View>

        {/* Info Note */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Your documents will be reviewed within 24-48 hours. You can start using the app while verification is pending.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: COLORS.primary },
            isLoading && styles.createButtonDisabled,
          ]}
          onPress={handleCreateAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.createButtonText}>Create Account</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
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
    marginBottom: SPACING.md,
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
  documentSection: {
    marginBottom: SPACING.lg,
  },
  documentHeader: {
    marginBottom: SPACING.sm,
  },
  documentTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginTop: 8,
  },
  uploadedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
