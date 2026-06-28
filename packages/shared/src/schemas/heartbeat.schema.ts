import { z } from "zod";

export const heartbeatRequestSchema = z.object({
	nodeId: z.string().uuid(),
	status: z.enum(["online", "offline", "busy"]),
	resources: z.object({
		cpu: z.object({
			// Fractional core usage is normal (e.g. 0.5 cores), so don't force ints.
			used: z.number().min(0),
			total: z.number().min(1),
		}),
		ram: z.object({
			used: z.string().min(1),
			total: z.string().min(1),
		}),
	}),
	runningTasks: z.number().int().min(0),
	version: z.string().max(32),
});

export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
