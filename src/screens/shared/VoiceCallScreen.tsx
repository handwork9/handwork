/**
 * VoiceCallScreen
 * Audio-only call interface using Agora SDK
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Vibration,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import callService, { CallStatus } from '../../services/callService';
import { FONTS, FONT_SIZES, SPACING } from '../../constants/theme';
import { BuyerStackParamList } from '../../types';

type VoiceCallScreenNavigationProp = NativeStackNavigationProp<BuyerStackParamList, 'VoiceCall'>;
type VoiceCallScreenRouteProp = RouteProp<BuyerStackParamList, 'VoiceCall'>;

interface ControlButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  size?: 'normal' | 'large';
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onPress,
  isActive = false,
  isDestructive = false,
  size = 'normal',
}) => {
  const buttonSize = size === 'large' ? 70 : 60;
  const iconSize = size === 'large' ? 32 : 28;

  const backgroundColor = isDestructive
    ? '#EF4444'
    : isActive
    ? '#FFFFFF'
    : 'rgba(255, 255, 255, 0.15)';

  const iconColor = isDestructive
    ? '#FFFFFF'
    : isActive
    ? '#1A1A2E'
    : '#FFFFFF';

  return (
    <TouchableOpacity style={styles.controlButtonContainer} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.controlButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function VoiceCallScreen() {
  const navigation = useNavigation<VoiceCallScreenNavigationProp>();
  const route = useRoute<VoiceCallScreenRouteProp>();

  const { userId, userName, userAvatar, isIncoming = false, channelName } = route.params || {};

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  // Animation for pulsing avatar
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Pulse animation for calling state
    if (callStatus === 'calling' || callStatus === 'ringing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callStatus]);

  // Initialize call
  useEffect(() => {
    const initCall = async () => {
      callService.setCallbacks({
        onRemoteUserJoined: (uid) => {
          console.log('Remote user joined:', uid);
          setCallStatus('connected');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onRemoteUserLeft: () => {
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
        const success = await callService.joinCall(
          'voice',
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
        const result = await callService.startCall(
          'voice',
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

  const handleAnswer = useCallback(() => {
    Vibration.cancel();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCallStatus('connected');
  }, []);

  const handleToggleMute = useCallback(async () => {
    Haptics.selectionAsync();
    const newMuted = await callService.toggleMute();
    setIsMuted(newMuted);
  }, []);

  const handleToggleSpeaker = useCallback(async () => {
    Haptics.selectionAsync();
    const newSpeaker = await callService.toggleSpeaker();
    setIsSpeakerOn(newSpeaker);
  }, []);

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
        return 'Incoming voice call';
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Call ended';
      default:
        return 'Connecting...';
    }
  };

  const displayName = userName || 'Unknown';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      
      <SafeAreaView style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={80} color="#FFF" />
              </View>
            )}
          </Animated.View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          
          {(callStatus === 'calling' || callStatus === 'idle') && (
            <ActivityIndicator size="small" color="white" style={{ marginTop: SPACING.md }} />
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {isIncoming && callStatus === 'ringing' ? (
            // Incoming call controls
            <View style={styles.incomingControls}>
              <ControlButton
                icon="phone-hangup"
                label="Decline"
                onPress={handleEndCall}
                isDestructive
                size="large"
              />
              <ControlButton
                icon="phone"
                label="Answer"
                onPress={handleAnswer}
                isActive
                size="large"
              />
            </View>
          ) : (
            // Active call controls
            <>
              <View style={styles.controlsRow}>
                <ControlButton
                  icon={isMuted ? 'microphone-off' : 'microphone'}
                  label={isMuted ? 'Unmute' : 'Mute'}
                  onPress={handleToggleMute}
                  isActive={isMuted}
                />
                <ControlButton
                  icon={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  label="Speaker"
                  onPress={handleToggleSpeaker}
                  isActive={isSpeakerOn}
                />
                <ControlButton
                  icon="dialpad"
                  label="Keypad"
                  onPress={() => {}}
                />
              </View>

              <TouchableOpacity
                style={styles.endCallButton}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="phone-hangup" size={36} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
  },
  userInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: SPACING.lg,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  controlsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xxl,
  },
  controlButtonContainer: {
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  controlLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#FFF',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
  },
});
