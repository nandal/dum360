/**
 * Docker Executor — runs a self-contained agent image for a task.
 *
 * The image is responsible for the full pipeline (clone → AI → tests →
 * commit → push → PR). This executor only:
 *   1. (optional) logs in to a private registry
 *   2. pulls the image
 *   3. runs the container with task context injected as env vars
 *   4. streams container output to the log service
 *   5. reads /artifacts/result.json and reports the result
 *
 * Contract with the image:
 *   Inputs  (env):   DUM360_TASK_ID, DUM360_REPOSITORY, DUM360_BRANCH,
 *                    DUM360_ISSUE_NUMBER/_TITLE/_BODY, DUM360_INSTRUCTIONS,
 *                    DUM360_AI_PROVIDER, AI_API_KEY, GITHUB_TOKEN
 *   Outputs (file):  /artifacts/result.json -> { prUrl, branch, commitSha, diff }
 *                    exit code 0 = success, non-zero = failure
 */
import { execFile, spawn } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { isValidRepository, isValidBranch } from "@dum360/shared";
import type { TaskAssignPayload, TaskResultRequest } from "@dum360/shared";
import type { Executor, LogEntry } from "./executor.interface";

const execFileAsync = promisify(execFile);

/** Image refs are passed to `docker` as args; reject flag-like/whitespace values. */
const IMAGE_PATTERN = /^(?!-)[A-Za-z0-9][\w./:@-]*$/;
const TASK_ID_PATTERN = /^[\w.-]+$/;

export interface DockerExecutorOptions {
	workDir: string;
	aiProvider: string;
	aiApiKey: string;
	memory: string;
	cpus: string;
	dockerPath?: string;
}

export class DockerExecutor implements Executor {
	private readonly docker: string;

	constructor(private readonly options: DockerExecutorOptions) {
		this.docker = options.dockerPath ?? "docker";
	}

	id(): string {
		return "docker";
	}

	canHandle(task: TaskAssignPayload): boolean {
		return task.executor === "docker";
	}

	async probe(): Promise<{ passed: boolean; reason?: string }> {
		try {
			// `docker info` requires a reachable daemon, not just the CLI.
			await execFileAsync(this.docker, ["info"], { timeout: 10_000 });
			return { passed: true };
		} catch {
			return { passed: false, reason: "docker daemon not available" };
		}
	}

	async execute(
		task: TaskAssignPayload,
		onLog: (entry: LogEntry) => Promise<void>,
	): Promise<TaskResultRequest["artifacts"]> {
		const log = (
			step: string,
			message: string,
			level: LogEntry["level"] = "info",
		) => onLog({ timestamp: new Date().toISOString(), level, step, message });

		// Validate everything that reaches the docker command line.
		if (!task.image || !IMAGE_PATTERN.test(task.image)) {
			throw new Error(`Invalid or missing image: ${task.image}`);
		}
		if (!isValidRepository(task.repository)) {
			throw new Error(`Invalid repository: ${task.repository}`);
		}
		if (!isValidBranch(task.branch)) {
			throw new Error(`Invalid branch: ${task.branch}`);
		}
		if (!TASK_ID_PATTERN.test(task.taskId)) {
			throw new Error(`Invalid task id: ${task.taskId}`);
		}

		const artifactsDir = join(this.options.workDir, task.taskId, "artifacts");
		mkdirSync(artifactsDir, { recursive: true });

		let loggedInRegistry: string | undefined;
		try {
			// 1. Optional private-registry login (password via stdin, never argv).
			if (task.registryCredentials) {
				const { username, password, registry } = task.registryCredentials;
				await log("login", `Logging in to ${registry ?? "Docker Hub"}...`);
				await this.dockerLogin(username, password, registry);
				loggedInRegistry = registry ?? "";
			}

			// 2. Pull image
			await log("pull", `Pulling ${task.image}...`);
			await execFileAsync(this.docker, ["pull", task.image], {
				timeout: Math.min(task.timeout, 600) * 1000,
			});

			// 3. Run container (streamed)
			await log("run", `Running container from ${task.image}...`);
			const exitCode = await this.runContainer(task, artifactsDir, log);

			// 4. Collect artifacts
			const artifacts = this.readArtifacts(artifactsDir);
			artifacts.exitCode = exitCode;

			if (exitCode !== 0) {
				throw new Error(`Container exited with code ${exitCode}`);
			}

			await log("done", `Container finished. PR: ${artifacts.prUrl ?? "n/a"}`);
			return artifacts;
		} catch (error) {
			await log("error", `Execution failed: ${error}`, "error");
			throw error;
		} finally {
			if (loggedInRegistry !== undefined) {
				await this.dockerLogout(loggedInRegistry).catch(() => undefined);
			}
		}
	}

