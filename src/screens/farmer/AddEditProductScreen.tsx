import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  InteractionManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { Button, TextInput, LoadingState } from '../../components/common';
import { productService } from '../../services/productService';
import { uploadService } from '../../services/uploadService';
import { FarmerStackParamList, ProductCategory } from '../../types';
import { useAppSelector } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { FarmerActivationIllustration } from '../../assets/illustrations/hero';

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;
type RouteProps = RouteProp<FarmerStackParamList, 'EditProduct'>;

const schema = yup.object().shape({
  name: yup.string().required('Product name is required').min(3, 'Name must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  price: yup.number().required('Price is required').positive('Price must be positive'),
  stock: yup.number().required('Stock is required').min(0, 'Stock cannot be negative').integer('Stock must be a whole number'),
  unit: yup.string().required('Unit is required'),
  category: yup.string().oneOf([
    'vegetables', 'fruits', 'grains', 'dairy', 'eggs', 'meat', 'poultry', 'seafood',
    'herbs_spices', 'honey', 'nuts', 'tubers', 'oils', 'legumes', 'processed',
    'livestock', 'seeds', 'beverages', 'others'
  ]).required('Category is required'),
  minOrderQuantity: yup.number().optional().min(1, 'Minimum order must be at least 1').integer('Must be a whole number'),
  bulkDiscountQuantity: yup.number().optional().min(1, 'Must be at least 1').integer('Must be a whole number'),
  bulkDiscountPercent: yup.number().optional().min(0, 'Cannot be negative').max(50, 'Maximum 50% discount'),
});

type FormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
  category: ProductCategory;
  minOrderQuantity?: number;
  bulkDiscountQuantity?: number;
  bulkDiscountPercent?: number;
};

const certifications = [
  { key: 'organic', label: 'Organic', icon: 'leaf', color: '#34C759' },
  { key: 'pesticide_free', label: 'Pesticide Free', icon: 'shield-checkmark', color: '#5856D6' },
  { key: 'non_gmo', label: 'Non-GMO', icon: 'nutrition', color: '#FF9500' },
  { key: 'locally_grown', label: 'Locally Grown', icon: 'location', color: '#007AFF' },
];

const categories: { key: ProductCategory; label: string; icon: string; iconType?: 'ionicons' | 'material' }[] = [
  { key: 'vegetables', label: 'Vegetables', icon: 'leaf-outline' },
  { key: 'fruits', label: 'Fruits', icon: 'nutrition-outline' },
  { key: 'grains', label: 'Grains', icon: 'flower-outline' },
  { key: 'dairy', label: 'Dairy', icon: 'water-outline' },
  { key: 'eggs', label: 'Eggs', icon: 'egg-outline' },
  { key: 'meat', label: 'Meat', icon: 'food-steak', iconType: 'material' },
  { key: 'poultry', label: 'Poultry', icon: 'egg-outline' },
  { key: 'seafood', label: 'Seafood', icon: 'fish-outline' },
  { key: 'herbs_spices', label: 'Herbs & Spices', icon: 'flame-outline' },
  { key: 'honey', label: 'Honey', icon: 'beehive-outline', iconType: 'material' },
  { key: 'nuts', label: 'Nuts', icon: 'peanut-outline', iconType: 'material' },
  { key: 'tubers', label: 'Tubers', icon: 'carrot', iconType: 'material' },
  { key: 'oils', label: 'Oils', icon: 'water-outline' },
  { key: 'legumes', label: 'Legumes', icon: 'seed-outline', iconType: 'material' },
  { key: 'processed', label: 'Processed', icon: 'food-variant', iconType: 'material' },
  { key: 'livestock', label: 'Livestock', icon: 'cow', iconType: 'material' },
  { key: 'seeds', label: 'Seeds', icon: 'seed', iconType: 'material' },
  { key: 'beverages', label: 'Beverages', icon: 'beer-outline' },
  { key: 'others', label: 'Others', icon: 'cube-outline' },
];

const units = ['kg', 'g', 'lb', 'piece', 'bunch', 'dozen', 'liter', 'pack'];

