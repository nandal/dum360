import {
	pgSchema,
	uuid,
	varchar,
	timestamp,
	uniqueIndex,
	index,
} from "drizzle-orm/pg-core";
import { registrySchema } from "./nodes";

export const capabilityCategoryEnum = registrySchema.enum(
	"capability_category",
	["executor", "resource", "tool", "runtime", "service"],
);

export const capabilities = registrySchema.table(
	"capabilities",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		category: capabilityCategoryEnum("category").notNull(),
		name: varchar("name", { length: 64 }).notNull(),
		version: varchar("version", { length: 32 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		nameIdx: index("idx_capabilities_name").on(table.name),
		categoryNameUniq: uniqueIndex("uq_capability_category_name").on(
			table.category,
			table.name,
		),
	}),
);

export type CapabilityRow = typeof capabilities.$inferSelect;
export type CapabilityInsert = typeof capabilities.$inferInsert;
