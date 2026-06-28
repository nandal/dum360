/**
 * Environment configuration helpers.
 *
 * Secrets must never fall back to well-known defaults — a missing secret is a
 * fatal misconfiguration, not something to paper over with a static value.
 */

/** Read a required environment variable or throw a clear startup error. */
export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`${name} is required but not set. Refusing to start with an insecure default.`,
		);
	}
	return value;
}

/**
 * The shared JWT signing/verification secret.
 * Throws at startup if JWT_SECRET is not configured.
 */
export function getJwtSecret(): string {
	return requireEnv("JWT_SECRET");
}
