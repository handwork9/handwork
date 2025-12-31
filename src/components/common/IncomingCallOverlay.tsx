/**
 * IncomingCallOverlay
 * Global overlay that appears when there's an incoming call
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { videoCallService, IncomingCallData, CallState } from '../../services/videoCallService';
import { FONTS, FONT_SIZES, SPACING } from '../../constants/theme';
import { BuyerStackParamList, FarmerStackParamList, RiderStackParamList } from '../../types';

type AnyStackParamList = BuyerStackParamList | FarmerStackParamList | RiderStackParamList;

export default function IncomingCallOverlay() {
  const navigation = useNavigation<NavigationProp<AnyStackParamList>>();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callState, setCallState] = useState<CallState>(videoCallService.getState());
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Connect to video call service (async)
    videoCallService.connect().catch(err => {
      console.warn('[IncomingCallOverlay] Failed to connect:', err);
    });

    // Listen for incoming calls
    const unsubscribeIncoming = videoCallService.onIncomingCall((data) => {
      setIncomingCall(data);
      startVibration();
    });

    // Listen for call state changes
    const unsubscribeState = videoCallService.onStateChange((state) => {
      setCallState(state);
      if (state.status !== 'ringing') {
        setIncomingCall(null);
        stopVibration();
      }
    });

    return () => {
      unsubscribeIncoming();
      unsubscribeState();
    };
  }, []);

  // Pulse animation for call button
  useEffect(() => {
    if (incomingCall) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [incomingCall]);

  const startVibration = () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 500], true);
    } else {
      // iOS - use pattern
      const pattern = [0, 500, 500, 500, 500, 500];
      Vibration.vibrate(pattern, true);
    }
  };

  const stopVibration = () => {
    Vibration.cancel();
  };

  const handleAnswer = () => {
    stopVibration();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to video call screen
    navigation.navigate('VideoCall' as any, {
      userId: incomingCall?.callerId,
      userName: incomingCall?.callerName,
      userAvatar: incomingCall?.callerAvatar,
      callType: incomingCall?.type,
      isIncoming: true,
    });
    
    setIncomingCall(null);
  };

  const handleDecline = () => {
    stopVibration();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    videoCallService.declineCall();
    setIncomingCall(null);
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={60} color="#FFF" />
            </View>
          </View>

          {/* Caller info */}
          <Text style={styles.callerName}>{incomingCall.callerName}</Text>
          <Text style={styles.callType}>
            Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call
          </Text>

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Decline */}
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
            >
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
              <Text style={styles.actionLabel}>Decline</Text>
            </TouchableOpacity>

            {/* Answer */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.answerButton]}
                onPress={handleAnswer}
              >
                <MaterialCommunityIcons 
                  name={incomingCall.type === 'video' ? 'video' : 'phone'} 
                  size={32} 
                  color="#FFF" 
                />
                <Text style={styles.actionLabel}>Answer</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  avatarContainer: {
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  callerName: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  callType: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.xxl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxl * 2,
    marginTop: SPACING.xl,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  answerButton: {
    backgroundColor: '#22C55E',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: '#FFF',
    marginTop: SPACING.xs,
    position: 'absolute',
    bottom: -24,
  },
});
