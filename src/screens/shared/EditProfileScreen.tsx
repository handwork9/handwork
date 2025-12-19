import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  TextInput as RNTextInput,
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';

// FloatingInput Component for Edit Modal
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  iconColor?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChangeText,
  icon,
  iconColor = '#16A34A',
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
}) => {
  const { colors, isDark } = useTheme();
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
    <View style={floatingStyles.container}>
      <View style={floatingStyles.inputRow}>
        <View style={floatingStyles.inputContent}>
          <Animated.Text style={[labelStyle, { fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif' }]}>
            {label}
          </Animated.Text>
          <RNTextInput
            style={[
              floatingStyles.input,
              { color: colors.text },
              multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            autoCorrect={false}
            placeholderTextColor="transparent"
            multiline={multiline}
            numberOfLines={numberOfLines}
            autoFocus={autoFocus}
          />
        </View>
        {icon && (
          <View style={floatingStyles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={22}
              color={isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
            />
          </View>
        )}
      </View>
      <View style={[floatingStyles.underline, isFocused && floatingStyles.underlineFocused]} />
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  inputContent: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  iconContainer: {
    marginLeft: 12,
  },
  underline: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  underlineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
});

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

  React.useEffect(() => {
    if (field) {
      setValue(field.value);
    }
  }, [field]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  if (!field) return null;

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Floating Cancel Button */}
        <TouchableOpacity 
          style={[styles.modalFloatingCancel, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Floating Save Button */}
        <TouchableOpacity 
          style={styles.modalFloatingSave}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.modalFloatingSaveText}>Save</Text>
        </TouchableOpacity>

        {/* Modal Title */}
        <View style={styles.modalTitleContainer}>
          <Text style={[styles.modalTitleLarge, { color: colors.text }]}>{field.label}</Text>
        </View>

        <View style={styles.modalContent}>
          <FloatingInput
            label={field.label}
            value={value}
            onChangeText={setValue}
            icon={field.icon}
            iconColor={field.iconColor}
            placeholder={field.placeholder}
            keyboardType={field.keyboardType}
            multiline={field.multiline}
            numberOfLines={field.multiline ? 4 : 1}
            autoFocus
          />
          
          <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
            Enter your {field.label.toLowerCase()} above
          </Text>
        </View>
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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EditField | null>(null);

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
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
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
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
      const updateData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        avatar: avatar || undefined,
      };

      // Call backend API to update profile
      const response = await authService.updateProfile(updateData);
      
      if (response.success) {
        // Update local Redux state
        dispatch(updateUser(updateData));
        
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
        onPress={handleDiscard}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Floating Save Button */}
      <TouchableOpacity
        style={[
          styles.floatingSaveButton, 
          { top: insets.top + 10 },
          !hasChanges && styles.floatingSaveButtonDisabled
        ]}
        onPress={handleSave}
        activeOpacity={0.7}
        disabled={!hasChanges || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.floatingSaveText}>Save</Text>
        )}
      </TouchableOpacity>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 70 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Update your personal information</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#16A34A' }]}>
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
            <Text style={styles.changePhotoText}>
              Change Photo
            </Text>
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
              <View style={styles.verifiedBadge}>
                <Ionicons 
                  name={user?.isPhoneVerified ? 'checkmark-circle' : 'close-circle'} 
                  size={18} 
                  color={user?.isPhoneVerified ? '#16A34A' : '#EF4444'} 
                />
                <Text style={{ color: user?.isPhoneVerified ? '#16A34A' : '#EF4444', fontSize: 14, fontWeight: '500' }}>
                  {user?.isPhoneVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delete Account */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }]}
            onPress={() => (navigation as any).navigate('DeleteAccount')}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

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
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingSaveButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingSaveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  floatingSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  pageTitleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
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
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F2F2F7',
  },
  changePhotoText: {
    fontSize: 15,
    color: '#16A34A',
    marginTop: 12,
    fontFamily: FONTS.semiBold,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: FONTS.semiBold,
  },
  fieldItem: {
    marginBottom: 20,
  },
  fieldContent: {
    paddingBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#16A34A',
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: FONTS.regular,
  },
  fieldValueEmpty: {
    color: '#9CA3AF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontFamily: FONTS.medium,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
  },
  roleText: {
    fontSize: 14,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalFloatingCancel: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalFloatingSave: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
    zIndex: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalFloatingSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  modalTitleContainer: {
    paddingTop: 80,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitleLarge: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalHint: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.sm,
    fontFamily: FONTS.regular,
  },
});
