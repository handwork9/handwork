import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userName: string;
}

interface CallRoom {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName?: string;
  type: 'video' | 'audio';
  status: 'ringing' | 'connected' | 'ended';
  startedAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
}

@Injectable()
@WebSocketGateway({
  namespace: '/video-call',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://handwork.com', process.env.ADMIN_URL || 'https://admin.handwork.com']
      : true,
    credentials: true,
  },
})
export class VideoCallGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoCallGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private activeCalls: Map<string, CallRoom> = new Map(); // callId -> CallRoom
  private userActiveCalls: Map<string, string> = new Map(); // userId -> callId

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Video Call Gateway initialized on namespace /video-call');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      this.logger.log(`Video call connection attempt - Token present: ${!!token}`);
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      this.logger.log(`Token verified for user: ${payload.sub}`);
      client.userId = payload.sub;

      // Get user name
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      client.userName = user?.name || 'Unknown';

      // Register socket
      this.userSockets.set(client.userId, client.id);
      this.socketUsers.set(client.id, client.userId);

      // Join personal room for receiving calls
      client.join(`user_${client.userId}`);

      this.logger.log(`User connected to video call: ${client.userId} (${client.userName})`);
      
      client.emit('connected', { userId: client.userId });
    } catch (error) {
      this.logger.error(`Video call connection rejected: ${error.message}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketUsers.get(client.id);
    
    if (userId) {
      // End any active call
      const activeCallId = this.userActiveCalls.get(userId);
      if (activeCallId) {
        this.endCall(activeCallId, 'disconnected');
      }

      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`User disconnected from video call: ${userId}`);
    }
  }

  /**
   * Initiate a call
   */
  @SubscribeMessage('call_user')
  async handleCallUser(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string; type: 'video' | 'audio'; orderId?: string },
  ) {
    const { receiverId, type, orderId } = data;

    // Check if caller is already in a call
    if (this.userActiveCalls.has(client.userId)) {
      client.emit('call_error', { message: 'You are already in a call' });
      return;
    }

    // Check if receiver is already in a call
    if (this.userActiveCalls.has(receiverId)) {
      client.emit('call_error', { message: 'User is already in a call' });
      return;
    }

    // Check if receiver is online
    const receiverSocketId = this.userSockets.get(receiverId);
    if (!receiverSocketId) {
      client.emit('call_error', { message: 'User is not available' });
      return;
    }

    // Get receiver info
    const receiver = await this.userRepository.findOne({ where: { id: receiverId } });
    if (!receiver) {
      client.emit('call_error', { message: 'User not found' });
      return;
    }

    // Create call room
    const callId = `call_${Date.now()}_${client.userId}_${receiverId}`;
    const callRoom: CallRoom = {
      callId,
      callerId: client.userId,
      callerName: client.userName,
      receiverId,
      receiverName: receiver.name,
      type,
      status: 'ringing',
      startedAt: new Date(),
    };

    this.activeCalls.set(callId, callRoom);
    this.userActiveCalls.set(client.userId, callId);
    this.userActiveCalls.set(receiverId, callId);

    // Join call room
    client.join(callId);

    // Notify receiver
    this.server.to(`user_${receiverId}`).emit('incoming_call', {
      callId,
      callerId: client.userId,
      callerName: client.userName,
      callerAvatar: null, // TODO: Add avatar
      type,
      orderId,
    });

    // Confirm call initiated
    client.emit('call_initiated', {
      callId,
      receiverId,
      receiverName: receiver.name,
      type,
    });

    this.logger.log(`Call initiated: ${callId} (${client.userName} -> ${receiver.name})`);

    // Set timeout for unanswered call (30 seconds)
    setTimeout(() => {
      const call = this.activeCalls.get(callId);
      if (call && call.status === 'ringing') {
        this.endCall(callId, 'no_answer');
      }
    }, 30000);
  }

  /**
   * Answer incoming call
   */
  @SubscribeMessage('answer_call')
  handleAnswerCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const call = this.activeCalls.get(data.callId);

    if (!call) {
      client.emit('call_error', { message: 'Call not found' });
      return;
    }

    if (call.receiverId !== client.userId) {
      client.emit('call_error', { message: 'Not authorized to answer this call' });
      return;
    }

    // Join call room
    client.join(data.callId);

    // Update call status
    call.status = 'connected';
    call.connectedAt = new Date();

    // Notify caller
    this.server.to(data.callId).emit('call_answered', {
      callId: data.callId,
      answeredBy: client.userId,
      answeredByName: client.userName,
    });

    this.logger.log(`Call answered: ${data.callId}`);
  }

  /**
   * Decline incoming call
   */
  @SubscribeMessage('decline_call')
  handleDeclineCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const call = this.activeCalls.get(data.callId);

    if (!call) {
      client.emit('call_error', { message: 'Call not found' });
      return;
    }

    if (call.receiverId !== client.userId) {
      client.emit('call_error', { message: 'Not authorized' });
      return;
    }

    this.endCall(data.callId, 'declined');
    this.logger.log(`Call declined: ${data.callId}`);
  }

  /**
   * End active call
   */
  @SubscribeMessage('end_call')
  handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const call = this.activeCalls.get(data.callId);

    if (!call) {
      client.emit('call_error', { message: 'Call not found' });
      return;
    }

    if (call.callerId !== client.userId && call.receiverId !== client.userId) {
      client.emit('call_error', { message: 'Not authorized' });
      return;
    }

    this.endCall(data.callId, 'ended');
    this.logger.log(`Call ended: ${data.callId} by ${client.userId}`);
  }

  /**
   * Send WebRTC offer
   */
  @SubscribeMessage('webrtc_offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; offer: RTCSessionDescriptionInit },
  ) {
    const call = this.activeCalls.get(data.callId);
    if (!call) return;

    // Send to other participant
    client.to(data.callId).emit('webrtc_offer', {
      callId: data.callId,
      offer: data.offer,
      from: client.userId,
    });
  }

  /**
   * Send WebRTC answer
   */
  @SubscribeMessage('webrtc_answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; answer: RTCSessionDescriptionInit },
  ) {
    const call = this.activeCalls.get(data.callId);
    if (!call) return;

    client.to(data.callId).emit('webrtc_answer', {
      callId: data.callId,
      answer: data.answer,
      from: client.userId,
    });
  }

  /**
   * Send ICE candidate
   */
  @SubscribeMessage('ice_candidate')
  handleICECandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; candidate: RTCIceCandidateInit },
  ) {
    const call = this.activeCalls.get(data.callId);
    if (!call) return;

    client.to(data.callId).emit('ice_candidate', {
      callId: data.callId,
      candidate: data.candidate,
      from: client.userId,
    });
  }

  /**
   * Toggle audio/video
   */
  @SubscribeMessage('toggle_media')
  handleToggleMedia(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; mediaType: 'audio' | 'video'; enabled: boolean },
  ) {
    const call = this.activeCalls.get(data.callId);
    if (!call) return;

    client.to(data.callId).emit('media_toggled', {
      callId: data.callId,
      userId: client.userId,
      mediaType: data.mediaType,
      enabled: data.enabled,
    });
  }

  /**
   * End call helper
   */
  private endCall(callId: string, reason: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    call.status = 'ended';
    call.endedAt = new Date();

    // Calculate duration
    const duration = call.connectedAt
      ? Math.floor((call.endedAt.getTime() - call.connectedAt.getTime()) / 1000)
      : 0;

    // Notify all participants
    this.server.to(callId).emit('call_ended', {
      callId,
      reason,
      duration,
    });

    // Also notify user rooms in case they're not in call room
    this.server.to(`user_${call.callerId}`).emit('call_ended', { callId, reason, duration });
    this.server.to(`user_${call.receiverId}`).emit('call_ended', { callId, reason, duration });

    // Clean up
    this.userActiveCalls.delete(call.callerId);
    this.userActiveCalls.delete(call.receiverId);
    this.activeCalls.delete(callId);

    this.logger.log(`Call ended: ${callId}, reason: ${reason}, duration: ${duration}s`);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get user's active call
   */
  getUserActiveCall(userId: string): CallRoom | null {
    const callId = this.userActiveCalls.get(userId);
    return callId ? this.activeCalls.get(callId) || null : null;
  }
}
