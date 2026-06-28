import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { DRIZZLE_DB } from '@dum360/shared';
import type {
  CreateTaskRequest,
  Task,
  TaskDetail,
  TaskListQuery,
  TaskStatus,
  TaskArtifacts,
  TaskStateTransition,
} from '@dum360/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';

/** Valid state transitions — enforced in application layer. */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  queued: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['queued'],
  cancelled: [],
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────

  async create(req: CreateTaskRequest): Promise<Task> {
    // Compute queue position
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

    // Insert capability requirements
    if (req.requirements?.length) {
      await this.db.insert(schema.taskRequirements).values(
        req.requirements.map((r) => ({
          taskId: task.id,
          capabilityName: r.capabilityName,
        })),
      );
    }

    // Record initial state transition
    await this.recordTransition(task.id, 'queued' as TaskStatus, 'queued' as TaskStatus);

    this.logger.log(`Task created: ${task.id} (${req.executor} — ${req.repository})`);

    return this.toTask(task);
  }

  // ─── Read ─────────────────────────────────────────────────────────────

  async listTasks(query: TaskListQuery): Promise<{ tasks: Task[]; total: number }> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (query.status) conditions.push(eq(schema.tasks.status, query.status));
    if (query.executor) conditions.push(eq(schema.tasks.executor, query.executor));
    if (query.nodeId) conditions.push(eq(schema.tasks.nodeId, query.nodeId));
    if (query.repository) conditions.push(eq(schema.tasks.repository, query.repository));

    const limit = Math.min(query.limit ?? 20, 100);
    const offset = query.offset ?? 0;

    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.tasks.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      tasks: rows.map((r) => this.toTask(r)),
      total: rows.length,
    };
  }

  async getTask(taskId: string): Promise<TaskDetail> {
    const [row] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, taskId))
      .limit(1);

    if (!row) throw new NotFoundException(`Task ${taskId} not found`);

    // Fetch requirements
    const reqs = await this.db
      .select()
      .from(schema.taskRequirements)
      .where(eq(schema.taskRequirements.taskId, taskId));

    // Fetch state transitions
    const transitions = await this.db
      .select()
      .from(schema.taskStateTransitions)
      .where(eq(schema.taskStateTransitions.taskId, taskId))
      .orderBy(desc(schema.taskStateTransitions.transitionedAt));

    return {
      ...this.toTask(row),
      requirements: reqs.map((r) => ({ capabilityName: r.capabilityName })),
      repoToken: row.repoToken ?? undefined,
      tokenExpiresAt: row.tokenExpiresAt?.toISOString(),
      stateTransitions: transitions.map((t) => ({
        id: t.id,
        taskId: t.taskId,
        fromStatus: t.fromStatus as TaskStatus,
        toStatus: t.toStatus as TaskStatus,
        reason: t.reason,
        transitionedAt: t.transitionedAt.toISOString(),
      })),
    };
  }

  // ─── State Machine ────────────────────────────────────────────────────

  async transitionTask(
    taskId: string,
    toStatus: TaskStatus,
    reason?: string,
    artifacts?: TaskArtifacts,
    errorMessage?: string,
  ): Promise<Task> {
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

    // Build update values
    const now = new Date();
    const updates: Partial<schema.TaskInsert> = { status: toStatus };

    if (toStatus === 'running') {
      updates.startedAt = now;
    }
    if (toStatus === 'completed' || toStatus === 'failed' || toStatus === 'cancelled') {
      updates.completedAt = now;
    }
    if (artifacts) {
      updates.artifacts = artifacts as Record<string, unknown>;
    }
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    await this.db
      .update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, taskId));

    // Record transition
    await this.recordTransition(taskId, fromStatus, toStatus, reason);

    this.logger.log(`Task ${taskId}: ${fromStatus} → ${toStatus}${reason ? ` (${reason})` : ''}`);

    return this.getTask(taskId);
  }

  /** Assign a task to a node (called by scheduler). */
  async assignTask(taskId: string, nodeId: string): Promise<Task> {
    await this.db
      .update(schema.tasks)
      .set({ nodeId, status: 'running' as const, startedAt: new Date() })
      .where(eq(schema.tasks.id, taskId));

    // Record assignment
    await this.db.insert(schema.schedulerAssignments).values({
      taskId,
      nodeId,
    });

    await this.recordTransition(taskId, 'queued', 'running');

    return this.getTask(taskId);
  }

  /** Get the next queued task for the scheduler (highest priority, earliest created). */
  async getNextQueuedTask(): Promise<Task | null> {
    const [row] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.status, 'queued'))
      .orderBy(schema.tasks.priority, schema.tasks.position)
      .limit(1);

    return row ? this.toTask(row) : null;
  }

  /** Return task payload for node assignment — includes repo token. */
  async getTaskPayload(taskId: string, nodeId: string): Promise<{
    taskId: string;
    executor: string;
    timeout: number;
    repository: string;
    branch: string;
    instructions: string;
    aiProvider: string;
    repoToken: string;
    tokenExpiresAt: string;
  } | null> {
    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, taskId))
      .limit(1);

    if (!task) return null;

    // Generate ephemeral GitHub token (MVP: use env var or placeholder)
    const repoToken = process.env.GITHUB_TOKEN ?? 'ghs_placeholder';
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    // Store token on task
    await this.db
      .update(schema.tasks)
      .set({ repoToken, tokenExpiresAt: new Date(expiresAt) })
      .where(eq(schema.tasks.id, taskId));

    return {
      taskId: task.id,
      executor: task.executor,
      timeout: task.timeoutSeconds,
      repository: task.repository,
      branch: task.branch,
      instructions: task.instructions,
      aiProvider: task.aiProvider,
      repoToken,
      tokenExpiresAt: expiresAt,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private async recordTransition(
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    reason?: string,
  ): Promise<void> {
    await this.db.insert(schema.taskStateTransitions).values({
      taskId,
      fromStatus,
      toStatus,
      reason: reason ?? null,
    });
  }

  private toTask(row: schema.TaskRow): Task {
    return {
      id: row.id,
      executor: row.executor,
      status: row.status as TaskStatus,
      repository: row.repository,
      branch: row.branch,
      issueNumber: row.issueNumber,
      issueTitle: row.issueTitle,
      issueBody: row.issueBody,
      instructions: row.instructions,
      aiProvider: row.aiProvider,
      timeoutSeconds: row.timeoutSeconds,
      priority: row.priority,
      nodeId: row.nodeId,
      artifacts: (row.artifacts ?? {}) as TaskArtifacts,
      errorMessage: row.errorMessage,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
    };
  }
}
