import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { triggerHaptic, triggerSelectionHaptic } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Common emojis organized by category
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '💪', '🦾'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔'],
  'Nature': ['🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃'],
  'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '⏰', '⌚', '💡', '🔦', '🕯️', '💰'],
};

interface AttachmentMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (uri: string) => void;
  onSelectCamera: (uri: string) => void;
  onSelectLocation: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  visible,
  onClose,
  onSelectImage,
  onSelectCamera,
  onSelectLocation,
}) => {
  const { colors, isDark } = useTheme();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSelectImage(result.assets[0].uri);
      onClose();
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSelectCamera(result.assets[0].uri);
      onClose();
    }
  };

  const handleShareLocation = () => {
    onSelectLocation();
    onClose();
  };

  const attachmentOptions = [
    { icon: 'image', label: 'Gallery', color: '#4CAF50', onPress: handlePickImage },
    { icon: 'camera', label: 'Camera', color: '#2196F3', onPress: handleTakePhoto },
    { icon: 'location', label: 'Location', color: '#FF5722', onPress: handleShareLocation },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.attachmentMenuContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.attachmentMenuHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]} />
          <Text style={[styles.attachmentMenuTitle, { color: colors.text }]}>Share</Text>
          <View style={styles.attachmentOptionsRow}>
            {attachmentOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attachmentOption}
                onPress={() => {
                  triggerHaptic();
                  option.onPress();
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.attachmentLabel, { color: colors.textSecondary }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]} onPress={() => {
            triggerHaptic();
            onClose();
          }}>
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onClose,
  onSelectEmoji,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Smileys');
  const { colors, isDark } = useTheme();
  const categories = Object.keys(EMOJI_CATEGORIES);

  const handleEmojiPress = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.emojiPickerContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.emojiPickerHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]} />
          
          {/* Category tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.categoryTabsContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  setSelectedCategory(category);
                }}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: isDark ? 'rgba(255,255,255,0.5)' : '#999999' },
                    selectedCategory === category && styles.categoryTabTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Emoji grid */}
          <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
            <View style={styles.emojiGridContent}>
              {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => {
                    triggerHaptic();
                    handleEmojiPress(emoji);
                  }}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.closeEmojiButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]} onPress={() => {
            triggerHaptic();
            onClose();
          }}>
            <Text style={[styles.closeEmojiButtonText, { color: colors.textSecondary }]}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  // Attachment Menu Styles
  attachmentMenuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  attachmentMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  attachmentMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  attachmentOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },

  // Emoji Picker Styles
  emojiPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '60%',
  },
  emojiPickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  categoryTabsContainer: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 4,
  },
  categoryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emojiGrid: {
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  emojiGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emojiButton: {
    width: (SCREEN_WIDTH - 32) / 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  closeEmojiButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeEmojiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});

export default { AttachmentMenu, EmojiPicker };
