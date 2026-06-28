// ─── Timing ─────────────────────────────────────────────────────────────
export const HEARTBEAT_INTERVAL = 15; // seconds
export const HEARTBEAT_GRACE = 30; // seconds
export const OFFLINE_THRESHOLD = 45; // seconds (interval + grace)
export const DEFAULT_POLL_INTERVAL = 5; // seconds
export const DEFAULT_TASK_TIMEOUT = 3600; // seconds

// ─── API ────────────────────────────────────────────────────────────────
export const API_VERSION = "0.1.0";

// ─── Logging ────────────────────────────────────────────────────────────
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export const LOG_RETENTION_DAYS = 30;

// ─── Services ───────────────────────────────────────────────────────────
export const SERVICE_PORTS = {
	GATEWAY: 8080,
	REGISTRY: 8081,
	ORCHESTRATION: 8082,
	LOG: 8083,
} as const;

// ─── Queue ──────────────────────────────────────────────────────────────
export const QUEUE_NAMES = {
	TASK_DISPATCH: "task-dispatch",
	LIVENESS_SWEEP: "liveness-sweep",
	LOG_RETENTION: "log-retention",
	WEBHOOK_PROCESS: "webhook-process",
} as const;

// ─── Database ───────────────────────────────────────────────────────────
export const DB_SCHEMAS = {
	REGISTRY: "registry",
	ORCHESTRATION: "orchestration",
} as const;

// ─── RegEx Patterns ─────────────────────────────────────────────────────
export const PATTERNS = {
	REPOSITORY: /^[\w.-]+\/[\w.-]+$/,
	BRANCH: /^[\w./-]+$/,
} as const;
