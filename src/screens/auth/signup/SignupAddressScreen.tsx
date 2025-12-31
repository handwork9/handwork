import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TextInput as RNTextInput,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { MAP_CONFIG } from '../../../constants/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupAddress'>;

// Nigerian States and Cities
const NIGERIAN_STATES: { [key: string]: string[] } = {
  'Abia': ['Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende'],
  'Adamawa': ['Yola', 'Mubi', 'Jimeta', 'Numan', 'Ganye'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum'],
  'Bayelsa': ['Yenagoa', 'Ogbia', 'Sagbama', 'Brass', 'Nembe'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya'],
  'Borno': ['Maiduguri', 'Biu', 'Bama', 'Dikwa', 'Gwoza'],
  'Cross River': ['Calabar', 'Ogoja', 'Ikom', 'Obudu', 'Ugep'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Edda', 'Ezza'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua'],
  'Ekiti': ['Ado-Ekiti', 'Ikere', 'Oye', 'Ikole', 'Ijero'],
  'Enugu': ['Enugu', 'Nsukka', 'Agbani', 'Udi', 'Oji River'],
  'FCT': ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kwali'],
  'Gombe': ['Gombe', 'Billiri', 'Kaltungo', 'Bajoga', 'Dukku'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise'],
  'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Ringim'],
  'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Zonkwa'],
  'Kano': ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Bichi'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Kankia'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Jega'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Ankpa'],
  'Kwara': ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba', 'Lafiagi'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Lekki', 'Victoria Island', 'Ikoyi', 'Surulere', 'Yaba', 'Ajah', 'Festac', 'Ikorodu'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Doma'],
  'Niger': ['Minna', 'Bida', 'Suleja', 'Kontagora', 'New Bussa'],
  'Ogun': ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota', 'Ilaro'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Ikare', 'Okitipupa'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo'],
  'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Langtang'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Degema', 'Okrika'],
  'Sokoto': ['Sokoto', 'Wamakko', 'Bodinga', 'Tambuwal', 'Goronyo'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Takum', 'Gembu'],
  'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Bungudu'],
};

const STATES = Object.keys(NIGERIAN_STATES).sort();

