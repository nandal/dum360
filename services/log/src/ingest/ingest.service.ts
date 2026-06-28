import { Injectable, Logger } from "@nestjs/common";
import type { LogEntryRequest } from "@dum360/shared";
import {
	ElasticsearchService,
	LogDocument,
} from "../elasticsearch/elasticsearch.service";

@Injectable()
export class IngestService {
	private readonly logger = new Logger(IngestService.name);
	private logCount = 0;

	constructor(private readonly es: ElasticsearchService) {}

	async ingest(
		taskId: string,
		entry: LogEntryRequest,
	): Promise<{ acknowledged: true; logCount: number }> {
		const doc: LogDocument = {
			taskId,
			nodeId: entry.nodeId,
			timestamp: entry.timestamp,
			level: entry.level,
			step: entry.step,
			message: entry.message,
		};

		await this.es.indexLog(doc);

		this.logCount++;
		this.logger.debug(
			`Log ingested: ${taskId} [${entry.level}] ${entry.step} — ${entry.message.slice(0, 80)}`,
		);

		return { acknowledged: true, logCount: this.logCount };
	}
}
