import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';

export type ContentType = 
  | 'product' 
  | 'review' 
  | 'social_post' 
  | 'farm_story' 
  | 'comment' 
  | 'user_profile' 
  | 'chat_message';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: ContentType;
  contentId: string;
  contentTitle?: string;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', icon: 'mail-unread-outline' },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'warning-outline' },
  { id: 'misleading', label: 'Misleading Information', icon: 'alert-circle-outline' },
  { id: 'harassment', label: 'Harassment or Bullying', icon: 'hand-left-outline' },
  { id: 'fake', label: 'Fake Product/Review', icon: 'close-circle-outline' },
  { id: 'scam', label: 'Scam or Fraud', icon: 'shield-outline' },
  { id: 'offensive', label: 'Offensive Language', icon: 'mic-off-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  contentType,
  contentId,
  contentTitle,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      const reason = REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const fullReason = additionalDetails 
        ? `${reason}: ${additionalDetails}` 
        : reason;

      await apiClient.post('/moderation/report', {
        contentType,
        contentId,
        reason: fullReason,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our team will review this content.',
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset state
      setSelectedReason(null);
      setAdditionalDetails('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setAdditionalDetails('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Content</Text>
          <View style={styles.closeButton} />
        </View>

        {contentTitle && (
          <View style={styles.contentInfo}>
            <Text style={styles.contentLabel}>Reporting:</Text>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {contentTitle}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

        <ScrollView style={styles.reasonsList}>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonItem,
                selectedReason === reason.id && styles.reasonItemSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <Ionicons
                name={reason.icon as any}
                size={24}
                color={selectedReason === reason.id ? '#16A34A' : '#666'}
              />
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
              {selectedReason === reason.id && (
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedReason && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Provide more details about your report..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              textAlignVertical="top"
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your report will be reviewed by our moderation team. False reports may result in action against your account.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  contentInfo: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contentTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reasonsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  reasonItemSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  reasonTextSelected: {
    color: '#16A34A',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default ReportModal;
