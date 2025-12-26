import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BuyerStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner, ErrorState } from '../../components/common';
import reviewService, {
  CreateReviewDto,
  FARMER_REVIEW_TAGS,
  RIDER_REVIEW_TAGS,
} from '../../services/reviewService';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<BuyerStackParamList, 'WriteReview'>;

const STAR_SIZE = 44;

export default function WriteReviewScreen({ route, navigation }: Props) {
  const { orderId, type = 'farmer', recipientName, recipientAvatar } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const tags = type === 'farmer' ? FARMER_REVIEW_TAGS : RIDER_REVIEW_TAGS;

  // Load order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
  });

  // Check if can rate
  const { data: canRate, isLoading: canRateLoading } = useQuery({
    queryKey: ['canRate', orderId],
    queryFn: () => reviewService.canRateOrder(orderId),
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: CreateReviewDto) =>
      type === 'farmer'
        ? reviewService.rateFarmer(orderId, data)
        : reviewService.rateRider(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['pendingRatings'] });
      queryClient.invalidateQueries({ queryKey: ['canRate', orderId] });
      Alert.alert(
        'Thank You! 🎉',
        `Your review has been submitted. Your feedback helps improve our ${type === 'farmer' ? 'farmers' : 'delivery'} service.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit review');
    },
  });

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    submitMutation.mutate({
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      isAnonymous,
    });
  };

  const getRatingText = (r: number) => {
    switch (r) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  const getRatingEmoji = (r: number) => {
    switch (r) {
      case 1: return '😞';
      case 2: return '😐';
      case 3: return '🙂';
      case 4: return '😊';
      case 5: return '🤩';
      default: return '';
    }
  };

  const isLoading = orderLoading || canRateLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const canSubmit = type === 'farmer' ? canRate?.canRateFarmer : canRate?.canRateRider;

  if (!canSubmit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Write Review</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
          <Text style={[styles.alreadyRatedTitle, { color: colors.text }]}>
            Already Rated
          </Text>
          <Text style={[styles.alreadyRatedText, { color: colors.textSecondary }]}>
            You have already submitted a review for this {type}.
          </Text>
          <TouchableOpacity
            style={[styles.goBackButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Write Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient Card */}
        <View style={[styles.recipientCard, { backgroundColor: colors.surface }]}>
          <View style={styles.recipientInfo}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name={type === 'farmer' ? 'leaf' : 'bicycle'}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
            )}
            <View style={styles.recipientDetails}>
              <Text style={[styles.recipientName, { color: colors.text }]}>
                {recipientName || (type === 'farmer' ? order?.farmerName || 'Farmer' : 'Rider')}
              </Text>
              <Text style={[styles.recipientRole, { color: colors.textSecondary }]}>
                {type === 'farmer' ? 'Farm Seller' : 'Delivery Rider'}
              </Text>
            </View>
          </View>
          {order && (
            <View style={[styles.orderInfo, { borderTopColor: colors.border }]}>
              <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>
                Order #{order.orderNumber}
              </Text>
              <Text style={[styles.orderAmount, { color: colors.primary }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          )}
        </View>

        {/* Star Rating */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How was your experience?
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={STAR_SIZE}
                  color={star <= rating ? '#FFC107' : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingTextContainer}>
            <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>
            <Text
              style={[
                styles.ratingText,
                { color: rating > 0 ? colors.text : colors.textSecondary },
              ]}
            >
              {getRatingText(rating)}
            </Text>
          </View>
        </View>

        {/* Quick Tags */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What did you like? (Optional)
          </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleTagPress(tag)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comment */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Write a comment (Optional)
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={`Share your experience with this ${type}...`}
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {comment.length}/500
          </Text>
        </View>

        {/* Anonymous Toggle */}
        <TouchableOpacity
          style={[styles.anonymousToggle, { backgroundColor: colors.surface }]}
          onPress={() => setIsAnonymous(!isAnonymous)}
        >
          <View style={styles.anonymousContent}>
            <View
              style={[
                styles.anonymousIcon,
                { backgroundColor: isAnonymous ? colors.primary + '20' : colors.background },
              ]}
            >
              <Ionicons
                name={isAnonymous ? 'eye-off' : 'eye'}
                size={20}
                color={isAnonymous ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.anonymousText}>
              <Text style={[styles.anonymousTitle, { color: colors.text }]}>
                Post Anonymously
              </Text>
              <Text style={[styles.anonymousSubtitle, { color: colors.textSecondary }]}>
                Your name won't be visible to others
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: isAnonymous ? colors.primary : 'transparent',
                borderColor: isAnonymous ? colors.primary : colors.border,
              },
            ]}
          >
            {isAnonymous && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: rating > 0 ? colors.primary : colors.textSecondary,
            },
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  alreadyRatedTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginTop: SPACING.lg,
  },
  alreadyRatedText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  goBackButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  recipientCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  recipientName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  recipientRole: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  orderLabel: {
    fontSize: FONT_SIZES.sm,
  },
  orderAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  section: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  ratingEmoji: {
    fontSize: 28,
  },
  ratingText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    minHeight: 100,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'right',
    marginTop: 4,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  anonymousContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anonymousIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousText: {
    marginLeft: SPACING.sm,
  },
  anonymousTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  anonymousSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
});
