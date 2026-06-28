import { z } from "zod";

export const heartbeatRequestSchema = z.object({
	nodeId: z.string().uuid(),
	status: z.enum(["online", "offline", "busy"]),
	resources: z.object({
		cpu: z.object({
			used: z.number().int().min(0),
			total: z.number().int().min(1),
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
