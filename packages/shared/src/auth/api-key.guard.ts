import {
	Injectable,
	type CanActivate,
	type ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common";

/**
 * Guard that validates the operator API key.
 * Use on operator-facing endpoints (task management, node listing).
 * Optional in MVP — only enforces if API_KEY env var is set.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
	private readonly expectedKey: string | null;

	constructor() {
		this.expectedKey = process.env.API_KEY ?? null;

		// Fail closed: refusing to boot is safer than silently serving operator
		// endpoints unauthenticated in production.
		if (!this.expectedKey && process.env.NODE_ENV === "production") {
			throw new Error(
				"API_KEY is required in production — operator endpoints must not be unauthenticated.",
			);
		}
	}

	canActivate(context: ExecutionContext): boolean {
		// In non-production environments an unset API_KEY skips auth (MVP/dev mode).
		if (!this.expectedKey) return true;

		const request = context.switchToHttp().getRequest();
		const apiKey = request.headers["x-api-key"];

		if (!apiKey) {
			throw new UnauthorizedException("Missing X-API-Key header");
		}

		if (apiKey !== this.expectedKey) {
			throw new UnauthorizedException("Invalid API key");
		}

		return true;
	}
}
