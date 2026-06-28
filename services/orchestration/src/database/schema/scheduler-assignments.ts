import { pgSchema, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { orchestrationSchema, tasks } from './tasks';

export const schedulerAssignments = orchestrationSchema.table(
  'scheduler_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    deassignedAt: timestamp('deassigned_at', { withTimezone: true }),
  },
  (table) => ({
    taskIdx: index('idx_sa_task').on(table.taskId),
    nodeIdx: index('idx_sa_node').on(table.nodeId),
    activeIdx: index('idx_sa_active').on(table.deassignedAt),
  }),
);

export type SchedulerAssignmentRow = typeof schedulerAssignments.$inferSelect;
export type SchedulerAssignmentInsert = typeof schedulerAssignments.$inferInsert;