	/** `docker login` with the password piped via stdin (kept out of argv/logs). */
	private async dockerLogin(
		username: string,
		password: string,
		registry?: string,
	): Promise<void> {
		const args = ["login", "--username", username, "--password-stdin"];
		if (registry) args.push(registry);
		await new Promise<void>((resolve, reject) => {
			const child = execFile(this.docker, args, (err) =>
				err ? reject(err) : resolve(),
			);
			child.stdin?.end(password);
		});
	}

	private async dockerLogout(registry: string): Promise<void> {
		const args = registry ? ["logout", registry] : ["logout"];
		await execFileAsync(this.docker, args, { timeout: 10_000 });
	}

	/** Build env injection list (no secrets in the returned strings are logged). */
	private buildEnvArgs(task: TaskAssignPayload): string[] {
		const env: Record<string, string> = {
			DUM360_TASK_ID: task.taskId,
			DUM360_REPOSITORY: task.repository,
			DUM360_BRANCH: task.branch,
			DUM360_INSTRUCTIONS: task.instructions,
			DUM360_AI_PROVIDER: task.aiProvider,
			GITHUB_TOKEN: task.repoToken,
		};
		if (this.options.aiApiKey) env.AI_API_KEY = this.options.aiApiKey;
		if (task.issue) {
			env.DUM360_ISSUE_NUMBER = String(task.issue.number);
			env.DUM360_ISSUE_TITLE = task.issue.title;
			if (task.issue.body) env.DUM360_ISSUE_BODY = task.issue.body;
		}
		return Object.entries(env).flatMap(([k, v]) => ["--env", `${k}=${v}`]);
	}

	/** Run the container, streaming output to the log sink. Resolves with exit code. */
	private runContainer(
		task: TaskAssignPayload,
		artifactsDir: string,
		log: (step: string, message: string, level?: LogEntry["level"]) => Promise<void>,
	): Promise<number> {
		const args = [
			"run",
			"--rm",
			"--memory",
			this.options.memory,
			"--cpus",
			this.options.cpus,
			"--pids-limit",
			"512",
			"--volume",
			`${artifactsDir}:/artifacts`,
			...this.buildEnvArgs(task),
			task.image as string,
		];

		return new Promise<number>((resolve, reject) => {
			const child = spawn(this.docker, args, { stdio: ["ignore", "pipe", "pipe"] });
			const timer = setTimeout(() => {
				child.kill("SIGKILL");
				reject(new Error(`Container timed out after ${task.timeout}s`));
			}, task.timeout * 1000);

			const stream = (level: LogEntry["level"]) => (chunk: Buffer) => {
				for (const line of chunk.toString("utf-8").split("\n")) {
					if (line.trim()) void log("container", line, level);
				}
			};
			child.stdout.on("data", stream("info"));
			child.stderr.on("data", stream("warn"));

			child.on("error", (err) => {
				clearTimeout(timer);
				reject(err);
			});
			child.on("close", (code) => {
				clearTimeout(timer);
				resolve(code ?? 1);
			});
		});
	}

	/** Read /artifacts/result.json produced by the container (best effort). */
	private readArtifacts(artifactsDir: string): NonNullable<TaskResultRequest["artifacts"]> {
		const resultPath = join(artifactsDir, "result.json");
		if (!existsSync(resultPath)) return {};
		try {
			const parsed = JSON.parse(readFileSync(resultPath, "utf-8"));
			return {
				branch: parsed.branch,
				prUrl: parsed.prUrl,
				commitSha: parsed.commitSha,
				diff: parsed.diff,
				testResults: parsed.testResults,
			};
		} catch {
			return {};
		}
	}
}
