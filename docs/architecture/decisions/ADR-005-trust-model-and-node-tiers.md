# ADR-005: Trust Model & Node Tiers

**Status:** Proposed
**Date:** 2026-06-28
**Deciders:** System Architect, CEO
**Relates to:** [#13](https://github.com/nandal/dum360/issues/13) (secrets lifecycle), [#15](https://github.com/nandal/dum360/issues/15) (node ownership), [#16](https://github.com/nandal/dum360/issues/16) (sensitivity-aware scheduling), [#17](https://github.com/nandal/dum360/issues/17) (creds-local mode), [ADR-004](ADR-004-docker-executor.md)

---

## Context

DUM360 executes privileged work (clone repos, run AI, push code, open PRs) on **nodes DUM360 does not control**. Two high-value secrets cross the network into the execution environment:

1. **GitHub access token** — repository write access.
2. **AI provider API key** — account-grade (billing + data).

A node operator with **root** can read any secret that reaches their machine in usable form (process memory, `/proc`, container filesystem, `docker inspect`, network MITM of the container's TLS). On commodity hardware you **cannot** cryptographically hide a running secret from the host owner. Therefore trust must be **structured by where work runs**, not assumed away by encryption (see [#13](https://github.com/nandal/dum360/issues/13) for the secret-lifecycle detail).

At the same time, a **distributed network of community contribution compute is genuinely valuable** — large open-source projects need lots of compute (large test matrices, refactors across many repos, batch agentic work). The mesh is a real asset in its own right, not just an on-ramp: *if something big is built as an open project, the community tier is where it scales.*

## Decision

Adopt **three node tiers, matched to data sensitivity.** A task's sensitivity determines its eligible node pool — this is the core routing invariant.

| Tier | Node owner | Repos | Credentials & agents | Trust basis |
|------|-----------|-------|----------------------|-------------|
| **Self-hosted** | the customer | public **and private** | customer's own GitHub creds, AI key, and **agent images** ("their agentic team") | self — operator *is* the owner, so there is no theft problem |
| **Community** | third parties (untrusted) | **OSS / public only** | DUM360-brokered AI (shared key never on node), anonymous clone, fork + server-side PR; per-task scope/quota/revoke | brokered + bounded blast radius |
| **Fully self-hosted** | the customer (server *and* nodes) | anything | everything local | zero trust in DUM360 — enabled by the project being open source |

**Routing invariant:** private / self-hosted tasks are scheduled **only** onto the owning account's nodes and **never** onto community nodes. Public/OSS tasks may use community nodes.

### Why self-hosted solves private repos
On a customer's own node the host operator *is* the owner of the repos, tokens, and AI keys — so the "untrusted operator steals secrets" threat evaporates. The customer gets full freedom: private repos, their own GitHub App/token, their own AI key and spend, and their **own agentic team** (their choice of agents, models, and tooling). The [Docker executor (ADR-004)](ADR-004-docker-executor.md) is already the vehicle: a self-contained agent image on a self-hosted node = the customer's agents running with the customer's creds, entirely on their hardware. **No new execution machinery is required** — only ownership and routing.

### Why the community tier stays valuable
Public/OSS work has no confidentiality requirement (the code is already public), so it can safely run on untrusted nodes with brokered credentials. This is exactly where a large, distributed, open contribution network pays off — community compute powering big open-source initiatives.

## Requirements this imposes

Tracked as issues; the execution layer (ADR-004) is done — the gaps are ownership and routing:

- **Node ownership / multi-tenancy** — nodes bound to an account + tier at registration ([#15](https://github.com/nandal/dum360/issues/15)).
- **Sensitivity-aware scheduling** — scheduler filters candidate nodes by `(owner, tier)` plus capability; hard cross-tenant isolation; OSS-only gate for community ([#16](https://github.com/nandal/dum360/issues/16)).
- **Creds-local mode** — for self-hosted tasks the server never receives the token/AI key; the node uses local creds. Community tier keeps brokered creds (AI gateway, per-task GitHub tokens — [#13](https://github.com/nandal/dum360/issues/13)) ([#17](https://github.com/nandal/dum360/issues/17)).

## Consequences

**Positive**
- Honest, strong security story: *"your code, your keys, your agents never leave your infrastructure — DUM360 orchestrates, it doesn't hold your secrets."*
- Private repos are supported safely **without** needing to defeat a root host operator.
- The community mesh remains a first-class, valuable distributed-compute network for open projects.
- Reuses the existing Docker executor / capability / scheduler foundation.

**Trade-offs**
- More orchestration complexity: multi-tenancy, per-account node pools, two credential paths.
- In SaaS mode the DUM360 **server** still sees task *metadata* (repo names, instructions) even when it never sees creds. Customers who won't tolerate that use the **fully self-hosted** tier.
- Operator abuse on community nodes is reduced to bounded, quota-capped, revocable, attributable use (never durable secret theft) — the realistic ceiling on hardware you don't own.

## Out of scope / future

- **Confidential computing (TEE + remote attestation)** — AMD SEV-SNP / Intel TDX / Nitro Enclaves — the only way to run **private** work on **untrusted** hardware with secrets hidden from root. Post-MVP; the genuine "use but can't read" enforced by silicon.
- GitHub App installation-token minting and the AI gateway proxy live in [#13](https://github.com/nandal/dum360/issues/13).
