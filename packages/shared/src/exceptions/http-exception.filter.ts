import {
	type ExceptionFilter,
	Catch,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorBody {
	statusCode: number;
	error: string;
	code?: string;
	messages?: Array<{ field: string; message: string }>;
	timestamp: string;
	path: string;
}

/**
 * Global exception filter.
 * Normalizes all exceptions into a consistent JSON shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let status: HttpStatus;
		let body: ErrorBody;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res = exception.getResponse();

			body = {
				statusCode: status,
				error: HttpStatus[status] ?? "Internal Server Error",
				timestamp: new Date().toISOString(),
				path: request.url,
			};

			// Preserve validation error details from Zod pipe or class-validator
			if (typeof res === "object" && res !== null) {
				const r = res as Record<string, unknown>;
				if (r.messages) body.messages = r.messages as ErrorBody["messages"];
				if (r.code) body.code = r.code as string;
			}
		} else {
			// Unexpected error — log full stack, return generic 500
			this.logger.error(
				"Unhandled exception",
				exception instanceof Error ? exception.stack : exception,
			);
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			body = {
				statusCode: status,
				error: "Internal Server Error",
				timestamp: new Date().toISOString(),
				path: request.url,
			};
		}

		response.status(status).json(body);
	}
}
