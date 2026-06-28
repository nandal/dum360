import { z } from "zod";

export const declaredCapabilitySchema = z.object({
	id: z.string().min(1).max(64),
	value: z.string().optional(),
	version: z.string().max(32).optional(),
});

export const declaredCapabilitiesSchema = z.object({
	executors: z
		.array(declaredCapabilitySchema)
		.min(1, "At least one executor required"),
	resources: z.array(declaredCapabilitySchema),
	tools: z.array(declaredCapabilitySchema),
	runtimes: z.array(declaredCapabilitySchema),
	services: z.array(declaredCapabilitySchema),
});

export const registerNodeRequestSchema = z.object({
	name: z.string().min(1).max(128),
	version: z.string().max(32).default("0.1.0"),
	capabilities: declaredCapabilitiesSchema,
});

export const nodeStatusSchema = z.enum(["online", "offline", "busy"]);
