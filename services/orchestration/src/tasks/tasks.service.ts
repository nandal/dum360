/**
 * @module tasks.service
 * @description Task CRUD operations — create, list, get, getNextQueued, getTaskPayload.
 *   State machine logic is delegated to TaskStateMachine.
 *   Data mapping is delegated to task-mapper.ts.
 */
import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { DRIZZLE_DB } from '@dum360/shared';
import type { CreateTaskRequest, Task, TaskAssignPayload, TaskDetail, TaskListQuery, TaskStatus } from '@dum360/shared';
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
    const [queued] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tasks)
      .where(eq(schema.tasks.status, 'queued'));
    const queuedCount = Number(queued?.count ?? 0);

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
        image: req.image ?? null,
        registryCredentials: req.registryCredentials ?? null,
        timeoutSeconds: req.timeout ?? 3600,
        priority: req.priority ?? 'normal',
        position: queuedCount + 1,
      })
      .returning();

    // Route docker tasks only to nodes that advertise a "docker" capability.
    const capabilityNames = new Set(
      (req.requirements ?? []).map((r) => r.capabilityName),
    );
    if (req.executor === 'docker') capabilityNames.add('docker');

    if (capabilityNames.size) {
      await this.db.insert(schema.taskRequirements).values(
        [...capabilityNames].map((capabilityName) => ({ taskId: task.id, capabilityName })),
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
  async getTaskPayload(taskId: string): Promise<TaskAssignPayload | null> {
    const [task] = await this.db
      .select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);

    if (!task) return null;

    // MVP: static delegated token. Real GitHub App minting is a follow-up.
    const repoToken = process.env.GITHUB_TOKEN ?? 'ghs_placeholder';
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await this.db
      .update(schema.tasks).set({ repoToken, tokenExpiresAt: new Date(expiresAt) })
      .where(eq(schema.tasks.id, taskId));

    return {
      taskId: task.id,
      executor: task.executor,
      timeout: task.timeoutSeconds,
      repository: task.repository,
      branch: task.branch,
      issue: task.issueNumber
        ? {
            number: task.issueNumber,
            title: task.issueTitle ?? '',
            body: task.issueBody ?? undefined,
          }
        : null,
      instructions: task.instructions,
      aiProvider: task.aiProvider,
      image: task.image ?? undefined,
      registryCredentials:
        (task.registryCredentials as TaskAssignPayload['registryCredentials']) ?? undefined,
      repoToken,
      tokenExpiresAt: expiresAt,
    };
  }

  /**
   * Node-facing poll: return the payload for a task assigned to this node that
   * has not yet been delivered (startedAt is set on first delivery to avoid
   * redelivering). Returns null when the node has no pending task.
   */
  async getNextTaskForNode(nodeId: string): Promise<TaskAssignPayload | null> {
    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.nodeId, nodeId),
          eq(schema.tasks.status, 'running'),
          isNull(schema.tasks.startedAt),
        ),
      )
      .orderBy(schema.tasks.priority, schema.tasks.position)
      .limit(1);

    if (!task) return null;

    // Mark as delivered so a subsequent poll won't hand out the same task.
    await this.db
      .update(schema.tasks)
      .set({ startedAt: new Date() })
      .where(eq(schema.tasks.id, task.id));

    return this.getTaskPayload(task.id);
  }
}
