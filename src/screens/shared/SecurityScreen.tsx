import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { twoFactorService } from '../../services/twoFactorService';
import sessionsService from '../../services/sessionsService';
import pinService from '../../services/pinService';
import securitySettingsService from '../../services/securitySettingsService';
import { useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';

const SECURITY_SETTINGS_KEY = '@security_settings';

interface ToggleItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface OptionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor: string;
  badge?: string;
  action: () => void;
  danger?: boolean;
}

export default function SecurityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  
  const [biometrics, setBiometrics] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [isBiometricsLoading, setIsBiometricsLoading] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [twoFactor, setTwoFactor] = useState(false);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [pinLock, setPinLock] = useState(false);

  // Fetch actual 2FA status and session count from backend when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchTwoFactorStatus = async () => {
        try {
          setIsTwoFactorLoading(true);
          const response = await twoFactorService.getStatus();
          if (response.success && response.data) {
            setTwoFactor(response.data.isEnabled);
          }
        } catch (error) {
          console.error('Failed to fetch 2FA status:', error);
        } finally {
          setIsTwoFactorLoading(false);
        }
      };
      
      const fetchSessionCount = async () => {
        try {
          const sessions = await sessionsService.getSessions();
          setSessionCount(sessions.length);
        } catch (error) {
          console.error('Failed to fetch session count:', error);
          setSessionCount(null);
        }
      };

      // Fetch login alerts setting from backend
      const fetchLoginAlertsSetting = async () => {
        try {
          const settings = await securitySettingsService.getSecuritySettings();
          setLoginAlerts(settings.loginAlertsEnabled);
        } catch (error) {
          console.error('Failed to fetch login alerts setting:', error);
          // Fall back to local storage
          const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
          if (stored) {
            const localSettings = JSON.parse(stored);
            setLoginAlerts(localSettings.loginAlerts ?? true);
          }
        }
      };
      
      // Check PIN status and update pinLock accordingly
      const checkPinStatus = async () => {
        try {
          console.log('checkPinStatus called');
          const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
          console.log('AsyncStorage raw value:', stored);
          const settings = stored ? JSON.parse(stored) : {};
          console.log('Parsed settings:', settings);
          
          // Check if PIN was just set successfully
          if (settings.pinSetSuccess) {
            console.log('pinSetSuccess flag found, enabling PIN Lock');
            setPinLock(true);
            // Save pinLock as true and clear the flag
            settings.pinLock = true;
            delete settings.pinSetSuccess;
            await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
            return;
          }
          
          // Set from stored settings - trust local storage as the source of truth
          const storedPinLock = settings.pinLock ?? false;
          console.log('storedPinLock value:', storedPinLock);
          setPinLock(storedPinLock);
          
          // Note: We no longer override local storage based on backend hasPin
          // The backend check is only used when enabling PIN Lock to ensure PIN exists
          // This prevents issues where API errors or timing issues could reset the toggle
        } catch (error) {
          console.error('Failed to check PIN status:', error);
        }
      };

      // Check biometric availability
      const checkBiometricAvailability = async () => {
        try {
          setIsBiometricsLoading(true);
          
          // Check if hardware supports biometrics
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          
          // Check if biometrics are enrolled
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          
          setIsBiometricsAvailable(hasHardware && isEnrolled);
          
          // Get supported authentication types
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('Iris');
          }
          
          // Load saved biometric preference
          const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
          if (stored) {
            const settings = JSON.parse(stored);
            // Only enable if device supports biometrics AND user has it enabled
            setBiometrics(hasHardware && isEnrolled && (settings.biometrics ?? false));
          }
        } catch (error) {
          console.error('Failed to check biometric availability:', error);
          setIsBiometricsAvailable(false);
        } finally {
          setIsBiometricsLoading(false);
        }
      };
      
      fetchTwoFactorStatus();
      fetchSessionCount();
      fetchLoginAlertsSetting();
      checkPinStatus();
      checkBiometricAvailability();
    }, [])
  );

  // Load security settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
        if (stored) {
          const settings = JSON.parse(stored);
          // Note: biometrics is now loaded in useFocusEffect with hardware check
          // Note: twoFactor is now loaded from backend
          setLoginAlerts(settings.loginAlerts ?? true);
          // Note: pinLock is now checked in useFocusEffect with PIN existence check
        }
      } catch (error) {
        console.error('Failed to load security settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save security settings when they change
  const saveSettings = async (key: string, value: boolean) => {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};
      settings[key] = value;
      await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save security settings:', error);
    }
  };

  const handleBiometricsChange = async (value: boolean) => {
    if (!isBiometricsAvailable) {
      Alert.alert(
        'Biometrics Not Available',
        'Your device does not support biometric authentication or it has not been set up. Please enable Face ID, Touch ID, or fingerprint in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (value) {
      // User is trying to enable biometrics - verify their identity first
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType} Login`,
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setBiometrics(true);
          saveSettings('biometrics', true);
          Alert.alert('Success', `${biometricType} login has been enabled.`);
        } else if (result.error === 'user_cancel') {
          // User cancelled, don't show error
        } else {
          Alert.alert('Authentication Failed', 'Could not verify your identity. Please try again.');
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
        Alert.alert('Error', 'An error occurred while setting up biometric authentication.');
      }
    } else {
      // User is disabling biometrics
      setBiometrics(false);
      saveSettings('biometrics', false);
    }
  };

  const handleTwoFactorChange = (value: boolean) => {
    // Navigate to the 2FA setup screen instead of just toggling
    // The actual state change will happen when returning from that screen
    (navigation as any).navigate('TwoFactorSetup', { 
      mode: value ? 'enable' : 'disable' 
    });
  };

  const [isLoginAlertsLoading, setIsLoginAlertsLoading] = useState(false);

  const handleLoginAlertsChange = async (value: boolean) => {
    // Optimistic update
    setLoginAlerts(value);
    setIsLoginAlertsLoading(true);
    
    try {
      const result = await securitySettingsService.updateLoginAlerts(value);
      if (!result.success) {
        // Revert on failure
        setLoginAlerts(!value);
        Alert.alert('Error', result.message);
      }
      // Also save to local storage as backup
      saveSettings('loginAlerts', value);
    } catch (error) {
      // Revert on error
      setLoginAlerts(!value);
      Alert.alert('Error', 'Failed to update login alerts setting');
    } finally {
      setIsLoginAlertsLoading(false);
    }
  };

  const handlePinLockChange = async (value: boolean) => {
    if (value) {
      // Enabling PIN Lock - check if PIN exists
      try {
        const { hasPin } = await pinService.hasPin();
        
        if (!hasPin) {
          // No PIN set, navigate to SetPin screen
          Alert.alert(
            'Set PIN Required',
            'You need to create a PIN before enabling PIN Lock.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Set PIN', 
                onPress: () => (navigation as any).navigate('SetPin', { returnToSecurity: true })
              }
            ]
          );
          return;
        }
      } catch (error) {
        // API error - assume PIN might exist and allow enabling
        console.error('Failed to check PIN status:', error);
      }
    }
    
    setPinLock(value);
    saveSettings('pinLock', value);
  };

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? colors.card : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);
  
  // Change PIN modal state
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Check if navigated from Forgot PIN
  useEffect(() => {
    const params = route.params as { showChangePin?: boolean } | undefined;
    if (params?.showChangePin) {
      setShowChangePinModal(true);
    }
  }, [route.params]);

  const securityScore = (biometrics ? 25 : 0) + (twoFactor ? 35 : 0) + (loginAlerts ? 20 : 0) + (pinLock ? 20 : 0);
  const securityLevel = securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : securityScore >= 40 ? 'Fair' : 'Weak';
  const securityColor = securityScore >= 80 ? '#34C759' : securityScore >= 60 ? '#FF9500' : securityScore >= 40 ? '#FF9500' : '#FF3B30';

  const securitySettings: ToggleItem[] = [
    {
      icon: 'finger-print',
      label: `${biometricType} Login`,
      iconColor: '#FF2D55',
      value: biometrics,
      onValueChange: handleBiometricsChange,
      isLoading: isBiometricsLoading,
      disabled: isBiometricsLoading || !isBiometricsAvailable,
    },
    {
      icon: 'shield-checkmark',
      label: 'Two-Factor Authentication',
      iconColor: '#34C759',
      value: twoFactor,
      onValueChange: handleTwoFactorChange,
      isLoading: isTwoFactorLoading,
      disabled: isTwoFactorLoading,
    },
    {
      icon: 'notifications',
      label: 'Login Alerts',
      iconColor: '#FF9500',
      value: loginAlerts,
      onValueChange: handleLoginAlertsChange,
      isLoading: isLoginAlertsLoading,
      disabled: isLoginAlertsLoading,
    },
    {
      icon: 'keypad',
      label: 'PIN Lock',
      iconColor: '#5856D6',
      value: pinLock,
      onValueChange: handlePinLockChange,
    },
  ];

  const handleChangePinAction = async () => {
    try {
      const result = await pinService.hasPin();
      console.log('handleChangePinAction - hasPin result:', result);
      if (result.hasPin === false) {
        // Only go to SetPin if we explicitly know there's no PIN
        (navigation as any).navigate('SetPin', { returnToSecurity: true });
      } else {
        // Show change PIN modal (default behavior)
        setShowChangePinModal(true);
      }
    } catch (error) {
      console.log('handleChangePinAction error, showing modal:', error);
      // On error, assume PIN exists and show change modal
      setShowChangePinModal(true);
    }
  };

  const accountOptions: OptionItem[] = [
    { 
      icon: 'key', 
      label: 'Change Password', 
      iconColor: '#007AFF',
      action: () => (navigation as any).navigate('ChangePassword'),
    },
    { 
      icon: 'keypad', 
      label: 'Change PIN', 
      iconColor: '#5856D6',
      action: handleChangePinAction,
    },
  ];

  const activityOptions: OptionItem[] = [
    { 
      icon: 'time', 
      label: 'Login Activity', 
      iconColor: '#007AFF',
      action: () => (navigation as any).navigate('LoginActivity'),
    },
    { 
      icon: 'phone-landscape', 
      label: 'Active Sessions', 
      iconColor: '#FF9500',
      badge: sessionCount !== null && sessionCount > 0 ? String(sessionCount) : undefined,
      action: () => (navigation as any).navigate('ActiveSessions'),
    },
  ];

  const handleSignOutAllDevices = () => {
    Alert.alert(
      'Sign Out All Devices',
      'This will sign you out from all devices including this one. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOutAll(true);
              await sessionsService.endAllSessions();
              dispatch(logout());
            } catch (error) {
              console.error('Error signing out all devices:', error);
              Alert.alert('Error', 'Failed to sign out all devices. Please try again.');
              setSigningOutAll(false);
            }
          },
        },
      ]
    );
  };

  const dangerOptions: OptionItem[] = [
    {
      icon: 'log-out',
      label: signingOutAll ? 'Signing out...' : 'Sign Out All Devices',
      iconColor: '#FF9500',
      action: handleSignOutAllDevices,
    },
    {
      icon: 'trash',
      label: 'Delete Account',
      iconColor: '#FF3B30',
      action: () => (navigation as any).navigate('DeleteAccount'),
      danger: true,
    },
  ];

  const renderToggleItem = (item: ToggleItem, isLast: boolean) => (
    <View key={item.label} style={styles.settingItem}>
      <View style={[styles.settingIconContainer, { backgroundColor: item.iconColor + '15' }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <View style={[styles.settingContent, !isLast && styles.settingBorder]}>
        <Text style={[styles.settingLabel, dynamicStyles.text]}>{item.label}</Text>
        {item.isLoading ? (
          <ActivityIndicator size="small" color={item.iconColor} />
        ) : (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: isDark ? '#39393D' : '#E5E7EB', true: '#16A34A' }}
            thumbColor="#FFFFFF"
            disabled={item.disabled}
          />
        )}
      </View>
    </View>
  );

  const renderOptionItem = (item: OptionItem, isLast: boolean) => (
    <TouchableOpacity key={item.label} style={styles.settingItem} onPress={item.action} activeOpacity={0.7}>
      <View style={[styles.settingIconContainer, { backgroundColor: item.iconColor + '15' }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <View style={[styles.settingContent, !isLast && styles.settingBorder]}>
        <Text style={[styles.settingLabel, { color: item.danger ? '#FF3B30' : colors.text }]}>
          {item.label}
        </Text>
        <View style={styles.settingRight}>
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.security')}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: 16 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Security Score Card */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>SECURITY SCORE</Text>
        </View>
        <View style={[styles.scoreCard, dynamicStyles.card]}>
          <View style={styles.scoreCardContent}>
            <View style={[styles.scoreCircle, { borderColor: securityColor }]}>
              <Text style={[styles.scoreValueText, { color: securityColor }]}>{securityScore}%</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreTitle, dynamicStyles.text]}>Security Level</Text>
              <View style={[styles.scoreBadge, { backgroundColor: securityColor + '15' }]}>
                <MaterialCommunityIcons 
                  name={securityScore >= 60 ? 'shield-check' : 'shield-alert'} 
                  size={16} 
                  color={securityColor} 
                />
                <Text style={[styles.scoreBadgeText, { color: securityColor }]}>{securityLevel}</Text>
              </View>
              <Text style={[styles.scoreHint, dynamicStyles.textSecondary]}>
                {securityScore < 100 ? 'Enable more options to improve' : 'Maximum protection enabled'}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
              <View style={[styles.progressFill, { width: `${securityScore}%`, backgroundColor: securityColor }]} />
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>SECURITY SETTINGS</Text>
        </View>
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          {securitySettings.map((item, index) =>
            renderToggleItem(item, index === securitySettings.length - 1)
          )}
        </View>

        {/* Account Security */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>ACCOUNT SECURITY</Text>
        </View>
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          {accountOptions.map((item, index) =>
            renderOptionItem(item, index === accountOptions.length - 1)
          )}
        </View>

        {/* Activity & Devices */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>ACTIVITY & DEVICES</Text>
        </View>
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          {activityOptions.map((item, index) =>
            renderOptionItem(item, index === activityOptions.length - 1)
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>DANGER ZONE</Text>
        </View>
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          {dangerOptions.map((item, index) =>
            renderOptionItem(item, index === dangerOptions.length - 1)
          )}
        </View>

        {/* Security Tip */}
        <View style={[styles.tipCard, dynamicStyles.card]}>
          <View style={styles.tipIconContainer}>
            <MaterialCommunityIcons name="lightbulb-on" size={22} color="#FFD60A" />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, dynamicStyles.text]}>Security Tip</Text>
            <Text style={[styles.tipText, dynamicStyles.textSecondary]}>
              Enable two-factor authentication for the best protection against unauthorized access.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={showChangePinModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              setShowChangePinModal(false);
              setCurrentPin('');
              setNewPin('');
              setConfirmPin('');
              setPinStep('current');
              setPinError('');
            }}
          />
          <View style={[styles.modalContent, dynamicStyles.card, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalDragHandle} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowChangePinModal(false);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                  setPinStep('current');
                  setPinError('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, dynamicStyles.text]}>Change PIN</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Icon */}
            <View style={styles.pinIconContainer}>
              <MaterialCommunityIcons name="dialpad" size={32} color="#16A34A" />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, pinStep === 'current' && styles.stepDotActive]} />
              <View style={[styles.stepLine, pinStep !== 'current' && styles.stepLineActive]} />
              <View style={[styles.stepDot, pinStep === 'new' && styles.stepDotActive]} />
              <View style={[styles.stepLine, pinStep === 'confirm' && styles.stepLineActive]} />
              <View style={[styles.stepDot, pinStep === 'confirm' && styles.stepDotActive]} />
            </View>

            {/* Step Title */}
            <Text style={[styles.pinStepTitle, dynamicStyles.text]}>
              {pinStep === 'current' ? 'Enter Current PIN' : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN'}
            </Text>
            <Text style={[styles.pinStepDescription, dynamicStyles.textSecondary]}>
              {pinStep === 'current' 
                ? 'Enter your current 4-digit PIN to continue'
                : pinStep === 'new'
                ? 'Create a new 4-digit PIN'
                : 'Re-enter your new PIN to confirm'}
            </Text>

            {/* PIN Input */}
            <View style={styles.pinInputContainer}>
              <RNTextInput
                style={[styles.pinInput, dynamicStyles.text, { borderColor: pinError ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB') }]}
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
                value={pinStep === 'current' ? currentPin : pinStep === 'new' ? newPin : confirmPin}
                onChangeText={(text: string) => {
                  const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setPinError('');
                  if (pinStep === 'current') {
                    setCurrentPin(numericText);
                  } else if (pinStep === 'new') {
                    setNewPin(numericText);
                  } else {
                    setConfirmPin(numericText);
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus
              />
            </View>

            {/* Error Message */}
            {pinError ? (
              <Text style={styles.pinErrorText}>{pinError}</Text>
            ) : null}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.pinContinueButton,
                ((pinStep === 'current' && currentPin.length < 4) ||
                  (pinStep === 'new' && newPin.length < 4) ||
                  (pinStep === 'confirm' && confirmPin.length < 4)) && styles.pinContinueButtonDisabled,
              ]}
              onPress={() => {
                if (pinStep === 'current') {
                  // Validate current PIN (demo: 1234)
                  if (currentPin === '1234') {
                    setPinStep('new');
                  } else {
                    setPinError('Incorrect current PIN');
                    setCurrentPin('');
                  }
                } else if (pinStep === 'new') {
                  if (newPin.length === 4) {
                    setPinStep('confirm');
                  }
                } else {
                  // Confirm step
                  if (confirmPin === newPin) {
                    setIsChangingPin(true);
                    // Simulate PIN change
                    setTimeout(() => {
                      setIsChangingPin(false);
                      setShowChangePinModal(false);
                      setCurrentPin('');
                      setNewPin('');
                      setConfirmPin('');
                      setPinStep('current');
                      Alert.alert('Success', 'Your PIN has been changed successfully');
                    }, 1500);
                  } else {
                    setPinError('PINs do not match');
                    setConfirmPin('');
                  }
                }
              }}
              disabled={
                isChangingPin ||
                (pinStep === 'current' && currentPin.length < 4) ||
                (pinStep === 'new' && newPin.length < 4) ||
                (pinStep === 'confirm' && confirmPin.length < 4)
              }
            >
              {isChangingPin ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.pinContinueText}>
                  {pinStep === 'confirm' ? 'Change PIN' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back Button for steps */}
            {pinStep !== 'current' && (
              <TouchableOpacity
                style={styles.pinBackButton}
                onPress={() => {
                  if (pinStep === 'new') {
                    setPinStep('current');
                    setNewPin('');
                  } else {
                    setPinStep('new');
                    setConfirmPin('');
                  }
                  setPinError('');
                }}
              >
                <Text style={styles.pinBackText}>Go Back</Text>
              </TouchableOpacity>
            )}

            {/* Forgot PIN Link - only shown on current PIN step */}
            {pinStep === 'current' && (
              <TouchableOpacity
                style={styles.forgotPinLink}
                onPress={() => {
                  setShowChangePinModal(false);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                  setPinStep('current');
                  setPinError('');
                  (navigation as any).navigate('ResetPin');
                }}
              >
                <Ionicons name="help-circle-outline" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.forgotPinText}>Forgot your PIN?</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.18)',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  floatingBackButton: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
    paddingBottom: SPACING.sm,
  },
  sectionHeaderTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  sectionSubHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
    marginTop: SPACING.lg,
  },
  sectionSubHeaderTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scoreCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  scoreValueText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 6,
  },
  scoreBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  scoreHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  settingsCard: {
    borderRadius: 16,
    marginBottom: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    minHeight: 56,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: SPACING.md,
    marginLeft: SPACING.md,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: SPACING.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  // Change PIN Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.md,
  },
  modalDragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 67, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  pinIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: '#16A34A',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#16A34A',
  },
  pinStepTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  pinStepDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinInputContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pinInput: {
    width: 140,
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  pinErrorText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  pinContinueButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pinContinueButtonDisabled: {
    backgroundColor: '#BBF7D0',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  pinContinueText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  pinBackButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  pinBackText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#16A34A',
  },
  forgotPinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  forgotPinText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#16A34A',
  },
});
