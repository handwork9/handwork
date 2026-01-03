import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  size?: number;
  style?: any;
}

export default function VoiceSearchButton({ onResult, size = 40, style }: VoiceSearchButtonProps) {
  const { colors, isDark } = useTheme();
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceSearch();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  // Send result when transcript changes and we stop listening
  useEffect(() => {
    if (!isListening && transcript) {
      onResult(transcript);
      clearTranscript();
    }
  }, [isListening, transcript]);

  const handlePress = async () => {
    triggerHaptic();
    
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDark ? colors.card : '#F2F2F7' }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={size * 0.5}
            color={isListening ? colors.primary : colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Listening Modal */}
      <Modal
        visible={isListening}
        transparent
        animationType="fade"
        onRequestClose={stopListening}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={stopListening}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Animated waves */}
            <View style={styles.wavesContainer}>
              {[...Array(3)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.wave,
                    {
                      backgroundColor: colors.primary,
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3 - index * 0.1, 0],
                      }),
                      transform: [
                        {
                          scale: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2 + index * 0.5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
              
              <TouchableOpacity 
                style={[styles.micButton, { backgroundColor: colors.primary }]}
                onPress={stopListening}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.listeningText, { color: colors.text }]}>
              Listening...
            </Text>

            {transcript ? (
              <Text style={[styles.transcriptText, { color: colors.textSecondary }]}>
                "{transcript}"
              </Text>
            ) : (
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Say a product name to search
              </Text>
            )}

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={stopListening}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Tap to stop</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  wavesContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wave: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    marginBottom: 20,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
  },
});
