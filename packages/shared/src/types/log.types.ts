export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntryRequest {
  nodeId: string;
  timestamp: string;
  level: LogLevel;
  step: string;
  message: string;
}

export interface LogEntry extends LogEntryRequest {
  taskId: string;
  metadata?: Record<string, unknown>;
}

export interface LogIngestResponse {
  acknowledged: true;
  logCount: number;
}
