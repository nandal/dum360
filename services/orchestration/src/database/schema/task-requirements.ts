import { pgSchema, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { orchestrationSchema, tasks } from './tasks';

export const taskRequirements = orchestrationSchema.table(
  'task_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    capabilityName: varchar('capability_name', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index('idx_tr_task').on(table.taskId),
    capabilityIdx: index('idx_tr_capability').on(table.capabilityName),
  }),
);

export type TaskRequirementRow = typeof taskRequirements.$inferSelect;
export type TaskRequirementInsert = typeof taskRequirements.$inferInsert;
