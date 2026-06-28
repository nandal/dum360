import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "../elasticsearch/elasticsearch.service";

@Injectable()
export class QueryService {
	constructor(private readonly es: ElasticsearchService) {}

	async getTaskLogs(
		taskId: string,
		options?: { tail?: number; level?: string },
	) {
		return this.es.queryLogs(taskId, options);
	}
}
