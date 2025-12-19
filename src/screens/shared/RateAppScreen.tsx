import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

interface FeedbackTag {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const POSITIVE_TAGS: FeedbackTag[] = [
  { id: '1', label: 'Easy to use', icon: 'phone-portrait-outline' },
  { id: '2', label: 'Great prices', icon: 'pricetag-outline' },
  { id: '3', label: 'Fast delivery', icon: 'flash-outline' },
  { id: '4', label: 'Fresh products', icon: 'leaf-outline' },
  { id: '5', label: 'Nice design', icon: 'color-palette-outline' },
  { id: '6', label: 'Good support', icon: 'headset-outline' },
];

const NEGATIVE_TAGS: FeedbackTag[] = [
  { id: '1', label: 'Slow delivery', icon: 'time-outline' },
  { id: '2', label: 'App crashes', icon: 'bug-outline' },
  { id: '3', label: 'High prices', icon: 'cash-outline' },
  { id: '4', label: 'Poor quality', icon: 'sad-outline' },
  { id: '5', label: 'Hard to use', icon: 'help-circle-outline' },
  { id: '6', label: 'Bad support', icon: 'chatbubble-outline' },
];

const RATING_EMOJIS = ['😞', '😕', '😐', '😊', '🤩'];
const RATING_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];
const RATING_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#16A34A'];

export default function RateAppScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentTags = rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please rate', 'Select a star rating before submitting');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      if (rating >= 4) {
        setTimeout(() => {
          Alert.alert(
            'Thank you! 🎉',
            'Would you like to share your experience on the App Store?',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Rate on Store', onPress: () => Linking.openURL('https://apps.apple.com/app/handwork') },
            ]
          );
        }, 500);
      }
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <TouchableOpacity
          style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Thank You!</Text>
          <Text style={[styles.successMessage, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Your feedback helps us improve Handwork for everyone.
          </Text>
          
          <View style={[styles.ratingResultCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={styles.resultEmoji}>{RATING_EMOJIS[rating - 1]}</Text>
            <Text style={[styles.resultLabel, { color: RATING_COLORS[rating - 1] }]}>
              {RATING_LABELS[rating - 1]}
            </Text>
            <View style={styles.resultStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= rating ? RATING_COLORS[rating - 1] : isDark ? '#4B5563' : '#D1D5DB'}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
      >
        {/* Page Title */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Rate App</Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Your feedback helps us improve</Text>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Enjoying Handwork?</Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Let us know how we're doing</Text>
        </View>

        {/* Star Rating */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Tap to rate</Text>
        <View style={[styles.ratingCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star);
                    setSelectedTags([]);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.starContainer,
                    isSelected && { backgroundColor: `${RATING_COLORS[star - 1]}15` }
                  ]}>
                    <Ionicons
                      name={isSelected ? 'star' : 'star-outline'}
                      size={32}
                      color={isSelected ? RATING_COLORS[star - 1] : '#D1D5DB'}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {rating > 0 && (
            <View style={styles.ratingFeedback}>
              <Text style={styles.feedbackEmoji}>{RATING_EMOJIS[rating - 1]}</Text>
              <Text style={[styles.feedbackLabel, { color: RATING_COLORS[rating - 1] }]}>
                {RATING_LABELS[rating - 1]}
              </Text>
            </View>
          )}
        </View>

        {/* Feedback Tags */}
        {rating > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {rating >= 4 ? 'What do you like?' : 'What can we improve?'}
            </Text>
            <View style={[styles.tagsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {currentTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const tagColor = rating >= 4 ? '#16A34A' : '#F59E0B';
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagItem,
                      { backgroundColor: isSelected ? tagColor : isDark ? colors.background : '#F3F4F6', borderColor: isSelected ? tagColor : isDark ? colors.border : '#E5E7EB' }
                    ]}
                    activeOpacity={0.7}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Ionicons
                      name={tag.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <Text style={[
                      styles.tagText,
                      { color: isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#374151' }
                    ]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Additional Feedback */}
        {rating > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Additional feedback (optional)</Text>
            <View style={[styles.feedbackCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <TextInput
                style={[styles.feedbackInput, { color: colors.text }]}
                placeholder={rating >= 4 ? "Tell us what you love..." : "Tell us how we can improve..."}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {/* Submit Button */}
        {rating > 0 && (
          <TouchableOpacity
            style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
            {!isSubmitting && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        )}

        {/* Info Note */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
          <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
            Your feedback is anonymous and helps us improve the app.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  pageTitleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingFeedback: {
    alignItems: 'center',
    marginTop: 16,
  },
  feedbackEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  feedbackLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  tagsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackInput: {
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    fontFamily: FONTS.regular,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  successMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: FONTS.regular,
  },
  ratingResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  resultStars: {
    flexDirection: 'row',
    gap: 6,
  },
  doneButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});
