import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { eq, and, sql, isNull } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  QUEUE_NAMES,
  OFFLINE_THRESHOLD,
} from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import type { TasksService } from '../tasks/tasks.service';
import type { TaskStateMachine } from '../tasks/task-state-machine';

/**
 * MVP Scheduler.
 *
 * Algorithm:
 *   1. Get next queued task (highest priority, earliest created)
 *   2. Get its capability requirements
 *   3. Find online/idle nodes matching all capabilities
 *   4. Sort by utilization (least utilized first)
 *   5. Assign to first match
 *   6. Enqueue task dispatch notification
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    @InjectQueue(QUEUE_NAMES.TASK_DISPATCH) private queue: Queue,
    private readonly tasksService: TasksService,
    private readonly stateMachine: TaskStateMachine,
  ) {
    void this.scheduleCycle();
  }

  private async scheduleCycle(): Promise<void> {
    // Run scheduling cycle every 5 seconds
    const repeatables = await this.queue.getRepeatableJobs();
    for (const job of repeatables) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    await this.queue.add('schedule', {}, {
      repeat: { every: 5000 },
      removeOnComplete: true,
    });

    this.logger.log('Scheduler cycle scheduled (every 5s)');
  }

  /** Called by BullMQ worker on schedule. */
  async runCycle(): Promise<{ assigned: number }> {
    let assigned = 0;

    // Get next queued task
    const task = await this.tasksService.getNextQueuedTask();
    if (!task) return { assigned };

    // Get task requirements
    const reqs = await this.db
      .select({ name: schema.taskRequirements.capabilityName })
      .from(schema.taskRequirements)
      .where(eq(schema.taskRequirements.taskId, task.id));

    const requiredCaps = reqs.map((r) => r.name);

    // Find available nodes matching all capabilities
    const threshold = new Date(Date.now() - OFFLINE_THRESHOLD * 1000);

    // For MVP: query registry schema from this service's DB connection
    // In production: call Registry Service API via HTTP
    const availableNodes = await this.db.execute(
      sql`SELECT n.id, n.status, hb.cpu_used, hb.cpu_total, hb.ram_used, hb.ram_total
          FROM registry.nodes n
          LEFT JOIN LATERAL (
            SELECT cpu_used, cpu_total, ram_used, ram_total
            FROM registry.heartbeats
            WHERE node_id = n.id
            ORDER BY received_at DESC
            LIMIT 1
          ) hb ON true
          WHERE n.status IN ('online', 'busy')
          AND n.last_heartbeat_at > ${threshold.toISOString()}
          AND n.current_task_id IS NULL
          AND n.id IN (
            SELECT nc.node_id
            FROM registry.node_capabilities nc
            JOIN registry.capabilities c ON nc.capability_id = c.id
            WHERE c.name = ANY(${requiredCaps})
            GROUP BY nc.node_id
            HAVING COUNT(DISTINCT c.name) = ${requiredCaps.length}
          )
          ORDER BY
            COALESCE(hb.cpu_used::float / NULLIF(hb.cpu_total, 0), 0)
            + COALESCE(
              (regexp_replace(hb.ram_used, '[^0-9]', '', 'g'))::float
              / NULLIF(regexp_replace(hb.ram_total, '[^0-9]', '', 'g')::float, 0),
              0
            ) ASC`,
    );

    const nodes = availableNodes.rows as Array<{
      id: string;
      status: string;
      cpu_used: number;
      cpu_total: number;
      ram_used: string;
      ram_total: string;
    }>;

    if (nodes.length === 0) {
      this.logger.debug(`No capable node for task ${task.id}. Required: ${requiredCaps.join(', ')}`);
      return { assigned };
    }

    // Assign to first (least utilized) node
    const node = nodes[0];
    await this.stateMachine.assign(task.id, node.id);

    // Enqueue dispatch notification for the node
    await this.queue.add('dispatch', {
      taskId: task.id,
      nodeId: node.id,
    });

    this.logger.log(`Task ${task.id} assigned to node ${node.id}`);
    assigned++;

    return { assigned };
  }
}
