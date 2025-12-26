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
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupBikeDetails'>;

// Floating Input Component
const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  autoCapitalize = 'sentences',
  isDark,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
          autoCapitalize={autoCapitalize}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function SignupBikeDetailsScreen({ navigation, route }: Props) {
  const {
    role,
    email,
    phone,
    password,
    firstName,
    lastName,
    nationality,
    nationalityCode,
    state,
    city,
    address,
    latitude,
    longitude,
  } = route.params;

  const [bikeModel, setBikeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [bikeColor, setBikeColor] = useState('');
  const [driversLicense, setDriversLicense] = useState<string | null>(null);
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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDriversLicense(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDriversLicense(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Upload Driver\'s License',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!bikeModel.trim()) {
      newErrors.bikeModel = 'Bike model is required';
    }
    if (!plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }
    if (!bikeColor.trim()) {
      newErrors.bikeColor = 'Bike color is required';
    }
    if (!driversLicense) {
      newErrors.driversLicense = 'Driver\'s license is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    navigation.navigate('SignupGuarantors', {
      role,
      email,
      phone,
      password,
      firstName,
      lastName,
      nationality,
      nationalityCode,
      state,
      city,
      address,
      latitude,
      longitude,
      bikeModel: bikeModel.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      bikeColor: bikeColor.trim(),
      driversLicense,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['85.68%', '88%'],
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
          Step 7 of 9
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
          <Text style={[styles.title, { color: colors.text }]}>Bike Details 🏍️</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Tell us about your delivery vehicle
          </Text>
        </View>

        <FloatingInput
          label="Bike Model"
          value={bikeModel}
          onChangeText={setBikeModel}
          icon="motorbike"
          error={errors.bikeModel}
          isDark={isDark}
          colors={colors}
        />

        <FloatingInput
          label="Plate Number"
          value={plateNumber}
          onChangeText={setPlateNumber}
          icon="card-text-outline"
          error={errors.plateNumber}
          autoCapitalize="characters"
          isDark={isDark}
          colors={colors}
        />

        <FloatingInput
          label="Bike Color"
          value={bikeColor}
          onChangeText={setBikeColor}
          icon="palette-outline"
          error={errors.bikeColor}
          isDark={isDark}
          colors={colors}
        />

        {/* Driver's License Upload */}
        <View style={styles.uploadSection}>
          <Text style={[styles.uploadLabel, { color: colors.text }]}>Driver's License</Text>
          <Text style={[styles.uploadDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Upload a clear photo of your valid driver's license
          </Text>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: errors.driversLicense ? '#EF4444' : (driversLicense ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB')),
              },
            ]}
            onPress={showImageOptions}
          >
            {driversLicense ? (
              <View style={styles.uploadedContainer}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                <Text style={[styles.uploadedText, { color: COLORS.primary }]}>
                  License Uploaded
                </Text>
                <TouchableOpacity onPress={() => setDriversLicense(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={32} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text style={[styles.uploadPlaceholderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Tap to upload
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.driversLicense && (
            <Text style={styles.errorText}>{errors.driversLicense}</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: COLORS.primary },
          ]}
          onPress={handleContinue}
        >
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
  titleContainer: { marginBottom: SPACING.xl },
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
  inputWrapper: { marginBottom: SPACING.lg },
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
  uploadSection: { marginTop: SPACING.md },
  uploadLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  uploadDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  uploadButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadPlaceholderText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginTop: SPACING.sm,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  uploadedText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
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
