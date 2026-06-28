# ADR-002: Database Schemas — Registry & Orchestration Services

**Status:** Proposed
**Date:** 2026-06-28
**Deciders:** System Architect, CEO
**Depends on:** ADR-001 (Technology Stack)
**Supersedes:** PRD §Data Models (normalized into service-specific schemas)

---

## Context

ADR-001 decomposed DUM360 into 4 microservices with PostgreSQL per-service schemas. This ADR defines the Drizzle ORM schemas for **Registry** and **Orchestration** services. The **Log** service is redesigned in ADR-003 (ELK stack) and has no PostgreSQL tables. The **API Gateway** is stateless — owns no database tables.

Each schema maps PRD data models into normalized PostgreSQL tables with proper relationships, indexes, constraints, and TypeScript types via Drizzle ORM.

---

## Decision

### Registry Service — Schema: `registry`

Owns: node lifecycle, heartbeat tracking, capability catalog, attestation records.

#### ER Diagram

```
┌──────────────┐       ┌────────────────────┐
│    nodes     │       │  attestation_results│
│──────────────│       │────────────────────│
│ id (PK)      │──┐    │ id (PK)            │
│ name (UQ)    │  │    │ node_id (FK)       │──┐
│ status       │  │    │ capability_id (FK) │  │
│ jwt_secret   │  │    │ passed             │  │
│ version      │  │    │ reason             │  │
│ registered_at│  │    │ created_at         │  │
│ last_heart.. │  │    └────────────────────┘  │
└──────────────┘  │                            │
       │          │    ┌────────────────────┐   │
       │          │    │  capabilities      │   │
       │          │    │────────────────────│   │
       │          └───►│ id (PK)            │◄──┘
       │               │ category           │
       │               │ name               │
       │               │ version (nullable) │
       │               │ created_at         │
       │               └────────────────────┘
       │                        │
       │               ┌────────┴────────┐
       │               │ node_capabilities│
       │               │─────────────────│
       └──────────────►│ node_id (FK,PK)  │
                       │ capability_id(FK)│
                       │ value (nullable) │
                       │ attested_at      │
                       └──────────────────┘

┌──────────────────────┐
│     heartbeats       │
│──────────────────────│
│ id (PK)              │
│ node_id (FK) ────────┼──► nodes
│ status               │
│ cpu_used             │
│ cpu_total            │
│ ram_used             │
│ ram_total            │
│ running_tasks        │
│ version              │
│ received_at          │
└──────────────────────┘
```

#### Table: `nodes`

```typescript
// services/registry/src/database/schema/nodes.ts
import { pgSchema, uuid, varchar, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const registrySchema = pgSchema('registry');

export const nodeStatusEnum = registrySchema.enum('node_status', [
  'online', 'offline', 'busy',
]);

export const nodes = registrySchema.table('nodes', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           varchar('name', { length: 128 }).notNull().unique(),
  status:         nodeStatusEnum('status').notNull().default('online'),
  jwtSecret:      varchar('jwt_secret', { length: 256 }).notNull(),
  version:        varchar('version', { length: 32 }).notNull().default('0.1.0'),
  registeredAt:   timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  currentTaskId:  uuid('current_task_id'),       // denormalized for fast scheduler reads
}, (table) => ({
  statusIdx:       index('idx_nodes_status').on(table.status),
  lastHeartbeatIdx: index('idx_nodes_last_heartbeat').on(table.lastHeartbeatAt),
  nameUniq:        uniqueIndex('uq_nodes_name').on(table.name),
}));
```

**Design notes:**

- `jwtSecret` — unique per node, rotated on re-registration. Used by API Gateway to validate node JWTs.
- `currentTaskId` — denormalized from Orchestration for fast scheduler queries. Updated via event when tasks are assigned/completed.
- `lastHeartbeatAt` — denormalized from `heartbeats` to avoid join on every scheduler cycle. Updated on every heartbeat write.

#### Table: `capabilities`

