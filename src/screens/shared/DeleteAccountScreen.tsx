import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import accountDeletionService, {
  DeletionReason,
  DeletionRequestStatus,
  DELETION_REASON_LABELS,
  DeletionStatusResponse,
} from '../../services/accountDeletionService';
import { useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();

  const [selectedReason, setSelectedReason] = useState<DeletionReason | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingRequest, setExistingRequest] = useState<DeletionStatusResponse | null>(null);

  // Check for existing deletion request
  useFocusEffect(
    React.useCallback(() => {
      checkExistingRequest();
    }, [])
  );

  const checkExistingRequest = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await accountDeletionService.getStatus();
      if (status.hasRequest) {
        setExistingRequest(status);
      } else {
        setExistingRequest(null);
      }
    } catch (error) {
      console.error('Failed to check deletion status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for account deletion');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password to confirm');
      return;
    }

    if (selectedReason === DeletionReason.OTHER && !additionalDetails.trim()) {
      Alert.alert('Error', 'Please provide additional details for your reason');
      return;
    }

    Alert.alert(
      'Confirm Account Deletion Request',
      'Are you sure you want to request account deletion? This action will be reviewed by our team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await accountDeletionService.requestDeletion(
                selectedReason,
                password,
                additionalDetails.trim() || undefined,
              );

              if (result.success) {
                Alert.alert(
                  'Request Submitted',
                  'Your account deletion request has been submitted for review. You will be notified once it is processed.',
                  [{ text: 'OK', onPress: () => checkExistingRequest() }],
                );
                setPassword('');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to submit deletion request');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleCancelRequest = async () => {
    if (!existingRequest?.requestId) return;

    Alert.alert(
      'Cancel Deletion Request',
      'Are you sure you want to cancel your account deletion request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await accountDeletionService.cancelRequest(existingRequest.requestId!);
              if (result.success) {
                Alert.alert('Success', 'Your deletion request has been cancelled');
                setExistingRequest(null);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: DeletionRequestStatus) => {
    switch (status) {
      case DeletionRequestStatus.PENDING:
        return '#FF9500';
      case DeletionRequestStatus.APPROVED:
        return '#34C759';
      case DeletionRequestStatus.REJECTED:
        return '#FF3B30';
      case DeletionRequestStatus.COMPLETED:
        return '#8E8E93';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: DeletionRequestStatus) => {
    switch (status) {
      case DeletionRequestStatus.PENDING:
        return 'Pending Review';
      case DeletionRequestStatus.APPROVED:
        return 'Approved';
      case DeletionRequestStatus.REJECTED:
        return 'Rejected';
      case DeletionRequestStatus.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  };

  const renderExistingRequest = () => {
    if (!existingRequest) return null;

    return (
      <View style={[styles.existingRequestContainer, { backgroundColor: colors.card }]}>
        <View style={styles.requestHeader}>
          <Ionicons
            name={
              existingRequest.status === DeletionRequestStatus.PENDING
                ? 'time-outline'
                : existingRequest.status === DeletionRequestStatus.APPROVED
                ? 'checkmark-circle-outline'
                : existingRequest.status === DeletionRequestStatus.REJECTED
                ? 'close-circle-outline'
                : 'checkmark-done-outline'
            }
            size={48}
            color={getStatusColor(existingRequest.status!)}
          />
          <Text style={[styles.requestTitle, { color: colors.text }]}>
            Deletion Request {getStatusLabel(existingRequest.status!)}
          </Text>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reason:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {DELETION_REASON_LABELS[existingRequest.reason!]}
            </Text>
          </View>

          {existingRequest.additionalDetails && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Details:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {existingRequest.additionalDetails}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Submitted:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(existingRequest.createdAt!).toLocaleDateString()}
            </Text>
          </View>

          {existingRequest.status === DeletionRequestStatus.APPROVED && existingRequest.scheduledDeletionDate && (
            <View style={[styles.warningBox, { backgroundColor: '#FFF3CD' }]}>
              <Ionicons name="warning-outline" size={20} color="#856404" />
              <Text style={styles.warningText}>
                Your account will be deleted on{' '}
                {new Date(existingRequest.scheduledDeletionDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {existingRequest.status === DeletionRequestStatus.REJECTED && existingRequest.rejectionReason && (
            <View style={[styles.rejectionBox, { backgroundColor: '#F8D7DA' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#721C24" />
              <Text style={styles.rejectionText}>
                Reason: {existingRequest.rejectionReason}
              </Text>
            </View>
          )}
        </View>

        {existingRequest.status === DeletionRequestStatus.PENDING && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: '#FF3B30' }]}
            onPress={handleCancelRequest}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {existingRequest.status === DeletionRequestStatus.REJECTED && (
          <TouchableOpacity
            style={[styles.newRequestButton, { backgroundColor: colors.primary }]}
            onPress={() => setExistingRequest(null)}
          >
            <Text style={styles.newRequestButtonText}>Submit New Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderDeletionForm = () => (
    <>
      <View style={[styles.warningCard, { backgroundColor: '#FFF3CD' }]}>
        <Ionicons name="warning-outline" size={24} color="#856404" />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>Account Deletion Warning</Text>
          <Text style={styles.warningDescription}>
            Deleting your account will permanently remove all your data, including order history,
            saved addresses, and any wallet balance. This action cannot be undone.
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Why do you want to delete your account?
      </Text>

      <View style={[styles.reasonsContainer, { backgroundColor: colors.card }]}>
        {Object.entries(DELETION_REASON_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.reasonItem,
              selectedReason === key && { backgroundColor: colors.primary + '20' },
              { borderBottomColor: colors.border },
            ]}
            onPress={() => setSelectedReason(key as DeletionReason)}
          >
            <View style={styles.reasonContent}>
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: selectedReason === key ? colors.primary : colors.textSecondary },
                ]}
              >
                {selectedReason === key && (
                  <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.reasonText, { color: colors.text }]}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {(selectedReason === DeletionReason.OTHER || selectedReason) && (
        <View style={styles.detailsSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Additional Details {selectedReason === DeletionReason.OTHER ? '(Required)' : '(Optional)'}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
                fontFamily: FONTS.regular,
              },
            ]}
            placeholder="Tell us more about why you're leaving..."
            placeholderTextColor={colors.textSecondary}
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}

      <View style={styles.passwordSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Confirm with your password
        </Text>
        <View
          style={[
            styles.passwordInputContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.passwordInput, { color: colors.text, fontFamily: FONTS.regular }]}
            placeholder="Enter password to confirm"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.deleteButton, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleSubmitRequest}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  if (isCheckingStatus) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {existingRequest && existingRequest.status !== DeletionRequestStatus.REJECTED
          ? renderExistingRequest()
          : renderDeletionForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  warningCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  warningContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  warningTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#856404',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#856404',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  reasonsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  reasonItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  detailsSection: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  textArea: {
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    minHeight: 100,
    borderWidth: 1,
  },
  passwordSection: {
    marginBottom: SPACING.lg,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  existingRequestContainer: {
    borderRadius: 12,
    padding: SPACING.lg,
  },
  requestHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  requestTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  requestDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#856404',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  rejectionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#721C24',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  newRequestButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
});
