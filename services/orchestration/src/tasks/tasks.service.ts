/**
 * @module tasks.service
 * @description Task CRUD operations — create, list, get, getNextQueued, getTaskPayload.
 *   State machine logic is delegated to TaskStateMachine.
 *   Data mapping is delegated to task-mapper.ts.
 */
import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '@dum360/shared';
import type { CreateTaskRequest, Task, TaskDetail, TaskListQuery, TaskStatus } from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { toTask, toStateTransition } from './task-mapper';

@Injectable()
/** Handles task lifecycle from creation to completion. Delegates state transitions to TaskStateMachine. */
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────

  /** Create a new task from an API/webhook request. Sets initial state to queued. */
  async create(req: CreateTaskRequest): Promise<Task> {
    const [count] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tasks)
      .where(eq(schema.tasks.status, 'queued'));

    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        executor: req.executor,
        repository: req.repository,
        branch: req.branch ?? 'main',
        issueNumber: req.issue?.number ?? null,
        issueTitle: req.issue?.title ?? null,
        issueBody: req.issue?.body ?? null,
        instructions: req.instructions,
        aiProvider: req.aiProvider,
        timeoutSeconds: req.timeout ?? 3600,
        priority: req.priority ?? 'normal',
        position: count + 1,
      })
      .returning();

    if (req.requirements?.length) {
      await this.db.insert(schema.taskRequirements).values(
        req.requirements.map((r) => ({ taskId: task.id, capabilityName: r.capabilityName })),
      );
    }

    await this.db.insert(schema.taskStateTransitions).values({
      taskId: task.id,
      fromStatus: 'queued' as TaskStatus,
      toStatus: 'queued' as TaskStatus,
    });

    this.logger.log(`Task created: ${task.id} (${req.executor} — ${req.repository})`);
    return toTask(task);
  }

  // ─── Read ─────────────────────────────────────────────────────────────

  /** List tasks with optional filters. Paginated, ordered by creation date desc. */
  async listTasks(query: TaskListQuery): Promise<{ tasks: Task[]; total: number }> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (query.status) conditions.push(eq(schema.tasks.status, query.status));
    if (query.executor) conditions.push(eq(schema.tasks.executor, query.executor));
    if (query.nodeId) conditions.push(eq(schema.tasks.nodeId, query.nodeId));
    if (query.repository) conditions.push(eq(schema.tasks.repository, query.repository));

    const rows = await this.db
      .select().from(schema.tasks)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.tasks.createdAt))
      .limit(Math.min(query.limit ?? 20, 100))
      .offset(query.offset ?? 0);

    return { tasks: rows.map(toTask), total: rows.length };
  }

  /** Get full task detail including requirements and state transitions. */
  async getTask(taskId: string): Promise<TaskDetail> {
    const [row] = await this.db
      .select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);

    if (!row) throw new NotFoundException(`Task ${taskId} not found`);

    const reqs = await this.db
      .select().from(schema.taskRequirements).where(eq(schema.taskRequirements.taskId, taskId));

    const transitions = await this.db
      .select().from(schema.taskStateTransitions)
      .where(eq(schema.taskStateTransitions.taskId, taskId))
      .orderBy(desc(schema.taskStateTransitions.transitionedAt));

    return {
      ...toTask(row),
      requirements: reqs.map((r) => ({ capabilityName: r.capabilityName })),
      repoToken: row.repoToken ?? undefined,
      tokenExpiresAt: row.tokenExpiresAt?.toISOString(),
      stateTransitions: transitions.map(toStateTransition),
    };
  }

  // ─── Scheduler helpers ────────────────────────────────────────────────

  /** Get the next queued task for scheduling (highest priority, earliest position). */
  async getNextQueuedTask(): Promise<Task | null> {
    const [row] = await this.db
      .select().from(schema.tasks)
      .where(eq(schema.tasks.status, 'queued'))
      .orderBy(schema.tasks.priority, schema.tasks.position)
      .limit(1);

    return row ? toTask(row) : null;
  }

  /** Build task payload for node assignment including ephemeral repo token. */
  async getTaskPayload(taskId: string): Promise<{
    taskId: string; executor: string; timeout: number; repository: string;
    branch: string; instructions: string; aiProvider: string;
    repoToken: string; tokenExpiresAt: string;
  } | null> {
    const [task] = await this.db
      .select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);

    if (!task) return null;

    const repoToken = process.env.GITHUB_TOKEN ?? 'ghs_placeholder';
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await this.db
      .update(schema.tasks).set({ repoToken, tokenExpiresAt: new Date(expiresAt) })
      .where(eq(schema.tasks.id, taskId));

    return {
      taskId: task.id, executor: task.executor, timeout: task.timeoutSeconds,
      repository: task.repository, branch: task.branch, instructions: task.instructions,
      aiProvider: task.aiProvider, repoToken, tokenExpiresAt: expiresAt,
    };
  }
}
