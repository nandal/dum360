import {
  pgSchema,
  uuid,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const registrySchema = pgSchema('registry');

export const nodeStatusEnum = registrySchema.enum('node_status', [
  'online',
  'offline',
  'busy',
]);

export const nodes = registrySchema.table(
  'nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    status: nodeStatusEnum('status').notNull().default('online'),
    version: varchar('version', { length: 32 }).notNull().default('0.1.0'),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
    lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
    currentTaskId: uuid('current_task_id'),
  },
  (table) => ({
    statusIdx: index('idx_nodes_status').on(table.status),
    lastHeartbeatIdx: index('idx_nodes_last_heartbeat').on(table.lastHeartbeatAt),
    nameUniq: uniqueIndex('uq_nodes_name').on(table.name),
    schedulerIdx: index('idx_nodes_scheduler').on(table.status, table.lastHeartbeatAt),
  }),
);

// Types derived from schema
export type NodeRow = typeof nodes.$inferSelect;
export type NodeInsert = typeof nodes.$inferInsert;
