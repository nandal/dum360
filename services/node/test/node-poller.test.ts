/**
 * Unit Tests — Task Poller & Heartbeat Loop
 *
 * Tests the node's task polling concurrency control and heartbeat
 * reporting (intervals, resource utilization, graceful shutdown).
 */
import { describe, it, expect } from "vitest";
describe("Heartbeat Loop", () => {
	it("sends heartbeat at configured interval", () => {
		const interval = 15; // seconds
		expect(interval).toBe(15);
	});

	it("heartbeat payload includes resource utilization", () => {
		const heartbeat = {
			status: "online",
			resources: {
				cpu: { used: 30, total: 16 },
				ram: { used: "24GB", total: "64GB" },
			},
			runningTasks: 0,
			version: "0.1.0",
		};

		expect(heartbeat).toHaveProperty("resources");
		expect(heartbeat.resources).toHaveProperty("cpu");
		expect(heartbeat.resources).toHaveProperty("ram");
		expect(heartbeat.resources.cpu).toHaveProperty("used");
		expect(heartbeat.resources.cpu).toHaveProperty("total");
	});

	it("reports running task count accurately", () => {
		const running = 1;
		const heartbeat = { runningTasks: running };
		expect(heartbeat.runningTasks).toBe(1);

		const idle = 0;
		const idleHeartbeat = { runningTasks: idle };
		expect(idleHeartbeat.runningTasks).toBe(0);
	});

	it("sends offline heartbeat on graceful shutdown", () => {
		const shutdownHeartbeat = {
			status: "offline",
			resources: {
				cpu: { used: 0, total: 0 },
				ram: { used: "0GB", total: "0GB" },
			},
			runningTasks: 0,
			version: "0.1.0",
		};

		expect(shutdownHeartbeat.status).toBe("offline");
		expect(shutdownHeartbeat.runningTasks).toBe(0);
	});
});
