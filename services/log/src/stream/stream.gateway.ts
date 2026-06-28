import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  Logger,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { StreamService } from './stream.service';

@WebSocketGateway({
  namespace: 'ws',
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
})
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(StreamGateway.name);

  constructor(private readonly streamService: StreamService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    // Stop all pollers for this client
    const rooms = Array.from(client.rooms);
    for (const room of rooms) {
      if (room.startsWith('task:')) {
        // Check if any other client is in this room
        const roomSockets = this.server.sockets.adapter.rooms.get(room);
        if (!roomSockets || roomSockets.size === 0) {
          const taskId = room.slice(5);
          this.streamService.stopPolling(taskId);
        }
      }
    }
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:task')
  async handleSubscribeTask(client: Socket, taskId: string): Promise<void> {
    const room = `task:${taskId}`;
    await client.join(room);

    // Start polling ES for new logs
    this.streamService.startPolling(
      taskId,
      (log) => {
        this.server.to(room).emit('log', log);
      },
      (error) => {
        this.server.to(room).emit('error', { message: error.message });
      },
    );

    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  @SubscribeMessage('unsubscribe:task')
  async handleUnsubscribeTask(client: Socket, taskId: string): Promise<void> {
    const room = `task:${taskId}`;
    await client.leave(room);

    // Check if room is empty, stop polling
    const roomSockets = this.server.sockets.adapter.rooms.get(room);
    if (!roomSockets || roomSockets.size === 0) {
      this.streamService.stopPolling(taskId);
    }
  }
}
