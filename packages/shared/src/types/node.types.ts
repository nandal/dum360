import type { DeclaredCapability } from './capability.types';

export type NodeStatus = 'online' | 'offline' | 'busy';

export interface NodeResource {
  cpu: { used: number; total: number };
  ram: { used: string; total: string };
}

export interface DeclaredCapabilities {
  executors: DeclaredCapability[];
  resources: DeclaredCapability[];
  tools: DeclaredCapability[];
  runtimes: DeclaredCapability[];
  services: DeclaredCapability[];
}

export interface AttestedCapabilities extends DeclaredCapabilities {}

export interface FailedAttestation {
  id: string;
  reason: string;
}

export interface RegisterNodeRequest {
  name: string;
  version: string;
  capabilities: DeclaredCapabilities;
}

export interface RegisterNodeResponse {
  nodeId: string;
  jwt: string;
  heartbeatInterval: number;
  pollInterval: number;
  attestedCapabilities: AttestedCapabilities;
  failedAttestations: FailedAttestation[];
}

export interface Node {
  id: string;
  name: string;
  status: NodeStatus;
  version: string;
  registeredAt: string;
  lastHeartbeatAt: string | null;
  currentTaskId: string | null;
}

export interface NodeDetail extends Node {
  capabilities: DeclaredCapabilities;
  resources: NodeResource;
  taskHistory: {
    total: number;
    completed: number;
    failed: number;
  };
}
