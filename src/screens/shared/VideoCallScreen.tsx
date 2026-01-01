/**
 * VideoCallScreen
 * Full-screen video/audio call interface using Agora SDK
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Vibration,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, SPACING, COLORS } from '../../constants/theme';
import { BuyerStackParamList } from '../../types';
import callService, { isCallServiceAvailable } from '../../services/callService';

// Try to import Agora components - will fail in Expo Go
let RtcSurfaceView: any = null;
let VideoSourceType: any = null;

try {
  const agora = require('react-native-agora');
  RtcSurfaceView = agora.RtcSurfaceView;
  VideoSourceType = agora.VideoSourceType;
} catch (e) {
  console.log('[VideoCallScreen] Agora components not available - running in Expo Go');
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'video' | 'voice';

type VideoCallScreenNavigationProp = NativeStackNavigationProp<BuyerStackParamList, 'VideoCall'>;
type VideoCallScreenRouteProp = RouteProp<BuyerStackParamList, 'VideoCall'>;

interface ControlButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  size?: 'normal' | 'large';
  disabled?: boolean;
  iconType?: 'material' | 'ionicons';
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onPress,
  isActive = false,
  isDestructive = false,
  size = 'normal',
  disabled = false,
  iconType = 'material',
}) => {
  const buttonSize = size === 'large' ? 70 : 56;
  const iconSize = size === 'large' ? 32 : 24;

  const backgroundColor = isDestructive
    ? '#EF4444'
    : isActive
    ? '#FFFFFF'
    : 'rgba(255, 255, 255, 0.2)';

  const iconColor = isDestructive
    ? '#FFFFFF'
    : isActive
    ? '#000000'
    : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        styles.controlButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {iconType === 'ionicons' ? (
        <Ionicons name={icon as any} size={iconSize} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={iconColor} />
      )}
      {label && <Text style={[styles.controlLabel, { color: '#FFFFFF' }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

export default function VideoCallScreen() {
  const navigation = useNavigation<VideoCallScreenNavigationProp>();
  const route = useRoute<VideoCallScreenRouteProp>();
  const { colors } = useTheme();

  const { userId, userName, userAvatar, callType = 'video', isIncoming = false, channelName } = route.params || {};

  // Show message if Agora is not available (Expo Go)
  if (!isCallServiceAvailable()) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <SafeAreaView style={styles.unavailableContainer}>
          <MaterialCommunityIcons name="video-off" size={80} color="#FFF" />
          <Text style={styles.unavailableTitle}>Video Calls Unavailable</Text>
          <Text style={styles.unavailableText}>
            Video and voice calls require a development build.{'\n'}
            They are not supported in Expo Go.
          </Text>
          <TouchableOpacity 
            style={styles.unavailableButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.unavailableButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Initialize call
  useEffect(() => {
    const initCall = async () => {
      // Setup callbacks
      callService.setCallbacks({
        onRemoteUserJoined: (uid) => {
          console.log('Remote user joined:', uid);
          setRemoteUid(uid);
          setCallStatus('connected');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onRemoteUserLeft: (uid) => {
          console.log('Remote user left:', uid);
          setRemoteUid(null);
          handleEndCall();
        },
        onCallConnected: () => {
          setCallStatus('connected');
        },
        onCallEnded: () => {
          navigation.goBack();
        },
        onCallFailed: (error) => {
          Alert.alert('Call Failed', error);
          navigation.goBack();
        },
        onDurationUpdate: (dur) => {
          setDuration(dur);
        },
      });

      if (isIncoming && channelName) {
        // Join incoming call
        const success = await callService.joinCall(
          (callType as CallType) || 'video',
          channelName,
          userName || 'Unknown',
          userAvatar
        );
        if (!success) {
          Alert.alert('Error', 'Failed to join call');
          navigation.goBack();
          return;
        }
        setCallStatus('ringing');
      } else if (userId) {
        // Start outgoing call
        const result = await callService.startCall(
          (callType as CallType) || 'video',
          userId,
          userName || 'Unknown',
          userAvatar
        );
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to start call');
          navigation.goBack();
          return;
        }
        setCallStatus('calling');
      }
    };

    initCall();

    return () => {
      callService.endCall();
    };
  }, []);

  // Auto-hide controls after 5 seconds when connected
  useEffect(() => {
    if (callStatus === 'connected' && showControls) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [callStatus, showControls]);

  // Vibrate for incoming call
  useEffect(() => {
    if (isIncoming && callStatus === 'ringing') {
      const pattern = [0, 500, 500, 500, 500, 500];
      Vibration.vibrate(pattern, true);
      return () => Vibration.cancel();
    }
  }, [isIncoming, callStatus]);

  const handleEndCall = useCallback(async () => {
    Vibration.cancel();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await callService.endCall();
    navigation.goBack();
  }, [navigation]);

  const handleToggleMute = useCallback(async () => {
    Haptics.selectionAsync();
    const newMuted = await callService.toggleMute();
    setIsMuted(newMuted);
  }, []);

  const handleToggleVideo = useCallback(async () => {
    Haptics.selectionAsync();
    const newEnabled = await callService.toggleVideo();
    setIsVideoEnabled(newEnabled);
  }, []);

  const handleSwitchCamera = useCallback(async () => {
    Haptics.selectionAsync();
    await callService.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  }, [isFrontCamera]);

  const handleToggleSpeaker = useCallback(async () => {
    Haptics.selectionAsync();
    const newSpeaker = await callService.toggleSpeaker();
    setIsSpeakerOn(newSpeaker);
  }, []);

  const toggleControls = () => {
    if (callStatus === 'connected') {
      setShowControls(!showControls);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Incoming call...';
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Call ended';
      default:
        return 'Connecting...';
    }
  };

  const displayName = userName || 'Unknown';

  // Render incoming call UI
  if (isIncoming && callStatus === 'ringing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.incomingCallContainer}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarLarge} />
          ) : (
            <View style={[styles.avatarLarge, styles.avatarPlaceholderLarge]}>
              <MaterialCommunityIcons name="account" size={80} color="#FFF" />
            </View>
          )}

          <Text style={styles.callerName}>{displayName}</Text>
          <Text style={styles.callTypeText}>
            Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
          </Text>

          {/* Answer/Decline buttons */}
          <View style={styles.incomingCallActions}>
            <View style={styles.incomingCallButton}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleEndCall}
              >
                <MaterialCommunityIcons name="phone-hangup" size={36} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            <View style={styles.incomingCallButton}>
              <TouchableOpacity
                style={[styles.actionButton, styles.answerButton]}
                onPress={() => setCallStatus('connected')}
              >
                <MaterialCommunityIcons 
                  name={callType === 'video' ? 'video' : 'phone'} 
                  size={36} 
                  color="#FFF" 
                />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Answer</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render active call UI
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1}
      onPress={toggleControls}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Remote video (full screen) */}
      {remoteUid && callType === 'video' ? (
        <RtcSurfaceView
          canvas={{
            uid: remoteUid,
            sourceType: VideoSourceType.VideoSourceRemote,
          }}
          style={styles.remoteVideo}
        />
      ) : (
        <View style={styles.audioCallBackground}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarLarge} />
          ) : (
            <View style={[styles.avatarLarge, styles.avatarPlaceholderLarge]}>
              <MaterialCommunityIcons name="account" size={80} color="#FFF" />
            </View>
          )}
          <Text style={styles.audioCallName}>{displayName}</Text>
          <Text style={styles.audioCallStatus}>{getStatusText()}</Text>
          {callStatus === 'calling' && (
            <ActivityIndicator size="small" color="white" style={{ marginTop: 16 }} />
          )}
        </View>
      )}

      {/* Local video (picture-in-picture) */}
      {callType === 'video' && isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView
            canvas={{ uid: 0 }}
            style={styles.localVideo}
          />
        </View>
      )}

      {/* Top bar */}
      {showControls && (
        <SafeAreaView style={styles.topBar} edges={['top']}>
          <TouchableOpacity 
            style={styles.minimizeButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-down" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.callInfo}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={24} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.callInfoText}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {callType === 'video' && (
            <TouchableOpacity 
              style={styles.switchCameraButton}
              onPress={handleSwitchCamera}
            >
              <MaterialCommunityIcons name="camera-flip" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      )}

      {/* Bottom controls */}
      {showControls && (
        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          {callStatus === 'connected' || callStatus === 'calling' ? (
            <View style={styles.controlsRow}>
              <ControlButton
                icon={isMuted ? 'microphone-off' : 'microphone'}
                onPress={handleToggleMute}
                isActive={isMuted}
              />

              {callType === 'video' && (
                <ControlButton
                  icon={isVideoEnabled ? 'video' : 'video-off'}
                  onPress={handleToggleVideo}
                  isActive={!isVideoEnabled}
                />
              )}

              <ControlButton
                icon="phone-hangup"
                onPress={handleEndCall}
                isDestructive
                size="large"
              />

              <ControlButton
                icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
                onPress={handleToggleSpeaker}
                isActive={!isSpeakerOn}
              />

              {callType === 'video' && (
                <ControlButton
                  icon="camera-flip"
                  onPress={handleSwitchCamera}
                />
              )}
            </View>
          ) : callStatus === 'ended' ? (
            <View style={styles.endedContainer}>
              <MaterialCommunityIcons name="phone-hangup" size={48} color="#FFF" />
              <Text style={styles.endedText}>Call Ended</Text>
              {duration > 0 && (
                <Text style={styles.durationText}>Duration: {formatDuration(duration)}</Text>
              )}
            </View>
          ) : null}
        </SafeAreaView>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  audioCallBackground: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: SPACING.lg,
  },
  avatarPlaceholderLarge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioCallName: {
    fontSize: 28,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  audioCallStatus: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: SPACING.md,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  localVideo: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  minimizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  callInfoText: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  switchCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  // Incoming call styles
  incomingCallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  callerName: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginBottom: SPACING.sm,
  },
  callTypeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.xxl,
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  incomingCallButton: {
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  answerButton: {
    backgroundColor: '#22C55E',
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#FFF',
  },
  // Ended call styles
  endedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  endedText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: '#FFF',
    marginTop: SPACING.md,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  // Unavailable styles (Expo Go)
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  unavailableTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  unavailableText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  unavailableButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  unavailableButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
});
