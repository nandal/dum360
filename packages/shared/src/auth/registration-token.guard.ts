import {
	Injectable,
	type CanActivate,
	type ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common";

/**
 * Guard that validates the pre-shared registration token.
 * Use only on POST /register.
 *
 * The registration token is provided via environment variable REGISTRATION_TOKEN.
 */
@Injectable()
export class RegistrationTokenGuard implements CanActivate {
	private readonly expectedToken: string;

	constructor() {
		this.expectedToken = process.env.REGISTRATION_TOKEN ?? "";
		if (!this.expectedToken) {
			// Log warning but don't throw — allows tests without env setup
			console.warn(
				"REGISTRATION_TOKEN not set — registration will be rejected",
			);
		}
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedException(
				"Missing or malformed registration token",
			);
		}

		const token = authHeader.slice(7);

		if (!this.expectedToken) {
			throw new UnauthorizedException("Registration not configured");
		}

		if (token !== this.expectedToken) {
			throw new UnauthorizedException("Invalid registration token");
		}

		return true;
	}
}
