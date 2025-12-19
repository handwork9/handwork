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
import { RidersService } from './riders.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'riders',
})
export class RidersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedRiders: Map<string, string> = new Map(); // socketId -> riderId

  constructor(private readonly ridersService: RidersService) {}

  async handleConnection(client: Socket) {
    console.log(`Rider connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const riderId = this.connectedRiders.get(client.id);
    if (riderId) {
      // Mark rider as offline
      await this.ridersService.updateStatus(riderId, { isOnline: false });
      this.connectedRiders.delete(client.id);
    }
    console.log(`Rider disconnected: ${client.id}`);
  }

  @SubscribeMessage('rider:register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { riderId: string },
  ) {
    this.connectedRiders.set(client.id, data.riderId);
    await this.ridersService.updateStatus(data.riderId, { isOnline: true });
    client.join(`rider:${data.riderId}`);
    return { event: 'registered', data: { success: true } };
  }

  @SubscribeMessage('rider:location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { riderId: string; lat: number; lng: number },
  ) {
    await this.ridersService.updateLocation(data.riderId, {
      lat: data.lat,
      lng: data.lng,
    });
    return { event: 'location:updated', data: { success: true } };
  }

  @SubscribeMessage('rider:available')
  async handleAvailabilityUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { riderId: string; available: boolean },
  ) {
    if (data.available) {
      await this.ridersService.markAsAvailable(data.riderId);
    } else {
      await this.ridersService.markAsUnavailable(data.riderId);
    }
    return { event: 'availability:updated', data: { success: true } };
  }

  // Send delivery offer to specific rider
  async sendDeliveryOffer(riderId: string, offer: any) {
    this.server.to(`rider:${riderId}`).emit('delivery:offer', offer);
  }

  // Broadcast to all riders in a state
  async broadcastToState(state: string, event: string, data: any) {
    this.server.to(`state:${state}`).emit(event, data);
  }
}
