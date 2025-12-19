import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { triggerHaptic, triggerErrorHaptic } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

interface DocumentUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (uri: string) => void;
  error?: string;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function DocumentUpload({
  label,
  description,
  value,
  onChange,
  error,
  placeholder = 'Tap to upload document',
  icon = 'document-outline',
}: DocumentUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { colors, isDark } = useTheme();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload documents.'
      );
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take photos.'
      );
      return;
    }

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showUploadOptions = () => {
    triggerHaptic();
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleCamera },
        { text: 'Choose from Gallery', onPress: handleUpload },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemove = () => {
    triggerErrorHaptic();
    onChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>{label}</Text>
      {description && <Text style={[styles.description, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>{description}</Text>}
      
      <TouchableOpacity
        style={[
          styles.uploadBox,
          { backgroundColor: isDark ? '#2C2C2E' : COLORS.surface, borderColor: isDark ? '#3A3A3C' : COLORS.border },
          error && styles.uploadBoxError,
          value && styles.uploadBoxWithImage,
        ]}
        onPress={showUploadOptions}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : value ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: value }} style={styles.previewImage} />
            <TouchableOpacity style={[styles.removeButton, { backgroundColor: isDark ? '#2C2C2E' : COLORS.white }]} onPress={handleRemove}>
              <Ionicons name="close-circle" size={28} color={COLORS.error} />
            </TouchableOpacity>
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
              <Text style={styles.uploadedText}>Uploaded</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContent}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3A3A3C' : COLORS.background }]}>
              <Ionicons name={icon} size={32} color={isDark ? '#9CA3AF' : COLORS.textSecondary} />
            </View>
            <Text style={[styles.placeholderText, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>{placeholder}</Text>
            <Text style={[styles.supportedText, { color: isDark ? '#6B7280' : COLORS.gray }]}>JPG, PNG (Max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  uploadBox: {
    height: 150,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  uploadBoxError: {
    borderColor: COLORS.error,
  },
  uploadBoxWithImage: {
    borderStyle: 'solid',
    borderColor: COLORS.primary,
  },
  placeholderContent: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  supportedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  uploadedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
