import {
  pgSchema,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { registrySchema, nodes, nodeStatusEnum } from './nodes';

export const heartbeats = registrySchema.table(
  'heartbeats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    status: nodeStatusEnum('status').notNull(),
    cpuUsed: integer('cpu_used').notNull(),
    cpuTotal: integer('cpu_total').notNull(),
    ramUsed: varchar('ram_used', { length: 16 }).notNull(),
    ramTotal: varchar('ram_total', { length: 16 }).notNull(),
    runningTasks: integer('running_tasks').notNull().default(0),
    version: varchar('version', { length: 32 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nodeIdx: index('idx_hb_node').on(table.nodeId),
    receivedIdx: index('idx_hb_received').on(table.receivedAt),
  }),
);

export type HeartbeatRow = typeof heartbeats.$inferSelect;
export type HeartbeatInsert = typeof heartbeats.$inferInsert;
