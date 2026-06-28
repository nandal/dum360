import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { sql, isNull } from 'drizzle-orm';
import { DRIZZLE_DB, QUEUE_NAMES, OFFLINE_THRESHOLD } from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';

/**
 * Liveness sweep — runs every 5 seconds.
 * Finds nodes that haven't heartbeated within the offline threshold
 * and marks them as offline.
 *
 * Publishing "node_offline" events is deferred to post-MVP
 * (requires Redis Pub/Sub to Orchestration service).
 */
@Injectable()
export class LivenessService {
  private readonly logger = new Logger(LivenessService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    @InjectQueue(QUEUE_NAMES.LIVENESS_SWEEP) private queue: Queue,
  ) {
    void this.scheduleSweep();
  }

  private async scheduleSweep(): Promise<void> {
    // Remove any old repeatable jobs
    const repeatables = await this.queue.getRepeatableJobs();
    for (const job of repeatables) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    // Schedule every 5 seconds
    await this.queue.add('sweep', {}, {
      repeat: { every: 5000 },
      removeOnComplete: true,
      removeOnFail: 5,
    });

    this.logger.log('Liveness sweep scheduled (every 5s)');
  }

  /** Called by BullMQ worker when sweep job fires. */
  async sweep(): Promise<{ offlined: number }> {
    const threshold = new Date(Date.now() - OFFLINE_THRESHOLD * 1000);
    const now = new Date();

    // Find nodes with no heartbeat within threshold (exclude already offline)
    const stale = await this.db
      .select({ id: schema.nodes.id, name: schema.nodes.name })
      .from(schema.nodes)
      .where(
        sql`${schema.nodes.status} != 'offline'
        AND ${schema.nodes.lastHeartbeatAt} IS NOT NULL
        AND ${schema.nodes.lastHeartbeatAt} < ${threshold}`,
      );

    if (stale.length === 0) return { offlined: 0 };

    const ids = stale.map((n) => n.id);

    // Mark offline
    await this.db
      .update(schema.nodes)
      .set({ status: 'offline' })
      .where(sql`${schema.nodes.id} IN (${sql.join(ids, sql`, `)})`);

    for (const node of stale) {
      this.logger.warn(`Node ${node.name} (${node.id}) marked offline`);
    }

    // Post-MVP: publish event to Orchestration to re-queue orphaned tasks
    // this.eventEmitter.emit('node.offline', { nodeIds: ids });

    return { offlined: stale.length };
  }
}
