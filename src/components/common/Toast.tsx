import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export type ToastType = 'info' | 'success' | 'warning' | 'promo' | 'error';

interface ToastProps {
  visible: boolean;
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  onPress?: () => void;
}

const toastConfig: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
  info: { bg: '#2563EB', icon: 'information-circle', iconColor: '#fff' },
  success: { bg: '#16A34A', icon: 'checkmark-circle', iconColor: '#fff' },
  warning: { bg: '#F59E0B', icon: 'warning', iconColor: '#fff' },
  promo: { bg: '#9333EA', icon: 'gift', iconColor: '#fff' },
  error: { bg: '#DC2626', icon: 'close-circle', iconColor: '#fff' },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  title,
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  onPress,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.bg }]}
        activeOpacity={0.9}
        onPress={onPress || hideToast}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon as any} size={28} color={config.iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
});

export default Toast;
