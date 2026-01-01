import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { socialService, SocialPost, FarmerStories } from '../../services/socialService';
import { BuyerStackParamList } from '../../types';

const { width } = Dimensions.get('window');
const STORY_SIZE = 72;
const POST_IMAGE_HEIGHT = width * 0.75;

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

// Story Circle Component
const StoryCircle = ({ 
  story, 
  onPress,
  isOwn = false 
}: { 
  story: FarmerStories; 
  onPress: () => void;
  isOwn?: boolean;
}) => {
  const { colors, isDark } = useTheme();
  const hasUnviewed = story.hasUnviewed;

  return (
    <TouchableOpacity style={styles.storyContainer} onPress={onPress}>
      <LinearGradient
        colors={hasUnviewed ? ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'] : [isDark ? '#333' : '#ccc', isDark ? '#333' : '#ccc']}
        style={styles.storyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.storyImageContainer, { backgroundColor: colors.background }]}>
          {story.farmer.user.avatar ? (
            <Image source={{ uri: story.farmer.user.avatar }} style={styles.storyImage} />
          ) : (
            <View style={[styles.storyImage, styles.storyPlaceholder, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.storyPlaceholderText}>
                {story.farmer.farmName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <Text 
        style={[styles.storyName, { color: colors.text }]} 
        numberOfLines={1}
      >
        {isOwn ? 'Your Story' : story.farmer.farmName}
      </Text>
    </TouchableOpacity>
  );
};

// Post Card Component
const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onShare,
  onProfilePress,
}: { 
  post: SocialPost; 
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfilePress: () => void;
}) => {
  const { colors, isDark } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onLike();
  };

  const hasImages = post.images && post.images.length > 0;
  const contentTruncated = post.content && post.content.length > 150;

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      {/* Header */}
      <TouchableOpacity style={styles.postHeader} onPress={onProfilePress}>
        {post.farmer.user.avatar ? (
          <Image source={{ uri: post.farmer.user.avatar }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {post.farmer.farmName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.postHeaderInfo}>
          <Text style={[styles.postFarmName, { color: colors.text }]}>
            {post.farmer.farmName}
          </Text>
          <View style={styles.postMetaRow}>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Text>
            {post.location && (
              <>
                <Text style={styles.postMetaDot}>•</Text>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.postLocation, { color: colors.textSecondary }]}>
                  {post.location}
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.postMoreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      {post.content && (
        <TouchableOpacity 
          style={styles.postContent}
          onPress={() => contentTruncated && setShowFullContent(!showFullContent)}
          activeOpacity={contentTruncated ? 0.7 : 1}
        >
          <Text style={[styles.postText, { color: colors.text }]}>
            {showFullContent || !contentTruncated 
              ? post.content 
              : `${post.content.substring(0, 150)}...`}
          </Text>
          {contentTruncated && !showFullContent && (
            <Text style={styles.readMore}>Read more</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Images */}
      {hasImages && (
        <View style={styles.postImagesContainer}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={post.images}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.postImage} />
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          />
          {post.images && post.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {post.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicator,
                    currentImageIndex === index && styles.imageIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons 
                name={post.isLiked ? 'heart' : 'heart-outline'} 
                size={26} 
                color={post.isLiked ? '#E74C3C' : colors.text}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Likes and Comments count */}
      <View style={styles.postStats}>
        {post.likeCount > 0 && (
          <Text style={[styles.postLikes, { color: colors.text }]}>
            {post.likeCount.toLocaleString()} {post.likeCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
        {post.commentCount > 0 && (
          <TouchableOpacity onPress={onComment}>
            <Text style={[styles.postComments, { color: colors.textSecondary }]}>
              View all {post.commentCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Main Component
const SocialFeedScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stories
  const { data: storiesData } = useQuery({
    queryKey: ['stories'],
    queryFn: () => socialService.getStories(),
  });

  // Fetch feed
  const { 
    data: feedData, 
    isLoading,
  } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => socialService.getFeed({ page: 1, limit: 20 }),
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (postId: string) => socialService.likePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['social-feed'] });
      const previousData = queryClient.getQueryData(['social-feed']);

      queryClient.setQueryData(['social-feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post: SocialPost) =>
            post.id === postId
              ? { 
                  ...post, 
                  isLiked: !post.isLiked, 
                  likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 
                }
              : post
          ),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      queryClient.setQueryData(['social-feed'], context?.previousData);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    await queryClient.invalidateQueries({ queryKey: ['stories'] });
    setRefreshing(false);
  }, []);

  const handleShare = async (post: SocialPost) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.farmer.farmName} on Handwork!\n\n${post.content || ''}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderStories = () => {
    if (!storiesData || storiesData.length === 0) return null;

    return (
      <View style={[styles.storiesContainer, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={storiesData}
          keyExtractor={(item) => item.farmer.id}
          renderItem={({ item, index }) => (
            <StoryCircle 
              story={item} 
              onPress={() => navigation.navigate('Stories' as any, { initialFarmerIndex: index })}
            />
          )}
          contentContainerStyle={styles.storiesList}
        />
      </View>
    );
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <PostCard
      post={item}
      onLike={() => likeMutation.mutate(item.id)}
      onComment={() => {}}
      onShare={() => handleShare(item)}
      onProfilePress={() => navigation.navigate('FarmerProfile', { farmerId: item.farmerId })}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color={isDark ? '#555' : '#ccc'} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Posts Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Follow farmers to see their posts and updates here
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Farm Feed
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => navigation.navigate('LiveStreams' as any)}
          >
            <Ionicons name="videocam-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feedData?.posts || []}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderStories}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerBtn: {
    padding: SPACING.xs,
  },
  feedList: {
    paddingBottom: 100,
  },
  // Stories
  storiesContainer: {
    borderBottomWidth: 1,
    paddingVertical: SPACING.sm,
  },
  storiesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  storyContainer: {
    alignItems: 'center',
    width: STORY_SIZE + 10,
  },
  storyGradient: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 3,
  },
  storyImageContainer: {
    flex: 1,
    borderRadius: (STORY_SIZE - 6) / 2,
    padding: 2,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 10) / 2,
  },
  storyPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyPlaceholderText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 24,
  },
  storyName: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  // Post Card
  postCard: {
    marginBottom: SPACING.sm,
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
    marginLeft: SPACING.sm,
  },
  postFarmName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postTime: {
    fontSize: FONT_SIZES.xs,
  },
  postMetaDot: {
    marginHorizontal: 4,
    color: '#999',
  },
  postLocation: {
    fontSize: FONT_SIZES.xs,
    marginLeft: 2,
  },
  postMoreBtn: {
    padding: SPACING.xs,
  },
  postContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  postText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  readMore: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  postImagesContainer: {
    position: 'relative',
  },
  postImage: {
    width: width,
    height: POST_IMAGE_HEIGHT,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: 'white',
    width: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    padding: 4,
  },
  postStats: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  postLikes: {
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  postComments: {
    fontSize: FONT_SIZES.sm,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default SocialFeedScreen;
