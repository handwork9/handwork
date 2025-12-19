import apiClient from './apiClient';

export interface FarmerApplicationData {
  farmName: string;
  farmDescription: string;
  farmAddress: string;
  farmCity: string;
  farmState: string;
  categories: string[];
  bankName: string;
  accountNumber: string;
  accountName: string;
  farmType?: string;
  farmSize?: string;
  yearsOfExperience?: string;
  hasTransportation?: boolean;
}

export interface FarmerApplicationResponse {
  success: boolean;
  message: string;
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FarmerApplicationStatus {
  hasApplied: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  farmName?: string;
  rejectionReason?: string;
  appliedAt?: string;
  approvedAt?: string;
}

const farmerApplicationService = {
  /**
   * Apply to become a farmer
   */
  async applyAsFarmer(data: FarmerApplicationData): Promise<FarmerApplicationResponse> {
    return apiClient.post<FarmerApplicationResponse>('/users/farmer/apply', data);
  },

  /**
   * Get farmer application status
   */
  async getApplicationStatus(): Promise<FarmerApplicationStatus> {
    return apiClient.get<FarmerApplicationStatus>('/users/farmer/application-status');
  },
};

export default farmerApplicationService;
