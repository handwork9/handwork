import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { socialService, FarmerStories, FarmStory } from '../../services/socialService';
import { chatService } from '../../services/chatService';

const { width, height } = Dimensions.get('window');

interface StoriesRouteParams {
  stories: FarmerStories[];
  initialIndex: number;
}

// Progress Bar Component
const ProgressBar = ({ 
  total, 
  current, 
  progress 
}: { 
  total: number; 
  current: number; 
  progress: number 
}) => {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={styles.progressBarWrapper}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: index < current 
                    ? '100%' 
                    : index === current 
                      ? `${progress}%` 
                      : '0%' 
                }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );
};

// Single Story View Component
const StoryView = ({
  story,
  isActive,
  onNext,
  onPrevious,
  onClose,
  onProgressUpdate,
  externalPaused = false,
}: {
  story: FarmStory;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onProgressUpdate: (progress: number) => void;
  externalPaused?: boolean;
}) => {
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressedPaused, setIsPressedPaused] = useState(false);
  
  // Combine internal press pause and external pause (from keyboard/input)
  const isPaused = isPressedPaused || externalPaused;

  const viewStoryMutation = useMutation({
    mutationFn: () => socialService.viewStory(story.id),
  });

  useEffect(() => {
    if (isActive && !story.isViewed) {
      viewStoryMutation.mutate();
    }
  }, [isActive, story.id]);

  useEffect(() => {
    if (!isActive) {
      progressRef.current = 0;
      onProgressUpdate(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const duration = (story.duration || 5) * 1000;
    const increment = 100 / (duration / 50); // Update every 50ms

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        progressRef.current += increment;
        onProgressUpdate(progressRef.current);

        if (progressRef.current >= 100) {
          clearInterval(intervalRef.current!);
          onNext();
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, story.duration]);

  const handlePressIn = () => setIsPressedPaused(true);
  const handlePressOut = () => setIsPressedPaused(false);

  const handleTap = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    if (touchX < width / 3) {
      onPrevious();
    } else if (touchX > (width * 2) / 3) {
      onNext();
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={1}
      style={styles.storyView}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleTap}
    >
      {story.type === 'text' ? (
        <View style={[styles.textStory, { backgroundColor: story.backgroundColor || COLORS.primary }]}>
          <Text style={[styles.storyText, { color: story.textColor || 'white' }]}>
            {story.caption}
          </Text>
        </View>
      ) : (
        <Image 
          source={{ uri: story.mediaUrl || story.thumbnailUrl }}
          style={styles.storyImage}
          resizeMode="cover"
        />
      )}

      {/* Caption overlay */}
      {story.caption && story.type !== 'text' && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.captionGradient}
        >
          <Text style={styles.caption}>{story.caption}</Text>
        </LinearGradient>
      )}

      {/* Link button */}
      {story.linkUrl && (
        <TouchableOpacity style={styles.linkButton}>
          <Ionicons name="chevron-up" size={16} color="white" />
          <Text style={styles.linkText}>{story.linkText || 'See More'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Main Stories Screen
const StoriesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: StoriesRouteParams }, 'params'>>();
  
  // Get params safely - they might be undefined if navigating directly
  const initialFarmerIndex = route.params?.initialIndex ?? 0;

  // Always fetch stories - use same query key as SocialFeedScreen
  const { data: fetchedStories, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => socialService.getStories(),
  });

  const stories = fetchedStories || [];

  const [currentFarmerIndex, setCurrentFarmerIndex] = useState(initialFarmerIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const currentFarmer = stories[currentFarmerIndex];
  const currentStory = currentFarmer?.stories?.[currentStoryIndex];

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  const goToNextStory = useCallback(() => {
    if (!currentFarmer?.stories) return;
    
    if (currentStoryIndex < currentFarmer.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else if (currentFarmerIndex < stories.length - 1) {
      setCurrentFarmerIndex(currentFarmerIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      navigation.goBack();
    }
  }, [currentStoryIndex, currentFarmerIndex, currentFarmer?.stories?.length, stories.length]);

  const goToPreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else if (currentFarmerIndex > 0) {
      const prevFarmer = stories[currentFarmerIndex - 1];
      setCurrentFarmerIndex(currentFarmerIndex - 1);
      setCurrentStoryIndex(prevFarmer?.stories?.length ? prevFarmer.stories.length - 1 : 0);
      setProgress(0);
    }
  }, [currentStoryIndex, currentFarmerIndex, stories]);

  // Handle sending reply to farmer
  const handleSendReply = useCallback(async () => {
    if (!replyMessage.trim() || isSendingReply || !currentFarmer) return;
    
    setIsSendingReply(true);
    Keyboard.dismiss();
    
    try {
      // Get or create conversation with the farmer
      const conversation = await chatService.getOrCreateConversation(
        currentFarmer.farmer.id,
        'farmer'
      );
      
      if (!conversation) {
        Alert.alert('Error', 'Could not start conversation with this farmer');
        return;
      }
      
      // Send the message
      const message = await chatService.sendMessage({
        conversationId: conversation.id,
        text: `[Replying to story] ${replyMessage.trim()}`,
        type: 'text',
      });
      
      if (message) {
        setReplyMessage('');
        Alert.alert('Sent!', 'Your message has been sent to the farmer');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send story reply:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  }, [replyMessage, isSendingReply, currentFarmer]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 100) {
        // Swipe right - previous farmer
        if (currentFarmerIndex > 0) {
          Animated.timing(translateX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentFarmerIndex(currentFarmerIndex - 1);
            setCurrentStoryIndex(0);
            setProgress(0);
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else if (gestureState.dx < -100) {
        // Swipe left - next farmer
        if (currentFarmerIndex < stories.length - 1) {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentFarmerIndex(currentFarmerIndex + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
            translateX.setValue(0);
          });
        } else {
          navigation.goBack();
        }
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!currentFarmer || !currentStory) {
    // Loading state
    if (isLoading) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading stories...</Text>
        </View>
      );
    }
    
    // No stories available
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SafeAreaView style={styles.emptyHeader}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
        <Ionicons name="images-outline" size={64} color="#666" />
        <Text style={styles.emptyTitle}>No Stories Yet</Text>
        <Text style={styles.emptySubtitle}>Check back later for new stories from farmers</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.storyContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <StoryView
          story={currentStory}
          isActive={true}
          onNext={goToNextStory}
          onPrevious={goToPreviousStory}
          onClose={() => navigation.goBack()}
          onProgressUpdate={setProgress}
          externalPaused={isPaused}
        />

        {/* Header */}
        <SafeAreaView style={styles.header}>
          <ProgressBar
            total={currentFarmer.stories.length}
            current={currentStoryIndex}
            progress={progress}
          />
          
          <View style={styles.headerContent}>
            <View style={styles.farmerInfo}>
              {currentFarmer.farmer.user.avatar ? (
                <Image 
                  source={{ uri: currentFarmer.farmer.user.avatar }} 
                  style={styles.farmerAvatar} 
                />
              ) : (
                <View style={[styles.farmerAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {currentFarmer.farmer.farmName.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.farmerTextInfo}>
                <Text style={styles.farmerName}>{currentFarmer.farmer.farmName}</Text>
                <Text style={styles.storyTime}>
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Bottom actions - Reply input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.footer}
          keyboardVerticalOffset={0}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.footerContent}>
              <TextInput
                ref={inputRef}
                style={styles.replyTextInput}
                placeholder="Send message..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={replyMessage}
                onChangeText={setReplyMessage}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                returnKeyType="send"
                onSubmitEditing={handleSendReply}
                editable={!isSendingReply}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!replyMessage.trim() || isSendingReply) && styles.sendBtnDisabled]}
                onPress={handleSendReply}
                disabled={!replyMessage.trim() || isSendingReply}
              >
                {isSendingReply ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="paper-plane" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContainer: {
    flex: 1,
  },
  storyView: {
    flex: 1,
  },
  storyImage: {
    width,
    height,
  },
  textStory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  storyText: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  captionGradient: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  caption: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  linkButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    gap: 4,
  },
  linkText: {
    color: 'white',
    fontFamily: FONTS.medium,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    gap: 4,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  farmerTextInfo: {
    marginLeft: SPACING.sm,
  },
  farmerName: {
    color: 'white',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
  storyTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.xs,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: SPACING.md,
    fontFamily: FONTS.medium,
  },
  emptyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  goBackButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: 'white',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
});

export default StoriesScreen;
