import {
	pgSchema,
	uuid,
	varchar,
	integer,
	text,
	jsonb,
	boolean,
	timestamp,
	index,
} from "drizzle-orm/pg-core";
import { orchestrationSchema } from "./tasks";

export const webhookEventTypeEnum = orchestrationSchema.enum(
	"webhook_event_type",
	["issue_comment", "issues", "pull_request_review_comment"],
);

export const webhookEvents = orchestrationSchema.table(
	"webhook_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventType: webhookEventTypeEnum("event_type").notNull(),
		action: varchar("action", { length: 64 }).notNull(),
		repository: varchar("repository", { length: 256 }).notNull(),
		issueNumber: integer("issue_number"),
		sender: varchar("sender", { length: 128 }).notNull(),
		command: text("command"),
		payload: jsonb("payload").notNull(),
		processed: boolean("processed").notNull().default(false),
		tasksCreated: integer("tasks_created").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		processedIdx: index("idx_we_processed").on(table.processed),
		repoIdx: index("idx_we_repository").on(table.repository),
		createdAtIdx: index("idx_we_created_at").on(table.createdAt),
	}),
);

export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type WebhookEventInsert = typeof webhookEvents.$inferInsert;
