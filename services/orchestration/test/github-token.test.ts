/**
 * GitHubTokenService — credential selection & fail-closed behaviour.
 * (The live GitHub App path is exercised separately; here we cover config
 *  selection, which needs no network.)
 */
import { describe, it, expect, afterEach } from "vitest";
import { GitHubTokenService } from "../src/github/github-token.service";

const KEYS = [
	"GITHUB_APP_ID",
	"GITHUB_APP_PRIVATE_KEY",
	"GITHUB_TOKEN",
	"NODE_ENV",
] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function reset() {
	for (const k of KEYS) delete process.env[k];
}
afterEach(() => {
	for (const k of KEYS) {
		if (saved[k] === undefined) delete process.env[k];
		else process.env[k] = saved[k];
	}
});

describe("GitHubTokenService", () => {
	it("fails closed when nothing is configured (no silent placeholder)", async () => {
		reset();
		process.env.NODE_ENV = "test";
		await expect(
			new GitHubTokenService().mintForRepo("owner/repo"),
		).rejects.toThrow(/No GitHub credentials/);
	});

	it("uses the static dev token outside production", async () => {
		reset();
		process.env.NODE_ENV = "test";
		process.env.GITHUB_TOKEN = "ghs_devtoken";
		const minted = await new GitHubTokenService().mintForRepo("owner/repo");
		expect(minted.token).toBe("ghs_devtoken");
		expect(minted.expiresAt).toBeInstanceOf(Date);
	});

	it("refuses the static dev token in production", async () => {
		reset();
		process.env.NODE_ENV = "production";
		process.env.GITHUB_TOKEN = "ghs_devtoken";
		await expect(
			new GitHubTokenService().mintForRepo("owner/repo"),
		).rejects.toThrow(/No GitHub credentials/);
	});

	it("revoke is a no-op for the dev static token", async () => {
		reset();
		process.env.NODE_ENV = "test";
		process.env.GITHUB_TOKEN = "ghs_devtoken";
		await expect(
			new GitHubTokenService().revoke("ghs_devtoken"),
		).resolves.toBeUndefined();
	});
});
