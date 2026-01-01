import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';

// Dynamic import for Agora - only available in development builds
let RtcSurfaceView: any = null;
let VideoSourceType: any = { VideoSourceCamera: 0 };
let isAgoraAvailable = false;
try {
  const agora = require('react-native-agora');
  RtcSurfaceView = agora.RtcSurfaceView;
  VideoSourceType = agora.VideoSourceType;
  isAgoraAvailable = true;
} catch (e) {
  console.log('[LiveStreamsScreen] Agora not available - running in Expo Go');
}
import { useTheme } from '../../context/ThemeContext';
import { socialService, LiveStream } from '../../services/socialService';
import { API_CONFIG } from '../../constants/config';
import { useAppSelector } from '../../store';
import agoraService from '../../services/agoraService';

const { width } = Dimensions.get('window');

interface ChatMessage {
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

// Live Stream Card Component
const LiveStreamCard = ({ 
  stream, 
  onPress 
}: { 
  stream: LiveStream; 
  onPress: () => void 
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.streamCard, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={styles.streamThumbnailContainer}>
        {stream.thumbnailUrl ? (
          <Image source={{ uri: stream.thumbnailUrl }} style={styles.streamThumbnail} />
        ) : (
          <View style={[styles.streamThumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="videocam" size={40} color="white" />
          </View>
        )}
        
        {/* Live badge */}
        {stream.status === 'live' && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        
        {/* Viewer count */}
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={14} color="white" />
          <Text style={styles.viewerCount}>{stream.viewerCount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.streamInfo}>
        <View style={styles.streamHeader}>
          {stream.farmer.user.avatar ? (
            <Image source={{ uri: stream.farmer.user.avatar }} style={styles.farmerAvatar} />
          ) : (
            <View style={[styles.farmerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{stream.farmer.farmName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.streamTextInfo}>
            <Text 
              style={[styles.streamTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {stream.title}
            </Text>
            <Text style={[styles.farmerName, { color: colors.textSecondary }]}>
              {stream.farmer.farmName}
            </Text>
          </View>
        </View>
        
        {stream.tags && stream.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {stream.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Live Stream Viewer Component
const LiveStreamViewer = ({
  stream,
  onClose,
}: {
  stream: LiveStream;
  onClose: () => void;
}) => {
  const { user } = useAppSelector(state => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [isAgoraReady, setIsAgoraReady] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize Agora as viewer
    const initAgoraViewer = async () => {
      try {
        // Use stream ID as channel name to join the broadcaster's channel
        const joined = await agoraService.joinAsViewer(stream.id);
        if (joined) {
          setIsAgoraReady(true);
        }

        // Listen for remote user (broadcaster) joining
        agoraService.onRemoteUserJoined((uid) => {
          console.log('Broadcaster joined with uid:', uid);
          setRemoteUid(uid);
        });

        agoraService.onRemoteUserLeft((uid) => {
          console.log('Broadcaster left:', uid);
          setRemoteUid(null);
        });
      } catch (error) {
        console.error('Failed to join as viewer:', error);
      }
    };

    initAgoraViewer();

    // Connect to live stream socket for chat
    socketRef.current = io(`${API_CONFIG.WS_URL}/live`, {
      transports: ['websocket'],
    });

    socketRef.current.emit('join_stream', {
      streamId: stream.id,
      userId: user?.id,
      username: user?.name || 'Anonymous',
    });

    socketRef.current.on('chat_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('viewer_joined', (data: any) => {
      console.log('Viewer joined:', data.viewerCount);
    });

    socketRef.current.on('viewer_left', (data: any) => {
      console.log('Viewer left:', data.viewerCount);
    });

    socketRef.current.on('product_pinned', (data: any) => {
      Alert.alert('Product Featured', `${data.productName} - ₦${data.productPrice}`);
    });

    socketRef.current.on('stream_ended', () => {
      Alert.alert('Stream Ended', 'This live stream has ended.');
      onClose();
    });

    return () => {
      // Leave Agora channel
      agoraService.leaveChannel();
      setIsAgoraReady(false);
      setRemoteUid(null);
      
      if (socketRef.current) {
        socketRef.current.emit('leave_stream', { streamId: stream.id });
        socketRef.current.disconnect();
      }
    };
  }, [stream.id, user]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('stream_chat', {
      streamId: stream.id,
      userId: user?.id || 'anonymous',
      username: user?.name || 'Anonymous',
      message: inputMessage.trim(),
    });

    setInputMessage('');
  };

  const sendReaction = (reaction: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('stream_reaction', {
      streamId: stream.id,
      reaction,
      userId: user?.id,
    });
  };

  return (
    <View style={styles.viewerContainer}>
      {/* Live video from broadcaster using Agora */}
      <View style={styles.videoContainer}>
        {isAgoraReady && remoteUid ? (
          <RtcSurfaceView
            canvas={{ 
              uid: remoteUid,
              sourceType: VideoSourceType.VideoSourceRemote,
            }}
            style={styles.remoteVideo}
          />
        ) : (
          <View style={[styles.videoPlaceholder, { backgroundColor: '#000' }]}>
            {stream.thumbnailUrl ? (
              <Image source={{ uri: stream.thumbnailUrl }} style={styles.loadingThumbnail} />
            ) : null}
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.streamingText}>
                {isAgoraReady ? 'Waiting for broadcaster...' : 'Connecting to stream...'}
              </Text>
            </View>
          </View>
        )}

        {/* Overlay controls */}
        <SafeAreaView style={styles.viewerOverlay}>
          {/* Header */}
          <View style={styles.viewerHeader}>
            <View style={styles.viewerHeaderLeft}>
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <View style={styles.viewerBadge}>
                <Ionicons name="eye" size={14} color="white" />
                <Text style={styles.viewerCount}>{stream.viewerCount}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeViewerBtn}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Farmer info */}
          <View style={styles.viewerFarmerInfo}>
            {stream.farmer.user.avatar ? (
              <Image source={{ uri: stream.farmer.user.avatar }} style={styles.viewerFarmerAvatar} />
            ) : (
              <View style={[styles.viewerFarmerAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{stream.farmer.farmName.charAt(0)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.viewerFarmerName}>{stream.farmer.farmName}</Text>
              <Text style={styles.viewerStreamTitle}>{stream.title}</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Chat overlay */}
        {showChat && (
          <View style={styles.chatOverlay}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.chatMessage}>
                  <Text style={styles.chatUsername}>{item.username}:</Text>
                  <Text style={styles.chatText}>{item.message}</Text>
                </View>
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Bottom controls */}
        <SafeAreaView style={styles.viewerFooter} edges={['bottom']}>
          {/* Reactions */}
          <View style={styles.reactionsRow}>
            {['❤️', '🔥', '👏', '😍', '🎉'].map((emoji) => (
              <TouchableOpacity 
                key={emoji} 
                style={styles.reactionBtn}
                onPress={() => sendReaction(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.toggleChatBtn}
              onPress={() => setShowChat(!showChat)}
            >
              <Ionicons 
                name={showChat ? 'chatbubble' : 'chatbubble-outline'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Chat input */}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Say something..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

// Main Live Streams Screen
const LiveStreamsScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');

  // Fetch live streams
  const { data: liveData, isLoading: loadingLive } = useQuery({
    queryKey: ['live-streams'],
    queryFn: () => socialService.getLiveStreams(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch upcoming streams
  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcoming-streams'],
    queryFn: () => socialService.getUpcomingStreams(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['live-streams'] });
    await queryClient.invalidateQueries({ queryKey: ['upcoming-streams'] });
    setRefreshing(false);
  }, []);

  const renderStreamCard = ({ item }: { item: LiveStream }) => (
    <LiveStreamCard 
      stream={item} 
      onPress={() => setSelectedStream(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'live' ? 'videocam-off-outline' : 'calendar-outline'} 
        size={64} 
        color={isDark ? '#555' : '#ccc'} 
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {activeTab === 'live' ? 'No Live Streams' : 'No Upcoming Streams'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {activeTab === 'live' 
          ? 'Check back later for live farm tours and product showcases'
          : 'Follow more farmers to see their scheduled streams'}
      </Text>
    </View>
  );

  if (selectedStream) {
    return (
      <LiveStreamViewer 
        stream={selectedStream} 
        onClose={() => setSelectedStream(null)} 
      />
    );
  }

  const isLoading = activeTab === 'live' ? loadingLive : loadingUpcoming;
  const streams = activeTab === 'live' ? liveData?.streams : upcomingData?.streams;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Live Streams
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'live' && styles.activeTab]}
          onPress={() => setActiveTab('live')}
        >
          <View style={styles.tabContent}>
            {activeTab === 'live' && <View style={styles.liveIndicator} />}
            <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
              Live Now
            </Text>
            {liveData && liveData.streams.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{liveData.streams.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={streams || []}
          keyExtractor={(item) => item.id}
          renderItem={renderStreamCard}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: FONTS.bold,
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
  // Stream Card
  streamCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  streamThumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  viewerBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  streamInfo: {
    padding: SPACING.md,
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  farmerAvatar: {
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
  avatarText: {
    color: 'white',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  streamTextInfo: {
    flex: 1,
  },
  streamTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  farmerName: {
    fontSize: FONT_SIZES.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
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
  // Viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamingText: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.md,
  },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  viewerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  closeViewerBtn: {
    padding: SPACING.xs,
  },
  viewerFarmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  viewerFarmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  viewerFarmerName: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  viewerStreamTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.sm,
  },
  chatOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 200,
    paddingHorizontal: SPACING.md,
  },
  chatMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 4,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  chatUsername: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginRight: 4,
  },
  chatText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    flexShrink: 1,
  },
  viewerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 22,
  },
  toggleChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  chatInput: {
    flex: 1,
    height: 44,
    color: 'white',
    fontSize: FONT_SIZES.md,
  },
  sendBtn: {
    padding: SPACING.xs,
  },
});

export default LiveStreamsScreen;
