import apiClient from './apiClient';

export interface Session {
  id: string;
  device: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface SessionsResponse {
  sessions: Session[];
}

export interface EndSessionResponse {
  message: string;
  loggedOut?: boolean;
  endedCount?: number;
}

export interface LoginActivity {
  id: string;
  device: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  location: string;
  ip: string;
  timestamp: string;
  status: 'success' | 'failed' | 'blocked';
}

export interface LoginHistoryResponse {
  activities: LoginActivity[];
}

const sessionsService = {
  /**
   * Get all active sessions for the current user
   */
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<{ success: boolean; data: SessionsResponse } | SessionsResponse>('/sessions');
    console.log('[sessionsService] getSessions response:', JSON.stringify(response));
    // API returns {success: true, data: {sessions: [...]}}, extract the data
    const data = (response as any)?.data || response;
    return data.sessions || [];
  },

  /**
   * Get login history for the current user
   */
  async getLoginHistory(): Promise<LoginActivity[]> {
    const response = await apiClient.get<{ success: boolean; data: LoginHistoryResponse } | LoginHistoryResponse>('/sessions/login-history');
    console.log('[sessionsService] getLoginHistory response:', JSON.stringify(response));
    // API returns {success: true, data: {activities: [...]}}, extract the data
    const data = (response as any)?.data || response;
    return data.activities || [];
  },

  /**
   * End a specific session by ID
   */
  async endSession(sessionId: string): Promise<EndSessionResponse> {
    return apiClient.delete<EndSessionResponse>(`/sessions/${sessionId}`);
  },

  /**
   * End all sessions except the current one
   */
  async endAllOtherSessions(): Promise<EndSessionResponse> {
    return apiClient.post<EndSessionResponse>('/sessions/end-all-others');
  },

  /**
   * End all sessions (log out everywhere)
   */
  async endAllSessions(): Promise<EndSessionResponse> {
    return apiClient.post<EndSessionResponse>('/sessions/end-all');
  },
};

export default sessionsService;
