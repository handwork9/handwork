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
  ActivityIndicator,
  Alert,
  Image,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupGuarantors'>;

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
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad';
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
          keyboardType={keyboardType}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function SignupGuarantorsScreen({ navigation, route }: Props) {
  const params = route.params;

  // Guarantor 1
  const [g1Name, setG1Name] = useState('');
  const [g1Phone, setG1Phone] = useState('');
  const [g1Occupation, setG1Occupation] = useState('');
  const [g1Relationship, setG1Relationship] = useState('');
  const [g1Address, setG1Address] = useState('');
  const [g1IdDocument, setG1IdDocument] = useState<string | null>(null);

  // Guarantor 2
  const [g2Name, setG2Name] = useState('');
  const [g2Phone, setG2Phone] = useState('');
  const [g2Occupation, setG2Occupation] = useState('');
  const [g2Relationship, setG2Relationship] = useState('');
  const [g2Address, setG2Address] = useState('');
  const [g2IdDocument, setG2IdDocument] = useState<string | null>(null);

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
    Alert.alert('Upload ID Document', 'Choose an option', [
      { text: 'Take Photo', onPress: () => takePhoto(setter) },
      { text: 'Choose from Gallery', onPress: () => pickImage(setter) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Guarantor 1 validation
    if (!g1Name.trim()) newErrors.g1Name = 'Name is required';
    if (!g1Phone.trim()) newErrors.g1Phone = 'Phone is required';
    if (!g1Occupation.trim()) newErrors.g1Occupation = 'Occupation is required';
    if (!g1Relationship.trim()) newErrors.g1Relationship = 'Relationship is required';
    if (!g1Address.trim()) newErrors.g1Address = 'Address is required';
    if (!g1IdDocument) newErrors.g1IdDocument = 'ID document is required';

    // Guarantor 2 validation
    if (!g2Name.trim()) newErrors.g2Name = 'Name is required';
    if (!g2Phone.trim()) newErrors.g2Phone = 'Phone is required';
    if (!g2Occupation.trim()) newErrors.g2Occupation = 'Occupation is required';
    if (!g2Relationship.trim()) newErrors.g2Relationship = 'Relationship is required';
    if (!g2Address.trim()) newErrors.g2Address = 'Address is required';
    if (!g2IdDocument) newErrors.g2IdDocument = 'ID document is required';

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
        latitude: params.latitude,
        longitude: params.longitude,
        nationality: params.nationality,
        nationalityCode: params.nationalityCode,
        // Rider specific
        bikeModel: params.bikeModel,
        plateNumber: params.plateNumber,
        bikeColor: params.bikeColor,
        driversLicense: params.driversLicense,
        guarantors: [
          {
            name: g1Name.trim(),
            phone: g1Phone.trim(),
            occupation: g1Occupation.trim(),
            relationship: g1Relationship.trim(),
            address: g1Address.trim(),
            idDocument: g1IdDocument,
          },
          {
            name: g2Name.trim(),
            phone: g2Phone.trim(),
            occupation: g2Occupation.trim(),
            relationship: g2Relationship.trim(),
            address: g2Address.trim(),
            idDocument: g2IdDocument,
          },
        ],
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
          <Text style={[styles.title, { color: colors.text }]}>Guarantors 👥</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Provide two guarantors who can vouch for you
          </Text>
        </View>

        {/* Guarantor 1 */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>First Guarantor</Text>
          
          <FloatingInput
            label="Full Name"
            value={g1Name}
            onChangeText={setG1Name}
            icon="account-outline"
            error={errors.g1Name}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Phone Number"
            value={g1Phone}
            onChangeText={setG1Phone}
            icon="phone-outline"
            error={errors.g1Phone}
            keyboardType="phone-pad"
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Occupation"
            value={g1Occupation}
            onChangeText={setG1Occupation}
            icon="briefcase-outline"
            error={errors.g1Occupation}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Relationship"
            value={g1Relationship}
            onChangeText={setG1Relationship}
            icon="account-group-outline"
            error={errors.g1Relationship}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Address"
            value={g1Address}
            onChangeText={setG1Address}
            icon="map-marker-outline"
            error={errors.g1Address}
            isDark={isDark}
            colors={colors}
          />

          {/* ID Upload */}
          <Text style={[styles.uploadLabel, { color: colors.text }]}>Valid ID Document</Text>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                borderColor: errors.g1IdDocument ? '#EF4444' : (isDark ? '#4B5563' : '#E5E7EB'),
              },
            ]}
            onPress={() => showImageOptions(setG1IdDocument)}
          >
            {g1IdDocument ? (
              <View style={styles.uploadedContainer}>
                <Image source={{ uri: g1IdDocument }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setG1IdDocument(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={32}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text style={[styles.uploadText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Upload ID (NIN, Passport, Driver's License)
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.g1IdDocument && <Text style={styles.errorText}>{errors.g1IdDocument}</Text>}
        </View>

        {/* Guarantor 2 */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Second Guarantor</Text>
          
          <FloatingInput
            label="Full Name"
            value={g2Name}
            onChangeText={setG2Name}
            icon="account-outline"
            error={errors.g2Name}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Phone Number"
            value={g2Phone}
            onChangeText={setG2Phone}
            icon="phone-outline"
            error={errors.g2Phone}
            keyboardType="phone-pad"
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Occupation"
            value={g2Occupation}
            onChangeText={setG2Occupation}
            icon="briefcase-outline"
            error={errors.g2Occupation}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Relationship"
            value={g2Relationship}
            onChangeText={setG2Relationship}
            icon="account-group-outline"
            error={errors.g2Relationship}
            isDark={isDark}
            colors={colors}
          />
          <FloatingInput
            label="Address"
            value={g2Address}
            onChangeText={setG2Address}
            icon="map-marker-outline"
            error={errors.g2Address}
            isDark={isDark}
            colors={colors}
          />

          {/* ID Upload */}
          <Text style={[styles.uploadLabel, { color: colors.text }]}>Valid ID Document</Text>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                borderColor: errors.g2IdDocument ? '#EF4444' : (isDark ? '#4B5563' : '#E5E7EB'),
              },
            ]}
            onPress={() => showImageOptions(setG2IdDocument)}
          >
            {g2IdDocument ? (
              <View style={styles.uploadedContainer}>
                <Image source={{ uri: g2IdDocument }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setG2IdDocument(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={32}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text style={[styles.uploadText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Upload ID (NIN, Passport, Driver's License)
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.g2IdDocument && <Text style={styles.errorText}>{errors.g2IdDocument}</Text>}
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
  uploadLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 8,
    textAlign: 'center',
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
