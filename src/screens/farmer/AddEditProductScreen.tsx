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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { Button, TextInput, LoadingState } from '../../components/common';
import { productService } from '../../services/productService';
import { uploadService } from '../../services/uploadService';
import { FarmerStackParamList, ProductCategory } from '../../types';
import { useAppSelector } from '../../store';
import { useTheme } from '../../context/ThemeContext';

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
          {/* Images Section */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Images</Text>
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
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Add up to 5 images. First image is the main photo.</Text>
          </View>

          {/* Basic Info */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Stock</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Certifications</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
              Select all that apply to your product
            </Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Harvest Information</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Settings</Text>
            
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
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  imagesContainer: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
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
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  addImageIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  addImageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  row: {
    flexDirection: 'row',
  },
  spacer: {
    width: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  unitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  unitChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unitText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  unitTextActive: {
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  toggleHelper: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
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
    gap: SPACING.sm,
  },
  certificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  certificationLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  // Date Picker
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  datePickerValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  // Bulk Discount
  bulkDiscountSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  bulkDiscountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  bulkDiscountTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  modalCancelButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Date Picker Modal
  datePickerModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: SPACING.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  datePickerCancel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  datePickerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  datePickerDone: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  datePicker: {
    height: 200,
    marginTop: SPACING.sm,
  },
});
