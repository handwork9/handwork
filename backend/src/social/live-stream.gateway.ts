import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';

interface StreamMessage {
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

@WebSocketGateway({
  namespace: 'live',
  cors: {
    origin: '*',
  },
})
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private streamViewers: Map<string, Set<string>> = new Map();
  private userStreams: Map<string, string> = new Map();

  constructor(private readonly socialService: SocialService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected to live stream: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const streamId = this.userStreams.get(client.id);
    if (streamId) {
      await this.leaveStream(client, streamId);
    }
    console.log(`Client disconnected from live stream: ${client.id}`);
  }

  @SubscribeMessage('join_stream')
  async handleJoinStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; userId?: string; username?: string },
  ) {
    const { streamId, userId, username } = data;

    // Join socket room
    client.join(streamId);

    // Track viewer
    if (!this.streamViewers.has(streamId)) {
      this.streamViewers.set(streamId, new Set());
    }
    this.streamViewers.get(streamId)?.add(client.id);
    this.userStreams.set(client.id, streamId);

    // Update viewer count in database
    await this.socialService.updateViewerCount(streamId, 1);

    const viewerCount = this.streamViewers.get(streamId)?.size || 0;

    // Notify others
    this.server.to(streamId).emit('viewer_joined', {
      viewerCount,
      userId,
      username,
    });

    // Send current state to joining client
    client.emit('stream_state', {
      streamId,
      viewerCount,
    });

    return { success: true, viewerCount };
  }

  @SubscribeMessage('leave_stream')
  async handleLeaveStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    await this.leaveStream(client, data.streamId);
    return { success: true };
  }

  private async leaveStream(client: Socket, streamId: string) {
    client.leave(streamId);

    const viewers = this.streamViewers.get(streamId);
    if (viewers) {
      viewers.delete(client.id);
      if (viewers.size === 0) {
        this.streamViewers.delete(streamId);
      }
    }
    this.userStreams.delete(client.id);

    // Update viewer count in database
    await this.socialService.updateViewerCount(streamId, -1);

    const viewerCount = this.streamViewers.get(streamId)?.size || 0;

    // Notify others
    this.server.to(streamId).emit('viewer_left', {
      viewerCount,
    });
  }

  @SubscribeMessage('stream_chat')
  async handleStreamChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; userId: string; username: string; message: string },
  ) {
    const { streamId, userId, username, message } = data;

    const chatMessage: StreamMessage = {
      streamId,
      userId,
      username,
      message,
      timestamp: new Date(),
    };

    // Broadcast to all viewers
    this.server.to(streamId).emit('chat_message', chatMessage);

    return { success: true };
  }

  @SubscribeMessage('stream_reaction')
  async handleStreamReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; reaction: string; userId?: string },
  ) {
    const { streamId, reaction, userId } = data;

    // Broadcast reaction to all viewers
    this.server.to(streamId).emit('reaction', {
      reaction,
      userId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  // Methods for farmer (streamer) to use
  @SubscribeMessage('start_broadcast')
  async handleStartBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; farmerId: string },
  ) {
    const { streamId, farmerId } = data;

    client.join(streamId);
    client.join(`streamer_${streamId}`);

    this.server.to(streamId).emit('stream_started', {
      streamId,
      farmerId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('end_broadcast')
  async handleEndBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    const { streamId } = data;

    this.server.to(streamId).emit('stream_ended', {
      streamId,
      timestamp: new Date(),
    });

    // Clean up
    this.streamViewers.delete(streamId);

    return { success: true };
  }

  @SubscribeMessage('pin_product')
  async handlePinProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; productId: string; productName: string; productPrice: number; productImage?: string },
  ) {
    // Only streamer can pin products
    const { streamId, ...productData } = data;

    this.server.to(streamId).emit('product_pinned', {
      ...productData,
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('unpin_product')
  async handleUnpinProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    const { streamId } = data;

    this.server.to(streamId).emit('product_unpinned', {
      timestamp: new Date(),
    });

    return { success: true };
  }

  // Get viewer count for a stream
  getViewerCount(streamId: string): number {
    return this.streamViewers.get(streamId)?.size || 0;
  }

  // Broadcast notification to all stream viewers
  notifyStreamViewers(streamId: string, event: string, data: any) {
    this.server.to(streamId).emit(event, data);
  }
}
