/**
 * Node configuration — all from environment variables.
 * Designed to run as a Docker container with env vars injected at startup.
 */
export interface NodeConfig {
  /** DUM360 Server URL (Gateway) */
  serverUrl: string;

  /** Human-readable node name */
  nodeName: string;

  /** Node version */
  version: string;

  /** Registration token (pre-shared secret) */
  registrationToken: string;

  /** AI provider to use for task execution */
  aiProvider: string;

  /** Poll interval in seconds */
  pollInterval: number;

  /** Heartbeat interval in seconds */
  heartbeatInterval: number;

  /** Maximum concurrent tasks (MVP: 1) */
  maxConcurrentTasks: number;

  /** Working directory for cloned repositories */
  workDir: string;

  /** Local API port */
  localApiPort: number;
}

export function loadConfig(): NodeConfig {
  return {
    serverUrl:           process.env.SERVER_URL ?? 'http://gateway:8080',
    nodeName:            process.env.NODE_NAME ?? `node-${process.pid}`,
    version:             process.env.NODE_VERSION ?? '0.1.0',
    registrationToken:   process.env.REGISTRATION_TOKEN ?? '',
    aiProvider:          process.env.AI_PROVIDER ?? 'claude',
    pollInterval:        parseInt(process.env.POLL_INTERVAL ?? '5', 10),
    heartbeatInterval:   parseInt(process.env.HEARTBEAT_INTERVAL ?? '15', 10),
    maxConcurrentTasks:  parseInt(process.env.MAX_CONCURRENT_TASKS ?? '1', 10),
    workDir:             process.env.WORK_DIR ?? '/tmp/dum360/workspaces',
    localApiPort:        parseInt(process.env.LOCAL_API_PORT ?? '9090', 10),
  };
}