```typescript
export const capabilityCategoryEnum = registrySchema.enum('capability_category', [
  'executor', 'resource', 'tool', 'runtime', 'service',
]);

export const capabilities = registrySchema.table('capabilities', {
  id:        uuid('id').primaryKey().defaultRandom(),
  category:  capabilityCategoryEnum('category').notNull(),
  name:      varchar('name', { length: 64 }).notNull(),
  version:   varchar('version', { length: 32 }),        // nullable — some caps have no version
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx:         index('idx_capabilities_name').on(table.name),
  categoryNameUniq: uniqueIndex('uq_capability_category_name').on(table.category, table.name),
}));
```

**Design notes:**

- Capabilities are a **catalog** — pre-seeded with known capabilities, extended when nodes register with new ones.
- `(category, name)` is unique — there's only one "python" runtime capability, shared across all nodes.
- `version` is nullable for capabilities like `git`, `docker` that have no meaningful version.

#### Table: `node_capabilities` (join)

```typescript
export const nodeCapabilities = registrySchema.table('node_capabilities', {
  nodeId:        uuid('node_id')
                   .notNull()
                   .references(() => nodes.id, { onDelete: 'cascade' }),
  capabilityId:  uuid('capability_id')
                   .notNull()
                   .references(() => capabilities.id, { onDelete: 'cascade' }),
  value:         varchar('value', { length: 64 }),      // e.g., "64GB", "16", "RTX4090"
  attestedAt:    timestamp('attested_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk:            primaryKey({ columns: [table.nodeId, table.capabilityId] }),
  nodeIdx:       index('idx_nc_node').on(table.nodeId),
  capabilityIdx: index('idx_nc_capability').on(table.capabilityId),
}));
```

**Design notes:**

- Composite PK ensures a node can't declare the same capability twice.
- `value` stores the declared/attested value (e.g., `"64GB"` for ram, `"16"` for cpu).
- Updated on re-registration with new capabilities.

#### Table: `attestation_results`

```typescript
export const attestationResults = registrySchema.table('attestation_results', {
  id:           uuid('id').primaryKey().defaultRandom(),
  nodeId:       uuid('node_id')
                  .notNull()
                  .references(() => nodes.id, { onDelete: 'cascade' }),
  capabilityId: uuid('capability_id')
                  .notNull()
                  .references(() => capabilities.id, { onDelete: 'cascade' }),
  passed:       boolean('passed').notNull(),
  reason:       varchar('reason', { length: 512 }),      // failure reason if !passed
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nodeIdx:      index('idx_ar_node').on(table.nodeId),
  createdAtIdx: index('idx_ar_created_at').on(table.createdAt),
}));
```

**Design notes:**

- Immutable audit log. Every attestation attempt is recorded, not just the latest.
- Latest attestation for (node, capability) is derived via `DISTINCT ON ... ORDER BY created_at DESC`.
- `reason` is nullable — only populated for failures.

#### Table: `heartbeats`

```typescript
export const heartbeats = registrySchema.table('heartbeats', {
  id:           uuid('id').primaryKey().defaultRandom(),
  nodeId:       uuid('node_id')
                  .notNull()
                  .references(() => nodes.id, { onDelete: 'cascade' }),
  status:       nodeStatusEnum('status').notNull(),
  cpuUsed:      integer('cpu_used').notNull(),
  cpuTotal:     integer('cpu_total').notNull(),
  ramUsed:      varchar('ram_used', { length: 16 }).notNull(),    // "24GB"
  ramTotal:     varchar('ram_total', { length: 16 }).notNull(),   // "64GB"
  runningTasks: integer('running_tasks').notNull().default(0),
  version:      varchar('version', { length: 32 }).notNull(),
  receivedAt:   timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nodeIdx:      index('idx_hb_node').on(table.nodeId),
  receivedIdx:  index('idx_hb_received').on(table.receivedAt),
}));
```

**Design notes:**

- Append-only time-series. Partition by month in production.
- MVP: keep last 24h of heartbeats, TTL-clean via BullMQ scheduled job.
- `ramUsed`/`ramTotal` stored as string (matching PRD format: `"64GB"`). Parsed in application layer for utilization math.

---

### Orchestration Service — Schema: `orchestration`

