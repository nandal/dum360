import {
	pgSchema,
	uuid,
	boolean,
	varchar,
	timestamp,
	index,
} from "drizzle-orm/pg-core";
import { registrySchema, nodes } from "./nodes";
import { capabilities } from "./capabilities";

export const attestationResults = registrySchema.table(
	"attestation_results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		nodeId: uuid("node_id")
			.notNull()
			.references(() => nodes.id, { onDelete: "cascade" }),
		capabilityId: uuid("capability_id")
			.notNull()
			.references(() => capabilities.id, { onDelete: "cascade" }),
		passed: boolean("passed").notNull(),
		reason: varchar("reason", { length: 512 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		nodeIdx: index("idx_ar_node").on(table.nodeId),
		createdAtIdx: index("idx_ar_created_at").on(table.createdAt),
	}),
);

export type AttestationResultRow = typeof attestationResults.$inferSelect;
export type AttestationResultInsert = typeof attestationResults.$inferInsert;
