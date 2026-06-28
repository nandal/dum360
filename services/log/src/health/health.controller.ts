import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import type { ElasticsearchService } from "../elasticsearch/elasticsearch.service";

@Controller("health")
export class HealthController {
	constructor(private readonly es: ElasticsearchService) {}

	@Get()
	async check() {
		const esHealthy = await this.es.isHealthy();
		if (!esHealthy) {
			throw new HttpException(
				{ status: "unhealthy", service: "log", elasticsearch: "unreachable" },
				HttpStatus.SERVICE_UNAVAILABLE,
			);
		}

		return { status: "healthy", version: "0.1.0", service: "log" };
	}
}
