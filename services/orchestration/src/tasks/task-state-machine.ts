/**
 * @module task-state-machine
 * @description Task lifecycle state machine — validates transitions, applies side effects
 *   (timestamps, artifacts), records audit trail. No CRUD — only mutation operations.
 */
import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DRIZZLE_DB } from '@dum360/shared';
import type { TaskStatus, TaskArtifacts, Task, TaskDetail } from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { toTask, toStateTransition } from './task-mapper';
import { GitHubTokenService } from '../github/github-token.service';

/** Valid state transitions — enforced in application layer. */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  queued: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['queued'],
  cancelled: [],
};

@Injectable()
/** Handles all task state transitions: run, complete, fail, cancel, assign. */
export class TaskStateMachine {
  private readonly logger = new Logger(TaskStateMachine.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    private readonly gitHubToken: GitHubTokenService,
  ) {}

  /** Transition a task to a new status with validation. */
  async transition(
    taskId: string,
    toStatus: TaskStatus,
    reason?: string,
    artifacts?: TaskArtifacts,
    errorMessage?: string,
  ): Promise<TaskDetail> {
    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, taskId))
      .limit(1);

    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const fromStatus = task.status as TaskStatus;
    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid state transition: ${fromStatus} → ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const now = new Date();
    const isTerminal = ['completed', 'failed', 'cancelled'].includes(toStatus);
    const updates: Partial<schema.TaskInsert> = { status: toStatus };

    if (toStatus === 'running') updates.startedAt = now;
    if (isTerminal) updates.completedAt = now;
    if (artifacts) updates.artifacts = artifacts as Record<string, unknown>;
    if (errorMessage) updates.errorMessage = errorMessage;

    // Revoke the per-task GitHub token the moment the task ends — don't wait for
    // its TTL. Clear it from the row so a stale token isn't left at rest.
    if (isTerminal && task.repoToken) {
      await this.gitHubToken.revoke(task.repoToken);
      updates.repoToken = null;
      updates.tokenExpiresAt = null;
    }

    await this.db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, taskId));
    await this.recordTransition(taskId, fromStatus, toStatus, reason);

    this.logger.log(`Task ${taskId}: ${fromStatus} → ${toStatus}${reason ? ` (${reason})` : ''}`);

    return this.loadDetail(taskId);
  }

  /** Assign a task to a node (called by scheduler). */
  async assign(taskId: string, nodeId: string): Promise<TaskDetail> {
    await this.db
      .update(schema.tasks)
      .set({ nodeId, status: 'running' as const, startedAt: new Date() })
      .where(eq(schema.tasks.id, taskId));

    await this.db.insert(schema.schedulerAssignments).values({ taskId, nodeId });
    await this.recordTransition(taskId, 'queued', 'running');

    return this.loadDetail(taskId);
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private async recordTransition(
    taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus, reason?: string,
  ): Promise<void> {
    await this.db.insert(schema.taskStateTransitions).values({
      taskId, fromStatus, toStatus, reason: reason ?? null,
    });
  }

  private async loadDetail(taskId: string): Promise<TaskDetail> {
    const [row] = await this.db
      .select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);

    const reqs = await this.db
      .select().from(schema.taskRequirements).where(eq(schema.taskRequirements.taskId, taskId));

    const transitions = await this.db
      .select().from(schema.taskStateTransitions)
      .where(eq(schema.taskStateTransitions.taskId, taskId))
      .orderBy(desc(schema.taskStateTransitions.transitionedAt));

    return {
      ...toTask(row!),
      requirements: reqs.map((r) => ({ capabilityName: r.capabilityName })),
      repoToken: row!.repoToken ?? undefined,
      tokenExpiresAt: row!.tokenExpiresAt?.toISOString(),
      stateTransitions: transitions.map(toStateTransition),
    };
  }
}
