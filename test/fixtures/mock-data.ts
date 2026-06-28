/**
 * Mock data fixtures for all test suites.
 * Single source of truth — no duplicate test data across test files.
 */

// ─── Registration ───────────────────────────────────────────────────────
export const validRegisterRequest = {
	name: "test-node-1",
	version: "0.1.0",
	capabilities: {
		executors: [{ id: "github" }],
		resources: [
			{ id: "cpu", value: "16" },
			{ id: "ram", value: "64GB" },
		],
		tools: [{ id: "git" }, { id: "gh" }, { id: "docker" }],
		runtimes: [
			{ id: "go", version: "1.25" },
			{ id: "python", version: "3.13" },
		],
		services: [{ id: "claude" }, { id: "codex" }],
	},
};

export const validRegisterResponse = {
	nodeId: "550e8400-e29b-41d4-a716-446655440000",
	jwt: "eyJhbGciOi...test...",
	heartbeatInterval: 15,
	pollInterval: 5,
	attestedCapabilities: validRegisterRequest.capabilities,
	failedAttestations: [],
};

// ─── Heartbeat ──────────────────────────────────────────────────────────
export const validHeartbeatRequest = {
	nodeId: "550e8400-e29b-41d4-a716-446655440000",
	status: "online" as const,
	resources: {
		cpu: { used: 30, total: 16 },
		ram: { used: "24GB", total: "64GB" },
	},
	runningTasks: 0,
	version: "0.1.0",
};

// ─── Tasks ──────────────────────────────────────────────────────────────
export const validCreateTaskRequest = {
	executor: "github" as const,
	repository: "nandal/dum360",
	branch: "main",
	issue: {
		number: 42,
		title: "Fix authentication bug",
		body: "Users cannot log in when using OAuth flow.",
	},
	instructions: "@dum360 fix this issue. Keep API compatible.",
	aiProvider: "claude" as const,
	requirements: [
		{ capabilityName: "git" },
		{ capabilityName: "claude" },
		{ capabilityName: "gh" },
	],
	timeout: 3600,
	priority: "normal" as const,
};

export const validTaskResult = {
	nodeId: "550e8400-e29b-41d4-a716-446655440000",
	status: "completed" as const,
	artifacts: {
		branch: "dum360/t_xyz789",
		prUrl: "https://github.com/nandal/dum360/pull/99",
		commitSha: "a1b2c3d4e5f6",
		diff: "+120/-45 across 3 files",
	},
	duration: 287,
};

// ─── Log Entry ──────────────────────────────────────────────────────────
export const validLogEntry = {
	nodeId: "550e8400-e29b-41d4-a716-446655440000",
	timestamp: "2026-06-28T12:05:00.000Z",
	level: "info" as const,
	step: "clone",
	message: "Cloning repository nandal/dum360...",
};

// ─── GitHub Webhook ─────────────────────────────────────────────────────
export const validGitHubWebhook = {
	action: "created",
	issue: {
		number: 42,
		title: "Fix authentication bug",
		body: "@dum360 fix this issue",
	},
	comment: {
		body: "@dum360 fix this issue",
	},
	repository: { full_name: "nandal/dum360" },
	sender: { login: "test-user" },
};

// ─── Security / Edge Cases ──────────────────────────────────────────────
export const invalidInputs = {
	sqlInjection: {
		repository: "nandal/dum360; DROP TABLE nodes;--",
		branch: "main$(rm -rf /)",
		instructions: "fix'; DROP TABLE tasks;--",
	},
	xss: {
		instructions: '<script>alert("xss")</script>',
		issueTitle: "<img src=x onerror=alert(1)>",
	},
	missingFields: {
		// No name
		name: "",
		version: "0.1.0",
		capabilities: {
			executors: [],
			resources: [],
			tools: [],
			runtimes: [],
			services: [],
		},
	},
	invalidEnums: {
		executor: "bitcoin_miner" as any,
		aiProvider: "evil_ai" as any,
		priority: "ultra" as any,
	},
};

// ─── Idempotency ────────────────────────────────────────────────────────
export const idempotencyKey = "idem-2026-06-28-test-001";
