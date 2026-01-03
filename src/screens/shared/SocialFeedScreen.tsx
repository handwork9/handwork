import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  Clipboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import { socialService, SocialPost, FarmerStories, PostComment } from '../../services/socialService';
import { chatService, Conversation } from '../../services/chatService';
import { BuyerStackParamList } from '../../types';
import { ReportModal } from '../../components/common';

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

// Comments Modal Component - Instagram Style
const CommentsModal = ({
  visible,
  onClose,
  post,
  onCommentAdded,
}: {
  visible: boolean;
  onClose: () => void;
  post: SocialPost | null;
  onCommentAdded: () => void;
}) => {
  const { colors, isDark } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);

  const { data: commentsData, isLoading, refetch } = useQuery({
    queryKey: ['post-comments', post?.id],
    queryFn: async () => {
      if (!post) return { comments: [], total: 0 };
      const result = await socialService.getPostComments(post.id);
      return result;
    },
    enabled: visible && !!post,
  });

  // Reset reply state when modal closes
  useEffect(() => {
    if (!visible) {
      setReplyingTo(null);
      setCommentText('');
    }
  }, [visible]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await socialService.createComment(post.id, commentText.trim(), replyingTo?.id);
      setCommentText('');
      setReplyingTo(null);
      refetch();
      onCommentAdded();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: PostComment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.user.name} `);
    inputRef.current?.focus();
  };

  const handleLikeComment = async (commentId: string) => {
    // Toggle like state locally for instant feedback
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
    
    try {
      await socialService.likeComment(commentId);
      refetch();
    } catch (error) {
      // Revert on error
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const CommentItem = ({ item, isReply = false }: { item: PostComment; isReply?: boolean }) => {
    const isLiked = likedComments.has(item.id) || (item as any).isLiked;
    const hasReplies = item.replies && item.replies.length > 0;
    const showReplies = expandedReplies.has(item.id);

    return (
      <View style={[styles.commentItem, isReply && styles.replyItem]}>
        <View style={styles.commentRow}>
          {/* Avatar */}
          {item.user.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={[styles.commentAvatar, isReply && styles.replyAvatar]} />
          ) : (
            <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder, isReply && styles.replyAvatar]}>
              <Text style={[styles.commentAvatarText, isReply && { fontSize: 10 }]}>
                {item.user.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          {/* Comment Content */}
          <View style={styles.commentContentContainer}>
            <View style={styles.commentBubble}>
              <Text style={[styles.commentUserName, { color: colors.text }]}>
                {item.user.name}
              </Text>
              <Text style={[styles.commentText, { color: colors.text }]}>
                {item.content}
              </Text>
            </View>
            
            {/* Comment Actions */}
            <View style={styles.commentActions}>
              <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
              {(item.likeCount || 0) > 0 && (
                <Text style={[styles.commentLikeCount, { color: colors.textSecondary }]}>
                  {item.likeCount} {item.likeCount === 1 ? 'like' : 'likes'}
                </Text>
              )}
              <TouchableOpacity onPress={() => handleReply(item)}>
                <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>
                  Reply
                </Text>
              </TouchableOpacity>
            </View>

            {/* View Replies Button */}
            {hasReplies && !isReply && (
              <TouchableOpacity 
                style={styles.viewRepliesBtn}
                onPress={() => toggleReplies(item.id)}
              >
                <View style={[styles.repliesLine, { backgroundColor: colors.textSecondary }]} />
                <Text style={[styles.viewRepliesText, { color: colors.textSecondary }]}>
                  {showReplies ? 'Hide replies' : `View ${item.replies!.length} ${item.replies!.length === 1 ? 'reply' : 'replies'}`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Nested Replies */}
            {showReplies && hasReplies && (
              <View style={styles.repliesContainer}>
                {item.replies!.map(reply => (
                  <CommentItem key={reply.id} item={reply} isReply={true} />
                ))}
              </View>
            )}
          </View>

          {/* Like Button */}
          <TouchableOpacity 
            style={styles.commentLikeBtn}
            onPress={() => handleLikeComment(item.id)}
          >
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={isReply ? 14 : 16} 
              color={isLiked ? '#E74C3C' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.commentsModalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.commentsModalHeader, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
            <Text style={[styles.commentsModalTitle, { color: colors.text }]}>
              Comments
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.commentsCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {isLoading ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={commentsData?.comments || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CommentItem item={item} />}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={isDark ? '#555' : '#ccc'} />
                  <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
            />
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <View style={[styles.replyIndicator, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}>
              <Text style={[styles.replyIndicatorText, { color: colors.textSecondary }]}>
                Replying to <Text style={{ fontWeight: '600', color: colors.text }}>{replyingTo.user.name}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input */}
          <View style={[styles.commentInputContainer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#eee' }]}>
            <TextInput
              ref={inputRef}
              style={[styles.commentInput, { color: colors.text, backgroundColor: isDark ? '#222' : '#f5f5f5' }]}
              placeholder={replyingTo ? `Reply to ${replyingTo.user.name}...` : "Add a comment..."}
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.commentSubmitBtn,
                (!commentText.trim() || isSubmitting) && styles.commentSubmitBtnDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Post Options Modal Component
const PostOptionsModal = ({
  visible,
  onClose,
  post,
  onShare,
  onReport,
}: {
  visible: boolean;
  onClose: () => void;
  post: SocialPost | null;
  onShare: () => void;
  onReport: () => void;
}) => {
  const { colors, isDark } = useTheme();

  const handleCopyLink = () => {
    // Copy a shareable link
    const link = `https://handwork.app/post/${post?.id}`;
    Clipboard.setString(link);
    Alert.alert('Copied', 'Link copied to clipboard');
    onClose();
  };

  const handleReport = () => {
    onClose();
    onReport();
  };

  const handleSharePost = () => {
    onShare();
    onClose();
  };

  const options = [
    { 
      icon: 'share-outline' as const, 
      label: 'Share', 
      onPress: handleSharePost,
      color: colors.text 
    },
    { 
      icon: 'copy-outline' as const, 
      label: 'Copy Link', 
      onPress: handleCopyLink,
      color: colors.text 
    },
    { 
      icon: 'flag-outline' as const, 
      label: 'Report', 
      onPress: handleReport,
      color: '#E74C3C' 
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.optionsOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionItem,
                index < options.length - 1 && { borderBottomColor: isDark ? '#333' : '#eee', borderBottomWidth: 1 }
              ]}
              onPress={option.onPress}
            >
              <Ionicons name={option.icon} size={24} color={option.color} />
              <Text style={[styles.optionLabel, { color: option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.optionItem, styles.cancelOption]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Instagram-style Share Modal Component
const ShareModal = ({
  visible,
  onClose,
  post,
}: {
  visible: boolean;
  onClose: () => void;
  post: SocialPost | null;
}) => {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);

  // Fetch recent conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['share-conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: visible,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedUsers([]);
      setMessage('');
      setSentTo([]);
    }
  }, [visible]);

  // Get unique users from conversations
  const recentUsers = React.useMemo(() => {
    if (!conversations) return [];
    const users: { id: string; name: string; avatar?: string; role: string }[] = [];
    const seenIds = new Set<string>();

    conversations.forEach((conv: Conversation) => {
      conv.participants.forEach((p: { id: string; name: string; avatar?: string; role: string }) => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          users.push({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            role: p.role,
          });
        }
      });
    });

    return users;
  }, [conversations]);

  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return recentUsers;
    const query = searchQuery.toLowerCase();
    return recentUsers.filter(user => 
      user.name.toLowerCase().includes(query)
    );
  }, [recentUsers, searchQuery]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendToUser = async (userId: string) => {
    if (!post || sentTo.includes(userId)) return;

    setIsSending(true);
    try {
      const user = recentUsers.find(u => u.id === userId);
      if (!user) return;

      // Get or create conversation
      const conversation = await chatService.getOrCreateConversation(
        userId,
        user.role as 'buyer' | 'farmer' | 'rider'
      );

      if (conversation) {
        // Send the post as a message
        const postContent = `📸 Shared a post from ${post.farmer.farmName}\n\n${post.content || ''}\n\n🔗 View post: https://handwork.app/post/${post.id}`;
        await chatService.sendMessage({
          conversationId: conversation.id,
          text: message ? `${message}\n\n${postContent}` : postContent,
          type: 'text',
        });
        setSentTo(prev => [...prev, userId]);
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToSelected = async () => {
    if (selectedUsers.length === 0 || !post) return;

    setIsSending(true);
    try {
      for (const userId of selectedUsers) {
        if (!sentTo.includes(userId)) {
          await handleSendToUser(userId);
        }
      }
      Alert.alert('Sent!', `Post shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`);
      onClose();
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    const link = `https://handwork.app/post/${post?.id}`;
    Clipboard.setString(link);
    Alert.alert('Copied!', 'Link copied to clipboard');
  };

  const handleShareExternal = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Check out this post from ${post.farmer.farmName} on Handwork!\n\n${post.content || ''}\n\nhttps://handwork.app/post/${post.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderUserItem = ({ item }: { item: typeof recentUsers[0] }) => {
    const isSelected = selectedUsers.includes(item.id);
    const isSent = sentTo.includes(item.id);

    return (
      <View style={styles.shareUserItem}>
        <TouchableOpacity 
          style={styles.shareUserInfo}
          onPress={() => toggleUserSelection(item.id)}
        >
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.shareUserAvatar} />
          ) : (
            <View style={[styles.shareUserAvatar, styles.shareAvatarPlaceholder]}>
              <Text style={styles.shareAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.shareUserDetails}>
            <Text style={[styles.shareUserName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.shareUserRole, { color: colors.textSecondary }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          {isSelected && !isSent && (
            <View style={styles.shareCheckmark}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shareSendBtn,
            isSent && styles.shareSentBtn,
            isSending && styles.shareSendingBtn,
          ]}
          onPress={() => handleSendToUser(item.id)}
          disabled={isSent || isSending}
        >
          <Text style={[styles.shareSendBtnText, isSent && styles.shareSentBtnText]}>
            {isSent ? 'Sent' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.shareModalOverlay}>
        <View style={[styles.shareModalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.shareModalHeader, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
            <TouchableOpacity onPress={onClose} style={styles.shareCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.shareModalTitle, { color: colors.text }]}>Share</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Post Preview */}
          {post && (
            <View style={[styles.sharePostPreview, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
              {post.images && post.images[0] && (
                <Image source={{ uri: post.images[0] }} style={styles.sharePostImage} />
              )}
              <View style={styles.sharePostInfo}>
                <Text style={[styles.sharePostFarm, { color: colors.text }]} numberOfLines={1}>
                  {post.farmer.farmName}
                </Text>
                <Text style={[styles.sharePostContent, { color: colors.textSecondary }]} numberOfLines={2}>
                  {post.content || 'Photo post'}
                </Text>
              </View>
            </View>
          )}

          {/* Message Input */}
          <View style={[styles.shareMessageContainer, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
            <TextInput
              style={[styles.shareMessageInput, { color: colors.text }]}
              placeholder="Write a message..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
          </View>

          {/* Search */}
          <View style={[styles.shareSearchContainer, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.shareSearchInput, { color: colors.text }]}
              placeholder="Search people..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Users List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={styles.shareUsersList}
            contentContainerStyle={styles.shareUsersListContent}
            ListEmptyComponent={
              <View style={styles.shareEmptyContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
                    <Text style={[styles.shareEmptyText, { color: colors.textSecondary }]}>
                      {searchQuery ? 'No users found' : 'Start a conversation to share posts'}
                    </Text>
                  </>
                )}
              </View>
            }
          />

          {/* Send to Selected Button */}
          {selectedUsers.length > 0 && (
            <TouchableOpacity
              style={[styles.shareSendSelectedBtn, isSending && styles.shareSendingBtn]}
              onPress={handleSendToSelected}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.shareSendSelectedText}>
                  Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Quick Share Options */}
          <View style={[styles.shareQuickOptions, { borderTopColor: isDark ? '#333' : '#eee' }]}>
            <TouchableOpacity style={styles.shareQuickOption} onPress={handleCopyLink}>
              <View style={[styles.shareQuickIcon, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                <Ionicons name="link" size={24} color={colors.text} />
              </View>
              <Text style={[styles.shareQuickText, { color: colors.text }]}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareQuickOption} onPress={handleShareExternal}>
              <View style={[styles.shareQuickIcon, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                <Ionicons name="share-social" size={24} color={colors.text} />
              </View>
              <Text style={[styles.shareQuickText, { color: colors.text }]}>Share to...</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Post Card Component
const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onShare,
  onSave,
  onProfilePress,
  onMorePress,
}: { 
  post: SocialPost; 
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onProfilePress: () => void;
  onMorePress: () => void;
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
    <View style={[
      styles.postCard, 
      { 
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      }
    ]}>
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
        <TouchableOpacity style={styles.postMoreBtn} onPress={onMorePress}>
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
        <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={post.isSaved ? COLORS.primary : colors.text} 
          />
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
  const { user } = useAppSelector((state) => state.auth);
  const isFarmer = user?.role === 'farmer';
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPost, setReportingPost] = useState<SocialPost | null>(null);

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

  const handleShare = (post: SocialPost) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  const handleOpenComments = (post: SocialPost) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleOpenOptions = (post: SocialPost) => {
    setSelectedPost(post);
    setShowOptionsModal(true);
  };

  const handleCommentAdded = () => {
    // Increment comment count in cache
    if (selectedPost) {
      queryClient.setQueryData(['social-feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post: SocialPost) =>
            post.id === selectedPost.id
              ? { ...post, commentCount: post.commentCount + 1 }
              : post
          ),
        };
      });
    }
  };

  const renderStories = () => {
    // Show stories section if there are stories OR if user is a farmer (to show add button)
    const hasStories = storiesData && storiesData.length > 0;
    
    if (!hasStories && !isFarmer) return null;

    return (
      <View style={[styles.storiesContainer, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={storiesData || []}
          keyExtractor={(item) => item.farmer.id}
          ListHeaderComponent={
            isFarmer ? (
              <TouchableOpacity 
                style={styles.addStoryContainer}
                onPress={() => navigation.navigate('CreateStory' as any)}
              >
                <View style={styles.addStoryCircle}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark || '#4CAF50']}
                    style={styles.addStoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="add" size={32} color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={[styles.storyName, { color: colors.text }]}>Add Story</Text>
              </TouchableOpacity>
            ) : null
          }
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

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: (postId: string) => socialService.savePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['social-feed'] });
      const previousData = queryClient.getQueryData(['social-feed']);

      queryClient.setQueryData(['social-feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post: SocialPost) =>
            post.id === postId
              ? { ...post, isSaved: !post.isSaved }
              : post
          ),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      queryClient.setQueryData(['social-feed'], context?.previousData);
      Alert.alert('Error', 'Failed to save post');
    },
  });

  const handleSavePost = (post: SocialPost) => {
    saveMutation.mutate(post.id);
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <PostCard
      post={item}
      onLike={() => likeMutation.mutate(item.id)}
      onComment={() => handleOpenComments(item)}
      onShare={() => handleShare(item)}
      onSave={() => handleSavePost(item)}
      onProfilePress={() => navigation.navigate('FarmerProfile', { farmerId: item.farmerId })}
      onMorePress={() => handleOpenOptions(item)}
    />
  );

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
        <Ionicons name="images" size={32} color="#4CAF50" />
      </View>
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
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Community
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => navigation.navigate('SavedPosts' as any)}
          >
            <Ionicons name="bookmark-outline" size={22} color={colors.text} />
          </TouchableOpacity>
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

      {/* Comments Modal */}
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onCommentAdded={handleCommentAdded}
      />

      {/* Post Options Modal */}
      <PostOptionsModal
        visible={showOptionsModal}
        onClose={() => {
          setShowOptionsModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onShare={() => selectedPost && handleShare(selectedPost)}
        onReport={() => {
          if (selectedPost) {
            setReportingPost(selectedPost);
            setShowReportModal(true);
          }
        }}
      />

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingPost(null);
        }}
        contentType="social_post"
        contentId={reportingPost?.id || ''}
        contentTitle={reportingPost?.content?.substring(0, 50) || 'Post'}
      />

      {/* Instagram-style Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
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
  // Add Story Button
  addStoryContainer: {
    alignItems: 'center',
    width: STORY_SIZE + 10,
    marginRight: SPACING.xs,
  },
  addStoryCircle: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    overflow: 'hidden',
  },
  addStoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Post Card
  postCard: {
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
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
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.semiBold,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  // Comments Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  commentsModalContainer: {
    height: '80%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  commentsModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  commentsCloseBtn: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
  },
  commentsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    paddingBottom: SPACING.md,
  },
  commentItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  replyItem: {
    paddingLeft: 0,
    paddingTop: SPACING.xs,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  commentContentContainer: {
    flex: 1,
  },
  commentBubble: {
    flex: 1,
  },
  commentUserName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  commentText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  commentTime: {
    fontSize: FONT_SIZES.xs,
  },
  commentLikeCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  commentActionText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  commentLikeBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  repliesLine: {
    width: 24,
    height: 1,
    marginRight: SPACING.sm,
  },
  viewRepliesText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  repliesContainer: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  replyIndicatorText: {
    fontSize: FONT_SIZES.sm,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  noCommentsText: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  commentSubmitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  // Post Options Modal Styles
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  cancelOption: {
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  // Share Modal Styles
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContainer: {
    height: '85%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  shareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  shareCloseBtn: {
    padding: SPACING.xs,
  },
  shareModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  sharePostPreview: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  sharePostImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  sharePostInfo: {
    flex: 1,
  },
  sharePostFarm: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  sharePostContent: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  shareMessageContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  shareMessageInput: {
    fontSize: FONT_SIZES.md,
    minHeight: 40,
    maxHeight: 80,
  },
  shareSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  shareSearchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  shareUsersList: {
    flex: 1,
  },
  shareUsersListContent: {
    paddingHorizontal: SPACING.md,
  },
  shareUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  shareUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  shareAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareAvatarText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  shareUserDetails: {
    flex: 1,
  },
  shareUserName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  shareUserRole: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  shareCheckmark: {
    marginRight: SPACING.sm,
  },
  shareSendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  shareSentBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  shareSendingBtn: {
    opacity: 0.6,
  },
  shareSendBtnText: {
    color: 'white',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
  },
  shareSentBtnText: {
    color: '#999',
  },
  shareEmptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  shareEmptyText: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  shareSendSelectedBtn: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  shareSendSelectedText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  shareQuickOptions: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderTopWidth: 1,
    gap: SPACING.xl,
  },
  shareQuickOption: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  shareQuickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareQuickText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
});

export default SocialFeedScreen;
