import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  Logger,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * WebSocket gateway for real-time log streaming and node status.
 *
 * Channels:
 *   /ws/tasks/:id  — live task log stream
 *   /ws/nodes      — live node status feed
 */
@WebSocketGateway({
  namespace: 'ws',
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  /** Client subscribes to a task's log stream. */
  @SubscribeMessage('subscribe:task')
  handleSubscribeTask(client: Socket, taskId: string): void {
    const room = `task:${taskId}`;
    void client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  /** Client subscribes to the node status feed. */
  @SubscribeMessage('subscribe:nodes')
  handleSubscribeNodes(client: Socket): void {
    const room = 'nodes';
    void client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  /** Push a log entry to all clients watching a task. */
  emitTaskLog(taskId: string, logEntry: unknown): void {
    this.server.to(`task:${taskId}`).emit('log', logEntry);
  }

  /** Push a node status change to all watchers. */
  emitNodeStatus(nodeId: string, status: unknown): void {
    this.server.to('nodes').emit('node_status', status);
  }
}
