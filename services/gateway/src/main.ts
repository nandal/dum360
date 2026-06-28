import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "@dum360/shared";
import { Logger } from "@nestjs/common";
import helmet from "helmet";
import compression from "compression";

async function bootstrap() {
	const logger = new Logger("Gateway");
	const app = await NestFactory.create(AppModule);

	// Security
	app.use(helmet());
	app.use(compression());

	// Global exception filter — normalized error responses
	app.useGlobalFilters(new AllExceptionsFilter());

	// CORS — allow Dashboard SPA
	app.enableCors({
		origin: process.env.CORS_ORIGIN ?? "*",
		methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-API-Key",
			"X-Idempotency-Key",
		],
	});

	const port = process.env.PORT ?? 8080;
	await app.listen(port);
	logger.log(`DUM360 API Gateway listening on :${port}`);
}

bootstrap();
