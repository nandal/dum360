import { Injectable, NotFoundException, GoneException, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB, type HeartbeatRequest, type HeartbeatResponse } from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';

@Injectable()
export class HeartbeatService {
  private readonly logger = new Logger(HeartbeatService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async process(req: HeartbeatRequest): Promise<HeartbeatResponse> {
    // Check node exists
    const [node] = await this.db
      .select({ id: schema.nodes.id, status: schema.nodes.status })
      .from(schema.nodes)
      .where(eq(schema.nodes.id, req.nodeId))
      .limit(1);

    if (!node) {
      throw new NotFoundException(`Node ${req.nodeId} not found`);
    }

    // Check if node was evicted (status is a known enum value)
    if (node.status === 'offline') {
      // Re-transition to online on heartbeat
      this.logger.log(`Node ${req.nodeId} re-onlined via heartbeat`);
    }

    // Insert heartbeat record
    await this.db.insert(schema.heartbeats).values({
      nodeId: req.nodeId,
      status: req.status,
      cpuUsed: req.resources.cpu.used,
      cpuTotal: req.resources.cpu.total,
      ramUsed: req.resources.ram.used,
      ramTotal: req.resources.ram.total,
      runningTasks: req.runningTasks,
      version: req.version,
    });

    // Update node status and last heartbeat timestamp
    await this.db
      .update(schema.nodes)
      .set({
        status: req.status,
        lastHeartbeatAt: new Date(),
        version: req.version,
      })
      .where(eq(schema.nodes.id, req.nodeId));

    return {
      acknowledged: true,
      serverTime: new Date().toISOString(),
      nextHeartbeatIn: 15,
    };
  }
}
