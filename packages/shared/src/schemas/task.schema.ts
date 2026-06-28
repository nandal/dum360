import { z } from "zod";

export const executorTypeSchema = z.enum(["github", "docker"]);
export const taskStatusSchema = z.enum([
	"queued",
	"running",
	"completed",
	"failed",
	"cancelled",
]);
export const taskPrioritySchema = z.enum(["low", "normal", "high", "critical"]);
export const aiProviderSchema = z.enum(["claude", "codex", "gemini"]);

// Repository: owner/repo — no shell metacharacters, no leading "-" (flag-like)
const repoPattern = /^(?!-)[\w.-]+\/(?!-)[\w.-]+$/;
const branchPattern = /^(?!-)[\w./-]+$/;
// Image ref: "[registry/]namespace/name[:tag][@digest]". No whitespace, no
// leading "-" (it is passed to `docker pull`/`docker run` as an argument).
const imagePattern = /^(?!-)[A-Za-z0-9][\w./:@-]*$/;

export const registryCredentialsSchema = z.object({
	username: z.string().min(1).max(256),
	password: z.string().min(1).max(4096),
	registry: z.string().min(1).max(256).optional(),
});

export const issueRefSchema = z.object({
	number: z.number().int().positive(),
	title: z.string().min(1).max(512),
	body: z.string().optional(),
	labels: z.array(z.string()).optional(),
});

export const taskRequirementSchema = z.object({
	capabilityName: z.string().min(1).max(64),
});

export const createTaskRequestSchema = z
	.object({
		executor: executorTypeSchema,
		repository: z.string().regex(repoPattern, "Must be owner/repo format"),
		branch: z.string().regex(branchPattern).default("main"),
		issue: issueRefSchema.optional(),
		instructions: z.string().min(1),
		aiProvider: aiProviderSchema,
		image: z
			.string()
			.max(256)
			.regex(imagePattern, "Invalid container image reference")
			.optional(),
		registryCredentials: registryCredentialsSchema.optional(),
		requirements: z.array(taskRequirementSchema).optional(),
		timeout: z.number().int().min(60).max(86400).default(3600),
		priority: taskPrioritySchema.default("normal"),
	})
	.refine((t) => t.executor !== "docker" || !!t.image, {
		message: "image is required when executor is 'docker'",
		path: ["image"],
	});

export const taskResultRequestSchema = z.object({
	nodeId: z.string().uuid(),
	status: z.enum(["completed", "failed"]),
	artifacts: z
		.object({
			branch: z.string().optional(),
			prUrl: z.string().url().optional(),
			commitSha: z.string().optional(),
			diff: z.string().optional(),
			exitCode: z.number().int().optional(),
			testResults: z
				.object({
					passed: z.number().int().min(0),
					failed: z.number().int().min(0),
					skipped: z.number().int().min(0),
				})
				.optional(),
		})
		.optional(),
	error: z.string().optional(),
	duration: z.number().int().min(0),
});

// Canonical CreateTaskRequest / TaskResultRequest types live in ../types/task.types
// (re-exported from the package root) to avoid a duplicate-export ambiguity.
