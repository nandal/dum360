/**
 * Schema validation tests — the first line of defense.
 * Every Zod schema must reject invalid input with specific error messages.
 */
import { describe, it, expect } from "vitest";
import {
	registerNodeRequestSchema,
	createTaskRequestSchema,
	heartbeatRequestSchema,
	taskResultRequestSchema,
	logEntryRequestSchema,
} from "@dum360/shared";
import {
	validRegisterRequest,
	validCreateTaskRequest,
	validHeartbeatRequest,
	validTaskResult,
	validLogEntry,
	invalidInputs,
} from "../../../test/fixtures/mock-data";

// ─── Registration Schema ────────────────────────────────────────────────
describe("registerNodeRequestSchema", () => {
	it("accepts a valid registration request", () => {
		const result = registerNodeRequestSchema.safeParse(validRegisterRequest);
		expect(result.success).toBe(true);
	});

	it("rejects empty node name", () => {
		const result = registerNodeRequestSchema.safeParse({
			...validRegisterRequest,
			name: "",
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toContain("name");
	});

	it("rejects name exceeding 128 characters", () => {
		const result = registerNodeRequestSchema.safeParse({
			...validRegisterRequest,
			name: "x".repeat(129),
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing capabilities (no executors)", () => {
		const result = registerNodeRequestSchema.safeParse({
			...validRegisterRequest,
			capabilities: {
				executors: [],
				resources: [{ id: "cpu", value: "16" }],
				tools: [],
				runtimes: [],
				services: [],
			},
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toContain("At least one executor");
	});

	it("rejects missing name field entirely", () => {
		const { name, ...noName } = validRegisterRequest;
		const result = registerNodeRequestSchema.safeParse(noName);
		expect(result.success).toBe(false);
	});

	it("provides default version when omitted", () => {
		const { version, ...rest } = validRegisterRequest;
		const result = registerNodeRequestSchema.safeParse(rest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.version).toBe("0.1.0");
		}
	});
});

// ─── Task Creation Schema ───────────────────────────────────────────────
describe("createTaskRequestSchema", () => {
	it("accepts a valid task creation request", () => {
		const result = createTaskRequestSchema.safeParse(validCreateTaskRequest);
		expect(result.success).toBe(true);
	});

	it("rejects invalid repository format (no owner/repo)", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			repository: "not-a-valid-repo",
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toContain("owner/repo");
	});

	it("rejects shell injection in repository field", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			repository: "nandal/dum360; DROP TABLE nodes;--",
		});
		expect(result.success).toBe(false);
	});

	it("rejects shell injection in branch field", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			branch: "main$(rm -rf /)",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid AI provider", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			aiProvider: "evil_ai",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid executor type", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			executor: "bitcoin_miner",
		});
		expect(result.success).toBe(false);
	});

	it("rejects timeout below minimum (60s)", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			timeout: 30,
		});
		expect(result.success).toBe(false);
	});

	it("rejects timeout above maximum (86400s)", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			timeout: 100000,
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty instructions", () => {
		const result = createTaskRequestSchema.safeParse({
			...validCreateTaskRequest,
			instructions: "",
		});
		expect(result.success).toBe(false);
	});

	it("accepts task without issue (no requirements)", () => {
		const { issue, requirements, ...rest } = validCreateTaskRequest;
		const result = createTaskRequestSchema.safeParse(rest);
		expect(result.success).toBe(true);
	});

	it("provides defaults for branch, timeout, and priority", () => {
		const { branch, timeout, priority, ...rest } = validCreateTaskRequest;
		const result = createTaskRequestSchema.safeParse(rest);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.branch).toBe("main");
			expect(result.data.timeout).toBe(3600);
			expect(result.data.priority).toBe("normal");
		}
	});
});

// ─── Heartbeat Schema ───────────────────────────────────────────────────
describe("heartbeatRequestSchema", () => {
	it("accepts a valid heartbeat", () => {
		const result = heartbeatRequestSchema.safeParse(validHeartbeatRequest);
		expect(result.success).toBe(true);
	});

	it("rejects missing nodeId", () => {
		const { nodeId, ...rest } = validHeartbeatRequest;
		const result = heartbeatRequestSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects invalid nodeId format (not UUID)", () => {
		const result = heartbeatRequestSchema.safeParse({
			...validHeartbeatRequest,
			nodeId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative CPU usage", () => {
		const result = heartbeatRequestSchema.safeParse({
			...validHeartbeatRequest,
			resources: {
				cpu: { used: -1, total: 16 },
				ram: { used: "24GB", total: "64GB" },
			},
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero total CPU", () => {
		const result = heartbeatRequestSchema.safeParse({
			...validHeartbeatRequest,
			resources: {
				cpu: { used: 0, total: 0 },
				ram: { used: "24GB", total: "64GB" },
			},
		});
		expect(result.success).toBe(false);
	});
});

// ─── Task Result Schema ─────────────────────────────────────────────────
describe("taskResultRequestSchema", () => {
	it("accepts a completed task result", () => {
		const result = taskResultRequestSchema.safeParse(validTaskResult);
		expect(result.success).toBe(true);
	});

	it("accepts a failed task result", () => {
		const result = taskResultRequestSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
			status: "failed",
			error: "AI invocation timed out after 3600s",
			duration: 3600,
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid status value", () => {
		const result = taskResultRequestSchema.safeParse({
			...validTaskResult,
			status: "pending",
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative duration", () => {
		const result = taskResultRequestSchema.safeParse({
			...validTaskResult,
			duration: -1,
		});
		expect(result.success).toBe(false);
	});
});

// ─── Log Entry Schema ───────────────────────────────────────────────────
describe("logEntryRequestSchema", () => {
	it("accepts a valid log entry", () => {
		const result = logEntryRequestSchema.safeParse(validLogEntry);
		expect(result.success).toBe(true);
	});

	it("rejects invalid log level", () => {
		const result = logEntryRequestSchema.safeParse({
			...validLogEntry,
			level: "critical",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty message", () => {
		const result = logEntryRequestSchema.safeParse({
			...validLogEntry,
			message: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid timestamp format", () => {
		const result = logEntryRequestSchema.safeParse({
			...validLogEntry,
			timestamp: "not-a-date",
		});
		expect(result.success).toBe(false);
	});
});
