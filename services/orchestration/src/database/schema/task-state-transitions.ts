import { pgSchema, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { orchestrationSchema, tasks, taskStatusEnum } from "./tasks";

export const taskStateTransitions = orchestrationSchema.table(
	"task_state_transitions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, { onDelete: "cascade" }),
		fromStatus: taskStatusEnum("from_status").notNull(),
		toStatus: taskStatusEnum("to_status").notNull(),
		reason: varchar("reason", { length: 512 }),
		transitionedAt: timestamp("transitioned_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		taskIdx: index("idx_tst_task").on(table.taskId),
		timeIdx: index("idx_tst_time").on(table.transitionedAt),
	}),
);

export type TaskStateTransitionRow = typeof taskStateTransitions.$inferSelect;
export type TaskStateTransitionInsert =
	typeof taskStateTransitions.$inferInsert;
