/**
 * Video Call Service
 * Handles WebRTC video/audio calls with Socket.io signaling
 * 
 * NOTE: This service requires react-native-webrtc which only works in
 * development builds, not in Expo Go. The imports are lazy-loaded to
 * prevent crashes in Expo Go.
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { store } from '../store';
import { setTokens } from '../store/slices/authSlice';
import axios from 'axios';

// Lazy-load WebRTC modules to avoid crashes in Expo Go
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let mediaDevices: any;
let MediaStream: any;

// Flag to check if WebRTC is available
let webrtcAvailable = false;

try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  MediaStream = webrtc.MediaStream;
  webrtcAvailable = true;
} catch (error) {
  console.warn('react-native-webrtc not available. Video calls will not work in Expo Go.');
  webrtcAvailable = false;
}

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export type CallType = 'video' | 'audio';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallEndReason = 'ended' | 'declined' | 'no_answer' | 'disconnected' | 'error';

export interface CallState {
  callId: string | null;
  status: CallStatus;
  type: CallType;
  isIncoming: boolean;
  remoteUserId: string | null;
  remoteUserName: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  duration: number;
  error: string | null;
}

export interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: CallType;
  orderId?: string;
}

type CallStateListener = (state: CallState) => void;
type IncomingCallListener = (data: IncomingCallData) => void;

class VideoCallService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callStateListeners: Set<CallStateListener> = new Set();
  private incomingCallListeners: Set<IncomingCallListener> = new Set();
  private durationInterval: NodeJS.Timeout | null = null;

  private state: CallState = {
    callId: null,
    status: 'idle',
    type: 'video',
    isIncoming: false,
    remoteUserId: null,
    remoteUserName: null,
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isSpeakerOn: true,
    duration: 0,
    error: null,
  };

  /**
   * Connect to video call WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const authState = store.getState().auth;
    if (!authState.accessToken) {
      console.warn('[VideoCall] No auth token, cannot connect');
      return;
    }

    // Try to refresh token if it might be expired (refresh proactively)
    let token = authState.accessToken;
    if (authState.refreshToken) {
      try {
        // Check if token might be expired by decoding it
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = tokenPayload.exp * 1000;
        const now = Date.now();
        
        // If token expires within 5 minutes, refresh it
        if (expiresAt - now < 5 * 60 * 1000) {
          console.log('[VideoCall] Token expiring soon, refreshing...');
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken: authState.refreshToken,
          });
          
          if (response.data?.data?.accessToken) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            token = accessToken;
            // Update tokens in store
            store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
            console.log('[VideoCall] Token refreshed successfully');
          }
        }
      } catch (error) {
        console.warn('[VideoCall] Token refresh check failed:', error);
        // Continue with existing token
      }
    }

    // Socket.io uses HTTP for handshake, then upgrades to WebSocket
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    
    console.log('[VideoCall] Connecting to:', `${baseUrl}/video-call`);
    
    this.socket = io(`${baseUrl}/video-call`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect from video call WebSocket
   */
  disconnect(): void {
    if (this.state.status !== 'idle') {
      this.endCall();
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[VideoCall] Connected to signaling server');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[VideoCall] Connection error:', error.message);
      this.updateState({ error: `Connection failed: ${error.message}` });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[VideoCall] Disconnected from signaling server:', reason);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('[VideoCall] Socket error:', error.message);
      this.updateState({ error: error.message });
    });

    // Incoming call
    this.socket.on('incoming_call', (data: IncomingCallData) => {
      console.log('[VideoCall] Incoming call:', data);
      this.updateState({
        callId: data.callId,
        status: 'ringing',
        type: data.type,
        isIncoming: true,
        remoteUserId: data.callerId,
        remoteUserName: data.callerName,
      });
      this.notifyIncomingCall(data);
    });

    // Call initiated (for caller)
    this.socket.on('call_initiated', (data: { callId: string; receiverId: string; receiverName: string; type: CallType }) => {
      console.log('[VideoCall] Call initiated:', data);
      this.updateState({
        callId: data.callId,
        status: 'calling',
        type: data.type,
        remoteUserId: data.receiverId,
        remoteUserName: data.receiverName,
      });
    });

    // Call answered
    this.socket.on('call_answered', async (data: { callId: string }) => {
      console.log('[VideoCall] Call answered:', data);
      this.updateState({ status: 'connected' });
      this.startDurationTimer();

      // If we're the caller, create and send offer
      if (!this.state.isIncoming) {
        await this.createAndSendOffer();
      }
    });

    // Call ended
    this.socket.on('call_ended', (data: { callId: string; reason: CallEndReason; duration: number }) => {
      console.log('[VideoCall] Call ended:', data);
      this.handleCallEnded(data.reason);
    });

    // Call error
    this.socket.on('call_error', (data: { message: string }) => {
      console.error('[VideoCall] Call error:', data.message);
      this.updateState({ error: data.message, status: 'idle' });
      this.cleanup();
    });

    // WebRTC signaling
    this.socket.on('webrtc_offer', async (data: { callId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[VideoCall] Received offer');
      await this.handleOffer(data.offer);
    });

    this.socket.on('webrtc_answer', async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[VideoCall] Received answer');
      await this.handleAnswer(data.answer);
    });

    this.socket.on('ice_candidate', async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      await this.handleIceCandidate(data.candidate);
    });

    // Media toggle
    this.socket.on('media_toggled', (data: { userId: string; mediaType: 'audio' | 'video'; enabled: boolean }) => {
      console.log('[VideoCall] Remote media toggled:', data);
      // Could update UI to show remote user muted/video off
    });
  }

  /**
   * Check if WebRTC is available
   */
  isAvailable(): boolean {
    return webrtcAvailable;
  }

  /**
   * Start a call
   */
  async startCall(receiverId: string, type: CallType = 'video', orderId?: string): Promise<void> {
    if (!webrtcAvailable) {
      throw new Error('Video calling is not available. Please use a development build.');
    }

    if (!this.socket?.connected) {
      await this.connect();
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.state.status !== 'idle') {
      throw new Error('Already in a call');
    }

    try {
      // Get local media stream
      await this.getLocalStream(type);

      // Send call request
      this.socket?.emit('call_user', { receiverId, type, orderId });
      
      this.updateState({
        status: 'calling',
        type,
        isIncoming: false,
        remoteUserId: receiverId,
      });
    } catch (error: any) {
      console.error('[VideoCall] Failed to start call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Answer incoming call
   */
  async answerCall(): Promise<void> {
    if (!webrtcAvailable) {
      throw new Error('Video calling is not available. Please use a development build.');
    }

    if (!this.state.callId || this.state.status !== 'ringing') {
      throw new Error('No incoming call to answer');
    }

    try {
      // Get local media stream
      await this.getLocalStream(this.state.type);

      // Setup peer connection
      await this.setupPeerConnection();

      // Send answer
      this.socket?.emit('answer_call', { callId: this.state.callId });
    } catch (error: any) {
      console.error('[VideoCall] Failed to answer call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Decline incoming call
   */
  declineCall(): void {
    if (!this.state.callId) return;
    
    this.socket?.emit('decline_call', { callId: this.state.callId });
    this.handleCallEnded('declined');
  }

  /**
   * End current call
   */
  endCall(): void {
    if (!this.state.callId) return;

    this.socket?.emit('end_call', { callId: this.state.callId });
    this.handleCallEnded('ended');
  }

  /**
   * Toggle audio
   */
  toggleAudio(): void {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.updateState({ isAudioEnabled: audioTrack.enabled });

      this.socket?.emit('toggle_media', {
        callId: this.state.callId,
        mediaType: 'audio',
        enabled: audioTrack.enabled,
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(): void {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.updateState({ isVideoEnabled: videoTrack.enabled });

      this.socket?.emit('toggle_media', {
        callId: this.state.callId,
        mediaType: 'video',
        enabled: videoTrack.enabled,
      });
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
      (videoTrack as any)._switchCamera();
    }
  }

  /**
   * Toggle speaker
   */
  toggleSpeaker(): void {
    // This is handled by the native speaker control
    this.updateState({ isSpeakerOn: !this.state.isSpeakerOn });
  }

  /**
   * Get local media stream
   */
  private async getLocalStream(type: CallType): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? {
        facingMode: 'user',
      } : false,
    };

    this.localStream = await mediaDevices.getUserMedia(constraints);
    this.updateState({ 
      localStream: this.localStream,
      isAudioEnabled: true,
      isVideoEnabled: type === 'video',
    });
  }

  /**
   * Setup WebRTC peer connection
   */
  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle remote tracks
    if (this.peerConnection) {
      this.peerConnection.ontrack = (event: any) => {
        console.log('[VideoCall] Remote track received');
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.updateState({ remoteStream: this.remoteStream });
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          this.socket?.emit('ice_candidate', {
            callId: this.state.callId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('[VideoCall] Connection state:', this.peerConnection?.connectionState);
        if (this.peerConnection?.connectionState === 'failed') {
          this.handleCallEnded('error');
        }
      };
    }
  }

  /**
   * Create and send WebRTC offer
   */
  private async createAndSendOffer(): Promise<void> {
    await this.setupPeerConnection();

    const offer = await this.peerConnection!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.state.type === 'video',
    });

    await this.peerConnection!.setLocalDescription(offer);

    this.socket?.emit('webrtc_offer', {
      callId: this.state.callId,
      offer: offer,
    });
  }

  /**
   * Handle incoming WebRTC offer
   */
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      await this.setupPeerConnection();
    }

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    this.socket?.emit('webrtc_answer', {
      callId: this.state.callId,
      answer: answer,
    });
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * Handle call ended
   */
  private handleCallEnded(reason: CallEndReason): void {
    this.stopDurationTimer();
    this.cleanup();
    this.updateState({
      status: 'ended',
      error: reason === 'error' ? 'Connection failed' : null,
    });

    // Reset state after a delay
    setTimeout(() => {
      this.resetState();
    }, 2000);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  /**
   * Start duration timer
   */
  private startDurationTimer(): void {
    this.durationInterval = setInterval(() => {
      this.updateState({ duration: this.state.duration + 1 });
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  /**
   * Reset state
   */
  private resetState(): void {
    this.state = {
      callId: null,
      status: 'idle',
      type: 'video',
      isIncoming: false,
      remoteUserId: null,
      remoteUserName: null,
      localStream: null,
      remoteStream: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isSpeakerOn: true,
      duration: 0,
      error: null,
    };
    this.notifyStateChange();
  }

  /**
   * Update state
   */
  private updateState(partial: Partial<CallState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyStateChange();
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: CallStateListener): () => void {
    this.callStateListeners.add(listener);
    return () => this.callStateListeners.delete(listener);
  }

  /**
   * Subscribe to incoming calls
   */
  onIncomingCall(listener: IncomingCallListener): () => void {
    this.incomingCallListeners.add(listener);
    return () => this.incomingCallListeners.delete(listener);
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.callStateListeners.forEach(listener => listener(state));
  }

  /**
   * Notify incoming call listeners
   */
  private notifyIncomingCall(data: IncomingCallData): void {
    this.incomingCallListeners.forEach(listener => listener(data));
  }

  /**
   * Format duration
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const videoCallService = new VideoCallService();
