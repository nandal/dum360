// ─── Capability Category ────────────────────────────────────────────────
export const CAPABILITY_CATEGORIES = [
  'executor',
  'resource',
  'tool',
  'runtime',
  'service',
] as const;

export type CapabilityCategory = (typeof CAPABILITY_CATEGORIES)[number];

// ─── Capability ─────────────────────────────────────────────────────────
export interface Capability {
  id: string;
  category: CapabilityCategory;
  name: string;
  version?: string | null;
}

// ─── Node Capability (join) ─────────────────────────────────────────────
export interface NodeCapability {
  nodeId: string;
  capabilityId: string;
  value?: string | null;
  attestedAt: string;
}

// ─── Attestation Result ─────────────────────────────────────────────────
export interface AttestationResult {
  id: string;
  nodeId: string;
  capabilityId: string;
  passed: boolean;
  reason?: string | null;
  createdAt: string;
}

// ─── Declared capability (what a node sends at registration) ────────────
export interface DeclaredCapability {
  id: string;
  value?: string;
  version?: string;
}
