import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import socialService, { SocialPost } from '../../services/socialService';

const { width } = Dimensions.get('window');

const SavedPostsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => socialService.getSavedPosts(1, 50),
  });

  const unsaveMutation = useMutation({
    mutationFn: (postId: string) => socialService.savePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['saved-posts'] });
      const previousData = queryClient.getQueryData(['saved-posts']);

      queryClient.setQueryData(['saved-posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.filter((post: SocialPost) => post.id !== postId),
          total: old.total - 1,
        };
      });

      // Also update the social feed
      queryClient.setQueryData(['social-feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post: SocialPost) =>
            post.id === postId ? { ...post, isSaved: false } : post
          ),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      queryClient.setQueryData(['saved-posts'], context?.previousData);
      Alert.alert('Error', 'Failed to unsave post');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const handleShare = async (post: SocialPost) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.farmer?.farmName || 'a farmer'} on Handwork!\n\n${post.content || ''}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleUnsave = (post: SocialPost) => {
    Alert.alert(
      'Remove from Saved',
      'Are you sure you want to remove this post from your saved posts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => unsaveMutation.mutate(post.id)
        },
      ]
    );
  };

  const renderPost = ({ item }: { item: SocialPost }) => {
    const hasImages = item.images && item.images.length > 0;

    return (
      <View style={[
        styles.postCard, 
        { 
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }
      ]}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.postHeader}
          onPress={() => navigation.navigate('FarmerProfile', { farmerId: item.farmerId })}
        >
          {item.farmer?.user?.avatar ? (
            <Image source={{ uri: item.farmer.user.avatar }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {item.farmer?.farmName?.charAt(0).toUpperCase() || 'F'}
              </Text>
            </View>
          )}
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.postFarmName, { color: colors.text }]}>
              {item.farmer?.farmName || 'Farm'}
            </Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.unsaveBtn}
            onPress={() => handleUnsave(item)}
          >
            <Ionicons name="bookmark" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Content */}
        {item.content && (
          <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
            {item.content}
          </Text>
        )}

        {/* Image */}
        {hasImages && (
          <Image 
            source={{ uri: item.images![0] }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={styles.postActions}>
          <View style={styles.postStats}>
            <Ionicons name="heart" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.likeCount}
            </Text>
            <Ionicons name="chatbubble" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.commentCount}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleShare(item)}>
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {/* SVG Background */}
      <View style={styles.emptyBackground}>
        <Svg width={200} height={200}>
          <Defs>
            <SvgLinearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#81C784" stopOpacity="0.08" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
          <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
        </Svg>
      </View>
      <View style={[styles.emptyIconContainer, { backgroundColor: '#E8F5E9' }]}>
        <Ionicons name="bookmark" size={32} color="#4CAF50" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Saved Posts
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Posts you save will appear here for easy access
      </Text>
      <TouchableOpacity 
        style={styles.browseBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.browseBtnText}>Browse Community</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Posts</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {data?.total || 0} saved
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.posts || []}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.small,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postFarmName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
  postTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  unsaveBtn: {
    padding: SPACING.xs,
  },
  postContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  browseBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
  },
  browseBtnText: {
    color: 'white',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
});

export default SavedPostsScreen;
