/**
 * VideoCallScreen
 * Full-screen video/audio call interface
 * 
 * NOTE: Requires react-native-webrtc which only works in development builds,
 * not in Expo Go.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { videoCallService, CallState, CallType } from '../../services/videoCallService';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '../../constants/theme';
import { BuyerStackParamList } from '../../types';

// Lazy-load RTCView to avoid crashes in Expo Go
let RTCView: any = null;
try {
  RTCView = require('react-native-webrtc').RTCView;
} catch (error) {
  console.warn('react-native-webrtc RTCView not available');
}

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
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onPress,
  isActive = false,
  isDestructive = false,
  size = 'normal',
  disabled = false,
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
      <MaterialCommunityIcons name={icon as any} size={iconSize} color={iconColor} />
      {label && <Text style={[styles.controlLabel, { color: '#FFFFFF' }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

export default function VideoCallScreen() {
  const navigation = useNavigation<VideoCallScreenNavigationProp>();
  const route = useRoute<VideoCallScreenRouteProp>();
  const { colors } = useTheme();

  const { userId, userName, userAvatar, callType = 'video', isIncoming = false } = route.params || {};

  const [callState, setCallState] = useState<CallState>(videoCallService.getState());
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Check if WebRTC is available
  if (!RTCView) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#1C1C1E' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <View style={styles.unavailableContainer}>
          <MaterialCommunityIcons name="video-off" size={64} color="#666" />
          <Text style={styles.unavailableTitle}>Video Calls Not Available</Text>
          <Text style={styles.unavailableText}>
            Video calling requires a development build.{'\n'}
            It is not supported in Expo Go.
          </Text>
          <TouchableOpacity
            style={styles.unavailableButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.unavailableButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Subscribe to call state changes
  useEffect(() => {
    const unsubscribe = videoCallService.onStateChange(setCallState);
    
    // Start or answer call
    if (isIncoming) {
      // Will answer when user taps accept
    } else if (userId) {
      startOutgoingCall();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-hide controls after 5 seconds when connected
  useEffect(() => {
    if (callState.status === 'connected' && showControls) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [callState.status, showControls]);

  // Handle call ended - navigate back
  useEffect(() => {
    if (callState.status === 'ended') {
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState.status]);

  // Vibrate for incoming call
  useEffect(() => {
    if (isIncoming && callState.status === 'ringing') {
      const pattern = [0, 500, 500, 500, 500, 500];
      Vibration.vibrate(pattern, true);
      
      return () => Vibration.cancel();
    }
  }, [isIncoming, callState.status]);

  const startOutgoingCall = async () => {
    try {
      await videoCallService.startCall(userId!, callType as CallType);
    } catch (error: any) {
      Alert.alert('Call Failed', error.message || 'Could not start call');
      navigation.goBack();
    }
  };

  const handleAnswer = async () => {
    try {
      Vibration.cancel();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await videoCallService.answerCall();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not answer call');
    }
  };

  const handleDecline = () => {
    Vibration.cancel();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    videoCallService.declineCall();
    navigation.goBack();
  };

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    videoCallService.endCall();
  };

  const handleToggleAudio = () => {
    Haptics.selectionAsync();
    videoCallService.toggleAudio();
  };

  const handleToggleVideo = () => {
    Haptics.selectionAsync();
    videoCallService.toggleVideo();
  };

  const handleSwitchCamera = () => {
    Haptics.selectionAsync();
    videoCallService.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  };

  const handleToggleSpeaker = () => {
    Haptics.selectionAsync();
    videoCallService.toggleSpeaker();
  };

  const toggleControls = () => {
    if (callState.status === 'connected') {
      setShowControls(!showControls);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Incoming call...';
      case 'connected':
        return formatDuration(callState.duration);
      case 'ended':
        return callState.error || 'Call ended';
      default:
        return '';
    }
  };

  const displayName = callState.remoteUserName || userName || 'Unknown';

  // Render incoming call UI
  if (isIncoming && callState.status === 'ringing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.incomingCallContainer}>
          {/* Avatar placeholder */}
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="account" size={80} color="#FFF" />
          </View>

          <Text style={styles.callerName}>{displayName}</Text>
          <Text style={styles.callTypeText}>
            Incoming {callState.type === 'video' ? 'Video' : 'Audio'} Call
          </Text>

          {/* Answer/Decline buttons */}
          <View style={styles.incomingCallActions}>
            <View style={styles.incomingCallButton}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleDecline}
              >
                <MaterialCommunityIcons name="phone-hangup" size={36} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            <View style={styles.incomingCallButton}>
              <TouchableOpacity
                style={[styles.actionButton, styles.answerButton]}
                onPress={handleAnswer}
              >
                <MaterialCommunityIcons 
                  name={callState.type === 'video' ? 'video' : 'phone'} 
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
      {callState.remoteStream && callState.type === 'video' ? (
        <RTCView
          streamURL={(callState.remoteStream as any).toURL?.() || ''}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.audioCallBackground}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="account" size={80} color="#FFF" />
          </View>
          <Text style={styles.audioCallName}>{displayName}</Text>
        </View>
      )}

      {/* Local video (picture-in-picture) */}
      {callState.localStream && callState.type === 'video' && callState.isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={(callState.localStream as any).toURL?.() || ''}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera}
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

          {callState.type === 'video' && (
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
          {callState.status === 'connected' ? (
            <View style={styles.controlsRow}>
              <ControlButton
                icon={callState.isAudioEnabled ? 'microphone' : 'microphone-off'}
                onPress={handleToggleAudio}
                isActive={!callState.isAudioEnabled}
              />

              {callState.type === 'video' && (
                <ControlButton
                  icon={callState.isVideoEnabled ? 'video' : 'video-off'}
                  onPress={handleToggleVideo}
                  isActive={!callState.isVideoEnabled}
                />
              )}

              <ControlButton
                icon="phone-hangup"
                onPress={handleEndCall}
                isDestructive
                size="large"
              />

              <ControlButton
                icon={callState.isSpeakerOn ? 'volume-high' : 'volume-off'}
                onPress={handleToggleSpeaker}
                isActive={!callState.isSpeakerOn}
              />

              {callState.type === 'video' && (
                <ControlButton
                  icon="camera-flip"
                  onPress={handleSwitchCamera}
                />
              )}
            </View>
          ) : callState.status === 'calling' ? (
            <View style={styles.controlsRow}>
              <ControlButton
                icon="phone-hangup"
                onPress={handleEndCall}
                isDestructive
                size="large"
              />
            </View>
          ) : callState.status === 'ended' ? (
            <View style={styles.endedContainer}>
              <MaterialCommunityIcons 
                name={callState.error ? 'phone-missed' : 'phone-hangup'} 
                size={48} 
                color="#FFF" 
              />
              <Text style={styles.endedText}>
                {callState.error || 'Call Ended'}
              </Text>
              {callState.duration > 0 && (
                <Text style={styles.durationText}>
                  Duration: {(videoCallService.constructor as any).formatDuration?.(callState.duration) || 
                    `${Math.floor(callState.duration / 60)}:${(callState.duration % 60).toString().padStart(2, '0')}`}
                </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  audioCallName: {
    fontSize: 28,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
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
  // Unavailable styles (for Expo Go)
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  unavailableTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  unavailableButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
});
