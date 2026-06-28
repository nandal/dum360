/**
 * HTTP client for DUM360 Server API.
 * Handles JWT auth, retries, and error mapping.
 */
import type { NodeConfig } from './config';
import type {
  RegisterNodeResponse,
  RegisterNodeRequest,
  HeartbeatRequest,
  HeartbeatResponse,
  TaskAssignPayload,
  TaskResultRequest,
  LogEntryRequest,
  LogIngestResponse,
} from '@dum360/shared';

export class ServerClient {
  private jwt: string | null = null;
  private nodeId: string | null = null;

  constructor(private config: NodeConfig) {}

  // ─── Registration ────────────────────────────────────────────────────

  async register(req: RegisterNodeRequest): Promise<RegisterNodeResponse> {
    const res = await this.request<RegisterNodeResponse>('POST', '/register', req, {
      auth: `Bearer ${this.config.registrationToken}`,
    });

    this.jwt = res.jwt;
    this.nodeId = res.nodeId;

    return res;
  }

  // ─── Heartbeat ───────────────────────────────────────────────────────

  async heartbeat(req: Omit<HeartbeatRequest, 'nodeId'>): Promise<HeartbeatResponse> {
    return this.request<HeartbeatResponse>('POST', '/heartbeat', {
      ...req,
      nodeId: this.nodeId!,
    });
  }

  // ─── Task Polling ────────────────────────────────────────────────────

  async pollForTask(): Promise<TaskAssignPayload | null> {
    try {
      return await this.request<TaskAssignPayload>('GET', '/tasks/next');
    } catch (error) {
      // 204 No Content → no task available
      return null;
    }
  }

  // ─── Task Result ─────────────────────────────────────────────────────

  async reportTaskResult(req: TaskResultRequest & { nodeId: string }): Promise<void> {
    return this.request('PATCH', `/tasks/${req.taskId}/result`, req);
  }

  // ─── Log Upload ──────────────────────────────────────────────────────

  async uploadLog(taskId: string, entry: LogEntryRequest): Promise<void> {
    await this.request<LogIngestResponse>('POST', `/tasks/${taskId}/log`, entry);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  getNodeId(): string | null {
    return this.nodeId;
  }

  getJwt(): string | null {
    return this.jwt;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this.config.serverUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    // Use JWT for authenticated requests (after registration)
    if (this.jwt && !extraHeaders?.auth) {
      headers['Authorization'] = `Bearer ${this.jwt}`;
    }

    // Override with explicit auth (registration token)
    if (extraHeaders?.auth) {
      headers['Authorization'] = extraHeaders.auth;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return undefined as T;
    if (response.status === 401) {
      throw new Error('Authentication failed — re-registration required');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? `HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}
