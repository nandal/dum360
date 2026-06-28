import { Injectable, Logger } from '@nestjs/common';
import type { ElasticsearchService, LogDocument } from '../elasticsearch/elasticsearch.service';

/**
 * Polls Elasticsearch for new log entries and pushes to WebSocket clients.
 * MVP: 500ms polling interval. Post-MVP: Elasticsearch _changes feed or push-based.
 */
@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private pollers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly es: ElasticsearchService) {}

  /**
   * Start polling for new logs for a task.
   * Calls onLog for each new log entry found.
   */
  startPolling(
    taskId: string,
    onLog: (log: LogDocument) => void,
    onError: (error: Error) => void,
  ): void {
    if (this.pollers.has(taskId)) return;

    let lastTimestamp: string | undefined;

    const interval = setInterval(async () => {
      try {
        const { logs } = await this.es.queryLogs(taskId, {
          tail: 50,
          since: lastTimestamp,
        });

        // Push new logs in ascending order
        for (const log of logs.reverse()) {
          onLog(log);
          if (!lastTimestamp || log.timestamp > lastTimestamp) {
            lastTimestamp = log.timestamp;
          }
        }
      } catch (error) {
        onError(error as Error);
      }
    }, 500);

    this.pollers.set(taskId, interval);
    this.logger.log(`Polling started for task ${taskId}`);
  }

  /** Stop polling for a task. */
  stopPolling(taskId: string): void {
    const interval = this.pollers.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.pollers.delete(taskId);
      this.logger.log(`Polling stopped for task ${taskId}`);
    }
  }
}
