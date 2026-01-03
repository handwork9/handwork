import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { socialService, CreateStoryDto } from '../../services/socialService';
import { uploadService } from '../../services/uploadService';
import { BuyerStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

// Available background colors for text stories
const BACKGROUND_COLORS = [
  { gradient: ['#FF6B6B', '#EE5A24'], name: 'Red' },
  { gradient: ['#F79F1F', '#F39C12'], name: 'Orange' },
  { gradient: ['#1DD1A1', '#10AC84'], name: 'Green' },
  { gradient: ['#54A0FF', '#2E86DE'], name: 'Blue' },
  { gradient: ['#5F27CD', '#341F97'], name: 'Purple' },
  { gradient: ['#FF9FF3', '#F368E0'], name: 'Pink' },
  { gradient: ['#00D2D3', '#01A3A4'], name: 'Teal' },
  { gradient: ['#576574', '#222F3E'], name: 'Dark' },
];

// Text colors
const TEXT_COLORS = ['#FFFFFF', '#000000', '#FFD700', '#FF6B6B', '#54A0FF', '#1DD1A1'];

// Story types
type StoryType = 'image' | 'video' | 'text';

const CreateStoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  // Story state
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [selectedTextColor, setSelectedTextColor] = useState(0);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [duration, setDuration] = useState(5);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textInputRef = useRef<TextInput>(null);

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: CreateStoryDto) => {
      return socialService.createStory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      Alert.alert('Success', 'Your story has been posted!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to create story');
    },
  });

  // Pick image from gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaBase64(asset.base64 || null);
      setMediaType('image');
      setStoryType('image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaBase64(asset.base64 || null);
      setMediaType('image');
      setStoryType('image');
    }
  };

  // Start text story
  const startTextStory = () => {
    setStoryType('text');
    setMediaUri(null);
    setMediaBase64(null);
    setMediaType(null);
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  // Reset story
  const resetStory = () => {
    setStoryType(null);
    setMediaUri(null);
    setMediaBase64(null);
    setMediaType(null);
    setCaption('');
    setTextContent('');
    setSelectedBackground(0);
    setSelectedTextColor(0);
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
  };

  // Post story
  const postStory = async () => {
    if (!storyType) return;

    // Validate
    if (storyType === 'text' && !textContent.trim()) {
      Alert.alert('Error', 'Please enter some text for your story');
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !mediaUri) {
      Alert.alert('Error', 'Please select media for your story');
      return;
    }

    setIsUploading(true);

    try {
      let uploadedMediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      // Upload media if needed
      if (mediaUri && storyType === 'image') {
        // Only support image uploads for now (videos require different handling)
        try {
          if (!mediaBase64) {
            throw new Error('No image data available. Please select an image again.');
          }
          
          // Get file extension for proper MIME type
          const extension = mediaUri.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
          
          const base64Data = `data:${mimeType};base64,${mediaBase64}`;
          
          console.log('[CreateStory] Uploading image, size:', Math.round(base64Data.length / 1024), 'KB');
          
          const uploadResult = await uploadService.uploadImage(base64Data, 'stories');
          if (uploadResult.success && uploadResult.data) {
            uploadedMediaUrl = uploadResult.data.url;
            thumbnailUrl = uploadResult.data.url; // Use same URL for thumbnail
          } else {
            throw new Error(uploadResult.error || 'Failed to upload image');
          }
        } catch (uploadError: any) {
          console.error('[CreateStory] Upload error:', uploadError);
          throw new Error(uploadError?.message || 'Failed to upload image');
        }
      } else if (mediaUri && storyType === 'video') {
        // For videos, just use the local URI for now (video upload requires different handling)
        Alert.alert('Coming Soon', 'Video stories will be available soon. Please use an image for now.');
        setIsUploading(false);
        return;
      }

      // Prepare story data
      const storyData: CreateStoryDto = {
        type: storyType,
        duration: storyType === 'video' ? undefined : duration,
      };

      if (storyType === 'text') {
        storyData.caption = textContent;
        storyData.backgroundColor = BACKGROUND_COLORS[selectedBackground].gradient[0];
        storyData.textColor = TEXT_COLORS[selectedTextColor];
      } else {
        storyData.mediaUrl = uploadedMediaUrl;
        storyData.thumbnailUrl = thumbnailUrl;
        if (caption.trim()) {
          storyData.caption = caption.trim();
        }
      }

      // Add link if provided
      if (linkUrl.trim()) {
        storyData.linkUrl = linkUrl.trim();
        storyData.linkText = linkText.trim() || 'See More';
      }

      // Create story
      await createStoryMutation.mutateAsync(storyData);
    } catch (error: any) {
      console.error('[CreateStory] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to upload story');
    } finally {
      setIsUploading(false);
    }
  };

  // Render story type selector (initial screen)
  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Create Story</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Share updates with your followers
      </Text>

      <View style={styles.typeOptions}>
        <TouchableOpacity 
          style={[
            styles.typeOption, 
            { 
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}
          onPress={pickImage}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="images" size={32} color="#FF6B6B" />
          </View>
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, { color: colors.text }]}>Gallery</Text>
            <Text style={[styles.typeDescription, { color: colors.textSecondary }]}>
              Choose from your photos
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.typeOption, 
            { 
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}
          onPress={takePhoto}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="camera" size={32} color="#54A0FF" />
          </View>
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, { color: colors.text }]}>Camera</Text>
            <Text style={[styles.typeDescription, { color: colors.textSecondary }]}>
              Take a photo or video
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.typeOption, 
            { 
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}
          onPress={startTextStory}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="text" size={32} color="#1DD1A1" />
          </View>
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, { color: colors.text }]}>Text</Text>
            <Text style={[styles.typeDescription, { color: colors.textSecondary }]}>
              Create a text story
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render text story editor
  const renderTextEditor = () => (
    <View style={styles.editorContainer}>
      {/* Preview */}
      <LinearGradient
        colors={BACKGROUND_COLORS[selectedBackground].gradient as [string, string]}
        style={styles.textStoryPreview}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TextInput
          ref={textInputRef}
          style={[
            styles.textStoryInput,
            { color: TEXT_COLORS[selectedTextColor] }
          ]}
          placeholder="Type your story..."
          placeholderTextColor={TEXT_COLORS[selectedTextColor] + '80'}
          value={textContent}
          onChangeText={setTextContent}
          multiline
          maxLength={200}
          textAlign="center"
          textAlignVertical="center"
        />
        {linkUrl && (
          <View style={styles.linkPreview}>
            <Ionicons name="link" size={16} color="#FFF" />
            <Text style={styles.linkPreviewText}>{linkText || 'See More'}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Background color picker */}
      <View style={styles.colorPickerSection}>
        <Text style={[styles.colorPickerLabel, { color: colors.textSecondary }]}>
          Background
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {BACKGROUND_COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedBackground(index)}
              style={[
                styles.colorOption,
                selectedBackground === index && styles.colorOptionSelected,
              ]}
            >
              <LinearGradient
                colors={color.gradient as [string, string]}
                style={styles.colorGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Text color picker */}
      <View style={styles.colorPickerSection}>
        <Text style={[styles.colorPickerLabel, { color: colors.textSecondary }]}>
          Text Color
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TEXT_COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedTextColor(index)}
              style={[
                styles.colorOption,
                selectedTextColor === index && styles.colorOptionSelected,
              ]}
            >
              <View style={[styles.textColorOption, { backgroundColor: color }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render media editor
  const renderMediaEditor = () => (
    <View style={styles.editorContainer}>
      {/* Media preview */}
      <View style={styles.mediaPreviewContainer}>
        {mediaType === 'video' ? (
          <Video
            source={{ uri: mediaUri! }}
            style={styles.mediaPreview}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <Image 
            source={{ uri: mediaUri! }} 
            style={styles.mediaPreview}
            resizeMode="cover"
          />
        )}

        {/* Caption overlay */}
        {caption && (
          <View style={styles.captionOverlay}>
            <Text style={styles.captionPreviewText}>{caption}</Text>
          </View>
        )}

        {/* Link preview */}
        {linkUrl && (
          <View style={styles.linkPreviewMedia}>
            <Ionicons name="link" size={16} color="#FFF" />
            <Text style={styles.linkPreviewText}>{linkText || 'See More'}</Text>
          </View>
        )}
      </View>

      {/* Caption input */}
      <View style={[
        styles.captionInputContainer, 
        { 
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }
      ]}>
        <TextInput
          style={[styles.captionInput, { color: colors.text }]}
          placeholder="Add a caption..."
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          maxLength={200}
          multiline
        />
      </View>

      {/* Duration picker (for images) */}
      {mediaType === 'image' && (
        <View style={styles.durationSection}>
          <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
            Duration: {duration}s
          </Text>
          <View style={styles.durationOptions}>
            {[5, 7, 10, 15].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={[
                  styles.durationOption,
                  { backgroundColor: colors.card },
                  duration === d && { backgroundColor: COLORS.primary },
                ]}
              >
                <Text style={[
                  styles.durationOptionText,
                  { color: duration === d ? '#FFF' : colors.text },
                ]}>
                  {d}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // Render link input modal
  const renderLinkInput = () => (
    <View style={[styles.linkInputContainer, { backgroundColor: colors.card }]}>
      <View style={styles.linkInputHeader}>
        <Text style={[styles.linkInputTitle, { color: colors.text }]}>Add Link</Text>
        <TouchableOpacity onPress={() => setShowLinkInput(false)}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={[styles.linkInput, { color: colors.text, backgroundColor: colors.background }]}
        placeholder="https://..."
        placeholderTextColor={colors.textSecondary}
        value={linkUrl}
        onChangeText={setLinkUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      
      <TextInput
        style={[styles.linkInput, { color: colors.text, backgroundColor: colors.background }]}
        placeholder="Link text (e.g., Shop Now)"
        placeholderTextColor={colors.textSecondary}
        value={linkText}
        onChangeText={setLinkText}
      />
      
      <TouchableOpacity 
        style={[styles.linkSaveBtn, { backgroundColor: COLORS.primary }]}
        onPress={() => setShowLinkInput(false)}
      >
        <Text style={styles.linkSaveBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => storyType ? resetStory() : navigation.goBack()}>
          <Ionicons 
            name={storyType ? 'close' : 'arrow-back'} 
            size={28} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {storyType === 'text' ? 'Text Story' : 
           storyType === 'image' ? 'Photo Story' :
           storyType === 'video' ? 'Video Story' : 'New Story'}
        </Text>

        {storyType ? (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => setShowLinkInput(true)}
            >
              <Ionicons name="link" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.postButton, { backgroundColor: COLORS.primary }]}
              onPress={postStory}
              disabled={isUploading || createStoryMutation.isPending}
            >
              {(isUploading || createStoryMutation.isPending) ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        {!storyType && renderTypeSelector()}
        {storyType === 'text' && renderTextEditor()}
        {(storyType === 'image' || storyType === 'video') && mediaUri && renderMediaEditor()}
      </KeyboardAvoidingView>

      {/* Link Input Modal */}
      {showLinkInput && (
        <View style={styles.linkInputOverlay}>
          {renderLinkInput()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAction: {
    padding: SPACING.xs,
  },
  postButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
  },

  // Type Selector
  typeSelectorContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xl,
  },
  typeOptions: {
    gap: SPACING.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  typeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  typeTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  typeDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  // Editor Container
  editorContainer: {
    flex: 1,
    padding: SPACING.md,
  },

  // Text Story
  textStoryPreview: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    maxHeight: height * 0.5,
    marginBottom: SPACING.md,
  },
  textStoryInput: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    width: '100%',
    maxHeight: '80%',
  },
  linkPreview: {
    position: 'absolute',
    bottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.xs,
  },
  linkPreviewText: {
    color: '#FFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },

  // Color Picker
  colorPickerSection: {
    marginBottom: SPACING.md,
  },
  colorPickerLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  colorGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  textColorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#00000020',
  },

  // Media Editor
  mediaPreviewContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    maxHeight: height * 0.5,
    marginBottom: SPACING.md,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  captionPreviewText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  linkPreviewMedia: {
    position: 'absolute',
    bottom: SPACING.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.xs,
  },
  captionInputContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  captionInput: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    minHeight: 50,
    maxHeight: 100,
  },

  // Duration
  durationSection: {
    marginBottom: SPACING.md,
  },
  durationLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  durationOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  durationOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },

  // Link Input
  linkInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  linkInputContainer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  linkInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  linkInputTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  linkInput: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  linkSaveBtn: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  linkSaveBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
});

export default CreateStoryScreen;
