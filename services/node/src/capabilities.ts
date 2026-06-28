/**
 * Capability detection — scans the local environment for tools, runtimes, and services.
 */
import { execSync } from "node:child_process";
import { cpus, totalmem } from "node:os";
import type { DeclaredCapabilities, DeclaredCapability } from "@dum360/shared";

type ProbeMap = {
	tool: string;
	category: "tool" | "runtime" | "service" | "executor";
};

const PROBES: ProbeMap[] = [
	{ tool: "git", category: "tool" },
	{ tool: "gh", category: "tool" },
	{ tool: "go", category: "runtime" },
	{ tool: "python3", category: "runtime" },
	{ tool: "node", category: "runtime" },
	{ tool: "claude", category: "service" },
	{ tool: "codex", category: "service" },
	{ tool: "gemini", category: "service" },
	{ tool: "github", category: "executor" },
];

async function probeBinary(
	name: string,
): Promise<{ found: boolean; version?: string }> {
	try {
		const stdout = execSync(`${name} --version 2>&1 || ${name} version 2>&1`, {
			timeout: 5000,
			stdio: "pipe",
		}).toString("utf-8");
		// Extract first line as version
		const version = stdout.split("\n")[0].trim();
		return { found: true, version };
	} catch {
		return { found: false };
	}
}

/** True when a Docker daemon is reachable (CLI present + `docker info` works). */
async function dockerDaemonAvailable(): Promise<boolean> {
	try {
		execSync("docker info", { timeout: 10_000, stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

export async function detectCapabilities(): Promise<DeclaredCapabilities> {
	const result: DeclaredCapabilities = {
		executors: [],
		resources: [],
		tools: [],
		runtimes: [],
		services: [],
	};

	// Hardware resources
	const cpuCount = cpus().length;
	const ramGb = Math.round(totalmem() / 1e9);
	result.resources.push(
		{ id: "cpu", value: String(cpuCount) },
		{ id: "ram", value: `${ramGb}GB` },
	);

	// Docker executor: only advertised when the daemon is actually reachable,
	// so the scheduler never routes container tasks to a CLI-only node.
	if (await dockerDaemonAvailable()) {
		result.executors.push({ id: "docker" });
	}

	// Probe binaries
	for (const { tool, category } of PROBES) {
		const { found, version } = await probeBinary(tool);

		if (found) {
			const cap: DeclaredCapability = { id: tool };
			if (version) cap.version = version;

			switch (category) {
				case "executor":
					result.executors.push(cap);
					break;
				case "tool":
					result.tools.push(cap);
					break;
				case "runtime":
					result.runtimes.push(cap);
					break;
				case "service":
					result.services.push(cap);
					break;
			}
		}
	}

	return result;
}
