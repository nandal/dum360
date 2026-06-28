import { Module } from "@nestjs/common";
import { DrizzleModule } from "@dum360/shared";
import { BullModule } from "@nestjs/bullmq";
import { QUEUE_NAMES } from "@dum360/shared";
import { TasksModule } from "./tasks/tasks.module";
import { WebhookModule } from "./webhook/webhook.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { HealthController } from "./health/health.controller";

@Module({
	imports: [
		DrizzleModule.forRoot({
			connectionString:
				process.env.DATABASE_URL ??
				"postgres://dum360:dum360@localhost:5432/dum360",
			logging: process.env.NODE_ENV === "development",
		}),
		BullModule.forRoot({
			connection: {
				host: process.env.REDIS_HOST ?? "localhost",
				port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
			},
		}),
		BullModule.registerQueue({ name: QUEUE_NAMES.TASK_DISPATCH }),
		TasksModule,
		WebhookModule,
		SchedulerModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