type AddressMode = 'manual' | 'search';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function SignupAddressScreen({ navigation, route }: Props) {
  const { role, email, phone, password, firstName, lastName, nationality, nationalityCode } = route.params;
  
  const [addressMode, setAddressMode] = useState<AddressMode>('manual');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{state?: string; city?: string; address?: string}>({});
  const [stateFocused, setStateFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  
  // Location coordinates
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const addressInputRef = useRef<RNTextInput>(null);
  const searchInputRef = useRef<RNTextInput>(null);
  
  const addressAnimValue = useRef(new Animated.Value(0)).current;

  // Get user's current location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsGettingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
          console.log('[SignupAddress] Got location:', location.coords.latitude, location.coords.longitude);
        }
      } catch (error) {
        console.log('[SignupAddress] Error getting location:', error);
      } finally {
        setIsGettingLocation(false);
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(addressAnimValue, {
      toValue: addressFocused || streetAddress ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [addressFocused, streetAddress]);

  useEffect(() => {
    if (state && NIGERIAN_STATES[state]) {
      setAvailableCities(NIGERIAN_STATES[state]);
      setCity('');
    }
  }, [state]);

  // Google Places Autocomplete API search
  const handleSearchAddress = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const apiKey = MAP_CONFIG.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('[SignupAddress] Google Maps API key not configured, using location-based search');
        // Fallback to location-based results when no API key
        await fallbackLocalSearch(query);
        return;
      }

      // Build location bias for Nigeria
      const locationBias = latitude && longitude 
        ? `&location=${latitude},${longitude}&radius=50000`
        : '&location=9.0820,8.6753&radius=500000'; // Center of Nigeria

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&components=country:ng${locationBias}&types=address`;
      
      console.log('[SignupAddress] Fetching places...');
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        const results: PlacePrediction[] = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: {
            main_text: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
            secondary_text: prediction.structured_formatting?.secondary_text || prediction.description.split(',').slice(1).join(','),
          },
        }));
        setSearchResults(results);
      } else if (data.status === 'ZERO_RESULTS') {
        setSearchResults([]);
      } else {
        console.warn('[SignupAddress] Places API error:', data.status, data.error_message);
        // Fallback to local search
        await fallbackLocalSearch(query);
      }
    } catch (error) {
      console.error('[SignupAddress] Error searching address:', error);
      // Fallback to local search on error
      await fallbackLocalSearch(query);
    } finally {
      setIsSearching(false);
    }
  };

  // Fallback search using Nigerian states/cities data
  const fallbackLocalSearch = async (query: string) => {
    const lowerQuery = query.toLowerCase();
    const results: PlacePrediction[] = [];
    
    // Search through Nigerian states and cities
    for (const [stateName, cities] of Object.entries(NIGERIAN_STATES)) {
      // Check if query matches state
      if (stateName.toLowerCase().includes(lowerQuery)) {
        results.push({
          place_id: `state_${stateName}`,
          description: `${stateName} State, Nigeria`,
          structured_formatting: {
            main_text: stateName,
            secondary_text: 'Nigeria',
          },
        });
      }
      
      // Check if query matches cities in this state
      for (const cityName of cities) {
        if (cityName.toLowerCase().includes(lowerQuery)) {
          results.push({
            place_id: `city_${stateName}_${cityName}`,
            description: `${cityName}, ${stateName}, Nigeria`,
            structured_formatting: {
              main_text: cityName,
              secondary_text: `${stateName}, Nigeria`,
            },
          });
        }
      }
      
      if (results.length >= 5) break;
    }
    
    // Add generic address suggestions if query looks like a street
    if (results.length < 3 && query.length >= 3) {
      results.push({
        place_id: `custom_${Date.now()}`,
        description: `${query}, Lagos, Nigeria`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'Lagos, Nigeria',
        },
      });
    }
    
    setSearchResults(results.slice(0, 5));
  };

  const handleSelectPlace = async (place: PlacePrediction) => {
    setSelectedPlace(place);
    setSearchQuery(place.description);
    setSearchResults([]);
    
    // Try to extract state and city from the place description
    const addressParts = place.description.split(',').map(part => part.trim());
    
    // Try to get place details for coordinates if API key is available
    if (MAP_CONFIG.GOOGLE_MAPS_API_KEY && !place.place_id.startsWith('state_') && !place.place_id.startsWith('city_') && !place.place_id.startsWith('custom_')) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,address_components&key=${MAP_CONFIG.GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(detailsUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.result) {
          // Extract coordinates
          if (data.result.geometry?.location) {
            setLatitude(data.result.geometry.location.lat);
            setLongitude(data.result.geometry.location.lng);
            console.log('[SignupAddress] Got place coordinates:', data.result.geometry.location);
          }
          
          // Extract state and city from address components
          if (data.result.address_components) {
            for (const component of data.result.address_components) {
              if (component.types.includes('administrative_area_level_1')) {
                // This is the state
                const stateName = component.long_name.replace(' State', '');
                if (NIGERIAN_STATES[stateName]) {
                  setState(stateName);
                }
              }
              if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                // This is the city
                setCity(component.long_name);
              }
            }
          }
        }
      } catch (error) {
        console.log('[SignupAddress] Error getting place details:', error);
      }
    } else {
      // Extract from local search results
      if (place.place_id.startsWith('state_')) {
        const stateName = place.place_id.replace('state_', '');
        setState(stateName);
      } else if (place.place_id.startsWith('city_')) {
        const parts = place.place_id.replace('city_', '').split('_');
        if (parts.length >= 2) {
          setState(parts[0]);
          setCity(parts[1]);
        }
      }
    }
  };

  const handleContinue = () => {
    const newErrors: typeof errors = {};

    if (addressMode === 'manual') {
      if (!state) newErrors.state = 'State is required';
      if (!city) newErrors.city = 'City is required';
      if (!streetAddress.trim()) {
        newErrors.address = 'Street address is required';
      } else if (streetAddress.trim().length < 5) {
        newErrors.address = 'Please enter a valid street address';
      }
    } else {
      if (!selectedPlace && !searchQuery.trim()) {
        newErrors.address = 'Please search and select an address';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fullAddress = addressMode === 'manual' 
      ? `${streetAddress}, ${city}, ${state}` 
      : (selectedPlace?.description || searchQuery);

    // Use extracted state/city or try to parse from address
    let finalState = state;
    let finalCity = city;
    
    if (addressMode === 'search' && selectedPlace) {
      // Try to extract from address if not already set
      if (!finalState || !finalCity) {
        const addressParts = selectedPlace.description.split(',').map(p => p.trim());
        // Try to find Nigerian state in address parts
        for (const part of addressParts) {
          const cleanPart = part.replace(' State', '').replace(' state', '');
          if (NIGERIAN_STATES[cleanPart]) {
            finalState = cleanPart;
            break;
          }
        }
        // Use first part as city if not found
        if (!finalCity && addressParts.length > 1) {
          finalCity = addressParts[0];
        }
      }
    }

    navigation.navigate('SignupAgreement', {
      role,
      email,
      phone,
      password,
      firstName,
      lastName,
      nationality,
      nationalityCode,
      state: finalState || 'Lagos',
      city: finalCity || 'Lagos',
      address: fullAddress,
      latitude,
      longitude,
    });
  };

  const createLabelStyle = (animValue: Animated.Value) => ({
    position: 'absolute' as const,
    left: 0,
    top: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['71.4%', '85.68%'], // Step 6 of 7
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step 6 of 7
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: progressWidth, backgroundColor: COLORS.primary },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              What's your address?
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter your delivery address
            </Text>
          </View>

          {/* Mode Toggle */}
          <View style={[styles.modeToggle, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                addressMode === 'manual' && styles.modeButtonActive,
                addressMode === 'manual' && { backgroundColor: isDark ? colors.card : '#FFFFFF' },
              ]}
              onPress={() => setAddressMode('manual')}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={addressMode === 'manual' ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280')}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  { color: addressMode === 'manual' ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280') },
                ]}
              >
                Manual
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                addressMode === 'search' && styles.modeButtonActive,
                addressMode === 'search' && { backgroundColor: isDark ? colors.card : '#FFFFFF' },
              ]}
              onPress={() => setAddressMode('search')}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={addressMode === 'search' ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280')}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  { color: addressMode === 'search' ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280') },
                ]}
              >
                Search
              </Text>
            </TouchableOpacity>
          </View>

          {addressMode === 'manual' ? (
            <>
              {/* State Selector */}
              <TouchableOpacity
                style={[
                  styles.selector,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: state ? COLORS.primary : (errors.state ? '#EF4444' : (isDark ? '#374151' : '#E5E7EB')),
                  },
                ]}
                onPress={() => setShowStatePicker(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: state ? colors.text : (isDark ? '#6B7280' : '#9CA3AF') },
                  ]}
                >
                  {state || 'Select State'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}

              {/* City Selector */}
              <TouchableOpacity
                style={[
                  styles.selector,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: city ? COLORS.primary : (errors.city ? '#EF4444' : (isDark ? '#374151' : '#E5E7EB')),
                    opacity: state ? 1 : 0.5,
                  },
                ]}
                onPress={() => state && setShowCityPicker(true)}
                disabled={!state}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: city ? colors.text : (isDark ? '#6B7280' : '#9CA3AF') },
                  ]}
                >
                  {city || 'Select City'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

              {/* Street Address Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Animated.Text style={[createLabelStyle(addressAnimValue), styles.label]}>
                    Street Address
                  </Animated.Text>
                  <RNTextInput
                    ref={addressInputRef}
                    style={[styles.input, { color: colors.text }]}
                    value={streetAddress}
                    onChangeText={(text) => {
                      setStreetAddress(text);
                      if (errors.address) setErrors({...errors, address: undefined});
                    }}
                    onFocus={() => setAddressFocused(true)}
                    onBlur={() => setAddressFocused(false)}
                    placeholder=""
                    placeholderTextColor="transparent"
                    multiline
                    numberOfLines={2}
                  />
                </View>
                <View
                  style={[
                    styles.inputLine,
                    { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                    addressFocused && styles.inputLineFocused,
                    errors.address && styles.inputLineError,
                  ]}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>
            </>
          ) : (
            <>
              {/* Google Places Search */}
              <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <RNTextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={handleSearchAddress}
                  placeholder="Search for your address..."
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                />
                {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
                {searchQuery.length > 0 && !isSearching && (
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedPlace(null);
                  }}>
                    <Ionicons name="close-circle" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={[styles.searchResults, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.place_id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectPlace(result)}
                    >
                      <Ionicons name="location" size={20} color={COLORS.primary} />
                      <View style={styles.searchResultText}>
                        <Text style={[styles.searchResultMain, { color: colors.text }]}>
                          {result.structured_formatting.main_text}
                        </Text>
                        <Text style={[styles.searchResultSecondary, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          {result.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedPlace && (
                <View style={[styles.selectedPlaceContainer, { backgroundColor: isDark ? '#1E3A2F' : '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  <Text style={[styles.selectedPlaceText, { color: isDark ? '#86EFAC' : '#065F46' }]}>
                    Address selected
                  </Text>
                </View>
              )}

              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </>
          )}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              (addressMode === 'manual' ? (!state || !city || !streetAddress.trim()) : !searchQuery.trim()) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={addressMode === 'manual' ? (!state || !city || !streetAddress.trim()) : !searchQuery.trim()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStatePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={STATES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  state === item && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setState(item);
                  setShowStatePicker(false);
                  setErrors({...errors, state: undefined});
                }}
              >
                <Text style={[styles.pickerItemText, { color: colors.text }]}>{item}</Text>
                {state === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            )}
          />
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select City</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  city === item && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setCity(item);
                  setShowCityPicker(false);
                  setErrors({...errors, city: undefined});
                }}
              >
                <Text style={[styles.pickerItemText, { color: colors.text }]}>{item}</Text>
                {city === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            )}
          />
        </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  titleContainer: {
    marginBottom: SPACING.lg,
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
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  selectorText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  label: {
    fontFamily: FONTS.medium,
  },
  input: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
    minHeight: 48,
  },
  inputLine: {
    height: 1,
  },
  inputLineFocused: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
  inputLineError: {
    height: 2,
    backgroundColor: '#EF4444',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: '#EF4444',
    marginTop: 4,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: 10,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  searchResults: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultText: {
    flex: 1,
  },
  searchResultMain: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  searchResultSecondary: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  selectedPlaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  selectedPlaceText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  pickerItemText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  separator: {
    height: 1,
  },
});
