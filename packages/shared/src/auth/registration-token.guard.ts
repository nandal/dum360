import { timingSafeEqual } from "node:crypto";
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

		if (!this.tokensMatch(token, this.expectedToken)) {
			throw new UnauthorizedException("Invalid registration token");
		}

		return true;
	}

	/** Constant-time comparison to avoid leaking the token via timing. */
	private tokensMatch(provided: string, expected: string): boolean {
		const a = Buffer.from(provided);
		const b = Buffer.from(expected);
		// timingSafeEqual requires equal-length buffers; length mismatch ⇒ no match.
		if (a.length !== b.length) return false;
		return timingSafeEqual(a, b);
	}
}
