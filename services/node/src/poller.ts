/**
 * Task poller — polls server for assigned tasks every N seconds.
 * When a task is received, dispatches to the matching executor.
 */
import type { ServerClient } from "./server-client";
import type { NodeConfig } from "./config";
import type { TaskAssignPayload } from "@dum360/shared";
import type { Executor } from "./executors/executor.interface";

export class TaskPoller {
	private timer: NodeJS.Timeout | null = null;
	private running = false;
	private activeTaskCount = 0;

	constructor(
		private client: ServerClient,
		private config: NodeConfig,
		private executors: Executor[],
	) {}

	get runningTaskCount(): number {
		return this.activeTaskCount;
	}

	start(): void {
		this.timer = setInterval(
			() => this.poll(),
			this.config.pollInterval * 1000,
		);
		console.log(`[poller] Started (every ${this.config.pollInterval}s)`);
	}

	stop(): void {
		if (this.timer) clearInterval(this.timer);
	}

	private async poll(): Promise<void> {
		if (this.activeTaskCount >= this.config.maxConcurrentTasks) return;

		try {
			const task = await this.client.pollForTask();
			if (!task) return;

			this.activeTaskCount++;
			console.log(`[poller] Task received: ${task.taskId} (${task.executor})`);

			// Execute asynchronously — don't block polling
			this.executeTask(task).finally(() => {
				this.activeTaskCount--;
				console.log(`[poller] Task complete: ${task.taskId}`);
			});
		} catch (error) {
			console.error(
				"[poller] Error:",
				error instanceof Error ? error.message : error,
			);
		}
	}

	private async executeTask(task: TaskAssignPayload): Promise<void> {
		const executor = this.executors.find((e) => e.canHandle(task));
		if (!executor) {
			console.error(
				`[poller] No executor for task ${task.taskId} (${task.executor})`,
			);
			await this.client.reportTaskResult({
				taskId: task.taskId,
				nodeId: this.client.getNodeId()!,
				status: "failed",
				error: `No executor found for: ${task.executor}`,
				duration: 0,
			});
			return;
		}

		const startTime = Date.now();

		try {
			const artifacts = await executor.execute(task, async (entry) => {
				await this.client.uploadLog(task.taskId, {
					nodeId: this.client.getNodeId()!,
					timestamp: entry.timestamp,
					level: entry.level,
					step: entry.step,
					message: entry.message,
				});
			});

			const duration = Math.round((Date.now() - startTime) / 1000);

			await this.client.reportTaskResult({
				taskId: task.taskId,
				nodeId: this.client.getNodeId()!,
				status: "completed",
				artifacts,
				duration,
			});
		} catch (error) {
			const duration = Math.round((Date.now() - startTime) / 1000);
			await this.client.reportTaskResult({
				taskId: task.taskId,
				nodeId: this.client.getNodeId()!,
				status: "failed",
				error: error instanceof Error ? error.message : "Unknown error",
				duration,
			});
		}
	}
}
