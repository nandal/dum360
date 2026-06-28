import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { QUEUE_NAMES } from "@dum360/shared";
import type { SchedulerService } from "./scheduler.service";

@Processor(QUEUE_NAMES.TASK_DISPATCH)
export class SchedulerProcessor extends WorkerHost {
	private readonly logger = new Logger(SchedulerProcessor.name);

	constructor(private readonly scheduler: SchedulerService) {
		super();
	}

	async process(job: Job): Promise<{ assigned: number }> {
		if (job.name === "schedule") {
			return this.scheduler.runCycle();
		}

		if (job.name === "dispatch") {
			// Task dispatch notification — post-MVP: notify node via WebSocket
			this.logger.log(
				`Dispatch: task ${job.data.taskId} → node ${job.data.nodeId}`,
			);
			return { assigned: 0 };
		}

		return { assigned: 0 };
	}
}