Owns: tasks, task lifecycle, capability requirements, webhook events, scheduler assignments.

#### ER Diagram

```
┌──────────────────┐       ┌───────────────────────┐
│     tasks        │       │   task_requirements    │
│──────────────────│       │───────────────────────│
│ id (PK)          │──┐    │ id (PK)               │
│ executor         │  │    │ task_id (FK) ─────────┼──► tasks
│ status           │  │    │ capability_name       │
│ repository       │  │    │ required_at           │
│ branch           │  │    └───────────────────────┘
│ issue_number     │  │
│ issue_title      │  │    ┌───────────────────────┐
│ issue_body       │  │    │  task_state_transitions│
│ instructions     │  │    │───────────────────────│
│ ai_provider      │  │    │ id (PK)               │
│ timeout_seconds  │  │    │ task_id (FK) ─────────┼──► tasks
│ priority         │  │    │ from_status           │
│ node_id (FK)     │──┼───►│ to_status             │
│ repo_token       │  │    │ reason (nullable)     │
│ token_expires_at │  │    │ transitioned_at       │
│ artifacts        │  │    └───────────────────────┘
│ error_message    │  │
│ created_at       │  │    ┌───────────────────────┐
│ started_at       │  │    │   webhook_events      │
│ completed_at     │  │    │───────────────────────│
│ position         │  │    │ id (PK)               │
└──────────────────┘  │    │ event_type            │
                       │    │ action                │
┌──────────────────────┐    │ repository            │
│ scheduler_assignments│    │ issue_number          │
│──────────────────────│    │ sender                │
│ id (PK)              │    │ command               │
│ task_id (FK) ────────┼──► tasks                   │
│ node_id              │    │ payload (JSONB)       │
│ assigned_at          │    │ processed             │
│ deassigned_at        │    │ tasks_created         │
└──────────────────────┘    │ created_at            │
                            └───────────────────────┘
```

#### Table: `tasks`

```typescript
// services/orchestration/src/database/schema/tasks.ts
import { pgSchema, uuid, varchar, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const orchestrationSchema = pgSchema('orchestration');

export const taskStatusEnum = orchestrationSchema.enum('task_status', [
  'queued', 'running', 'completed', 'failed', 'cancelled',
]);

export const taskPriorityEnum = orchestrationSchema.enum('task_priority', [
  'low', 'normal', 'high', 'critical',
]);

export const executorEnum = orchestrationSchema.enum('executor', [
  'github',
]);

export const aiProviderEnum = orchestrationSchema.enum('ai_provider', [
  'claude', 'codex', 'gemini',
]);

export const tasks = orchestrationSchema.table('tasks', {
  id:             uuid('id').primaryKey().defaultRandom(),
  executor:       executorEnum('executor').notNull(),
  status:         taskStatusEnum('status').notNull().default('queued'),
  repository:     varchar('repository', { length: 256 }).notNull(),
  branch:         varchar('branch', { length: 256 }).notNull().default('main'),
  issueNumber:    integer('issue_number'),
  issueTitle:     varchar('issue_title', { length: 512 }),
  issueBody:      text('issue_body'),
  instructions:   text('instructions').notNull(),
  aiProvider:     aiProviderEnum('ai_provider').notNull(),
  timeoutSeconds: integer('timeout_seconds').notNull().default(3600),
  priority:       taskPriorityEnum('priority').notNull().default('normal'),
  nodeId:         uuid('node_id'),                               // assigned node (nullable until scheduled)
  repoToken:      varchar('repo_token', { length: 512 }),        // GitHub installation token
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  artifacts:      jsonb('artifacts').default({}),                // { branch, prUrl, commitSha, diff, testResults }
  errorMessage:   text('error_message'),
  position:       integer('position'),                           // queue position for queued tasks
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt:      timestamp('started_at', { withTimezone: true }),
  completedAt:    timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  statusIdx:       index('idx_tasks_status').on(table.status),
  executorIdx:     index('idx_tasks_executor').on(table.executor),
  nodeIdx:         index('idx_tasks_node').on(table.nodeId),
  statusNodeIdx:   index('idx_tasks_status_node').on(table.status, table.nodeId),
  priorityIdx:     index('idx_tasks_priority').on(table.priority),
  repositoryIdx:   index('idx_tasks_repository').on(table.repository),
  createdAtIdx:    index('idx_tasks_created_at').on(table.createdAt),
  queuePositionIdx: index('idx_tasks_queue').on(table.status, table.priority, table.position),
}));
```

