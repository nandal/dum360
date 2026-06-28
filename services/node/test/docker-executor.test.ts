/**
 * Docker Executor — contract + input-validation tests.
 *
 * These cover the behaviour that runs BEFORE any `docker` invocation, so they
 * need no Docker daemon: executor identity, task matching, and the validation
 * that protects the `docker` command line from injection.
 */
import { describe, it, expect } from "vitest";
import { DockerExecutor } from "../src/executors/docker.executor";
import type { TaskAssignPayload } from "@dum360/shared";

const executor = new DockerExecutor({
	workDir: "/tmp/dum360-test",
	aiProvider: "claude",
	aiApiKey: "",
	memory: "2g",
	cpus: "2",
});

const baseTask: TaskAssignPayload = {
	taskId: "t_abc123",
	executor: "docker",
	timeout: 600,
	repository: "nandal/dum360",
	branch: "main",
	issue: { number: 1, title: "Fix" },
	instructions: "do the thing",
	aiProvider: "claude",
	image: "dum360/agent:latest",
	repoToken: "ghs_test",
	tokenExpiresAt: new Date(0).toISOString(),
};

const noop = async () => {};

describe("DockerExecutor", () => {
	it("identifies as 'docker'", () => {
		expect(executor.id()).toBe("docker");
	});

	it("handles docker tasks only", () => {
		expect(executor.canHandle(baseTask)).toBe(true);
		expect(executor.canHandle({ ...baseTask, executor: "github" })).toBe(false);
	});

	it("rejects a missing image before running docker", async () => {
		await expect(
			executor.execute({ ...baseTask, image: undefined }, noop),
		).rejects.toThrow(/image/i);
	});

	it("rejects a flag-like image reference", async () => {
		await expect(
			executor.execute({ ...baseTask, image: "--privileged" }, noop),
		).rejects.toThrow(/image/i);
	});

	it("rejects an injection-shaped repository", async () => {
		await expect(
			executor.execute({ ...baseTask, repository: "a b; rm -rf /" }, noop),
		).rejects.toThrow(/repository/i);
	});

	it("rejects a flag-like branch", async () => {
		await expect(
			executor.execute({ ...baseTask, branch: "--upload-pack=x" }, noop),
		).rejects.toThrow(/branch/i);
	});

	it("rejects an unsafe task id", async () => {
		await expect(
			executor.execute({ ...baseTask, taskId: "../escape" }, noop),
		).rejects.toThrow(/task id/i);
	});
});
