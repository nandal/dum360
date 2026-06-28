import {
	pgSchema,
	uuid,
	varchar,
	timestamp,
	primaryKey,
	index,
} from "drizzle-orm/pg-core";
import { registrySchema, nodes } from "./nodes";
import { capabilities } from "./capabilities";

export const nodeCapabilities = registrySchema.table(
	"node_capabilities",
	{
		nodeId: uuid("node_id")
			.notNull()
			.references(() => nodes.id, { onDelete: "cascade" }),
		capabilityId: uuid("capability_id")
			.notNull()
			.references(() => capabilities.id, { onDelete: "cascade" }),
		value: varchar("value", { length: 64 }),
		attestedAt: timestamp("attested_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.nodeId, table.capabilityId] }),
		nodeIdx: index("idx_nc_node").on(table.nodeId),
		capabilityIdx: index("idx_nc_capability").on(table.capabilityId),
	}),
);

export type NodeCapabilityRow = typeof nodeCapabilities.$inferSelect;
export type NodeCapabilityInsert = typeof nodeCapabilities.$inferInsert;
