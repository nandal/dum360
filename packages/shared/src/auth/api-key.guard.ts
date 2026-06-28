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
	}

	canActivate(context: ExecutionContext): boolean {
		// If no API key configured, skip auth (MVP mode)
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
