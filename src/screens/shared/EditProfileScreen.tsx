import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import apiClient from '../../services/apiClient';

interface EditField {
  key: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}

interface EditModalProps {
  visible: boolean;
  field: EditField | null;
  onClose: () => void;
  onSave: (value: string) => void;
}

function EditModal({ visible, field, onClose, onSave }: EditModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(field?.value || '');
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(field?.value ? 1 : 0)).current;

  useEffect(() => {
    if (field) {
      setValue(field.value);
      labelAnim.setValue(field.value ? 1 : 0);
    }
  }, [field]);

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  if (!field) return null;

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 14],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    fontFamily: FONTS.medium,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Edit {field.label}</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Update your {field.label.toLowerCase()}
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={labelStyle}>
                {field.label}
              </Animated.Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text },
                  field.multiline && { height: 100, textAlignVertical: 'top' },
                ]}
                value={value}
                onChangeText={setValue}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType={field.keyboardType}
                autoCorrect={false}
                multiline={field.multiline}
                autoFocus
              />
            </View>
            <View style={[
              styles.inputLine,
              isFocused && styles.inputLineFocused,
              { backgroundColor: isFocused ? COLORS.primary : isDark ? '#3C3C3E' : '#E5E7EB' },
            ]} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EditField | null>(null);

  // Sync local state with user prop when it changes (e.g., profile refresh from server)
  useEffect(() => {
    if (user) {
      // Only update if user has an avatar and local avatar is different
      if (user.avatar && user.avatar !== avatar && !avatar?.startsWith('file://')) {
        setAvatar(user.avatar);
      }
      // Sync other fields too
      if (user.name && user.name !== name) setName(user.name);
      if (user.email && user.email !== email) setEmail(user.email);
      if (user.phone && user.phone !== phone) setPhone(user.phone);
      if (user.address && user.address !== address) setAddress(user.address);
      if (user.city && user.city !== city) setCity(user.city);
      if (user.state && user.state !== state) setState(user.state);
    }
  }, [user?.avatar, user?.name, user?.email, user?.phone, user?.address, user?.city, user?.state]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Send OTP for phone verification
  const handleSendOtp = async () => {
    if (!user?.phone) {
      Alert.alert('Error', 'Please add a phone number first');
      return;
    }
    
    setIsSendingOtp(true);
    try {
      const response = await authService.sendOTP(user.phone);
      if (response.success && response.data?.otpId) {
        setOtpId(response.data.otpId);
        setShowOtpModal(true);
        setOtpCountdown(60);
        Alert.alert('Success', 'OTP sent to your phone number');
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    if (!otpId) {
      Alert.alert('Error', 'Please request a new OTP');
      return;
    }
    
    setIsVerifying(true);
    try {
      const response = await authService.verifyOTP(otpId, otp);
      if (response.success) {
        // Update user in store
        dispatch(updateUser({ isPhoneVerified: true }));
        setShowOtpModal(false);
        setOtp('');
        setOtpId('');
        Alert.alert('Success', 'Phone number verified successfully!');
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const hasChanges = 
    name !== (user?.name || '') ||
    email !== (user?.email || '') ||
    phone !== (user?.phone || '') ||
    address !== (user?.address || '') ||
    city !== (user?.city || '') ||
    state !== (user?.state || '') ||
    avatar !== (user?.avatar || null);

  const personalFields: EditField[] = [
    {
      key: 'name',
      label: 'Full Name',
      value: name,
      icon: 'person',
      iconColor: '#007AFF',
      placeholder: 'Enter your full name',
    },
    {
      key: 'email',
      label: 'Email Address',
      value: email,
      icon: 'mail',
      iconColor: '#5856D6',
      placeholder: 'Enter your email',
      keyboardType: 'email-address',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      value: phone,
      icon: 'call',
      iconColor: '#34C759',
      placeholder: 'Enter your phone number',
      keyboardType: 'phone-pad',
    },
  ];

  // Address fields - shown for farmers (farm address) and riders (delivery base)
  const addressFields: EditField[] = user?.role === 'farmer' || user?.role === 'rider' ? [
    {
      key: 'address',
      label: user?.role === 'farmer' ? 'Farm Address' : 'Base Address',
      value: address,
      icon: 'location',
      iconColor: '#FF9500',
      placeholder: user?.role === 'farmer' ? 'Enter your farm address' : 'Enter your base address',
    },
    {
      key: 'city',
      label: 'City',
      value: city,
      icon: 'business',
      iconColor: '#5856D6',
      placeholder: 'Enter city',
    },
    {
      key: 'state',
      label: 'State',
      value: state,
      icon: 'map',
      iconColor: '#007AFF',
      placeholder: 'Enter state',
    },
  ] : [];

  const handleFieldPress = (field: EditField) => {
    setEditingField(field);
    setModalVisible(true);
  };

  const handleFieldSave = (value: string) => {
    if (!editingField) return;
    
    switch (editingField.key) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhone(value); break;
      case 'address': setAddress(value); break;
      case 'city': setCity(value); break;
      case 'state': setState(value); break;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      exif: false,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('Selected image:', JSON.stringify(result.assets[0]));
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      exif: false,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('Captured image:', JSON.stringify(result.assets[0]));
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        avatar ? { text: 'Remove Photo', onPress: () => setAvatar(null), style: 'destructive' } : null,
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = avatar;

      // If avatar is a local file URI, upload it first
      if (avatar && avatar.startsWith('file://')) {
        try {
          console.log('Uploading avatar from:', avatar);
          
          // Get file info to check size
          const fileInfo = await FileSystem.getInfoAsync(avatar);
          console.log('File info:', JSON.stringify(fileInfo));
          
          if (!fileInfo.exists) {
            throw new Error('Image file not found');
          }
          
          let base64: string;
          
          // Read file as base64 with fallback
          if (FileSystem.EncodingType?.Base64) {
            base64 = await FileSystem.readAsStringAsync(avatar, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } else {
            // Fallback using fetch and FileReader
            const response = await fetch(avatar);
            const blob = await response.blob();
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1] || result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
          
          console.log('Base64 length:', base64.length);
          
          // Detect MIME type from file extension or default to jpeg
          const extension = avatar.split('.').pop()?.toLowerCase() || 'jpg';
          let mimeType = 'image/jpeg';
          if (extension === 'png') mimeType = 'image/png';
          else if (extension === 'gif') mimeType = 'image/gif';
          else if (extension === 'webp') mimeType = 'image/webp';
          else if (extension === 'heic' || extension === 'heif') mimeType = 'image/jpeg'; // Will be converted by expo
          
          console.log('MIME type:', mimeType, 'Extension:', extension);
          
          // Upload to server
          const uploadResponse = await apiClient.post<{ success: boolean; data: { url: string; filename: string; size: number } }>('/uploads/image', {
            base64: `data:${mimeType};base64,${base64}`,
            folder: 'avatars',
          });
          
          console.log('Upload response:', JSON.stringify(uploadResponse));
          
          // Backend wraps responses with { success: true, data: {...} }
          avatarUrl = uploadResponse?.data?.url || uploadResponse?.url || (uploadResponse as any)?.url;
          
          console.log('Avatar URL:', avatarUrl);
          
          if (!avatarUrl) {
            throw new Error('No URL in upload response');
          }
        } catch (uploadError: any) {
          console.error('Avatar upload error:', uploadError);
          console.error('Error details:', JSON.stringify(uploadError.response?.data || uploadError.message));
          Alert.alert('Warning', `Failed to upload profile picture: ${uploadError.response?.data?.message || uploadError.message || 'Unknown error'}`);
          avatarUrl = user?.avatar; // Keep existing avatar
        }
      }

      const updateData: any = {
        name: name.trim(),
      };
      
      // Only include fields that have values
      if (email.trim()) updateData.email = email.trim();
      if (address.trim()) updateData.address = address.trim();
      if (city.trim()) updateData.city = city.trim();
      if (state.trim()) updateData.state = state.trim();
      if (avatarUrl) updateData.avatar = avatarUrl;

      // Geocode address to get coordinates for farmers and riders
      if ((user?.role === 'farmer' || user?.role === 'rider') && (address.trim() || city.trim() || state.trim())) {
        try {
          const fullAddress = [address.trim(), city.trim(), state.trim(), 'Nigeria'].filter(Boolean).join(', ');
          console.log('Geocoding address:', fullAddress);
          
          const geocodeResults = await Location.geocodeAsync(fullAddress);
          if (geocodeResults.length > 0) {
            const { latitude, longitude } = geocodeResults[0];
            updateData.latitude = latitude;
            updateData.longitude = longitude;
            console.log('Geocoded coordinates:', { latitude, longitude });
          } else {
            console.log('No geocode results found for address');
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Continue without coordinates - don't block the save
        }
      }

      console.log('Updating profile with:', JSON.stringify(updateData));

      // Call backend API to update profile
      const response = await authService.updateProfile(updateData);
      
      console.log('Profile update response:', JSON.stringify(response));
      
      if (response.success) {
        // Update local Redux state with the server response data (which includes avatar URL)
        // If server returns full user data, use it; otherwise use our update data
        const updatedUserData = response.data || updateData;
        dispatch(updateUser(updatedUserData));
        
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderFieldItem = (field: EditField, isLast: boolean) => (
    <TouchableOpacity
      key={field.key}
      style={styles.fieldItem}
      onPress={() => handleFieldPress(field)}
      activeOpacity={0.6}
    >
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text 
          style={[styles.fieldValue, { color: field.value ? colors.text : (isDark ? '#6B7280' : '#9CA3AF') }]}
          numberOfLines={1}
        >
          {field.value || 'Not set'}
        </Text>
      </View>
      <View style={[styles.fieldLine, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]} />
      <View style={styles.fieldIconRight}>
        <Ionicons name={field.icon} size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={handleDiscard}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.headerSaveButton,
            !hasChanges && styles.headerSaveButtonDisabled
          ]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Update your personal information
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.avatarText}>
                    {name.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraButton, { borderColor: isDark ? colors.background : '#F2F2F7' }]}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          </View>
          {personalFields.map((field, index) =>
            renderFieldItem(field, index === personalFields.length - 1)
          )}
        </View>

        {/* Address Information - for farmers and riders */}
        {addressFields.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {user?.role === 'farmer' ? 'Farm Location' : 'Base Location'}
              </Text>
            </View>
            {addressFields.map((field, index) =>
              renderFieldItem(field, index === addressFields.length - 1)
            )}
          </View>
        )}

        {/* Account Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Info</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.border : '#F3F4F6' }]}>
              <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Member Since</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.border : '#F3F4F6' }]}>
              <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Account Type</Text>
              <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7' }]}>
                <Text style={styles.roleText}>
                  {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1) || 'User'}
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Phone Verified</Text>
              <View style={styles.verifiedBadgeRow}>
                <View style={styles.verifiedBadge}>
                  <Ionicons 
                    name={user?.isPhoneVerified ? 'checkmark-circle' : 'close-circle'} 
                    size={18} 
                    color={user?.isPhoneVerified ? COLORS.primary : '#EF4444'} 
                  />
                  <Text style={{ color: user?.isPhoneVerified ? COLORS.primary : '#EF4444', fontSize: 14, fontFamily: FONTS.medium }}>
                    {user?.isPhoneVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
                {!user?.isPhoneVerified && user?.phone && (
                  <TouchableOpacity
                    style={styles.verifyNowButton}
                    onPress={handleSendOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.verifyNowText}>Verify Now</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Delete Account */}
        <View style={[styles.section, { marginTop: SPACING.md }]}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }]}
            onPress={() => (navigation as any).navigate('DeleteAccount')}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.otpModalOverlay}
        >
          <View style={[styles.otpModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.otpModalHandle} />
            
            <View style={styles.otpModalHeader}>
              <Text style={[styles.otpModalTitle, { color: colors.text }]}>Verify Phone Number</Text>
              <TouchableOpacity onPress={() => { setShowOtpModal(false); setOtp(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.otpModalSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter the 6-digit code sent to {user?.phone}
            </Text>
            
            <View style={[styles.otpInputContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
              <TextInput
                style={[styles.otpInput, { color: colors.text }]}
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                autoFocus
              />
            </View>
            
            <TouchableOpacity
              style={[styles.otpVerifyButton, otp.length !== 6 && styles.otpVerifyButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.otpVerifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.otpResendButton}
              onPress={handleSendOtp}
              disabled={otpCountdown > 0 || isSendingOtp}
            >
              <Text style={[styles.otpResendText, { color: otpCountdown > 0 ? '#9CA3AF' : '#16A34A' }]}>
                {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <EditModal
        visible={modalVisible}
        field={editingField}
        onClose={() => setModalVisible(false)}
        onSave={handleFieldSave}
      />
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
  headerSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  headerSaveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  titleContainer: {
    marginBottom: SPACING.xl,
  },
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontFamily: FONTS.semiBold,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  fieldItem: {
    marginBottom: SPACING.lg,
  },
  fieldContent: {
    paddingBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: FONTS.medium,
  },
  fieldValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  fieldLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 30,
  },
  fieldIconRight: {
    position: 'absolute',
    right: 0,
    bottom: 10,
  },
  infoCard: {
    borderRadius: 14,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyNowButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  verifyNowText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  // OTP Modal styles
  otpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  otpModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
    paddingTop: 12,
  },
  otpModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpModalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  otpModalSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.lg,
  },
  otpInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  otpInput: {
    fontSize: 24,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  otpVerifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  otpVerifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  otpVerifyButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  otpResendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  otpResendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  // Edit Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  modalScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
  },
  inputLine: {
    height: 1,
  },
  inputLineFocused: {
    height: 2,
  },
});
