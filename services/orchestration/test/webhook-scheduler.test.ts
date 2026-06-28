/**
 * Unit Tests — Webhook Parser & Scheduler Algorithm
 */
import { describe, it, expect } from "vitest";

const TRIGGER = "@dum360";
function parseCmd(body: string): string | null {
	if (!body) return null;
	const i = body.indexOf(TRIGGER);
	if (i === -1) return null;
	const rest = body.slice(i + TRIGGER.length);
	const nl = rest.indexOf("\n");
	return (nl === -1 ? rest : rest.slice(0, nl)).trim() || null;
}

describe("GitHub Webhook Command Parser", () => {
	it("extracts command from issue comment", () => {
		expect(parseCmd("Please fix.\n\n@dum360 fix this issue.\n\nThanks!")).toBe(
			"fix this issue.",
		);
	});
	it("extracts command from issue body", () => {
		expect(parseCmd("@dum360 review this PR")).toBe("review this PR");
	});
	it("returns null without trigger", () => {
		expect(parseCmd("Just a comment.")).toBeNull();
	});
	it("returns null for empty body", () => {
		expect(parseCmd("")).toBeNull();
	});
	it("returns null for trigger at end of body", () => {
		expect(parseCmd("text\n\n@dum360")).toBeNull();
	});
	it("extracts only first line", () => {
		expect(parseCmd("@dum360 fix this\nignore")).toBe("fix this");
	});
	it("strips whitespace", () => {
		expect(parseCmd("@dum360   fix   \n")).toBe("fix");
	});
});

interface Node {
	id: string;
	status: string;
	caps: string[];
	cpuU: number;
	cpuT: number;
}
function sched(taskCaps: string[], nodes: Node[]): Node | null {
	const online = nodes.filter((n) => n.status === "online" && n.cpuU < n.cpuT);
	const capable = online.filter((n) =>
		taskCaps.every((c) => n.caps.includes(c)),
	);
	if (!capable.length) return null;
	capable.sort((a, b) => a.cpuU / a.cpuT - b.cpuU / b.cpuT);
	return capable[0];
}

describe("Scheduler Algorithm", () => {
	const ns: Node[] = [
		{
			id: "n1",
			status: "online",
			caps: ["git", "claude", "gh", "docker"],
			cpuU: 8,
			cpuT: 16,
		},
		{
			id: "n2",
			status: "online",
			caps: ["git", "claude", "gh"],
			cpuU: 2,
			cpuT: 8,
		},
		{
			id: "n3",
			status: "busy",
			caps: ["git", "claude", "gh", "docker"],
			cpuU: 12,
			cpuT: 16,
		},
		{ id: "n4", status: "offline", caps: ["git", "claude"], cpuU: 0, cpuT: 4 },
		{ id: "n5", status: "online", caps: ["git", "python"], cpuU: 1, cpuT: 4 },
	];

	it("assigns to least utilized capable online node", () => {
		expect(sched(["git", "claude", "gh"], ns)!.id).toBe("n2");
	});
	it("filters out busy nodes", () => {
		expect(sched(["git", "claude", "gh", "docker"], ns)!.id).toBe("n1");
	});
	it("filters out offline nodes", () => {
		expect(sched(["git", "claude"], ns)!.id).toBe("n2");
	});
	it("returns null when no node has required capabilities", () => {
		expect(sched(["git", "claude", "kubernetes"], ns)).toBeNull();
	});
	it("returns null when all capable nodes are busy/offline", () => {
		expect(
			sched(
				["git"],
				[
					{ id: "b", status: "busy", caps: ["git"], cpuU: 8, cpuT: 16 },
					{ id: "o", status: "offline", caps: ["git"], cpuU: 0, cpuT: 4 },
				],
			),
		).toBeNull();
	});
	it("prefers lower CPU utilization", () => {
		expect(
			sched(
				["git"],
				[
					{ id: "h", status: "online", caps: ["git"], cpuU: 15, cpuT: 16 },
					{ id: "l", status: "online", caps: ["git"], cpuU: 1, cpuT: 16 },
				],
			)!.id,
		).toBe("l");
	});
});