**Design notes:**

- `position` for queue ordering — updated when tasks enter/leave `queued` state.
- `artifacts` as JSONB — flexible, schema-light. Contains `branch`, `prUrl`, `commitSha`, `diff`, `testResults`.
- `repoToken` + `tokenExpiresAt` — ephemeral GitHub token, cleared after task completes.
- `issueBody` as `text` — can be large (GitHub issue bodies). No full-text search index in MVP.
- `queuePositionIdx` — composite index on `(status, priority, position)` for fast FIFO queue reads.

#### Table: `task_requirements`

```typescript
export const taskRequirements = orchestrationSchema.table('task_requirements', {
  id:              uuid('id').primaryKey().defaultRandom(),
  taskId:          uuid('task_id')
                     .notNull()
                     .references(() => tasks.id, { onDelete: 'cascade' }),
  capabilityName:  varchar('capability_name', { length: 64 }).notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx:         index('idx_tr_task').on(table.taskId),
  capabilityIdx:   index('idx_tr_capability').on(table.capabilityName),
}));
```

**Design notes:**

- Stores the flat capability ID list from task creation (e.g., `["git", "claude", "gh"]`).
- Scheduler joins this against `registry.node_capabilities` to find matching nodes.

#### Table: `task_state_transitions`

```typescript
export const taskStateTransitions = orchestrationSchema.table('task_state_transitions', {
  id:            uuid('id').primaryKey().defaultRandom(),
  taskId:        uuid('task_id')
                   .notNull()
                   .references(() => tasks.id, { onDelete: 'cascade' }),
  fromStatus:    taskStatusEnum('from_status').notNull(),
  toStatus:      taskStatusEnum('to_status').notNull(),
  reason:        varchar('reason', { length: 512 }),      // e.g., "node vanished", "timeout", "cancelled by operator"
  transitionedAt: timestamp('transitioned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx:       index('idx_tst_task').on(table.taskId),
  timeIdx:       index('idx_tst_time').on(table.transitionedAt),
}));
```

**Design notes:**

- Immutable audit log. Every status change is recorded.
- Enables time-in-state analysis and debugging.
- State machine validation happens in application layer, not in the database.
- **Valid transitions:**

  ```
  queued    → running, cancelled
  running   → completed, failed, cancelled
  completed → (terminal)
  failed    → queued (retry), (terminal)
  cancelled → (terminal)
  ```

#### Table: `webhook_events`

```typescript
export const webhookEventTypeEnum = orchestrationSchema.enum('webhook_event_type', [
  'issue_comment', 'issues', 'pull_request_review_comment',
]);

export const webhookEvents = orchestrationSchema.table('webhook_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  eventType:    webhookEventTypeEnum('event_type').notNull(),
  action:       varchar('action', { length: 64 }).notNull(),       // GitHub action: "created", "opened"
  repository:   varchar('repository', { length: 256 }).notNull(),
  issueNumber:  integer('issue_number'),
  sender:       varchar('sender', { length: 128 }).notNull(),
  command:      text('command'),                                    // parsed @dum360 command
  payload:      jsonb('payload').notNull(),                         // raw GitHub payload for debugging
  processed:    boolean('processed').notNull().default(false),
  tasksCreated: integer('tasks_created').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  processedIdx: index('idx_we_processed').on(table.processed),
  repoIdx:      index('idx_we_repository').on(table.repository),
  createdAtIdx: index('idx_we_created_at').on(table.createdAt),
}));
```

**Design notes:**

- `payload` as JSONB — stores the complete GitHub webhook payload. Enables replay and debugging without re-fetching from GitHub.
- `processed` flag + `tasksCreated` count — idempotency: duplicate webhooks are detected and skipped.
- `command` — the parsed `@dum360` text extracted from the comment/issue body.

