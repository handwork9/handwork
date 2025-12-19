import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  orderNumber: string;
}

const CANCEL_REASONS = [
  { id: 'changed_mind', label: 'Changed my mind', icon: 'sync-outline' },
  { id: 'found_cheaper', label: 'Found a better price elsewhere', icon: 'pricetag-outline' },
  { id: 'wrong_items', label: 'Ordered wrong items', icon: 'alert-circle-outline' },
  { id: 'delivery_too_long', label: 'Delivery time too long', icon: 'time-outline' },
  { id: 'duplicate_order', label: 'Duplicate order', icon: 'copy-outline' },
  { id: 'other', label: 'Other reason', icon: 'chatbubble-outline' },
];

export default function CancelOrderModal({
  visible,
  onClose,
  onConfirm,
  orderNumber,
}: CancelOrderModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    const reason = selectedReason === 'other' 
      ? customReason || 'Other reason'
      : CANCEL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    setIsLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <View style={[
          styles.container,
          { 
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            paddingBottom: insets.bottom + 16,
          }
        ]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="close-circle" size={32} color="#E53935" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Cancel Order</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Order #{orderNumber}
            </Text>
          </View>

          {/* Reasons */}
          <ScrollView style={styles.reasonsContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Please select a reason for cancellation
            </Text>

            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  { 
                    backgroundColor: isDark ? colors.surface : '#F8F9FA',
                    borderColor: selectedReason === reason.id ? colors.primary : 'transparent',
                    borderWidth: selectedReason === reason.id ? 2 : 0,
                  }
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.reasonIcon,
                  { backgroundColor: isDark ? 'rgba(0,122,255,0.15)' : '#E5F1FF' }
                ]}>
                  <Ionicons name={reason.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.reasonText, { color: colors.text }]}>
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {/* Custom reason input */}
            {selectedReason === 'other' && (
              <TextInput
                style={[
                  styles.customInput,
                  { 
                    backgroundColor: isDark ? colors.surface : '#F8F9FA',
                    color: colors.text,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder="Please specify your reason..."
                placeholderTextColor={colors.textSecondary}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          {/* Warning */}
          <View style={[styles.warningContainer, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="warning" size={20} color="#E65100" />
            <Text style={styles.warningText}>
              This action cannot be undone. Refunds will be processed within 3-5 business days.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Keep Order
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { 
                  backgroundColor: selectedReason ? '#E53935' : '#BDBDBD',
                  opacity: isLoading ? 0.7 : 1,
                }
              ]}
              onPress={handleConfirm}
              disabled={!selectedReason || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  reasonsContainer: {
    maxHeight: 300,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: FONTS.regular,
    minHeight: 80,
    marginTop: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#E65100',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
});
