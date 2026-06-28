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
import { GitHubTokenService } from '../github/github-token.service';

@Injectable()
/** Handles task lifecycle from creation to completion. Delegates state transitions to TaskStateMachine. */
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    private readonly gitHubToken: GitHubTokenService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────

  /** Create a new task from an API/webhook request. Sets initial state to queued. */
  async create(req: CreateTaskRequest): Promise<Task> {
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
        // Compute the queue position atomically inside the INSERT so concurrent
        // creates can't read the same count and collide on a position.
        position: sql`(SELECT COUNT(*) + 1 FROM ${schema.tasks} WHERE ${schema.tasks.status} = 'queued')`,
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
      // repoToken is a live credential — only delivered via the node-facing
      // task payload, never exposed in the operator detail view.
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

    // Mint a per-task, repo-scoped, short-lived credential (GitHub App when
    // configured; dev static token otherwise). Never a shared placeholder.
    // Task context is passed (not just the repo) so the self-hosted tier (#17)
    // can later decide to skip server-side minting and use node-local creds.
    const minted = await this.gitHubToken.mintForTask({
      repository: task.repository,
      taskId: task.id,
    });
    const repoToken = minted.token;
    const expiresAt = minted.expiresAt.toISOString();

    await this.db
      .update(schema.tasks).set({ repoToken, tokenExpiresAt: minted.expiresAt })
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
            // title must be non-empty (IssueRef contract) — fall back when null.
            title: task.issueTitle?.trim() || `Issue #${task.issueNumber}`,
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

    // Atomically claim delivery: only the poll that flips startedAt from null
    // wins, so concurrent polls can't both receive the same task.
    const claimed = await this.db
      .update(schema.tasks)
      .set({ startedAt: new Date() })
      .where(and(eq(schema.tasks.id, task.id), isNull(schema.tasks.startedAt)))
      .returning({ id: schema.tasks.id });

    if (claimed.length === 0) return null; // another poll already claimed it

    try {
      return await this.getTaskPayload(task.id);
    } catch (error) {
      // Minting can fail (misconfig, GitHub outage, app-not-installed). Roll the
      // claim back so the task stays redeliverable, and return "no task" rather
      // than a 500 to the polling node.
      await this.db
        .update(schema.tasks)
        .set({ startedAt: null })
        .where(eq(schema.tasks.id, task.id));
      this.logger.error(
        `Could not prepare task ${task.id} for node ${nodeId}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
