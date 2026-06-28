/**
 * @module github-token.service
 * @description Mints and revokes the per-task GitHub credential.
 *
 * Strategy (selected by configuration):
 *   - GitHub App  : GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY set → mint a
 *                   per-task **installation token**, scoped to the single target
 *                   repo, least privilege (contents+pull_requests: write), short
 *                   TTL, and revocable when the task ends.
 *   - Dev static  : GITHUB_TOKEN set and NODE_ENV !== 'production' → use it
 *                   (local development only; not revocable).
 *   - Otherwise   : fail closed. No silent placeholder token.
 *
 * Octokit is imported lazily so deployments/tests that don't use the App path
 * never load it.
 */
import { readFileSync } from "node:fs";
import { Injectable, Logger } from "@nestjs/common";

export interface MintedToken {
	token: string;
	expiresAt: Date;
}

/**
 * Context for minting a task credential. Currently only the repo is needed;
 * the self-hosted tier (#17) will extend this with owner/tier so the provider
 * can decide between server-side minting and node-local creds without a
 * signature change at the call site.
 */
export interface TokenRequest {
	repository: string;
	taskId: string;
}

/** Load the App private key from a Docker-secret file when provided, else env. */
function loadPrivateKey(): string | undefined {
	const file = process.env.GITHUB_APP_PRIVATE_KEY_FILE;
	if (file) return readFileSync(file, "utf-8");
	// Accept literal "\n" (common when injected via a single-line env var).
	return process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

@Injectable()
export class GitHubTokenService {
	private readonly logger = new Logger(GitHubTokenService.name);
	private readonly appId = process.env.GITHUB_APP_ID;
	private readonly privateKey = loadPrivateKey();
	private readonly devToken = process.env.GITHUB_TOKEN;
	private readonly isProd = process.env.NODE_ENV === "production";

	private get appConfigured(): boolean {
		return Boolean(this.appId && this.privateKey);
	}

	/** Mint a credential for a task (scoped to its single repository). */
	async mintForTask(req: TokenRequest): Promise<MintedToken> {
		if (this.appConfigured) return this.mintInstallationToken(req.repository);

		if (this.devToken && !this.isProd) {
			this.logger.warn(
				"Using static GITHUB_TOKEN (dev only). Configure a GitHub App for per-task scoped tokens.",
			);
			return { token: this.devToken, expiresAt: new Date(Date.now() + 3_600_000) };
		}

		// Fail closed — never fall back to a shared/placeholder token.
		throw new Error(
			"No GitHub credentials configured: set GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY " +
				"(or GITHUB_TOKEN for non-production development).",
		);
	}

	/** Revoke a previously minted token. No-op for the dev static token. */
	async revoke(token: string): Promise<void> {
		if (!this.appConfigured || token === this.devToken) return;
		try {
			const { Octokit } = await import("@octokit/rest");
			const octokit = new Octokit({ auth: token });
			await octokit.request("DELETE /installation/token");
			this.logger.log("Revoked per-task installation token");
		} catch (error) {
			this.logger.warn(
				`Token revoke failed (will expire on TTL): ${(error as Error).message}`,
			);
		}
	}

	private async mintInstallationToken(repository: string): Promise<MintedToken> {
		const [owner, repo] = repository.split("/");
		if (!owner || !repo) {
			throw new Error(`Invalid repository (expected owner/repo): ${repository}`);
		}
		const { Octokit } = await import("@octokit/rest");
		const { createAppAuth } = await import("@octokit/auth-app");

		const appId = this.appId as string;
		const privateKey = this.privateKey as string;

		// Resolve the installation that covers this repo, then mint a token scoped
		// to just that repo with the minimum permissions for clone/push/PR.
		const appOctokit = new Octokit({
			authStrategy: createAppAuth,
			auth: { appId, privateKey },
		});
		const { data: installation } = await appOctokit.rest.apps.getRepoInstallation(
			{ owner, repo },
		);

		const auth = createAppAuth({ appId, privateKey });
		const installationAuth = await auth({
			type: "installation",
			installationId: installation.id,
			repositoryNames: [repo],
			permissions: { contents: "write", pull_requests: "write" },
		});

		return {
			token: installationAuth.token,
			expiresAt: new Date(installationAuth.expiresAt),
		};
	}
}
