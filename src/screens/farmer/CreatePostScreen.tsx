import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { socialService } from '../../services/socialService';
import { uploadService } from '../../services/uploadService';
import { useAppSelector } from '../../store';

const MAX_IMAGES = 10;

const CreatePostScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAppSelector(state => state.auth);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: socialService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create post');
    },
  });

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post');
      return;
    }

    setIsUploading(true);

    try {
      // Upload images first
      const uploadedUrls: string[] = [];
      
      for (const image of images) {
        if (image.startsWith('data:') || image.startsWith('file:')) {
          const uploadResult = await uploadService.uploadImage(image, 'posts');
          if (uploadResult.success && uploadResult.data?.url) {
            uploadedUrls.push(uploadResult.data.url);
          }
        } else {
          uploadedUrls.push(image);
        }
      }

      // Create the post
      await createPostMutation.mutateAsync({
        content: content.trim(),
        images: uploadedUrls,
        location: location.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .slice(0, MAX_IMAGES - images.length)
        .map(asset => asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setImages([...images, imageUri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const isLoading = isUploading || createPostMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Post
        </Text>
        <TouchableOpacity 
          style={[styles.postBtn, (!content.trim() && images.length === 0) && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || (!content.trim() && images.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView 
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Content Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              What's happening on your farm?
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={6}
              placeholder="Share updates, tips, or showcase your products..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Photos ({images.length}/{MAX_IMAGES})
            </Text>
            
            {images.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                <Text style={[styles.mediaBtnText, { color: colors.text }]}>
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={takePhoto}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={[styles.mediaBtnText, { color: colors.text }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Location (optional)
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.locationInput, { color: colors.text }]}
                placeholder="Add location"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Tags Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Tags (optional)
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="Add tags (press enter to add)"
                placeholderTextColor={colors.textSecondary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.tag}
                    onPress={() => removeTag(index)}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Ionicons name="close" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  postBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  contentInput: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    minHeight: 150,
    fontFamily: FONTS.regular,
  },
  imageScroll: {
    marginBottom: SPACING.md,
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  mediaBtnText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  locationInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  tagInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
});

export default CreatePostScreen;
