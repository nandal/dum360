/**
 * @module task-mapper
 * @description Converts database rows to API response types (Task, TaskDetail).
 *   Isolated from business logic — pure data transformation.
 */
import type { TaskStatus, TaskArtifacts, Task, TaskDetail, TaskStateTransition } from '@dum360/shared';
import type * as schema from '../database/schema';

/** Map a single TaskRow to the API Task type. Pure function, no I/O. */
export function toTask(row: schema.TaskRow): Task {
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

/** Map TaskStateTransitionRows to API type. Pure function. */
export function toStateTransition(
  t: schema.TaskStateTransitionRow,
): TaskStateTransition {
  return {
    id: t.id,
    taskId: t.taskId,
    fromStatus: t.fromStatus as TaskStatus,
    toStatus: t.toStatus as TaskStatus,
    reason: t.reason,
    transitionedAt: t.transitionedAt.toISOString(),
  };
}
