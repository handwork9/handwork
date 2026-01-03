import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';

// Try to import Voice, but handle the case when it's not available (Expo Go)
let Voice: any = null;
let isVoiceAvailable = false;

try {
  Voice = require('@react-native-voice/voice').default;
  isVoiceAvailable = true;
} catch (e) {
  // Voice module not available (likely running in Expo Go)
  console.log('Voice module not available - voice search disabled');
  isVoiceAvailable = false;
}

interface UseVoiceSearchReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelListening: () => Promise<void>;
  clearTranscript: () => void;
}

export function useVoiceSearch(): UseVoiceSearchReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!isVoiceAvailable || !Voice) {
      setIsSupported(false);
      return;
    }

    // Check if voice recognition is supported
    const checkSupport = async () => {
      try {
        const supported = await Voice.isAvailable();
        setIsSupported(!!supported);
      } catch (e) {
        setIsSupported(false);
      }
    };

    checkSupport();

    // Set up voice recognition event listeners
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechPartialResults = (e: any) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: any) => {
      setIsListening(false);
      const errorMessage = e.error?.message || 'Voice recognition error';
      setError(errorMessage);
      
      // Handle specific errors
      if (errorMessage.includes('permission') || errorMessage.includes('7/')) {
        Alert.alert(
          'Microphone Access Required',
          'Please enable microphone access in your device settings to use voice search.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    };

    // Cleanup
    return () => {
      if (Voice) {
        Voice.destroy().then(() => Voice.removeAllListeners());
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!isVoiceAvailable || !Voice) {
      Alert.alert(
        'Voice Search Unavailable',
        'Voice search requires a development build. It is not available in Expo Go.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setError(null);
      setTranscript('');
      await Voice.start('en-US');
    } catch (e: any) {
      setError(e.message || 'Failed to start voice recognition');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!isVoiceAvailable || !Voice) return;

    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e: any) {
      setError(e.message || 'Failed to stop voice recognition');
    }
  }, []);

  const cancelListening = useCallback(async () => {
    if (!isVoiceAvailable || !Voice) return;

    try {
      await Voice.cancel();
      setIsListening(false);
      setTranscript('');
    } catch (e: any) {
      setError(e.message || 'Failed to cancel voice recognition');
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  };
}
