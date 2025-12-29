import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SyncService } from '../email/services/sync.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SyncGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // accountId -> Set of socketIds

  constructor(private syncService: SyncService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from all account subscriptions
    for (const [accountId, socketIds] of this.connectedClients.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.connectedClients.delete(accountId);
      }
    }
  }

  @SubscribeMessage('subscribe:account')
  handleSubscribeAccount(client: Socket, accountId: string) {
    this.logger.log(`Client ${client.id} subscribed to account ${accountId}`);

    if (!this.connectedClients.has(accountId)) {
      this.connectedClients.set(accountId, new Set());
    }
    this.connectedClients.get(accountId)!.add(client.id);

    // Send current sync status
    this.syncService.getSyncStatus(accountId).then((status) => {
      client.emit('sync:status', { accountId, ...status });
    });
  }

  @SubscribeMessage('unsubscribe:account')
  handleUnsubscribeAccount(client: Socket, accountId: string) {
    this.logger.log(`Client ${client.id} unsubscribed from account ${accountId}`);

    const socketIds = this.connectedClients.get(accountId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.connectedClients.delete(accountId);
      }
    }
  }

  /**
   * Broadcast new email to subscribed clients
   */
  broadcastNewEmail(accountId: string, email: any) {
    const socketIds = this.connectedClients.get(accountId);
    if (socketIds && socketIds.size > 0) {
      this.server.emit('email:new', { accountId, email });
      this.logger.log(
        `Broadcasted new email to ${socketIds.size} clients for account ${accountId}`
      );
    }
  }

  /**
   * Broadcast sync status update
   */
  broadcastSyncStatus(accountId: string, status: any) {
    const socketIds = this.connectedClients.get(accountId);
    if (socketIds && socketIds.size > 0) {
      this.server.emit('sync:status', { accountId, ...status });
    }
  }

  /**
   * Broadcast sync progress
   */
  broadcastSyncProgress(accountId: string, progress: { current: number; total: number }) {
    const socketIds = this.connectedClients.get(accountId);
    if (socketIds && socketIds.size > 0) {
      this.server.emit('sync:progress', { accountId, ...progress });
    }
  }
}
