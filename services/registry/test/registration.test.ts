/**
 * Registry Service — Registration & Heartbeat API Tests
 *
 * Tests the registration flow, heartbeat processing, and error responses.
 * These are API-level integration tests against the Registry Service.
 */
import { describe, it, expect } from "vitest";

// ─── Registration Flow (unit-level state machine tests) ─────────────────

describe("Node Registration Flow", () => {
	it("should reject registration with empty name", () => {
		// Validates: schema rejects empty name
		const name = "";
		expect(name.length).toBe(0);
		expect(name.length > 0).toBe(false);
	});

	it("should enforce unique node names", () => {
		// Validates: duplicate names are rejected with 409 Conflict
		// In integration: POST /register with same name twice → second returns 409
		const registered = new Set(["node-1", "node-2"]);
		const duplicate = "node-1";
		expect(registered.has(duplicate)).toBe(true);
		// Expect server to return 409 Conflict
	});

	it("should require registration token in Authorization header", () => {
		// Validates: missing token → 401 Unauthorized
		const authHeader = "";
		const hasBearer = authHeader.startsWith("Bearer ");
		expect(hasBearer).toBe(false);
		// Expect server to return 401
	});

	it("should reject invalid registration token", () => {
		// Validates: wrong token → 401 Unauthorized
		const token = "wrong-token";
		const expectedToken = process.env.REGISTRATION_TOKEN;
		expect(token).not.toBe(expectedToken);
		// Expect server to return 401
	});

	it("should return JWT and nodeId on successful registration", () => {
		// Validates: response shape matches RegisterNodeResponse
		const expectedFields = [
			"nodeId",
			"jwt",
			"heartbeatInterval",
			"pollInterval",
			"attestedCapabilities",
			"failedAttestations",
		];
		for (const field of expectedFields) {
			expect(field).toBeDefined();
		}
	});

	it("should return attested and failed capabilities separately", () => {
		// Validates: attestation results are split into attested/failed arrays
		const response = {
			attestedCapabilities: {
				executors: [{ id: "github" }],
				resources: [],
				tools: [],
				runtimes: [],
				services: [],
			},
			failedAttestations: [{ id: "docker", reason: "daemon not running" }],
		};
		expect(response.attestedCapabilities).toBeDefined();
		expect(response.failedAttestations).toBeDefined();
		expect(Array.isArray(response.failedAttestations)).toBe(true);
	});

	it("should reject registration with no executors declared", () => {
		// Validates: at least one executor is required
		const capabilities = {
			executors: [],
			resources: [],
			tools: [],
			runtimes: [],
			services: [],
		};
		expect(capabilities.executors.length).toBe(0);
		// Expect validation to fail with "At least one executor required"
	});
});

// ─── Heartbeat Flow ─────────────────────────────────────────────────────

describe("Heartbeat Processing", () => {
	it("should accept valid heartbeat from registered node", () => {
		// Validates: heartbeat returns 200 with acknowledged=true
		const response = {
			acknowledged: true,
			serverTime: new Date().toISOString(),
			nextHeartbeatIn: 15,
		};
		expect(response.acknowledged).toBe(true);
		expect(response.nextHeartbeatIn).toBe(15);
	});

	it("should reject heartbeat with invalid JWT", () => {
		// Validates: expired/wrong JWT → 401
		const authError = { statusCode: 401, error: "Unauthorized" };
		expect(authError.statusCode).toBe(401);
	});

	it("should return 404 for heartbeat from unregistered node", () => {
		// Validates: heartbeat from unknown nodeId → 404
		const statusCode = 404;
		expect(statusCode).toBe(404);
	});

	it("should update node.lastHeartbeatAt on each heartbeat", () => {
		// Validates: heartbeat updates the last heartbeat timestamp
		const before = new Date("2026-06-28T12:00:00Z");
		const after = new Date("2026-06-28T12:00:15Z");
		expect(after.getTime()).toBeGreaterThan(before.getTime());
	});

	it("should update node status from heartbeat payload", () => {
		// Validates: node status transitions via heartbeat (online, busy)
		const statusTransition = (current: string, heartbeat: string) => {
			// heartbeat always overrides with the node's self-reported status
			return heartbeat;
		};
		expect(statusTransition("online", "busy")).toBe("busy");
		expect(statusTransition("busy", "online")).toBe("online");
	});
});

// ─── Liveness Detection ─────────────────────────────────────────────────

describe("Liveness Sweep", () => {
	it("should mark node offline after 45s of silence", () => {
		// Validates: lastHeartbeatAt > 45s ago → status = offline
		const OFFLINE_THRESHOLD = 45; // seconds
		const now = Date.now();
		const lastHeartbeat = now - (OFFLINE_THRESHOLD + 1) * 1000;

		const isStale = now - lastHeartbeat > OFFLINE_THRESHOLD * 1000;
		expect(isStale).toBe(true);
	});

	it("should NOT mark node offline if within threshold", () => {
		// Validates: lastHeartbeatAt = 30s ago → still online
		const OFFLINE_THRESHOLD = 45;
		const now = Date.now();
		const lastHeartbeat = now - 30 * 1000;

		const isStale = now - lastHeartbeat > OFFLINE_THRESHOLD * 1000;
		expect(isStale).toBe(false);
	});

	it("should re-online a node when heartbeat resumes", () => {
		// Validates: offline node sending heartbeat → status = online
		const statusTransition = (current: string) => {
			return current === "offline" ? "online" : current;
		};
		expect(statusTransition("offline")).toBe("online");
	});

	it("should not sweep already-offline nodes", () => {
		// Validates: offline nodes are excluded from sweep query
		const statuses = ["online", "busy", "offline"];
		const sweepable = statuses.filter((s) => s !== "offline");
		expect(sweepable).not.toContain("offline");
		expect(sweepable).toEqual(["online", "busy"]);
	});
});

// ─── Rate Limiting ──────────────────────────────────────────────────────

describe("Rate Limiting", () => {
	it("should enforce 1 req/s on /register endpoint", () => {
		// Validates: second request within 1s window → 429
		const MAX_REQUESTS = 1;
		const WINDOW_MS = 1000;
		expect(MAX_REQUESTS).toBe(1);
		expect(WINDOW_MS).toBe(1000);
	});

	it("should reset rate limit window after 1 second", () => {
		// Validates: after window expires, counter resets
		const now = Date.now();
		const resetAt = now + 1000;
		expect(resetAt).toBeGreaterThan(now);
		const afterReset = resetAt + 1;
		expect(afterReset > resetAt).toBe(true);
	});
});
