import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface OrderOffer {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: string;
  estimatedEta: number;
  totalAmount: number;
  timeoutSeconds: number;
}

interface RiderResponseCallback {
  orderId: string;
  riderId: string;
  callback: (accepted: boolean) => void;
}

@WebSocketGateway({
  namespace: '/dispatch',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://handwork.com', process.env.ADMIN_URL || 'https://admin.handwork.com']
      : true,
    credentials: true,
  },
})
export class DispatchGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DispatchGateway.name);
  private readonly riderSockets = new Map<string, string>(); // riderId -> socketId
  private readonly responseListeners: RiderResponseCallback[] = [];

  handleConnection(client: Socket): void {
    this.logger.log(`Dispatch client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    // Remove rider from socket mapping
    for (const [riderId, socketId] of this.riderSockets.entries()) {
      if (socketId === client.id) {
        this.riderSockets.delete(riderId);
        this.logger.log(`Rider ${riderId} disconnected from dispatch`);
        break;
      }
    }
  }

  /**
   * Rider joins dispatch channel with their ID
   */
  @SubscribeMessage('rider:join')
  handleRiderJoin(
    @MessageBody() data: { riderId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.riderSockets.set(data.riderId, client.id);
    client.join(`rider:${data.riderId}`);
    this.logger.log(`Rider ${data.riderId} joined dispatch channel`);
    client.emit('dispatch:joined', { success: true, riderId: data.riderId });
  }

  /**
   * Buyer/Admin joins to track an order
   */
  @SubscribeMessage('order:track')
  handleOrderTrack(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`order:${data.orderId}`);
    this.logger.log(`Client ${client.id} tracking order ${data.orderId}`);
    client.emit('order:tracking', { success: true, orderId: data.orderId });
  }

  /**
   * Rider accepts order offer
   */
  @SubscribeMessage('offer:accept')
  handleOfferAccept(
    @MessageBody() data: { orderId: string; riderId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Rider ${data.riderId} accepted order ${data.orderId}`);
    this.triggerResponseCallback(data.orderId, data.riderId, true);
    client.emit('offer:accepted', { orderId: data.orderId });
  }

  /**
   * Rider declines order offer
   */
  @SubscribeMessage('offer:decline')
  handleOfferDecline(
    @MessageBody() data: { orderId: string; riderId: string; reason?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Rider ${data.riderId} declined order ${data.orderId}: ${data.reason}`);
    this.triggerResponseCallback(data.orderId, data.riderId, false);
    client.emit('offer:declined', { orderId: data.orderId });
  }

  /**
   * Send order offer to specific rider
   */
  sendOfferToRider(riderId: string, offer: OrderOffer): void {
    const socketId = this.riderSockets.get(riderId);
    if (socketId) {
      this.server.to(`rider:${riderId}`).emit('order:offer', offer);
      this.logger.log(`Sent order offer ${offer.orderId} to rider ${riderId}`);
    } else {
      this.logger.warn(`Rider ${riderId} not connected to dispatch`);
      // Could trigger push notification here as fallback
    }
  }

  /**
   * Notify that order has been assigned
   */
  notifyOrderAssigned(orderId: string, riderId: string): void {
    // Notify the rider
    this.server.to(`rider:${riderId}`).emit('order:assigned', {
      orderId,
      riderId,
      message: 'You have been assigned to this order',
    });

    // Notify anyone tracking the order
    this.server.to(`order:${orderId}`).emit('order:assigned', {
      orderId,
      riderId,
      status: 'assigned',
    });

    this.logger.log(`Notified order ${orderId} assignment to rider ${riderId}`);
  }

  /**
   * Notify that rider declined (internal use for dispatch logic)
   */
  notifyRiderDeclined(orderId: string, riderId: string): void {
    this.triggerResponseCallback(orderId, riderId, false);
  }

  /**
   * Broadcast order status update to tracking clients
   */
  broadcastOrderStatus(orderId: string, status: string, data?: Record<string, any>): void {
    this.server.to(`order:${orderId}`).emit('order:status', {
      orderId,
      status,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast rider location to order trackers
   */
  broadcastRiderLocation(
    orderId: string,
    riderId: string,
    latitude: number,
    longitude: number,
  ): void {
    this.server.to(`order:${orderId}`).emit('rider:location', {
      orderId,
      riderId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register callback for rider response
   */
  onRiderResponse(
    orderId: string,
    riderId: string,
    callback: (accepted: boolean) => void,
  ): void {
    this.responseListeners.push({ orderId, riderId, callback });
  }

  /**
   * Remove response listener
   */
  removeResponseListener(orderId: string, riderId: string): void {
    const index = this.responseListeners.findIndex(
      (l) => l.orderId === orderId && l.riderId === riderId,
    );
    if (index !== -1) {
      this.responseListeners.splice(index, 1);
    }
  }

  /**
   * Trigger response callback when rider responds
   */
  private triggerResponseCallback(
    orderId: string,
    riderId: string,
    accepted: boolean,
  ): void {
    const listener = this.responseListeners.find(
      (l) => l.orderId === orderId && l.riderId === riderId,
    );
    if (listener) {
      listener.callback(accepted);
      this.removeResponseListener(orderId, riderId);
    }
  }

  /**
   * Get online rider count
   */
  getOnlineRiderCount(): number {
    return this.riderSockets.size;
  }

  /**
   * Check if rider is online
   */
  isRiderOnline(riderId: string): boolean {
    return this.riderSockets.has(riderId);
  }
}
