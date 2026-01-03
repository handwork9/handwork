import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

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

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
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
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = useCallback(async () => {
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
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e: any) {
      setError(e.message || 'Failed to stop voice recognition');
    }
  }, []);

  const cancelListening = useCallback(async () => {
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
