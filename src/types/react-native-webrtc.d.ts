/**
 * Type declarations for react-native-webrtc
 * This library provides WebRTC functionality for React Native
 * 
 * Install with: npm install react-native-webrtc
 */

declare module 'react-native-webrtc' {
  import { ViewStyle, StyleProp } from 'react-native';

  export interface RTCConfiguration {
    iceServers: RTCIceServer[];
    iceTransportPolicy?: 'all' | 'relay';
    bundlePolicy?: 'balanced' | 'max-bundle' | 'max-compat';
    rtcpMuxPolicy?: 'require' | 'negotiate';
    iceCandidatePoolSize?: number;
  }

  export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
    credentialType?: 'password' | 'oauth';
  }

  export interface RTCOfferOptions {
    offerToReceiveAudio?: boolean;
    offerToReceiveVideo?: boolean;
    voiceActivityDetection?: boolean;
    iceRestart?: boolean;
  }

  export interface RTCAnswerOptions {
    voiceActivityDetection?: boolean;
  }

  export interface RTCSessionDescriptionInit {
    type: RTCSdpType;
    sdp?: string;
  }

  export type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';

  export class RTCSessionDescription {
    readonly type: RTCSdpType;
    readonly sdp: string;
    constructor(init?: RTCSessionDescriptionInit);
    toJSON(): RTCSessionDescriptionInit;
  }

  export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    usernameFragment?: string | null;
  }

  export class RTCIceCandidate {
    readonly candidate: string;
    readonly sdpMLineIndex: number | null;
    readonly sdpMid: string | null;
    readonly usernameFragment: string | null;
    constructor(init?: RTCIceCandidateInit);
    toJSON(): RTCIceCandidateInit;
  }

  export interface RTCTrackEvent {
    streams: MediaStream[];
    track: MediaStreamTrack;
    transceiver: RTCRtpTransceiver;
    receiver: RTCRtpReceiver;
  }

  export interface RTCPeerConnectionIceEvent {
    candidate: RTCIceCandidate | null;
  }

  export interface RTCRtpTransceiver {
    readonly mid: string | null;
    readonly sender: RTCRtpSender;
    readonly receiver: RTCRtpReceiver;
    readonly direction: RTCRtpTransceiverDirection;
    readonly currentDirection: RTCRtpTransceiverDirection | null;
    stop(): void;
  }

  export type RTCRtpTransceiverDirection = 'sendrecv' | 'sendonly' | 'recvonly' | 'inactive' | 'stopped';

  export interface RTCRtpSender {
    readonly track: MediaStreamTrack | null;
    readonly transport: RTCDtlsTransport | null;
    replaceTrack(track: MediaStreamTrack | null): Promise<void>;
    getStats(): Promise<RTCStatsReport>;
    setParameters(parameters: RTCRtpSendParameters): Promise<void>;
    getParameters(): RTCRtpSendParameters;
  }

  export interface RTCRtpReceiver {
    readonly track: MediaStreamTrack;
    readonly transport: RTCDtlsTransport | null;
    getStats(): Promise<RTCStatsReport>;
    getParameters(): RTCRtpReceiveParameters;
  }

  export interface RTCDtlsTransport {
    readonly state: RTCDtlsTransportState;
  }

  export type RTCDtlsTransportState = 'new' | 'connecting' | 'connected' | 'closed' | 'failed';

  export interface RTCRtpSendParameters {
    transactionId: string;
    encodings: RTCRtpEncodingParameters[];
    headerExtensions: RTCRtpHeaderExtensionParameters[];
    rtcp: RTCRtcpParameters;
    codecs: RTCRtpCodecParameters[];
  }

  export interface RTCRtpReceiveParameters {
    headerExtensions: RTCRtpHeaderExtensionParameters[];
    rtcp: RTCRtcpParameters;
    codecs: RTCRtpCodecParameters[];
  }

  export interface RTCRtpEncodingParameters {
    active?: boolean;
    maxBitrate?: number;
    scaleResolutionDownBy?: number;
    rid?: string;
  }

  export interface RTCRtpHeaderExtensionParameters {
    uri: string;
    id: number;
    encrypted?: boolean;
  }

  export interface RTCRtcpParameters {
    cname?: string;
    reducedSize?: boolean;
  }

  export interface RTCRtpCodecParameters {
    payloadType: number;
    mimeType: string;
    clockRate?: number;
    channels?: number;
    sdpFmtpLine?: string;
  }

  export type RTCStatsReport = Map<string, RTCStats>;

  export interface RTCStats {
    id: string;
    timestamp: number;
    type: string;
    [key: string]: any;
  }

  export type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  export type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'disconnected' | 'failed' | 'closed';
  export type RTCIceGatheringState = 'new' | 'gathering' | 'complete';
  export type RTCSignalingState = 'stable' | 'have-local-offer' | 'have-remote-offer' | 'have-local-pranswer' | 'have-remote-pranswer' | 'closed';

  export class RTCPeerConnection {
    readonly localDescription: RTCSessionDescription | null;
    readonly remoteDescription: RTCSessionDescription | null;
    readonly signalingState: RTCSignalingState;
    readonly iceGatheringState: RTCIceGatheringState;
    readonly iceConnectionState: RTCIceConnectionState;
    readonly connectionState: RTCPeerConnectionState;

    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any) | null;
    onicecandidateerror: ((this: RTCPeerConnection, ev: Event) => any) | null;
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onnegotiationneeded: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onsignalingstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null;

    constructor(configuration?: RTCConfiguration);

    addIceCandidate(candidate?: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
    close(): void;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    getReceivers(): RTCRtpReceiver[];
    getSenders(): RTCRtpSender[];
    getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport>;
    getTransceivers(): RTCRtpTransceiver[];
    removeTrack(sender: RTCRtpSender): void;
    setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
  }

  export interface RTCDataChannelInit {
    ordered?: boolean;
    maxPacketLifeTime?: number;
    maxRetransmits?: number;
    protocol?: string;
    negotiated?: boolean;
    id?: number;
  }

  export interface RTCDataChannel {
    readonly label: string;
    readonly ordered: boolean;
    readonly protocol: string;
    readonly readyState: RTCDataChannelState;
    readonly bufferedAmount: number;

    onopen: ((this: RTCDataChannel, ev: Event) => any) | null;
    onclose: ((this: RTCDataChannel, ev: Event) => any) | null;
    onmessage: ((this: RTCDataChannel, ev: MessageEvent) => any) | null;
    onerror: ((this: RTCDataChannel, ev: Event) => any) | null;

    close(): void;
    send(data: string | ArrayBuffer | ArrayBufferView): void;
  }

  export type RTCDataChannelState = 'connecting' | 'open' | 'closing' | 'closed';

  export interface MediaStreamTrack {
    readonly id: string;
    readonly kind: 'audio' | 'video';
    readonly label: string;
    readonly muted: boolean;
    enabled: boolean;
    readonly readyState: MediaStreamTrackState;

    stop(): void;
    clone(): MediaStreamTrack;
    getSettings(): MediaTrackSettings;
    getConstraints(): MediaTrackConstraints;
    applyConstraints(constraints?: MediaTrackConstraints): Promise<void>;
  }

  export type MediaStreamTrackState = 'live' | 'ended';

  export interface MediaTrackSettings {
    width?: number;
    height?: number;
    aspectRatio?: number;
    frameRate?: number;
    facingMode?: string;
    volume?: number;
    sampleRate?: number;
    sampleSize?: number;
    echoCancellation?: boolean;
    autoGainControl?: boolean;
    noiseSuppression?: boolean;
    deviceId?: string;
    groupId?: string;
  }

  export interface MediaTrackConstraints {
    width?: number | ConstrainULong;
    height?: number | ConstrainULong;
    aspectRatio?: number | ConstrainDouble;
    frameRate?: number | ConstrainDouble;
    facingMode?: string | ConstrainDOMString;
    deviceId?: string | ConstrainDOMString;
    groupId?: string | ConstrainDOMString;
    sampleRate?: number | ConstrainULong;
    sampleSize?: number | ConstrainULong;
    echoCancellation?: boolean | ConstrainBoolean;
    autoGainControl?: boolean | ConstrainBoolean;
    noiseSuppression?: boolean | ConstrainBoolean;
  }

  export interface ConstrainULong {
    min?: number;
    max?: number;
    exact?: number;
    ideal?: number;
  }

  export interface ConstrainDouble {
    min?: number;
    max?: number;
    exact?: number;
    ideal?: number;
  }

  export interface ConstrainDOMString {
    exact?: string | string[];
    ideal?: string | string[];
  }

  export interface ConstrainBoolean {
    exact?: boolean;
    ideal?: boolean;
  }

  export class MediaStream {
    readonly id: string;
    readonly active: boolean;

    constructor(stream?: MediaStream);
    constructor(tracks?: MediaStreamTrack[]);

    addTrack(track: MediaStreamTrack): void;
    clone(): MediaStream;
    getAudioTracks(): MediaStreamTrack[];
    getTrackById(trackId: string): MediaStreamTrack | null;
    getTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    removeTrack(track: MediaStreamTrack): void;
    toURL(): string;
    release(): void;
  }

  export interface MediaStreamConstraints {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
  }

  export const mediaDevices: {
    getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
    enumerateDevices(): Promise<MediaDeviceInfo[]>;
  };

  export interface MediaDeviceInfo {
    readonly deviceId: string;
    readonly groupId: string;
    readonly kind: 'audioinput' | 'audiooutput' | 'videoinput';
    readonly label: string;
  }

  export interface RTCViewProps {
    streamURL?: string | null;
    mirror?: boolean;
    objectFit?: 'contain' | 'cover' | 'fill';
    zOrder?: number;
    style?: StyleProp<ViewStyle>;
  }

  export const RTCView: React.FC<RTCViewProps>;
}
