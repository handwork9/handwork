import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import * as Location from 'expo-location';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress,
  Address 
} from '../../store/slices/addressSlice';

// FloatingInput Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  icon?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  autoFocus?: boolean;
}

const FloatingInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  icon,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  autoFocus = false,
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
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', error ? '#EF4444' : '#16A34A'],
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
          <TextInput
            style={[
              floatingStyles.floatingInput,
              { color: colors.text },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            autoFocus={autoFocus}
          />
        </View>
        {icon && (
          <View style={floatingStyles.inputIcons}>
            <Ionicons
              name={icon as any}
              size={20}
              color={error ? '#EF4444' : isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
            />
          </View>
        )}
      </View>
      <View style={[floatingStyles.inputLine, isFocused && floatingStyles.inputLineFocused, error && floatingStyles.inputLineError]} />
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
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    paddingVertical: 0,
    paddingTop: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  inputLine: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
  },
  inputLineFocused: {
    backgroundColor: '#16A34A',
    height: 2,
  },
  inputLineError: {
    backgroundColor: '#EF4444',
    height: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});

type EditField = 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'postalCode' | 'country' | null;

export default function MyAddressScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const dispatch = useAppDispatch();
  const addresses = useAppSelector((state) => state.address.addresses);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [expandedAddressId, setExpandedAddressId] = useState<string | null>(null);

  // Form state for new address
  const [newAddress, setNewAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get current location and reverse geocode
  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access to use this feature.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Reverse geocode to get address
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        // Build street address from available fields
        const streetParts = [
          geocode.streetNumber,
          geocode.street,
        ].filter(Boolean);
        
        const streetAddress = streetParts.length > 0 
          ? streetParts.join(' ') 
          : geocode.name || geocode.district || '';

        setNewAddress({
          ...newAddress,
          addressLine1: streetAddress,
          addressLine2: geocode.district || geocode.subregion || '',
          city: geocode.city || geocode.subregion || geocode.district || '',
          state: geocode.region || '',
          postalCode: geocode.postalCode || '',
          country: geocode.country || 'Nigeria',
        });
      } else {
        Alert.alert('Location Error', 'Could not determine your address. Please enter it manually.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleEditField = (address: Address, field: EditField) => {
    setEditingAddress(address);
    setEditField(field);
    if (field) {
      setEditValue(address[field] || '');
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSaveField = () => {
    if (!editingAddress || !editField) return;

    const updatedAddress = { ...editingAddress, [editField]: editValue };
    dispatch(updateAddress(updatedAddress));

    setEditField(null);
    setEditingAddress(null);
    setEditValue('');
  };

  const handleSetDefault = (id: string) => {
    dispatch(setDefaultAddress(id));
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteAddress(id)),
        },
      ]
    );
  };

  const handleAddAddress = () => {
    if (!newAddress.addressLine1 || !newAddress.city || !newAddress.state) {
      Alert.alert('Missing Information', 'Please fill in the required fields.');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      ...newAddress,
      isDefault: addresses.length === 0,
    };

    dispatch(addAddress(address));
    setShowAddModal(false);
    setNewAddress({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
    });
  };

  const renderAddressCard = (address: Address) => {
    const isExpanded = expandedAddressId === address.id;

    const toggleExpand = () => {
      setExpandedAddressId(isExpanded ? null : address.id);
    };

    const renderFieldItem = (
      label: string,
      value: string | undefined,
      field: EditField,
      icon: string,
      isLast: boolean = false
    ) => (
      <TouchableOpacity
        key={field}
        style={styles.fieldItem}
        onPress={() => handleEditField(address, field)}
        activeOpacity={0.7}
      >
        <View style={styles.fieldContent}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.fieldValue, { color: value ? colors.text : colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {value || 'Not set'}
          </Text>
        </View>
        <View style={styles.fieldLine} />
        <View style={styles.fieldIconRight}>
          <Ionicons name={icon as any} size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );

    return (
      <View
        key={address.id}
        style={[
          styles.addressCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
        ]}
      >
        {/* Header Row - Tappable to expand/collapse */}
        <TouchableOpacity 
          style={styles.addressHeaderRow}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View style={[styles.addressIconBg, { backgroundColor: '#16A34A' }]}>
            <Ionicons name="location" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.addressHeaderInfo}>
            <View style={styles.labelRow}>
              <Text style={[styles.addressLabel, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                {address.addressLine1}
              </Text>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={[styles.addressPreview, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {address.city}, {address.state}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* Expandable Content */}
        {isExpanded && (
          <>
            {/* Address Fields */}
            <View style={styles.fieldsContainer}>
              {renderFieldItem('Street Address', address.addressLine1, 'addressLine1', 'location-outline')}
              {renderFieldItem('Apt/Suite', address.addressLine2, 'addressLine2', 'cube-outline')}
              {renderFieldItem('City', address.city, 'city', 'storefront-outline')}
              {renderFieldItem('State', address.state, 'state', 'map-outline')}
              {renderFieldItem('Postal Code', address.postalCode, 'postalCode', 'keypad-outline')}
              {renderFieldItem('Country', address.country, 'country', 'globe-outline', true)}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {!address.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(address.id)}
                >
                  <Ionicons name="star-outline" size={18} color="#16A34A" />
                  <Text style={[styles.actionText, { color: '#16A34A' }]}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(address.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingAddButton, { top: insets.top + 10 }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.floatingAddButtonText}>Add</Text>
      </TouchableOpacity>

      {/* Page Title */}
      <View style={[styles.pageTitleContainer, { marginTop: insets.top + 70 }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>My Addresses</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Manage your delivery addresses
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Addresses Section */}
        {addresses.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SAVED ADDRESSES</Text>
            {addresses.map(renderAddressCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name="location-outline" size={48} color="#16A34A" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No addresses yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add your delivery addresses for faster checkout
            </Text>
          </View>
        )}

        {/* Add New Address Button */}
        <TouchableOpacity
          style={[styles.addNewButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => setShowAddModal(true)}
        >
          <View style={[styles.addIconBg, { backgroundColor: '#16A34A' }]}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.addNewText, { color: '#16A34A' }]}>Add New Address</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="information-circle" size={20} color="#16A34A" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your default address will be used for deliveries unless you select another during checkout.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Field Modal */}
      <Modal
        visible={editField !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setEditField(null);
          setEditingAddress(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
        >
          {/* Floating Cancel Button */}
          <TouchableOpacity 
            style={[styles.modalFloatingCancel, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={() => { setEditField(null); setEditingAddress(null); }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Floating Save Button */}
          <TouchableOpacity 
            style={styles.modalFloatingSave}
            onPress={handleSaveField}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.modalFloatingSaveText}>Save</Text>
          </TouchableOpacity>

          {/* Modal Title */}
          <View style={styles.modalTitleContainer}>
            <Text style={[styles.modalTitleLarge, { color: colors.text }]}>
              {editField === 'addressLine1' && 'Street Address'}
              {editField === 'addressLine2' && 'Apt/Suite'}
              {editField === 'city' && 'City'}
              {editField === 'state' && 'State'}
              {editField === 'postalCode' && 'Postal Code'}
              {editField === 'country' && 'Country'}
            </Text>
          </View>

          <View style={styles.modalContent}>
            <FloatingInput
              label={
                editField === 'addressLine1' ? 'Street Address' :
                editField === 'addressLine2' ? 'Apt/Suite' :
                editField === 'city' ? 'City' :
                editField === 'state' ? 'State' :
                editField === 'postalCode' ? 'Postal Code' : 'Country'
              }
              value={editValue}
              onChangeText={setEditValue}
              icon={
                editField === 'addressLine1' ? 'location-outline' :
                editField === 'addressLine2' ? 'cube-outline' :
                editField === 'city' ? 'storefront-outline' :
                editField === 'state' ? 'map-outline' :
                editField === 'postalCode' ? 'keypad-outline' : 'globe-outline'
              }
              keyboardType={editField === 'postalCode' ? 'numeric' : 'default'}
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
        >
          {/* Floating Cancel Button */}
          <TouchableOpacity 
            style={[styles.modalFloatingCancel, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={() => setShowAddModal(false)}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Floating Add Button */}
          <TouchableOpacity 
            style={styles.modalFloatingSave}
            onPress={handleAddAddress}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.modalFloatingSaveText}>Add</Text>
          </TouchableOpacity>

          {/* Modal Title */}
          <View style={styles.modalTitleContainer}>
            <Text style={[styles.modalTitleLarge, { color: colors.text }]}>New Address</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Add a new delivery address
            </Text>
          </View>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Use Current Location Button */}
            <TouchableOpacity 
              style={[styles.useLocationButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
              activeOpacity={0.7}
            >
              <View style={styles.useLocationIconContainer}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <Ionicons name="navigate" size={22} color="#16A34A" />
                )}
              </View>
              <View style={styles.useLocationTextContainer}>
                <Text style={[styles.useLocationTitle, { color: colors.text }]}>
                  {locationLoading ? 'Getting location...' : 'Use your current location'}
                </Text>
                <Text style={[styles.useLocationSubtitle, { color: colors.textSecondary }]}>
                  Auto-fill address using GPS
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Address Details */}
            <Text style={[styles.formSectionTitle, { color: colors.text }]}>Address Details</Text>
            
            <FloatingInput
              label="Street Address *"
              value={newAddress.addressLine1}
              onChangeText={(text) => setNewAddress({ ...newAddress, addressLine1: text })}
              icon="location-outline"
            />
            
            <FloatingInput
              label="Apt/Suite (optional)"
              value={newAddress.addressLine2}
              onChangeText={(text) => setNewAddress({ ...newAddress, addressLine2: text })}
              icon="cube-outline"
            />
            
            <FloatingInput
              label="City *"
              value={newAddress.city}
              onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
              icon="storefront-outline"
            />
            
            <FloatingInput
              label="State *"
              value={newAddress.state}
              onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
              icon="map-outline"
            />
            
            <FloatingInput
              label="Postal Code"
              value={newAddress.postalCode}
              onChangeText={(text) => setNewAddress({ ...newAddress, postalCode: text })}
              icon="keypad-outline"
              keyboardType="numeric"
            />
            
            <FloatingInput
              label="Country"
              value={newAddress.country}
              onChangeText={(text) => setNewAddress({ ...newAddress, country: text })}
              icon="globe-outline"
            />

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  floatingAddButton: {
    position: 'absolute',
    right: 16,
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
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  addressCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addressIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  addressPreview: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  fieldsContainer: {
    paddingHorizontal: 16,
  },
  fieldItem: {
    paddingVertical: 14,
  },
  fieldContent: {
    flex: 1,
    paddingRight: 36,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  fieldLine: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fieldIconRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  deleteButton: {},
  actionText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    fontFamily: FONTS.semiBold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
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
  modalSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  useLocationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  useLocationTextContainer: {
    flex: 1,
  },
  useLocationTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  useLocationSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  formSectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontFamily: FONTS.semiBold,
  },
  labelOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  labelOptionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labelOptionCardSelected: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  labelOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelOptionIconSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  labelOptionText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  labelOptionTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  labelCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
