import { z } from "zod";

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export const logEntryRequestSchema = z.object({
	nodeId: z.string().uuid(),
	timestamp: z.string().datetime(),
	level: logLevelSchema,
	step: z.string().min(1).max(64),
	message: z.string().min(1),
});

export type LogEntryRequest = z.infer<typeof logEntryRequestSchema>;
