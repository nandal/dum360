import {
	pgSchema,
	uuid,
	varchar,
	text,
	integer,
	timestamp,
	jsonb,
	index,
} from "drizzle-orm/pg-core";

export const orchestrationSchema = pgSchema("orchestration");

export const taskStatusEnum = orchestrationSchema.enum("task_status", [
	"queued",
	"running",
	"completed",
	"failed",
	"cancelled",
]);

export const taskPriorityEnum = orchestrationSchema.enum("task_priority", [
	"low",
	"normal",
	"high",
	"critical",
]);

export const executorEnum = orchestrationSchema.enum("executor", [
	"github",
	"docker",
]);

export const aiProviderEnum = orchestrationSchema.enum("ai_provider", [
	"claude",
	"codex",
	"gemini",
]);

export const tasks = orchestrationSchema.table(
	"tasks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		executor: executorEnum("executor").notNull(),
		status: taskStatusEnum("status").notNull().default("queued"),
		repository: varchar("repository", { length: 256 }).notNull(),
		branch: varchar("branch", { length: 256 }).notNull().default("main"),
		issueNumber: integer("issue_number"),
		issueTitle: varchar("issue_title", { length: 512 }),
		issueBody: text("issue_body"),
		instructions: text("instructions").notNull(),
		aiProvider: aiProviderEnum("ai_provider").notNull(),
		// Docker executor: image ref + optional private-registry credentials.
		// NOTE: credentials stored as-is for MVP; encryption at rest is a follow-up.
		image: varchar("image", { length: 256 }),
		registryCredentials: jsonb("registry_credentials"),
		timeoutSeconds: integer("timeout_seconds").notNull().default(3600),
		priority: taskPriorityEnum("priority").notNull().default("normal"),
		nodeId: uuid("node_id"),
		repoToken: varchar("repo_token", { length: 512 }),
		tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
		artifacts: jsonb("artifacts").default({}),
		errorMessage: text("error_message"),
		position: integer("position"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => ({
		statusIdx: index("idx_tasks_status").on(table.status),
		executorIdx: index("idx_tasks_executor").on(table.executor),
		nodeIdx: index("idx_tasks_node").on(table.nodeId),
		statusNodeIdx: index("idx_tasks_status_node").on(
			table.status,
			table.nodeId,
		),
		priorityIdx: index("idx_tasks_priority").on(table.priority),
		repositoryIdx: index("idx_tasks_repository").on(table.repository),
		createdAtIdx: index("idx_tasks_created_at").on(table.createdAt),
		queueIdx: index("idx_tasks_queue").on(
			table.status,
			table.priority,
			table.position,
		),
	}),
);

export type TaskRow = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
