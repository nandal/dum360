import type { TaskAssignPayload, TaskResultRequest } from "@dum360/shared";

export interface LogEntry {
	timestamp: string;
	level: "debug" | "info" | "warn" | "error";
	step: string;
	message: string;
}

/**
 * Standard executor interface — mirrors the Go interface from the PRD.
 * Each executor understands a task protocol and executes it.
 */
export interface Executor {
	/** Unique executor identifier (e.g., "github", "docker"). */
	id(): string;

	/** Check if this executor can handle the given task. */
	canHandle(task: TaskAssignPayload): boolean;

	/** Execute the task and return the result. */
	execute(
		task: TaskAssignPayload,
		onLog: (entry: LogEntry) => Promise<void>,
	): Promise<TaskResultRequest["artifacts"]>;

	/** Lightweight capability check (attestation). */
	probe(): Promise<{ passed: boolean; reason?: string }>;
}
