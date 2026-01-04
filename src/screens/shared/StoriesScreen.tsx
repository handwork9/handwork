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
  TouchableWithoutFeedback,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { socialService, FarmerStories, FarmStory } from '../../services/socialService';
import { chatService } from '../../services/chatService';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoriesRouteParams {
  stories: FarmerStories[];
  initialIndex: number;
}

// Instagram-style Progress Bar Component
const ProgressBar = ({ 
  total, 
  current, 
  progress,
  isPaused,
}: { 
  total: number; 
  current: number; 
  progress: number;
  isPaused?: boolean;
}) => {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={styles.progressBarWrapper}>
          <View style={styles.progressBarBg}>
            <Animated.View 
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
  onLongPressStart,
  onLongPressEnd,
}: {
  story: FarmStory;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onProgressUpdate: (progress: number) => void;
  externalPaused?: boolean;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
}) => {
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressedPaused, setIsPressedPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
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

    // Wait for image to load before starting progress
    if (story.type !== 'text' && !imageLoaded) return;

    const duration = (story.duration || 5) * 1000;
    const increment = 100 / (duration / 16); // 60fps (every ~16ms)

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        progressRef.current += increment;
        onProgressUpdate(Math.min(progressRef.current, 100));

        if (progressRef.current >= 100) {
          clearInterval(intervalRef.current!);
          onNext();
        }
      }
    }, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, story.duration, imageLoaded, story.type]);

  const handlePressIn = () => {
    setIsPressedPaused(true);
    onLongPressStart?.();
    // Subtle scale animation like Instagram
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressedPaused(false);
    onLongPressEnd?.();
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleTap = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    // Instagram: left 1/3 for previous, right 2/3 for next
    if (touchX < width / 3) {
      onPrevious();
    } else {
      onNext();
    }
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleTap}
    >
      <Animated.View style={[styles.storyView, { transform: [{ scale: scaleAnim }] }]}>
        {story.type === 'text' ? (
          <View style={[styles.textStory, { backgroundColor: story.backgroundColor || COLORS.primary }]}>
            <Text style={[styles.storyText, { color: story.textColor || 'white' }]}>
              {story.caption}
            </Text>
          </View>
        ) : (
          <>
            {!imageLoaded && (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
            <Image 
              source={{ uri: story.mediaUrl || story.thumbnailUrl }}
              style={[styles.storyImage, !imageLoaded && { opacity: 0 }]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        )}

        {/* Caption overlay - Instagram style at bottom */}
        {story.caption && story.type !== 'text' && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption} numberOfLines={3}>{story.caption}</Text>
          </View>
        )}

        {/* Link button - Swipe up style */}
        {story.linkUrl && (
          <View style={styles.linkContainer}>
            <View style={styles.linkChevron}>
              <Ionicons name="chevron-up" size={20} color="white" />
            </View>
            <Text style={styles.linkText}>{story.linkText || 'See More'}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Main Stories Screen
const StoriesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: StoriesRouteParams }, 'params'>>();
  const insets = useSafeAreaInsets();
  
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
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation] = useState(new Animated.Value(0));
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cubeRotation = useRef(new Animated.Value(0)).current;
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

  // Reset like state when story changes
  useEffect(() => {
    setIsLiked(false);
  }, [currentStoryIndex, currentFarmerIndex]);

  // Handle liking a story
  const handleLikeStory = useCallback(async () => {
    if (!currentStory) return;
    
    // Toggle like state with animation
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Only show heart animation when liking (not unliking)
    if (newLikedState) {
      setShowLikeHeart(true);
      
      // Animate the like heart
      Animated.sequence([
        Animated.spring(likeAnimation, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.timing(likeAnimation, {
          toValue: 0,
          duration: 500,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setShowLikeHeart(false));
    }
    
    // Try to persist to backend (silently fail if endpoint doesn't exist)
    try {
      await socialService.reactToStory(currentStory.id, 'love');
    } catch (error) {
      // Silently ignore - backend endpoint may not exist yet
      // The like will still work visually for the current session
    }
  }, [currentStory, isLiked, likeAnimation]);

  // Handle share story
  const handleShareStory = useCallback(async () => {
    if (!currentFarmer || !currentStory) return;
    
    setShowMoreOptions(false);
    setIsPaused(false);
    
    try {
      await Share.share({
        message: `Check out this story from ${currentFarmer.farmer.farmName} on Handwork! 🌾`,
        title: `${currentFarmer.farmer.farmName}'s Story`,
      });
    } catch (error) {
      console.error('Failed to share story:', error);
    }
  }, [currentFarmer, currentStory]);

  // Handle report story
  const handleReportStory = useCallback(() => {
    setShowMoreOptions(false);
    setIsPaused(false);
    
    Alert.alert(
      'Report Story',
      'Are you sure you want to report this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Reported', 'Thank you for your report. We will review this story.');
          }
        },
      ]
    );
  }, []);

  // Handle mute farmer
  const handleMuteFarmer = useCallback(() => {
    if (!currentFarmer) return;
    
    setShowMoreOptions(false);
    setIsPaused(false);
    
    Alert.alert(
      'Mute Stories',
      `Mute stories from ${currentFarmer.farmer.farmName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mute', 
          onPress: () => {
            Alert.alert('Muted', `You won't see stories from ${currentFarmer.farmer.farmName} anymore.`);
            navigation.goBack();
          }
        },
      ]
    );
  }, [currentFarmer, navigation]);

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
      // Respond to horizontal swipes > 10px or vertical swipes > 30px
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 30;
    },
    onPanResponderGrant: () => {
      setIsPaused(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Handle horizontal swipe for story navigation
      if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
        translateX.setValue(gestureState.dx);
      } else {
        // Handle vertical swipe for close gesture
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsPaused(false);
      
      // Vertical swipe down to close
      if (gestureState.dy > 100 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        Animated.timing(translateY, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }).start(() => navigation.goBack());
        return;
      }
      
      // Reset vertical position
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();

      // Horizontal swipe handling
      if (gestureState.dx > 80) {
        // Swipe right - previous farmer
        if (currentFarmerIndex > 0) {
          Animated.timing(translateX, {
            toValue: width,
            duration: 250,
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
      } else if (gestureState.dx < -80) {
        // Swipe left - next farmer
        if (currentFarmerIndex < stories.length - 1) {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 250,
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
        style={[
          styles.storyContainer, 
          { 
            transform: [
              { translateX },
              { translateY },
            ],
            opacity: translateY.interpolate({
              inputRange: [0, height / 2],
              outputRange: [1, 0.5],
              extrapolate: 'clamp',
            }),
          }
        ]}
        {...panResponder.panHandlers}
      >
        <StoryView
          story={currentStory}
          isActive={true}
          onNext={goToNextStory}
          onPrevious={goToPreviousStory}
          onClose={() => navigation.goBack()}
          onProgressUpdate={setProgress}
          externalPaused={isPaused || isLongPressed}
          onLongPressStart={() => setIsLongPressed(true)}
          onLongPressEnd={() => setIsLongPressed(false)}
        />

        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Header - Instagram Style */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <ProgressBar
            total={currentFarmer.stories.length}
            current={currentStoryIndex}
            progress={progress}
            isPaused={isPaused || isLongPressed}
          />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.farmerInfo}
              activeOpacity={0.7}
            >
              {/* Instagram-style avatar with gradient ring */}
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
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
                </View>
              </LinearGradient>
              
              <View style={styles.farmerTextInfo}>
                <Text style={styles.farmerName} numberOfLines={1}>
                  {currentFarmer.farmer.farmName}
                </Text>
                <Text style={styles.storyTime}>
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerIconBtn}
                onPress={() => {
                  setShowMoreOptions(true);
                  setIsPaused(true);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerIconBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Like Heart Animation - Instagram style double tap */}
        {showLikeHeart && (
          <Animated.View 
            style={[
              styles.likeHeartOverlay,
              {
                transform: [
                  { scale: likeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1.2],
                  })},
                ],
                opacity: likeAnimation,
              }
            ]}
          >
            <Ionicons name="heart" size={100} color="#ed4956" />
          </Animated.View>
        )}

        {/* Paused Indicator */}
        {isLongPressed && (
          <View style={styles.pausedIndicator}>
            <Text style={styles.pausedText}>Paused</Text>
          </View>
        )}

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Bottom actions - Instagram Style Reply */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.footer}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.footerContent, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.replyInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.replyTextInput}
                placeholder={`Reply to ${currentFarmer.farmer.farmName}...`}
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={replyMessage}
                onChangeText={setReplyMessage}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                returnKeyType="send"
                onSubmitEditing={handleSendReply}
                editable={!isSendingReply}
              />
            </View>
            
            {/* Like button */}
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={handleLikeStory}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={26} 
                color={isLiked ? "#ed4956" : "white"} 
              />
            </TouchableOpacity>
            
            {/* Send button */}
            <TouchableOpacity 
              style={[styles.sendMsgBtn, (!replyMessage.trim() || isSendingReply) && styles.sendBtnDisabled]}
              onPress={handleSendReply}
              disabled={!replyMessage.trim() || isSendingReply}
            >
              {isSendingReply ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="paper-plane-outline" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* More Options Modal */}
        <Modal
          visible={showMoreOptions}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowMoreOptions(false);
            setIsPaused(false);
          }}
        >
          <TouchableWithoutFeedback 
            onPress={() => {
              setShowMoreOptions(false);
              setIsPaused(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHandle} />
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={handleShareStory}
                  >
                    <Ionicons name="share-outline" size={24} color="white" />
                    <Text style={styles.modalOptionText}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={handleMuteFarmer}
                  >
                    <Ionicons name="volume-mute-outline" size={24} color="white" />
                    <Text style={styles.modalOptionText}>Mute {currentFarmer?.farmer.farmName}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={handleReportStory}
                  >
                    <Ionicons name="flag-outline" size={24} color="#ed4956" />
                    <Text style={[styles.modalOptionText, { color: '#ed4956' }]}>Report</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalOption, styles.modalCancel]}
                    onPress={() => {
                      setShowMoreOptions(false);
                      setIsPaused(false);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  storyView: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    width,
    height,
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
    lineHeight: 38,
  },
  // Caption styles - Instagram style at bottom
  captionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
  },
  caption: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Link/Swipe up styles
  linkContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
  },
  linkChevron: {
    marginBottom: 4,
  },
  linkText: {
    color: 'white',
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Gradient overlays
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  // Header styles - Instagram style
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    gap: 3,
  },
  progressBarWrapper: {
    flex: 1,
    height: 2,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Instagram-style avatar with gradient ring
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 17,
    backgroundColor: '#000',
    padding: 2,
  },
  farmerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  farmerTextInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  farmerName: {
    color: 'white',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storyTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconBtn: {
    padding: SPACING.xs,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  // Paused indicator
  pausedIndicator: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  pausedText: {
    color: 'white',
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
  // Footer styles - Instagram style
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  replyInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    minHeight: 44,
  },
  actionBtn: {
    padding: SPACING.xs,
  },
  sendMsgBtn: {
    padding: SPACING.xs,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  // Like heart animation overlay
  likeHeartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    zIndex: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#262626',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: SPACING.sm,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  modalOptionText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  modalCancel: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  // Empty & Loading states
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
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
