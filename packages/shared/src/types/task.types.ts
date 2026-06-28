export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type ExecutorType = 'github';
export type AIProvider = 'claude' | 'codex' | 'gemini';

export interface IssueRef {
  number: number;
  title: string;
  body?: string;
  labels?: string[];
}

export interface TaskArtifacts {
  branch?: string;
  prUrl?: string;
  commitSha?: string;
  diff?: string;
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
  repoToken: string;
  tokenExpiresAt: string;
}

export interface TaskResultRequest {
  nodeId: string;
  status: 'completed' | 'failed';
  artifacts?: TaskArtifacts;
  error?: string;
  duration: number;
}
