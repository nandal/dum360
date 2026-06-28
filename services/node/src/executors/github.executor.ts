/**
 * GitHub Executor — clones repos, invokes AI CLI, runs tests, creates PRs.
 *
 * Pipeline:
 *   1. Clone repository
 *   2. Checkout base branch
 *   3. Create work branch (dum360/<task-id>)
 *   4. Invoke AI CLI with instructions
 *   5. Run tests
 *   6. Commit changes
 *   7. Push branch
 *   8. Create Pull Request
 */
import { execFileSync, execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import {
	isValidRepository,
	isValidBranch,
	type TaskAssignPayload,
	type TaskResultRequest,
} from "@dum360/shared";
import type { Executor, LogEntry } from "./executor.interface";

const execFileAsync = promisify(execFile);

/** Task IDs become branch names and filesystem paths — keep them inert. */
const TASK_ID_PATTERN = /^[\w.-]+$/;

export class GitHubExecutor implements Executor {
	private readonly gitPath: string;
	private readonly ghPath: string;
	private readonly aiCli: string;
	private readonly workDir: string;

	constructor(options: {
		gitPath?: string;
		ghPath?: string;
		aiCli?: string;
		workDir: string;
		aiProvider: string;
	}) {
		this.gitPath = options.gitPath ?? "git";
		this.ghPath = options.ghPath ?? "gh";
		this.workDir = options.workDir;
		this.aiCli = options.aiProvider;
	}

	id(): string {
		return "github";
	}

	canHandle(task: TaskAssignPayload): boolean {
		return task.executor === "github";
	}

	async execute(
		task: TaskAssignPayload,
		onLog: (entry: LogEntry) => Promise<void>,
	): Promise<TaskResultRequest["artifacts"]> {
		// Validate every server-supplied value that reaches a git/gh command line.
		// All commands run via execFile (no shell), but a value shaped like a flag
		// (e.g. "--upload-pack=…") could still be misread by git, so reject those too.
		if (!isValidRepository(task.repository)) {
			throw new Error(`Invalid repository: ${task.repository}`);
		}
		if (!isValidBranch(task.branch)) {
			throw new Error(`Invalid branch: ${task.branch}`);
		}
		if (!TASK_ID_PATTERN.test(task.taskId)) {
			throw new Error(`Invalid task id: ${task.taskId}`);
		}

		const workDir = join(this.workDir, task.taskId);
		mkdirSync(workDir, { recursive: true });

		const log = (
			step: string,
			message: string,
			level: LogEntry["level"] = "info",
		) => onLog({ timestamp: new Date().toISOString(), level, step, message });

		const branch = `dum360/${task.taskId}`;
		const title = task.issue?.title ?? "DUM360: AI Fix";
		const commitMessage = `dum360: ${task.issue?.title ?? task.instructions.slice(0, 72)}`;

		try {
			// 1. Clone repository (token kept in the URL arg — never logged)
			await log("clone", `Cloning ${task.repository}...`);
			const cloneUrl = `https://x-access-token:${task.repoToken}@github.com/${task.repository}.git`;
			await this.run("git", ["clone", "--depth", "1", cloneUrl, workDir]);

			// 2. Checkout base branch ("--" guards against flag-like refs)
			await log("checkout", `Checking out ${task.branch}`);
			await this.run("git", ["checkout", task.branch, "--"], workDir);

			// 3. Create work branch
			await log("branch", `Creating branch ${branch}`);
			await this.run("git", ["checkout", "-b", branch], workDir);

			// 4. Invoke AI CLI
			await log("ai", `Invoking ${this.aiCli}...`);
			const promptFile = join(workDir, ".dum360-prompt.txt");
			writeFileSync(promptFile, task.instructions);

			await this.run(
				this.aiCli,
				["--prompt-file", promptFile, "--output-dir", workDir],
				workDir,
			);

			// 5. Run tests
			await log("test", "Running tests...");
			try {
				await this.run("npm", ["test"], workDir);
				await log("test", "Tests passed", "info");
			} catch {
				await log("test", "Tests failed — continuing", "warn");
			}

			// 6. Commit changes
			await log("commit", "Committing changes...");
			await this.run("git", ["add", "-A"], workDir);
			await this.run("git", ["commit", "-m", commitMessage], workDir);

			// 7. Push branch
			await log("push", `Pushing ${branch}...`);
			await this.run("git", ["push", "origin", branch], workDir);

			// 8. Create Pull Request
			await log("pr", "Creating Pull Request...");
			const prResult = await this.run(
				"gh",
				[
					"pr",
					"create",
					"--title",
					title,
					"--body",
					`🤖 Automated PR by DUM360\n\nCloses #${task.issue?.number ?? "?"}`,
					"--base",
					task.branch,
				],
				workDir,
			);

			const prUrl = prResult.stdout.trim();

			await log("done", `PR created: ${prUrl}`);

			return {
				branch,
				prUrl,
				diff: await this.run("git", ["diff", "--stat"], workDir).then((r) =>
					r.stdout.trim(),
				),
			};
		} catch (error) {
			await log("error", `Execution failed: ${error}`, "error");
			throw error;
		}
	}

	async probe(): Promise<{ passed: boolean; reason?: string }> {
		try {
			execFileSync(this.gitPath, ["--version"], { stdio: "pipe" });
			execFileSync(this.ghPath, ["--version"], { stdio: "pipe" });
			return { passed: true };
		} catch {
			return { passed: false, reason: "git or gh CLI not found" };
		}
	}

	/**
	 * Run a command without a shell. Arguments are passed as an array so
	 * server-supplied values can never be interpreted as shell metacharacters.
	 */
	private async run(
		file: string,
		args: string[],
		cwd?: string,
	): Promise<{ stdout: string; stderr: string }> {
		return execFileAsync(file, args, {
			cwd,
			timeout: 300_000, // 5 min per step
			env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
		});
	}
}