export default function AddEditProductScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const productId = route.params?.productId;
  const isEditing = !!productId;
  
  // Check if farmer needs activation
  const needsActivation = user?.role === 'farmer' && !user?.isActivated;
  
  const [images, setImages] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [harvestDate, setHarvestDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const pendingPickerAction = useRef<'camera' | 'gallery' | null>(null);

  // Check if farmer is activated before allowing product creation - DISABLED FOR TESTING
  // useEffect(() => {
  //   if (!isEditing && user?.role === 'farmer' && !user?.isActivated) {
  //     Alert.alert(
  //       'Activation Required',
  //       'You need to activate your farmer account before listing products. A one-time fee of ₦10,000 is required.',
  //       [
  //         {
  //           text: 'Cancel',
  //           style: 'cancel',
  //           onPress: () => navigation.goBack(),
  //         },
  //         {
  //           text: 'Activate Now',
  //           onPress: () => navigation.replace('FarmerActivation'),
  //         },
  //       ],
  //       { cancelable: false }
  //     );
  //   }
  // }, [user, isEditing, navigation]);

  const { data: existingProduct, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: isEditing,
  });

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      unit: 'kg',
      category: 'vegetables',
      minOrderQuantity: 1,
      bulkDiscountQuantity: undefined,
      bulkDiscountPercent: undefined,
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingProduct) {
      setValue('name', existingProduct.title || existingProduct.name || '');
      setValue('description', existingProduct.description);
      setValue('price', existingProduct.price);
      setValue('stock', existingProduct.stock);
      setValue('unit', existingProduct.unit);
      setValue('category', existingProduct.category);
      setImages(existingProduct.images || []);
      setIsAvailable(existingProduct.isAvailable);
      // Set new fields if they exist (cast to any for extended fields)
      const product = existingProduct as any;
      if (product.minOrderQuantity) setValue('minOrderQuantity', product.minOrderQuantity);
      if (product.bulkDiscountQuantity) setValue('bulkDiscountQuantity', product.bulkDiscountQuantity);
      if (product.bulkDiscountPercent) setValue('bulkDiscountPercent', product.bulkDiscountPercent);
      if (product.certifications) setSelectedCertifications(product.certifications);
      if (product.harvestDate) setHarvestDate(new Date(product.harvestDate));
    }
  }, [existingProduct, setValue]);

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      Alert.alert('Success', 'Product created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      console.error('Create product error:', JSON.stringify(error, null, 2));
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create product';
      Alert.alert('Error', Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update product');
    },
  });

  const launchGalleryPicker = async () => {
    try {
      console.log('Launching gallery picker...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permission);
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add images');
        return;
      }

      console.log('Opening image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      console.log('Image library result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          setImages(prev => [...prev, dataUri]);
        } else {
          setImages(prev => [...prev, asset.uri]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const launchCamera = async () => {
    try {
      console.log('Launching camera...');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission result:', permission);
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos');
        return;
      }

      console.log('Opening camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      console.log('Camera result:', result.canceled ? 'canceled' : 'captured');

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          setImages(prev => [...prev, dataUri]);
        } else {
          setImages(prev => [...prev, asset.uri]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleImageModalClose = () => {
    const action = pendingPickerAction.current;
    pendingPickerAction.current = null;
    
    if (action) {
      // Use InteractionManager to wait for modal animation to complete
      InteractionManager.runAfterInteractions(() => {
        if (action === 'gallery') {
          launchGalleryPicker();
        } else if (action === 'camera') {
          launchCamera();
        }
      });
    }
  };

  const pickImageFromGallery = () => {
    console.log('pickImageFromGallery called');
    pendingPickerAction.current = 'gallery';
    setShowImageOptions(false);
  };

  const takePhoto = () => {
    console.log('takePhoto called');
    pendingPickerAction.current = 'camera';
    setShowImageOptions(false);
  };

  const toggleCertification = (key: string) => {
    setSelectedCertifications(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, close picker after selection; on iOS, keep open until Done is pressed
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setHarvestDate(selectedDate);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    // Temporarily disabled for testing - re-enable for production
    // if (images.length === 0) {
    //   Alert.alert('Error', 'Please add at least one product image');
    //   return;
    // }

    // First, upload any base64 images and get URLs
    let imageUrls: string[] = [];
    if (images.length > 0) {
      const validImages = images.filter(img => 
        img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')
      );
      
      if (validImages.length > 0) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadService.processProductImages(validImages);
          imageUrls = uploadResult.urls;
          
          if (uploadResult.errors.length > 0) {
            console.warn('Some images failed to upload:', uploadResult.errors);
          }
          
          if (imageUrls.length === 0) {
            Alert.alert('Error', 'Failed to upload images. Please try again.');
            setIsUploading(false);
            return;
          }
        } catch (error) {
          console.error('Image upload error:', error);
          Alert.alert('Error', 'Failed to upload images. Please try again.');
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
    }

    // Map form fields to backend expected format
    // For updates, only include fields allowed in UpdateProductDto
    // For creates, include all fields including location
    
    if (isEditing && productId) {
      // Update - only send fields allowed in UpdateProductDto
      const updateData: Record<string, any> = {
        title: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        unit: data.unit,
        category: data.category,
        isAvailable: isAvailable,
        minOrderQuantity: data.minOrderQuantity ? Number(data.minOrderQuantity) : 1,
      };

      // Only add certifications if there are any
      if (selectedCertifications.length > 0) {
        updateData.certifications = selectedCertifications;
      }

      // Add bulk discount if both quantity and percent are set
      if (data.bulkDiscountQuantity && data.bulkDiscountPercent) {
        updateData.bulkDiscountQuantity = Number(data.bulkDiscountQuantity);
        updateData.bulkDiscountPercent = Number(data.bulkDiscountPercent);
      }

      // Add uploaded image URLs if any
      if (imageUrls.length > 0) {
        updateData.images = imageUrls;
      }

      console.log('Updating product with data:', JSON.stringify(updateData, null, 2));
      updateMutation.mutate({ id: productId, data: updateData });
    } else {
      // Create - include all fields
      const createData: Record<string, any> = {
        title: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        unit: data.unit,
        category: data.category,
        // Add default location from user profile or defaults
        pickupLat: user?.latitude || 6.5244,
        pickupLng: user?.longitude || 3.3792,
        pickupState: user?.state || 'Lagos',
        pickupCity: user?.city || '',
        pickupAddress: user?.address || '',
        minOrderQuantity: data.minOrderQuantity ? Number(data.minOrderQuantity) : 1,
      };

      // Only add certifications if there are any
      if (selectedCertifications.length > 0) {
        createData.certifications = selectedCertifications;
      }

      // Add harvest date if set
      if (harvestDate) {
        createData.harvestDate = harvestDate.toISOString();
      }

      // Add bulk discount if both quantity and percent are set
      if (data.bulkDiscountQuantity && data.bulkDiscountPercent) {
        createData.bulkDiscountQuantity = Number(data.bulkDiscountQuantity);
        createData.bulkDiscountPercent = Number(data.bulkDiscountPercent);
      }

      // Add uploaded image URLs if any
      if (imageUrls.length > 0) {
        createData.images = imageUrls;
      }

      console.log('Creating product with data:', JSON.stringify(createData, null, 2));
      createMutation.mutate(createData);
    }
  };

  if (productLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Activation Card - Always show for non-activated farmers when adding products */}
          {!isEditing && (
            <TouchableOpacity
              style={[styles.activationCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('FarmerActivation')}
              activeOpacity={0.9}
            >
              {/* SVG Background */}
              <View style={styles.activationCardSvg}>
                <Svg width="250" height="200" viewBox="0 0 250 200">
                  <Defs>
                    <SvgLinearGradient id="activationGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FF6B35" stopOpacity={0.15} />
                      <Stop offset="100%" stopColor="#FF8F00" stopOpacity={0.08} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="activationGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FF8F00" stopOpacity={0.12} />
                      <Stop offset="100%" stopColor="#FF6B35" stopOpacity={0.05} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx="180" cy="40" r="100" fill="url(#activationGrad1)" />
                  <Circle cx="220" cy="120" r="60" fill="url(#activationGrad2)" />
                  <Circle cx="140" cy="20" r="40" fill="url(#activationGrad2)" />
                </Svg>
              </View>
              
              <View style={styles.activationCardContent}>
                <View style={styles.activationCardLeft}>
                  {/* Badge */}
                  <View style={[styles.activationBadge, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="sparkles" size={10} color="#FF6B35" />
                    <Text style={[styles.activationBadgeText, { color: '#FF6B35' }]}>GET STARTED</Text>
                  </View>
                  
                  <Text style={[styles.activationCardTitle, { color: colors.text }]}>Activate Your Seller Account</Text>
                  <Text style={[styles.activationCardSubtitle, { color: colors.textSecondary }]}>
                    One-time ₦25,000 fee to unlock full selling features
                  </Text>
                  
                  {/* Benefits */}
                  <View style={styles.activationBenefitsRow}>
                    <View style={[styles.activationBenefitItem, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="storefront" size={12} color="#FF6B35" />
                      <Text style={[styles.activationBenefitText, { color: '#FF6B35' }]}>Your Store</Text>
                    </View>
                    <View style={[styles.activationBenefitItem, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="trending-up" size={12} color="#4CAF50" />
                      <Text style={[styles.activationBenefitText, { color: '#4CAF50' }]}>Unlimited Sales</Text>
                    </View>
                  </View>
                  
                  {/* CTA Button */}
                  <View style={[styles.activationCtaButton, { backgroundColor: '#FF6B35' }]}>
                    <Text style={[styles.activationCtaText, { color: '#FFFFFF' }]}>Activate Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </View>
                </View>
                
                {/* Illustration */}
                <View style={styles.activationIllustration}>
                  <FarmerActivationIllustration size={90} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Images Section */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Images</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Add up to 5 photos</Text>
              </View>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesContainer}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={[styles.productImage, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity 
                  style={[styles.addImageButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderColor: isDark ? '#48484A' : '#C6C6C8' }]} 
                  onPress={() => setShowImageOptions(true)}
                >
                  <Ionicons name="camera-outline" size={32} color={colors.primary} />
                  <Text style={[styles.addImageText, { color: colors.textSecondary }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>First image will be the main photo</Text>
          </View>

          {/* Basic Info */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Name and description</Text>
              </View>
            </View>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Product Name"
                  placeholder="e.g., Fresh Tomatoes"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description"
                  placeholder="Describe your product..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  error={errors.description?.message}
                />
              )}
            />
          </View>

          {/* Category */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Select product type</Text>
              </View>
            </View>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderColor: isDark ? '#48484A' : '#E5E5EA' },
                        value === cat.key && { backgroundColor: '#34C759', borderColor: '#34C759' },
                      ]}
                      onPress={() => onChange(cat.key)}
                    >
                      {cat.iconType === 'material' ? (
                        <MaterialCommunityIcons 
                          name={cat.icon as any} 
                          size={20} 
                          color={value === cat.key ? '#FFFFFF' : colors.textSecondary} 
                        />
                      ) : (
                        <Ionicons 
                          name={cat.icon as any} 
                          size={20} 
                          color={value === cat.key ? '#FFFFFF' : colors.textSecondary} 
                        />
                      )}
                      <Text style={[
                        styles.categoryLabel,
                        { color: colors.textSecondary },
                        value === cat.key && { color: '#FFFFFF', fontWeight: '600' },
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Pricing & Stock */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Stock</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Set your price and inventory</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Price (₦)"
                      placeholder="0"
                      value={value?.toString() || ''}
                      onChangeText={(text) => onChange(parseFloat(text) || 0)}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      error={errors.price?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.spacer} />
              <View style={styles.flex}>
                <Controller
                  control={control}
                  name="stock"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Stock Quantity"
                      placeholder="0"
                      value={value?.toString() || ''}
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      error={errors.stock?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
            <Controller
              control={control}
              name="unit"
              render={({ field: { onChange, value } }) => (
                <View style={styles.unitsRow}>
                  {units.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitChip,
                        { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderColor: isDark ? '#48484A' : '#E5E5EA' },
                        value === unit && { backgroundColor: '#34C759', borderColor: '#34C759' },
                      ]}
                      onPress={() => onChange(unit)}
                    >
                      <Text style={[
                        styles.unitText,
                        { color: colors.textSecondary },
                        value === unit && { color: '#FFFFFF', fontWeight: '600' },
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Certifications */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Certifications</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Quality badges for your product</Text>
              </View>
            </View>
            <View style={styles.certificationsGrid}>
              {certifications.map((cert) => (
                <TouchableOpacity
                  key={cert.key}
                  style={[
                    styles.certificationChip,
                    { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderColor: isDark ? '#48484A' : '#E5E5EA' },
                    selectedCertifications.includes(cert.key) && { backgroundColor: cert.color + '20', borderColor: cert.color },
                  ]}
                  onPress={() => toggleCertification(cert.key)}
                >
                  <Ionicons 
                    name={cert.icon as any} 
                    size={20} 
                    color={selectedCertifications.includes(cert.key) ? cert.color : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.certificationLabel,
                    { color: colors.textSecondary },
                    selectedCertifications.includes(cert.key) && { color: cert.color, fontWeight: '600' },
                  ]}>
                    {cert.label}
                  </Text>
                  {selectedCertifications.includes(cert.key) && (
                    <Ionicons name="checkmark-circle" size={18} color={cert.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Harvest Date */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Harvest Information</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>When was it harvested?</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.datePickerButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              <View style={styles.datePickerContent}>
                <Text style={[styles.datePickerLabel, { color: colors.textSecondary }]}>Harvest Date</Text>
                <Text style={[styles.datePickerValue, { color: colors.text }]}>
                  {harvestDate ? harvestDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Select date (optional)'}
                </Text>
              </View>
              {harvestDate && (
                <TouchableOpacity onPress={() => setHarvestDate(null)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Help buyers know how fresh your product is
            </Text>
          </View>

          {/* Minimum Order & Bulk Discount */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Settings</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Minimum orders & bulk discounts</Text>
              </View>
            </View>
            
            <Controller
              control={control}
              name="minOrderQuantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Minimum Order Quantity"
                  placeholder="1"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseInt(text) || 1)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.minOrderQuantity?.message}
                />
              )}
            />

            <View style={[styles.bulkDiscountSection, { borderColor: isDark ? '#48484A' : '#E5E5EA' }]}>
              <View style={styles.bulkDiscountHeader}>
                <Ionicons name="pricetag" size={20} color={colors.primary} />
                <Text style={[styles.bulkDiscountTitle, { color: colors.text }]}>Bulk Discount (Optional)</Text>
              </View>
              <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
                Offer a discount when customers buy in larger quantities
              </Text>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Controller
                    control={control}
                    name="bulkDiscountQuantity"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Min Quantity"
                        placeholder="e.g., 10"
                        value={value?.toString() || ''}
                        onChangeText={(text) => onChange(parseInt(text) || undefined)}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        error={errors.bulkDiscountQuantity?.message}
                      />
                    )}
                  />
                </View>
                <View style={styles.spacer} />
                <View style={styles.flex}>
                  <Controller
                    control={control}
                    name="bulkDiscountPercent"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Discount %"
                        placeholder="e.g., 10"
                        value={value?.toString() || ''}
                        onChangeText={(text) => onChange(parseInt(text) || undefined)}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        error={errors.bulkDiscountPercent?.message}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Availability Toggle */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsAvailable(!isAvailable)}
            >
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Available for Sale</Text>
                <Text style={[styles.toggleHelper, { color: colors.textSecondary }]}>
                  Toggle off to hide this product temporarily
                </Text>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: isDark ? '#48484A' : '#E5E5EA' },
                isAvailable && { backgroundColor: '#34C759' },
              ]}>
                <View style={[
                  styles.toggleKnob,
                  isAvailable && styles.toggleKnobActive,
                ]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isUploading ? 'Uploading Images...' : (isEditing ? 'Update Product' : 'Add Product')}
              onPress={handleSubmit(onSubmit)}
              loading={isUploading || createMutation.isPending || updateMutation.isPending}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="slide"
        onRequestClose={() => {
          pendingPickerAction.current = null;
          setShowImageOptions(false);
        }}
        onDismiss={handleImageModalClose}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            pendingPickerAction.current = null;
            setShowImageOptions(false);
          }}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Photo</Text>
            <Pressable 
              style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]} 
              onPress={() => {
                console.log('Take Photo pressed');
                takePhoto();
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#34C75920' }]}>
                <Ionicons name="camera" size={24} color="#34C759" />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Take Photo</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.7 }]} 
              onPress={() => {
                console.log('Gallery pressed');
                pickImageFromGallery();
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#007AFF20' }]}>
                <Ionicons name="images" size={24} color="#007AFF" />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Choose from Gallery</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.modalCancelButton, 
                { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                pressed && { opacity: 0.7 }
              ]} 
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.datePickerModal, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>Harvest Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={harvestDate || new Date()}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              style={styles.datePicker}
              textColor={colors.text}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  imagesContainer: {
    gap: 10,
    paddingBottom: 10,
    paddingTop: 10,
    paddingRight: 10,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  removeImageText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C6C6C8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  addImageIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  spacer: {
    width: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 12,
  },
  unitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitChipActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  unitTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleHelper: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E9E9EA',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  buttonContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  // Certifications
  certificationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  certificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  certificationLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Date Picker
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 2,
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Bulk Discount
  bulkDiscountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bulkDiscountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bulkDiscountTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#D1D1D6',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
  },
  modalCancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Date Picker Modal
  datePickerModal: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  datePickerCancel: {
    fontSize: 17,
    fontWeight: '400',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  datePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  datePicker: {
    height: 200,
    marginTop: 8,
  },
  // Activation Card Styles
  activationCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activationCardSvg: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
  },
  activationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activationCardLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  activationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  activationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  activationCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  activationCardSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  activationBenefitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  activationBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  activationBenefitText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  activationCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  activationCtaText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  activationIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