#### Table: `scheduler_assignments`

```typescript
export const schedulerAssignments = orchestrationSchema.table('scheduler_assignments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  taskId:        uuid('task_id')
                   .notNull()
                   .references(() => tasks.id, { onDelete: 'cascade' }),
  nodeId:        uuid('node_id').notNull(),
  assignedAt:    timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  deassignedAt:  timestamp('deassigned_at', { withTimezone: true }),
}, (table) => ({
  taskIdx:       index('idx_sa_task').on(table.taskId),
  nodeIdx:       index('idx_sa_node').on(table.nodeId),
  activeIdx:     index('idx_sa_active').on(table.deassignedAt),
}));
```

**Design notes:**

- Every task assignment is recorded, even if the node fails.
- `deassignedAt IS NULL` = currently assigned. Used for orphaned task recovery.
- Enables analysis of scheduling decisions and node performance over time.

---

## Index Strategy Summary

| Service | Table | Index | Purpose |
|---------|-------|-------|---------|
| Registry | `nodes` | `(status)` | Scheduler: filter online nodes |
| Registry | `nodes` | `(last_heartbeat_at)` | Liveness sweep: find stale nodes |
| Registry | `heartbeats` | `(node_id, received_at)` | Node history queries |
| Registry | `node_capabilities` | `(capability_id)` | Scheduler: find nodes by capability |
| Registry | `attestation_results` | `(node_id, created_at)` | Latest attestation per node |
| Orchestration | `tasks` | `(status, priority, position)` | Queue pop: next task for scheduling |
| Orchestration | `tasks` | `(status, node_id)` | Node's current task lookup |
| Orchestration | `tasks` | `(repository)` | Filter tasks by repo |
| Orchestration | `task_requirements` | `(capability_name)` | Scheduler: match tasks to capable nodes |
| Orchestration | `task_state_transitions` | `(task_id)` | Task timeline construction |
| Orchestration | `webhook_events` | `(processed)` | Find unprocessed webhooks |
| Orchestration | `scheduler_assignments` | `(deassigned_at)` | Find active assignments (NULL = active) |

---

## Migration Strategy

Each service has its own Drizzle Kit config and migration directory:

```bash
# Generate migration from schema changes
cd services/registry && npx drizzle-kit generate

# Apply migrations
cd services/registry && npx drizzle-kit migrate

# Same for orchestration
cd services/orchestration && npx drizzle-kit generate
cd services/orchestration && npx drizzle-kit migrate
```

At startup, each service runs pending migrations automatically (configurable via `RUN_MIGRATIONS=true` env var). Docker Compose health checks ensure PostgreSQL is ready before services start.

---

## Consequences

### Positive

- **Normalized schemas** — no duplication, referential integrity enforced by PostgreSQL FK constraints.
- **Capability catalog pattern** — shared across nodes, new capabilities are added once and referenced.
- **Audit trails** — `attestation_results`, `task_state_transitions`, `scheduler_assignments` are immutable event logs.
- **Scheduler-optimized indexes** — composite indexes on `(status, priority, position)` and `(status, last_heartbeat_at)` make the hot-path queries O(log n).
- **Drizzle type safety** — `tasks.status` is a TypeScript enum, not a magic string. Column types are inferred, not asserted.

### Negative

- **Cross-service data access.** Scheduler in Orchestration needs node capabilities from Registry. Solved via Redis Pub/Sub events (node registered → Orchestration caches capability set) or a dedicated Registry API call. ADR will be written when the scheduler design is finalized.
- **`currentTaskId` denormalization.** Stored in Registry but owned by Orchestration. Must be kept consistent via events. Risk of drift if event delivery fails — mitigated by heartbeat-based reconciliation.
- **No full-text search on issue bodies.** Acceptable for MVP. Post-MVP: add PostgreSQL `tsvector` column or offload to Elasticsearch.

---

## References

- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle Kit Migrations](https://orm.drizzle.team/docs/kit-overview)
- [ADR-001: Technology Stack](./ADR-001-technology-stack.md)
- [DUM360 PRD](../PRD.md) §Data Models
