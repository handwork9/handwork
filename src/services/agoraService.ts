import createAgoraRtcEngine, {
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
  RenderModeType,
} from 'react-native-agora';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { AGORA_CONFIG } from '../constants/config';
import apiClient from './apiClient';

export interface AgoraToken {
  token: string;
  uid: number;
  channelName: string;
  expiresIn: number;
}

export interface StreamStats {
  userCount: number;
  duration: number;
  bitrate?: number;
  frameRate?: number;
}

class AgoraService {
  private engine: IRtcEngine | null = null;
  private isInitialized = false;
  private currentChannel: string | null = null;
  private localUid: number = 0;
  
  // Event callbacks
  private onUserJoined: ((uid: number) => void) | null = null;
  private onUserLeft: ((uid: number) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onJoinSuccess: ((channel: string, uid: number) => void) | null = null;
  private onRemoteVideoStateChanged: ((uid: number, state: number) => void) | null = null;

  /**
   * Request camera and microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (!cameraGranted || !audioGranted) {
          Alert.alert(
            'Permissions Required',
            'Camera and microphone permissions are required for live streaming.',
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('[Agora] Permission request error:', error);
        return false;
      }
    }
    // iOS permissions are handled by Info.plist
    return true;
  }

  /**
   * Initialize the Agora engine
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.engine) {
      return true;
    }

    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return false;
      }

      this.engine = createAgoraRtcEngine();
      
      await this.engine.initialize({
        appId: AGORA_CONFIG.APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Enable video
      await this.engine.enableVideo();
      await this.engine.enableAudio();
      
      // Set default video encoder config for good quality
      await this.engine.setVideoEncoderConfiguration({
        dimensions: { width: 720, height: 1280 },
        frameRate: 30,
        bitrate: 1500,
        orientationMode: 0,
      });

      // Setup event handlers
      this.setupEventHandlers();
      
      this.isInitialized = true;
      console.log('[Agora] Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('[Agora] Initialize error:', error);
      this.onError?.(`Failed to initialize: ${error}`);
      return false;
    }
  }

  /**
   * Setup Agora event handlers
   */
  private setupEventHandlers() {
    if (!this.engine) return;

    this.engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
      console.log('[Agora] Join channel success:', connection.channelId, elapsed);
      this.localUid = connection.localUid || 0;
      this.onJoinSuccess?.(connection.channelId || '', connection.localUid || 0);
    });

    this.engine.addListener('onUserJoined', (connection, remoteUid, elapsed) => {
      console.log('[Agora] Remote user joined:', remoteUid);
      this.onUserJoined?.(remoteUid);
    });

    this.engine.addListener('onUserOffline', (connection, remoteUid, reason) => {
      console.log('[Agora] Remote user left:', remoteUid, reason);
      this.onUserLeft?.(remoteUid);
    });

    this.engine.addListener('onError', (err, msg) => {
      console.error('[Agora] Error:', err, msg);
      this.onError?.(`Error ${err}: ${msg}`);
    });

