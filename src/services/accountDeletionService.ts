/**
 * Account Deletion Service
 * Handles account deletion request operations
 */

import apiClient from './apiClient';

export enum DeletionReason {
  NOT_USING = 'not_using',
  PRIVACY_CONCERNS = 'privacy_concerns',
  FOUND_ALTERNATIVE = 'found_alternative',
  POOR_EXPERIENCE = 'poor_experience',
  TOO_MANY_NOTIFICATIONS = 'too_many_notifications',
  SECURITY_CONCERNS = 'security_concerns',
  OTHER = 'other',
}

export enum DeletionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export const DELETION_REASON_LABELS: Record<DeletionReason, string> = {
  [DeletionReason.NOT_USING]: "I'm not using the app anymore",
  [DeletionReason.PRIVACY_CONCERNS]: 'Privacy concerns',
  [DeletionReason.FOUND_ALTERNATIVE]: 'Found a better alternative',
  [DeletionReason.POOR_EXPERIENCE]: 'Poor user experience',
  [DeletionReason.TOO_MANY_NOTIFICATIONS]: 'Too many notifications',
  [DeletionReason.SECURITY_CONCERNS]: 'Security concerns',
  [DeletionReason.OTHER]: 'Other reason',
};

export interface DeletionRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
  status?: DeletionRequestStatus;
}

export interface DeletionStatusResponse {
  hasRequest: boolean;
  requestId?: string;
  status?: DeletionRequestStatus;
  reason?: DeletionReason;
  additionalDetails?: string;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
  scheduledDeletionDate?: string;
}

const accountDeletionService = {
  /**
   * Request account deletion
   */
  async requestDeletion(
    reason: DeletionReason,
    password: string,
    additionalDetails?: string,
  ): Promise<DeletionRequestResponse> {
    try {
      const response = await apiClient.post<DeletionRequestResponse>(
        '/users/account/delete-request',
        {
          reason,
          password,
          additionalDetails,
        },
      );
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit deletion request';
      return { success: false, message };
    }
  },

  /**
   * Get deletion request status
   */
  async getStatus(): Promise<DeletionStatusResponse> {
    try {
      const response = await apiClient.get<DeletionStatusResponse>(
        '/users/account/delete-request/status',
      );
      return response;
    } catch (error: any) {
      return { hasRequest: false };
    }
  },

  /**
   * Cancel deletion request
   */
  async cancelRequest(requestId: string): Promise<DeletionRequestResponse> {
    try {
      const response = await apiClient.delete<DeletionRequestResponse>(
        `/users/account/delete-request/${requestId}`,
      );
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to cancel request';
      return { success: false, message };
    }
  },
};

export default accountDeletionService;
