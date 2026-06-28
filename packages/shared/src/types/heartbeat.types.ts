import type { NodeStatus, NodeResource } from "./node.types";

export interface HeartbeatRequest {
	nodeId: string;
	status: NodeStatus;
	resources: {
		cpu: { used: number; total: number };
		ram: { used: string; total: string };
	};
	runningTasks: number;
	version: string;
}

export interface HeartbeatResponse {
	acknowledged: true;
	serverTime: string;
	nextHeartbeatIn: number;
}

export interface Heartbeat extends HeartbeatRequest {
	id: string;
	receivedAt: string;
}
