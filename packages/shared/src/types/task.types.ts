export type TaskStatus =
	| "queued"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "critical";
export type ExecutorType = "github" | "docker";
export type AIProvider = "claude" | "codex" | "gemini";

export interface IssueRef {
	number: number;
	title: string;
	body?: string;
	labels?: string[];
}

/** Credentials for pulling a private image from a container registry. */
export interface RegistryCredentials {
	username: string;
	password: string;
	/** Registry host; defaults to Docker Hub when omitted. */
	registry?: string;
}

export interface TaskArtifacts {
	branch?: string;
	prUrl?: string;
	commitSha?: string;
	diff?: string;
	/** Container exit code (docker executor). 0 = success. */
	exitCode?: number;
	testResults?: {
		passed: number;
		failed: number;
		skipped: number;
	};
}

export interface TaskRequirement {
	id?: string;
	taskId?: string;
	capabilityName: string;
}

export interface CreateTaskRequest {
	executor: ExecutorType;
	repository: string;
	branch?: string;
	issue?: IssueRef;
	instructions: string;
	aiProvider: AIProvider;
	/** Container image (e.g. "org/agent:tag"). Required when executor is "docker". */
	image?: string;
	/** Credentials for a private registry image (optional). */
	registryCredentials?: RegistryCredentials;
	requirements?: TaskRequirement[];
	timeout?: number;
	priority?: TaskPriority;
}

export interface Task {
	id: string;
	executor: ExecutorType;
	status: TaskStatus;
	repository: string;
	branch: string;
	issueNumber: number | null;
	issueTitle: string | null;
	issueBody: string | null;
	instructions: string;
	aiProvider: AIProvider;
	image: string | null;
	timeoutSeconds: number;
	priority: TaskPriority;
	nodeId: string | null;
	artifacts: TaskArtifacts;
	errorMessage: string | null;
	position: number | null;
	createdAt: string;
	startedAt: string | null;
	completedAt: string | null;
}

export interface TaskDetail extends Task {
	nodeName?: string;
	requirements: TaskRequirement[];
	repoToken?: string;
	tokenExpiresAt?: string;
	stateTransitions: TaskStateTransition[];
}

export interface TaskStateTransition {
	id: string;
	taskId: string;
	fromStatus: TaskStatus;
	toStatus: TaskStatus;
	reason: string | null;
	transitionedAt: string;
}

export interface TaskListQuery {
	status?: TaskStatus;
	executor?: ExecutorType;
	nodeId?: string;
	repository?: string;
	limit?: number;
	offset?: number;
}

export interface TaskAssignPayload {
	taskId: string;
	executor: ExecutorType;
	timeout: number;
	repository: string;
	branch: string;
	issue: IssueRef | null;
	instructions: string;
	aiProvider: AIProvider;
	/** Container image for the docker executor (undefined for github executor). */
	image?: string;
	/** Private-registry credentials, forwarded for the docker executor only. */
	registryCredentials?: RegistryCredentials;
	repoToken: string;
	tokenExpiresAt: string;
}

export interface TaskResultRequest {
	nodeId: string;
	status: "completed" | "failed";
	artifacts?: TaskArtifacts;
	error?: string;
	duration: number;
}
