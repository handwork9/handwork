/**
 * Call Service - Manages video and voice calls using Agora RTC
 */
import createAgoraRtcEngine, {
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  AudioProfileType,
  AudioScenarioType,
} from 'react-native-agora';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { AGORA_CONFIG } from '../constants/config';
import apiClient from './apiClient';

export type CallType = 'video' | 'voice';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallData {
  callId: string;
  channelName: string;
  callType: CallType;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface CallToken {
  token: string;
  uid: number;
  channelName: string;
  expiresIn: number;
}

class CallService {
  private engine: IRtcEngine | null = null;
  private isInitialized = false;
  private currentCall: CallData | null = null;
  private callStatus: CallStatus = 'idle';
  private localUid: number = 0;
  private callStartTime: Date | null = null;
  private callTimer: NodeJS.Timeout | null = null;
  private callDuration: number = 0;

  // Event callbacks
  private onRemoteUserJoined: ((uid: number) => void) | null = null;
  private onRemoteUserLeft: ((uid: number) => void) | null = null;
  private onCallEnded: (() => void) | null = null;
  private onCallConnected: (() => void) | null = null;
  private onCallFailed: ((error: string) => void) | null = null;
  private onDurationUpdate: ((duration: number) => void) | null = null;
  private onRemoteAudioStateChanged: ((uid: number, state: number) => void) | null = null;
  private onRemoteVideoStateChanged: ((uid: number, state: number) => void) | null = null;

  /**
   * Request camera and microphone permissions
   */
  async requestPermissions(callType: CallType): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = callType === 'video'
          ? [
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]
          : [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const cameraGranted = callType === 'voice' || granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (!audioGranted || !cameraGranted) {
          Alert.alert(
            'Permissions Required',
            callType === 'video' 
              ? 'Camera and microphone permissions are required for video calls.'
              : 'Microphone permission is required for voice calls.',
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('[CallService] Permission request error:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Initialize the Agora engine for calls
   */
  async initialize(callType: CallType): Promise<boolean> {
    if (this.isInitialized && this.engine) {
      return true;
    }

    try {
      const hasPermissions = await this.requestPermissions(callType);
      if (!hasPermissions) {
        return false;
      }

      this.engine = createAgoraRtcEngine();
      
      await this.engine.initialize({
        appId: AGORA_CONFIG.APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication, // 1:1 calls
      });

      // Enable audio
      await this.engine.enableAudio();
      await this.engine.setAudioProfile(
        AudioProfileType.AudioProfileDefault,
        AudioScenarioType.AudioScenarioChatroom
      );

      // Enable video for video calls
      if (callType === 'video') {
        await this.engine.enableVideo();
        await this.engine.setVideoEncoderConfiguration({
          dimensions: { width: 640, height: 480 },
          frameRate: 30,
          bitrate: 800,
          orientationMode: 0,
        });
      }

      // Setup event handlers
      this.setupEventHandlers();
      
      this.isInitialized = true;
      console.log('[CallService] Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('[CallService] Initialize error:', error);
      this.onCallFailed?.(`Failed to initialize: ${error}`);
      return false;
    }
  }

  /**
   * Setup Agora event handlers
   */
  private setupEventHandlers() {
    if (!this.engine) return;

    this.engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
      console.log('[CallService] Joined channel:', connection.channelId);
      this.localUid = connection.localUid || 0;
    });

    this.engine.addListener('onUserJoined', (connection, remoteUid, elapsed) => {
      console.log('[CallService] Remote user joined:', remoteUid);
      this.callStatus = 'connected';
      this.startCallTimer();
      this.onRemoteUserJoined?.(remoteUid);
      this.onCallConnected?.();
    });

    this.engine.addListener('onUserOffline', (connection, remoteUid, reason) => {
      console.log('[CallService] Remote user left:', remoteUid, reason);
      this.onRemoteUserLeft?.(remoteUid);
      // End call when remote user leaves
      this.endCall();
    });

    this.engine.addListener('onError', (err, msg) => {
      console.error('[CallService] Error:', err, msg);
      this.onCallFailed?.(`Error ${err}: ${msg}`);
    });

    this.engine.addListener('onRemoteAudioStateChanged', (connection, remoteUid, state, reason, elapsed) => {
      this.onRemoteAudioStateChanged?.(remoteUid, state);
    });

    this.engine.addListener('onRemoteVideoStateChanged', (connection, remoteUid, state, reason, elapsed) => {
      this.onRemoteVideoStateChanged?.(remoteUid, state);
    });
  }

  /**
   * Get call token from backend
   */
  async getCallToken(channelName: string): Promise<CallToken | null> {
    try {
      const response = await apiClient.post<CallToken>(
        '/social/live/agora-token',
        { channelName, role: 'host' }
      );
      return response as CallToken;
    } catch (error) {
      console.error('[CallService] Failed to get token:', error);
      // Fallback for development
      return {
        token: '',
        uid: Math.floor(Math.random() * 100000),
        channelName,
        expiresIn: 3600,
      };
    }
  }

  /**
   * Start an outgoing call
   */
  async startCall(
    callType: CallType,
    receiverId: string,
    receiverName: string,
    receiverAvatar?: string,
    callerName?: string,
    callerAvatar?: string,
  ): Promise<{ success: boolean; channelName?: string; error?: string }> {
    try {
      if (this.callStatus !== 'idle') {
        return { success: false, error: 'Already in a call' };
      }

      const initialized = await this.initialize(callType);
      if (!initialized) {
        return { success: false, error: 'Failed to initialize call' };
      }

      // Generate unique channel name
      const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get token
      const tokenData = await this.getCallToken(channelName);
      if (!tokenData) {
        return { success: false, error: 'Failed to get call token' };
      }

      // Create call data
      this.currentCall = {
        callId: channelName,
        channelName,
        callType,
        callerId: tokenData.uid.toString(),
        callerName: callerName || 'You',
        callerAvatar,
        receiverId,
        receiverName,
        receiverAvatar,
      };

      // Set client role
      await this.engine!.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Start video preview for video calls
      if (callType === 'video') {
        await this.engine!.startPreview();
      }

      // Join channel
      await this.engine!.joinChannel(
        tokenData.token,
        channelName,
        tokenData.uid,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: callType === 'video',
          autoSubscribeAudio: true,
          autoSubscribeVideo: callType === 'video',
        }
      );

      this.localUid = tokenData.uid;
      this.callStatus = 'calling';

      console.log('[CallService] Started call on channel:', channelName);
      return { success: true, channelName };
    } catch (error: any) {
      console.error('[CallService] Start call error:', error);
      return { success: false, error: error.message || 'Failed to start call' };
    }
  }

  /**
   * Join an incoming call
   */
  async joinCall(
    callType: CallType,
    channelName: string,
    callerName: string,
    callerAvatar?: string,
  ): Promise<boolean> {
    try {
      const initialized = await this.initialize(callType);
      if (!initialized) {
        return false;
      }

      // Get token
      const tokenData = await this.getCallToken(channelName);
      if (!tokenData) {
        return false;
      }

      // Create call data
      this.currentCall = {
        callId: channelName,
        channelName,
        callType,
        callerId: '',
        callerName,
        callerAvatar,
        receiverId: tokenData.uid.toString(),
        receiverName: 'You',
      };

      // Set client role
      await this.engine!.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Start video preview for video calls
      if (callType === 'video') {
        await this.engine!.startPreview();
      }

      // Join channel
      await this.engine!.joinChannel(
        tokenData.token,
        channelName,
        tokenData.uid,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: callType === 'video',
          autoSubscribeAudio: true,
          autoSubscribeVideo: callType === 'video',
        }
      );

      this.localUid = tokenData.uid;
      this.callStatus = 'ringing';

      console.log('[CallService] Joined call on channel:', channelName);
      return true;
    } catch (error) {
      console.error('[CallService] Join call error:', error);
      return false;
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<void> {
    try {
      this.stopCallTimer();

      if (this.engine) {
        await this.engine.leaveChannel();
        await this.engine.stopPreview();
      }

      if (this.currentCall) {
        this.currentCall.endTime = new Date();
        this.currentCall.duration = this.callDuration;
      }

      this.callStatus = 'ended';
      this.onCallEnded?.();
      
      // Reset state after a short delay
      setTimeout(() => {
        this.currentCall = null;
        this.callStatus = 'idle';
        this.callDuration = 0;
      }, 500);

      console.log('[CallService] Call ended');
    } catch (error) {
      console.error('[CallService] End call error:', error);
    }
  }

  /**
   * Start call duration timer
   */
  private startCallTimer() {
    this.callStartTime = new Date();
    this.callTimer = setInterval(() => {
      if (this.callStartTime) {
        this.callDuration = Math.floor((Date.now() - this.callStartTime.getTime()) / 1000);
        this.onDurationUpdate?.(this.callDuration);
      }
    }, 1000);
  }

  /**
   * Stop call duration timer
   */
  private stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
    this.callStartTime = null;
  }

  /**
   * Toggle microphone mute
   */
  private isMuted = false;
  async toggleMute(): Promise<boolean> {
    try {
      this.isMuted = !this.isMuted;
      await this.engine?.muteLocalAudioStream(this.isMuted);
      return this.isMuted;
    } catch (error) {
      console.error('[CallService] Toggle mute error:', error);
      return this.isMuted;
    }
  }

  /**
   * Toggle video
   */
  private isVideoEnabled = true;
  async toggleVideo(): Promise<boolean> {
    try {
      this.isVideoEnabled = !this.isVideoEnabled;
      await this.engine?.muteLocalVideoStream(!this.isVideoEnabled);
      return this.isVideoEnabled;
    } catch (error) {
      console.error('[CallService] Toggle video error:', error);
      return this.isVideoEnabled;
    }
  }

  /**
   * Switch camera
   */
  async switchCamera(): Promise<void> {
    try {
      await this.engine?.switchCamera();
    } catch (error) {
      console.error('[CallService] Switch camera error:', error);
    }
  }

  /**
   * Toggle speaker
   */
  private isSpeakerOn = true;
  async toggleSpeaker(): Promise<boolean> {
    try {
      this.isSpeakerOn = !this.isSpeakerOn;
      await this.engine?.setEnableSpeakerphone(this.isSpeakerOn);
      return this.isSpeakerOn;
    } catch (error) {
      console.error('[CallService] Toggle speaker error:', error);
      return this.isSpeakerOn;
    }
  }

  /**
   * Get engine instance
   */
  getEngine(): IRtcEngine | null {
    return this.engine;
  }

  /**
   * Get current call data
   */
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  /**
   * Get call status
   */
  getCallStatus(): CallStatus {
    return this.callStatus;
  }

  /**
   * Get local UID
   */
  getLocalUid(): number {
    return this.localUid;
  }

  /**
   * Get call duration
   */
  getCallDuration(): number {
    return this.callDuration;
  }

  /**
   * Format duration to MM:SS
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onRemoteUserJoined?: (uid: number) => void;
    onRemoteUserLeft?: (uid: number) => void;
    onCallEnded?: () => void;
    onCallConnected?: () => void;
    onCallFailed?: (error: string) => void;
    onDurationUpdate?: (duration: number) => void;
    onRemoteAudioStateChanged?: (uid: number, state: number) => void;
    onRemoteVideoStateChanged?: (uid: number, state: number) => void;
  }): void {
    this.onRemoteUserJoined = callbacks.onRemoteUserJoined || null;
    this.onRemoteUserLeft = callbacks.onRemoteUserLeft || null;
    this.onCallEnded = callbacks.onCallEnded || null;
    this.onCallConnected = callbacks.onCallConnected || null;
    this.onCallFailed = callbacks.onCallFailed || null;
    this.onDurationUpdate = callbacks.onDurationUpdate || null;
    this.onRemoteAudioStateChanged = callbacks.onRemoteAudioStateChanged || null;
    this.onRemoteVideoStateChanged = callbacks.onRemoteVideoStateChanged || null;
  }

  /**
   * Cleanup and destroy engine
   */
  async destroy(): Promise<void> {
    try {
      this.stopCallTimer();
      if (this.engine) {
        await this.endCall();
        this.engine.removeAllListeners();
        await this.engine.release();
        this.engine = null;
        this.isInitialized = false;
        console.log('[CallService] Engine destroyed');
      }
    } catch (error) {
      console.error('[CallService] Destroy error:', error);
    }
  }
}

export const callService = new CallService();
export default callService;
