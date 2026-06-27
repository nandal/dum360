# DUM360 — Architecture Overview

> **Status:** Early design. This captures the intended system design from the [Platform PRD](../PRD.md). It is the starting point for Architecture Decision Records (ADRs) and implementation.

---

## System Overview

DUM360 pools India's idle computing power — phones, PCs, university labs, government data centres, enterprise machines, and solar GPU rigs — into a single sovereign inference engine.

```
┌──────────────────────────────────────────────────────────────────┐
│                SOVEREIGN CORE (Indian Cloud Only)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Orchestrator │  │ Sovereign DB │  │ UPI Billing  │          │
│  │ (K8s Control │  │ & Metadata   │  │ Engine       │          │
│  │  Plane)      │  │ Store        │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│              Encrypted Mesh (TLS 1.3)                           │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ INSTITUTIONAL │  │  CONSUMER     │  │  RENEWABLE    │
│ TIER          │  │  TIER         │  │  TIER          │
│               │  │               │  │               │
│ IITs, NITs,   │  │ Phones, PCs,  │  │ Solar GPU     │
│ Universities  │  │ Gaming Rigs   │  │ rigs (GJ/RJ)  │
│ (LAN + NKN)   │  │ (Broadband)   │  │ (Wired)       │
│               │  │               │  │               │
│ K3s Agent     │  │ K3s / WASM    │  │ K3s Agent     │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────┴───────┐
                    │ GOVERNMENT /  │
                    │ PSU TIER      │
                    │               │
                    │ PSU labs,     │
                    │ ministry DCs  │
                    │ (Sovereign    │
                    │  networks)    │
                    │               │
                    │ K3s Agent     │
                    └───────────────┘
```

---

## Core Components

### 1. Sovereign Orchestrator
**Location:** Indian cloud provider (E2E, CtrlS, Yotta, NIC)
**Role:** Central scheduling, workload routing, node registry, availability tracking

- **Scheduler:** Reads node availability windows 6 hours in advance. Routes work based on tier capability. Implements day/night solar arbitrage (FR-3.2).
- **Workload Router:** Request-parallel (default) vs. in-cluster model sharding vs. NKN cross-campus pipeline.
- **Churn Manager:** Handles consumer node disconnections. Enforces >=3x deterministic redundancy (NFR-3.1). Issues cordon-and-drain 30 minutes before scheduled exit (FR-2.3).
- **Rashtra Seva Trigger:** Cryptographically authenticated emergency mode (FR-4.1-4.3).

**Tech candidates:** Kubernetes control plane on Indian cloud. Custom scheduling operators. Go or Rust.

### 2. Sovereign Database & Metadata Store
**Location:** Indian cloud — Mumbai primary, Bengaluru/NCR DR
**Role:** Node registry, scheduling state, workload metadata, usage/payment ledgers. No cross-border replication (NFR-1.2).

### 3. UPI Billing Engine
**Location:** Co-located with Sovereign DB
**Role:** Micro-transaction clearing — metered usage to rupees to VPA payouts (FR-5.1-5.3). Institutional settlement: compute-grants, credits, revenue-share.

### 4. Node Agent (Edge)
Two form factors:
- **Desktop Agent (K3s/KubeEdge):** Windows, Linux, macOS. Background-installed, minimized Kubernetes node daemon (FR-1.1).
- **Mobile Agent (WASM):** Android/iOS. Lightweight WebAssembly execution sandbox (FR-1.2).

Key behaviors: confidential computing sandbox, calendar-based availability scheduling, graceful 30-min eviction, hardware integrity attestation.

### 5. Inference Serving Layer
Routes inference requests by model size and interconnect quality:

| Strategy | Model size | Where | Use case |
|----------|-----------|-------|----------|
| Request-Parallel (default) | 7B-34B quantized | Any single node | Millions of concurrent inferences |
| In-Cluster Sharding | 70B-400B+ | LAN-connected cluster only | Big models on campus labs |
| NKN Cross-Campus Pipeline | Largest models | Multiple campuses over NKN | Academic grid |
| Speculative Decoding | Any | Small edge drafts, cluster verifies | Reduce big-model load |

**Design principle:** Country-wide mesh for throughput (request-parallel). Model parallelism only on LAN/NKN clusters (FR-6.1-6.5).

---

## Tier Architecture

| Tier | Agent | Interconnect | Trust | Best For |
|------|-------|-------------|-------|----------|
| Institutional (IITs, NITs, universities) | K3s | LAN + NKN backbone | High | Model parallelism, HPC |
| Government / PSU | K3s | Sovereign wired | Highest | Emergency, sovereign workloads |
| Enterprise / MSME | K3s | Business broadband | Med-High | Off-hours batch inference |
| Renewable (solar GPU rigs) | K3s | Wired | Medium | Daytime solar-prioritized |
| Consumer (phones, PCs) | WASM / K3s | Consumer broadband | Zero-trust | Burst, request-parallel only |

---

## Data Flow

1. Provider installs agent -> registers hardware + sets availability window
2. Orchestrator ingests schedule -> predicts capacity 6h ahead
3. Client submits job -> Orchestrator routes by workload fit
4. Workload runs inside encrypted sandbox on edge node(s)
5. Results returned -> >=3x cross-verification by independent nodes
6. Usage metered -> rupees -> UPI payout / institutional credit

---

## Security Boundaries

See [docs/security/README.md](../security/README.md) for the full threat model.

1. **Node <-> Core:** TLS 1.3 + mTLS
2. **Workload Sandbox:** Encrypted container — host cannot inspect
3. **Core <-> Core:** Indian cloud VPC, never crosses borders
4. **Rashtra Seva Trigger:** Cryptographic multi-party authentication

---

## Open Architecture Decisions

| ID | Decision | Options |
|----|----------|---------|
| ADR-001 | Edge agent runtime | K3s vs KubeEdge |
| ADR-002 | Mobile sandbox runtime | Wasmtime vs WasmEdge vs WAMR |
| ADR-003 | Inference serving framework | vLLM vs TGI vs custom |
| ADR-004 | Confidential computing approach | AMD SEV vs Intel TDX vs software enclaves |
| ADR-005 | Mesh networking stack | WireGuard vs Nebula vs custom |
| ADR-006 | UPI payment integration | Direct NPCI vs payment aggregator |

Use the [ADR template](decisions/TEMPLATE.md) when proposing a decision.

---

## Getting Started by Skill Area

| Area | Skills | Start |
|------|--------|-------|
| Node Agent (Desktop) | Go/Rust/C++; K8s/K3s | FR-1.1, FR-2.1-2.3 |
| Node Agent (Mobile) | Kotlin/Swift; WASM | FR-1.2 |
| Orchestrator | Go/Rust; K8s operators; distributed scheduling | FR-2.2, FR-3.2 |
| Inference Serving | Python/Rust; vLLM/TGI; CUDA | FR-6.1-6.5 |
| UPI Billing | Go/Python; NPCI APIs; financial ledgers | FR-5.1-5.3 |
| Security / Confidential Compute | TEEs; TLS; threat modeling | NFR-2.1-2.2 |
| Mesh Networking | WireGuard, Nebula; NAT traversal | NFR-1.1-1.2 |
| Frontend / Web | HTML/CSS/JS; Firebase; a11y | Website PRD, Design Spec |

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the full setup guide.
