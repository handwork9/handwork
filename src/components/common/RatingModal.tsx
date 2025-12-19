import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../constants/theme';
import reviewService, {
  CreateReviewDto,
  FARMER_REVIEW_TAGS,
  RIDER_REVIEW_TAGS,
} from '../../services/reviewService';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  type: 'farmer' | 'rider';
  recipientName?: string;
  onSuccess?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  orderId,
  type,
  recipientName = type === 'farmer' ? 'Farmer' : 'Rider',
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const tags = type === 'farmer' ? FARMER_REVIEW_TAGS : RIDER_REVIEW_TAGS;

  const submitMutation = useMutation({
    mutationFn: (data: CreateReviewDto) =>
      type === 'farmer'
        ? reviewService.rateFarmer(orderId, data)
        : reviewService.rateRider(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['pendingRatings'] });
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setRating(0);
    setComment('');
    setSelectedTags([]);
    setIsAnonymous(false);
    onClose();
  };

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) return;

    submitMutation.mutate({
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      isAnonymous,
    });
  };

  const getRatingText = (r: number) => {
    switch (r) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  const getRatingEmoji = (r: number) => {
    switch (r) {
      case 1:
        return '😞';
      case 2:
        return '😐';
      case 3:
        return '🙂';
      case 4:
        return '😊';
      case 5:
        return '🤩';
      default:
        return '⭐';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? COLORS.textWhite : COLORS.textPrimary}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.title,
                { color: isDark ? COLORS.textWhite : COLORS.textPrimary },
              ]}
            >
              Rate Your {type === 'farmer' ? 'Farmer' : 'Rider'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Recipient Info */}
            <View style={styles.recipientSection}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor:
                      type === 'farmer' ? COLORS.primaryLight : COLORS.accentLight,
                  },
                ]}
              >
                <Ionicons
                  name={type === 'farmer' ? 'leaf' : 'bicycle'}
                  size={32}
                  color={type === 'farmer' ? COLORS.primary : COLORS.accent}
                />
              </View>
              <Text
                style={[
                  styles.recipientName,
                  { color: isDark ? COLORS.textWhite : COLORS.textPrimary },
                ]}
              >
                {recipientName}
              </Text>
            </View>

            {/* Rating Stars */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#FFD700' : COLORS.grayLight}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text
                style={[
                  styles.ratingText,
                  {
                    color: rating > 0 ? COLORS.primary : COLORS.textSecondary,
                  },
                ]}
              >
                {getRatingText(rating)}
              </Text>
            </View>

            {/* Tags */}
            {rating > 0 && (
              <View style={styles.tagsSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? COLORS.textWhite : COLORS.textPrimary },
                  ]}
                >
                  What did you like? (Optional)
                </Text>
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tagButton,
                          {
                            backgroundColor: isSelected
                              ? COLORS.primary
                              : isDark
                              ? COLORS.backgroundDark
                              : COLORS.grayLight,
                          },
                        ]}
                        onPress={() => handleTagPress(tag)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            {
                              color: isSelected
                                ? COLORS.white
                                : isDark
                                ? COLORS.textWhite
                                : COLORS.textPrimary,
                            },
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Comment */}
            {rating > 0 && (
              <View style={styles.commentSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? COLORS.textWhite : COLORS.textPrimary },
                  ]}
                >
                  Share your experience (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: isDark
                        ? COLORS.backgroundDark
                        : COLORS.background,
                      color: isDark ? COLORS.textWhite : COLORS.textPrimary,
                      borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    },
                  ]}
                  placeholder={`Tell us about your experience with this ${type}...`}
                  placeholderTextColor={COLORS.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
              </View>
            )}

            {/* Anonymous Option */}
            {rating > 0 && (
              <TouchableOpacity
                style={styles.anonymousOption}
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <Ionicons
                  name={isAnonymous ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isAnonymous ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.anonymousText,
                    { color: isDark ? COLORS.textWhite : COLORS.textPrimary },
                  ]}
                >
                  Submit anonymously
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    rating > 0 && !submitMutation.isPending
                      ? COLORS.primary
                      : COLORS.grayLight,
                },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitText}>
                  Submit {rating > 0 ? `${rating}-Star` : ''} Rating
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {submitMutation.isError && (
            <Text style={styles.errorText}>
              {(submitMutation.error as any)?.message ||
                'Failed to submit rating. Please try again.'}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  recipientSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recipientName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  commentSection: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  anonymousText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
});

export default RatingModal;
