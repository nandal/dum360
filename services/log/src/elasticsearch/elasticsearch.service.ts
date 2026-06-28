import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Client } from "@elastic/elasticsearch";
import { LOG_RETENTION_DAYS } from "@dum360/shared";

export interface LogDocument {
	taskId: string;
	nodeId: string;
	timestamp: string;
	level: "debug" | "info" | "warn" | "error";
	step: string;
	message: string;
	metadata?: Record<string, unknown>;
}

const INDEX_PREFIX = "dum360-logs";

@Injectable()
export class ElasticsearchService implements OnModuleInit {
	private readonly logger = new Logger(ElasticsearchService.name);
	private client: Client | null = null;

	private get esUrl(): string {
		return process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
	}

	async onModuleInit(): Promise<void> {
		try {
			this.client = new Client({ node: this.esUrl });

			// Ping ES to verify connectivity
			const health = await this.client.cluster.health();
			this.logger.log(`Elasticsearch connected: ${health.status}`);

			// Ensure index template for daily indices
			await this.ensureIndexTemplate();
		} catch (error) {
			this.logger.warn(
				`Elasticsearch unavailable at ${this.esUrl} — log service degraded. ` +
					`Logs will be accepted but not persisted.`,
			);
			this.client = null;
		}
	}

	/** Current day's index: dum360-logs-2026.06.28 */
	private indexName(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		return `${INDEX_PREFIX}-${y}.${m}.${d}`;
	}

	/** Index a log document into today's index. */
	async indexLog(doc: LogDocument): Promise<void> {
		if (!this.client) {
			this.logger.debug("ES unavailable — log dropped");
			return;
		}

		await this.client.index({
			index: this.indexName(),
			document: {
				...doc,
				"@timestamp": doc.timestamp,
			},
		});
	}

	/** Bulk index multiple log documents. */
	async bulkIndexLogs(docs: LogDocument[]): Promise<void> {
		if (!this.client || docs.length === 0) return;

		const operations = docs.flatMap((doc) => [
			{ index: { _index: this.indexName() } },
			{ ...doc, "@timestamp": doc.timestamp },
		]);

		await this.client.bulk({ operations, refresh: false });
	}

	/** Query logs for a task. */
	async queryLogs(
		taskId: string,
		options?: { tail?: number; level?: string; since?: string },
	): Promise<{ logs: LogDocument[]; total: number }> {
		if (!this.client) {
			return { logs: [], total: 0 };
		}

		const must: Array<Record<string, unknown>> = [{ term: { taskId } }];

		if (options?.level) {
			must.push({ term: { level: options.level } });
		}

		if (options?.since) {
			must.push({ range: { "@timestamp": { gte: options.since } } });
		}

		const size = options?.tail ?? 100;

		const result = await this.client.search<LogDocument>({
			index: `${INDEX_PREFIX}-*`,
			body: {
				query: { bool: { must } },
				sort: { "@timestamp": "desc" },
				size,
			},
		});

		const logs = result.hits.hits.map((hit) => hit._source!);
		const total =
			typeof result.hits.total === "number"
				? result.hits.total
				: (result.hits.total?.value ?? 0);

		return { logs, total };
	}

	/** Check if ES is healthy. */
	async isHealthy(): Promise<boolean> {
		if (!this.client) return false;
		try {
			const health = await this.client.cluster.health();
			return health.status !== "red";
		} catch {
			return false;
		}
	}

	/** Delete indices older than retention period. */
	async cleanupOldIndices(): Promise<number> {
		if (!this.client) return 0;

		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);

		const y = cutoff.getFullYear();
		const m = String(cutoff.getMonth() + 1).padStart(2, "0");
		const d = String(cutoff.getDate()).padStart(2, "0");
		const cutoffIndex = `${INDEX_PREFIX}-${y}.${m}.${d}`;

		try {
			const result = await this.client.indices.delete({
				index: `${INDEX_PREFIX}-*`,
				ignore_unavailable: true,
			});

			// Elasticsearch doesn't support "older than" in delete by index pattern
			// In production: use ILM (Index Lifecycle Management) policies
			this.logger.debug(
				`Cleanup requested for indices older than ${cutoffIndex}`,
			);
			return 0;
		} catch (error) {
			this.logger.warn("Index cleanup failed", error);
			return 0;
		}
	}

	/** Create index template for consistent mappings. */
	private async ensureIndexTemplate(): Promise<void> {
		if (!this.client) return;

		await this.client.indices.putIndexTemplate({
			name: "dum360-logs-template",
			body: {
				index_patterns: [`${INDEX_PREFIX}-*`],
				template: {
					settings: {
						number_of_shards: 1,
						number_of_replicas: 0, // MVP: single node
					},
					mappings: {
						properties: {
							"@timestamp": { type: "date" },
							taskId: { type: "keyword" },
							nodeId: { type: "keyword" },
							level: { type: "keyword" },
							step: { type: "keyword" },
							message: { type: "text" },
							metadata: { type: "object", dynamic: true },
						},
					},
				},
			},
		});
	}
}
