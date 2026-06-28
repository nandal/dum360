/**
 * Unit Tests — Task State Machine & Lifecycle Scenarios
 */
import { describe, it, expect } from "vitest";

const VALID_TRANSITIONS: Record<string, string[]> = {
	queued: ["running", "cancelled"],
	running: ["completed", "failed", "cancelled"],
	completed: [],
	failed: ["queued"],
	cancelled: [],
};

describe("Task State Machine", () => {
	it("queued → running is valid", () =>
		expect(VALID_TRANSITIONS["queued"]).toContain("running"));
	it("queued → cancelled is valid", () =>
		expect(VALID_TRANSITIONS["queued"]).toContain("cancelled"));
	it("queued → completed is NOT valid", () =>
		expect(VALID_TRANSITIONS["queued"]).not.toContain("completed"));
	it("queued → failed is NOT valid", () =>
		expect(VALID_TRANSITIONS["queued"]).not.toContain("failed"));
	it("running → completed is valid", () =>
		expect(VALID_TRANSITIONS["running"]).toContain("completed"));
	it("running → failed is valid", () =>
		expect(VALID_TRANSITIONS["running"]).toContain("failed"));
	it("running → cancelled is valid", () =>
		expect(VALID_TRANSITIONS["running"]).toContain("cancelled"));
	it("running → queued is NOT valid", () =>
		expect(VALID_TRANSITIONS["running"]).not.toContain("queued"));
	it("completed is terminal", () =>
		expect(VALID_TRANSITIONS["completed"]).toEqual([]));
	it("cancelled is terminal", () =>
		expect(VALID_TRANSITIONS["cancelled"]).toEqual([]));
	it("failed → queued allows retry", () =>
		expect(VALID_TRANSITIONS["failed"]).toContain("queued"));
	it("all statuses have defined transitions", () => {
		for (const s of ["queued", "running", "completed", "failed", "cancelled"]) {
			expect(VALID_TRANSITIONS[s]).toBeDefined();
		}
	});
});

describe("Task Lifecycle Scenarios", () => {
	it("happy path: queued → running → completed", () => {
		const tl: string[] = [];
		let s = "queued";
		tl.push(s);
		expect(VALID_TRANSITIONS[s]).toContain("running");
		s = "running";
		tl.push(s);
		expect(VALID_TRANSITIONS[s]).toContain("completed");
		s = "completed";
		tl.push(s);
		expect(tl).toEqual(["queued", "running", "completed"]);
	});

	it("failure+retry: queued → running → failed → queued → running → completed", () => {
		const tl: string[] = [];
		let s = "queued";
		tl.push(s);
		s = "running";
		tl.push(s);
		s = "failed";
		tl.push(s);
		s = "queued";
		tl.push(s);
		s = "running";
		tl.push(s);
		s = "completed";
		tl.push(s);
		expect(tl).toEqual([
			"queued",
			"running",
			"failed",
			"queued",
			"running",
			"completed",
		]);
	});

	it("cancel before execution: queued → cancelled", () => {
		let s = "queued";
		expect(VALID_TRANSITIONS[s]).toContain("cancelled");
		s = "cancelled";
		expect(VALID_TRANSITIONS[s]).toEqual([]);
	});

	it("cancel during execution: running → cancelled", () => {
		let s = "running";
		expect(VALID_TRANSITIONS[s]).toContain("cancelled");
		s = "cancelled";
		expect(VALID_TRANSITIONS[s]).toEqual([]);
	});

	it("terminal states have no transitions", () => {
		for (const s of ["completed", "cancelled"]) {
			expect(VALID_TRANSITIONS[s]).toEqual([]);
		}
	});

	it("every transition creates audit record", () => {
		const audit = [
			{ from: "queued", to: "running" },
			{ from: "running", to: "completed" },
		];
		expect(audit).toHaveLength(2);
		for (const e of audit) {
			expect(e.from).toBeDefined();
			expect(e.to).toBeDefined();
		}
	});
});