    this.engine.addListener('onRemoteVideoStateChanged', (connection, remoteUid, state, reason, elapsed) => {
      console.log('[Agora] Remote video state changed:', remoteUid, state);
      this.onRemoteVideoStateChanged?.(remoteUid, state);
    });
  }

  /**
   * Get Agora token from backend
   */
  async getToken(channelName: string, role: 'host' | 'audience'): Promise<AgoraToken | null> {
    try {
      const response = await apiClient.post<{ token: string; uid: number; channelName: string; expiresIn: number }>(
        '/live-streams/agora-token',
        { channelName, role }
      );
      return response as AgoraToken;
    } catch (error) {
      console.error('[Agora] Failed to get token:', error);
      // Fallback for development - use no token (works with App Certificate disabled)
      return {
        token: '',
        uid: Math.floor(Math.random() * 100000),
        channelName,
        expiresIn: 3600,
      };
    }
  }

  /**
   * Start broadcasting as host
   */
  async startBroadcast(channelName: string): Promise<boolean> {
    try {
      if (!this.engine) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Get token
      const tokenData = await this.getToken(channelName, 'host');
      if (!tokenData) {
        throw new Error('Failed to get Agora token');
      }

      // Set as broadcaster
      await this.engine!.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Start preview
      await this.engine!.startPreview();

      // Join channel
      await this.engine!.joinChannel(
        tokenData.token,
        channelName,
        tokenData.uid,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
        }
      );

      this.currentChannel = channelName;
      this.localUid = tokenData.uid;
      
      console.log('[Agora] Started broadcasting on channel:', channelName);
      return true;
    } catch (error) {
      console.error('[Agora] Start broadcast error:', error);
      this.onError?.(`Failed to start broadcast: ${error}`);
      return false;
    }
  }

  /**
   * Join channel as viewer
   */
  async joinAsViewer(channelName: string): Promise<boolean> {
    try {
      if (!this.engine) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Get token
      const tokenData = await this.getToken(channelName, 'audience');
      if (!tokenData) {
        throw new Error('Failed to get Agora token');
      }

      // Set as audience
      await this.engine!.setClientRole(ClientRoleType.ClientRoleAudience);

      // Join channel
      await this.engine!.joinChannel(
        tokenData.token,
        channelName,
        tokenData.uid,
        {
          clientRoleType: ClientRoleType.ClientRoleAudience,
          autoSubscribeVideo: true,
          autoSubscribeAudio: true,
        }
      );

      this.currentChannel = channelName;
      this.localUid = tokenData.uid;
      
      console.log('[Agora] Joined channel as viewer:', channelName);
      return true;
    } catch (error) {
      console.error('[Agora] Join as viewer error:', error);
      this.onError?.(`Failed to join stream: ${error}`);
      return false;
    }
  }

  /**
   * Leave current channel
   */
  async leaveChannel(): Promise<void> {
    try {
      if (this.engine && this.currentChannel) {
        await this.engine.leaveChannel();
        this.currentChannel = null;
        console.log('[Agora] Left channel');
      }
    } catch (error) {
      console.error('[Agora] Leave channel error:', error);
    }
  }

  /**
   * Stop broadcasting and cleanup
   */
  async stopBroadcast(): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.stopPreview();
        await this.leaveChannel();
      }
    } catch (error) {
      console.error('[Agora] Stop broadcast error:', error);
    }
  }

  /**
   * Toggle camera
   */
  async switchCamera(): Promise<void> {
    try {
      await this.engine?.switchCamera();
    } catch (error) {
      console.error('[Agora] Switch camera error:', error);
    }
  }

  private isMuted = false;
  private isVideoEnabled = true;

  /**
   * Toggle local audio mute state
   * @returns The new muted state
   */
  async toggleMute(): Promise<boolean> {
    try {
      this.isMuted = !this.isMuted;
      await this.engine?.muteLocalAudioStream(this.isMuted);
      return this.isMuted;
    } catch (error) {
      console.error('[Agora] Toggle mute error:', error);
      return this.isMuted;
    }
  }

  /**
   * Toggle local video enabled state
   * @returns The new enabled state
   */
  async toggleVideo(): Promise<boolean> {
    try {
      this.isVideoEnabled = !this.isVideoEnabled;
      await this.engine?.muteLocalVideoStream(!this.isVideoEnabled);
      return this.isVideoEnabled;
    } catch (error) {
      console.error('[Agora] Toggle video error:', error);
      return this.isVideoEnabled;
    }
  }

  /**
   * Set mute state directly
   */
  async setMuted(muted: boolean): Promise<void> {
    try {
      this.isMuted = muted;
      await this.engine?.muteLocalAudioStream(muted);
    } catch (error) {
      console.error('[Agora] Set mute error:', error);
    }
  }

  /**
   * Set video enabled state directly
   */
  async setVideoEnabled(enabled: boolean): Promise<void> {
    try {
      this.isVideoEnabled = enabled;
      await this.engine?.muteLocalVideoStream(!enabled);
    } catch (error) {
      console.error('[Agora] Set video error:', error);
    }
  }

  /**
   * Get the Agora engine instance
   */
  getEngine(): IRtcEngine | null {
    return this.engine;
  }

  /**
   * Get current channel name
   */
  getCurrentChannel(): string | null {
    return this.currentChannel;
  }

  /**
   * Get local UID
   */
  getLocalUid(): number {
    return this.localUid;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onUserJoined?: (uid: number) => void;
    onUserLeft?: (uid: number) => void;
    onError?: (error: string) => void;
    onJoinSuccess?: (channel: string, uid: number) => void;
    onRemoteVideoStateChanged?: (uid: number, state: number) => void;
  }): void {
    this.onUserJoined = callbacks.onUserJoined || null;
    this.onUserLeft = callbacks.onUserLeft || null;
    this.onError = callbacks.onError || null;
    this.onJoinSuccess = callbacks.onJoinSuccess || null;
    this.onRemoteVideoStateChanged = callbacks.onRemoteVideoStateChanged || null;
  }

  /**
   * Register callback for remote user joining
   */
  onRemoteUserJoined(callback: (uid: number) => void): void {
    this.onUserJoined = callback;
  }

  /**
   * Register callback for remote user leaving
   */
  onRemoteUserLeft(callback: (uid: number) => void): void {
    this.onUserLeft = callback;
  }

  /**
   * Cleanup and destroy engine
   */
  async destroy(): Promise<void> {
    try {
      if (this.engine) {
        await this.leaveChannel();
        this.engine.removeAllListeners();
        await this.engine.release();
        this.engine = null;
        this.isInitialized = false;
        console.log('[Agora] Engine destroyed');
      }
    } catch (error) {
      console.error('[Agora] Destroy error:', error);
    }
  }
}

export const agoraService = new AgoraService();
export default agoraService;
