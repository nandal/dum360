import { z } from 'zod';

export const executorTypeSchema = z.enum(['github']);
export const taskStatusSchema = z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']);
export const taskPrioritySchema = z.enum(['low', 'normal', 'high', 'critical']);
export const aiProviderSchema = z.enum(['claude', 'codex', 'gemini']);

// Repository: owner/repo — no shell metacharacters
const repoPattern = /^[\w.-]+\/[\w.-]+$/;
const branchPattern = /^[\w./-]+$/;

export const issueRefSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1).max(512),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const taskRequirementSchema = z.object({
  capabilityName: z.string().min(1).max(64),
});

export const createTaskRequestSchema = z.object({
  executor: executorTypeSchema,
  repository: z.string().regex(repoPattern, 'Must be owner/repo format'),
  branch: z.string().regex(branchPattern).default('main'),
  issue: issueRefSchema.optional(),
  instructions: z.string().min(1),
  aiProvider: aiProviderSchema,
  requirements: z.array(taskRequirementSchema).optional(),
  timeout: z.number().int().min(60).max(86400).default(3600),
  priority: taskPrioritySchema.default('normal'),
});

export const taskResultRequestSchema = z.object({
  nodeId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  artifacts: z.object({
    branch: z.string().optional(),
    prUrl: z.string().url().optional(),
    commitSha: z.string().optional(),
    diff: z.string().optional(),
    testResults: z.object({
      passed: z.number().int().min(0),
      failed: z.number().int().min(0),
      skipped: z.number().int().min(0),
    }).optional(),
  }).optional(),
  error: z.string().optional(),
  duration: z.number().int().min(0),
});

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;
export type TaskResultRequest = z.infer<typeof taskResultRequestSchema>;
