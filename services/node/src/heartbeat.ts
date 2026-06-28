/**
 * Heartbeat loop — sends heartbeat to server every N seconds.
 * Reports node status, resource utilization, and running task count.
 */
import { cpus, totalmem, freemem } from "node:os";
import type { ServerClient } from "./server-client";
import type { NodeConfig } from "./config";

export class HeartbeatLoop {
	private timer: NodeJS.Timeout | null = null;

	constructor(
		private client: ServerClient,
		private config: NodeConfig,
		private getRunningTasks: () => number,
	) {}

	start(): void {
		this.sendHeartbeat(); // Immediate first heartbeat
		this.timer = setInterval(
			() => this.sendHeartbeat(),
			this.config.heartbeatInterval * 1000,
		);
	}

	stop(): void {
		if (this.timer) clearInterval(this.timer);
	}

	private async sendHeartbeat(): Promise<void> {
		try {
			const cpuCount = cpus().length;
			const totalRam = totalmem();
			const freeRam = freemem();
			const usedRam = totalRam - freeRam;

			await this.client.heartbeat({
				status: "online",
				resources: {
					cpu: {
						used: Math.round((process.cpuUsage().user / 1e6) * 100) / 100,
						total: cpuCount,
					},
					ram: {
						used: `${Math.round(usedRam / 1e9)}GB`,
						total: `${Math.round(totalRam / 1e9)}GB`,
					},
				},
				runningTasks: this.getRunningTasks(),
				version: this.config.version,
			});
		} catch (error) {
			console.error(
				"[heartbeat] Failed:",
				error instanceof Error ? error.message : error,
			);
		}
	}
}
