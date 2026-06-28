import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { QUEUE_NAMES } from "@dum360/shared";
import type { LivenessService } from "./liveness.service";

/**
 * BullMQ worker that runs the liveness sweep on schedule.
 */
@Processor(QUEUE_NAMES.LIVENESS_SWEEP)
export class LivenessProcessor extends WorkerHost {
	private readonly logger = new Logger(LivenessProcessor.name);

	constructor(private readonly livenessService: LivenessService) {
		super();
	}

	async process(job: Job): Promise<{ offlined: number }> {
		this.logger.debug("Running liveness sweep");
		return this.livenessService.sweep();
	}
}
