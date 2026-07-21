# ADR-006: OpenStack Boundary & the ProviderDriver Interface

**Status:** Proposed
**Date:** 2026-07-21
**Deciders:** Sandeep Nandal
**Relates to:** [ADR-001](ADR-001-technology-stack.md) (stack), [ADR-005](ADR-005-trust-model-and-node-tiers.md) (trust model & node tiers), [#15](https://github.com/nandal/dum360/issues/15) (node ownership), [#16](https://github.com/nandal/dum360/issues/16) (sensitivity-aware scheduling)

---

## Context

DUM360 orchestrates AI task execution across nodes it does not own. The Registry service handles
node lifecycle (registration, capability catalog, attestation, heartbeat, liveness), and the
Orchestration service schedules tasks onto nodes by capability match plus utilization sort.
All of this is being written from scratch in NestJS/TypeScript ([ADR-001](ADR-001-technology-stack.md)).

A reasonable question follows — raised by contributors, and likely to be raised by any
institution or cloud provider we approach:

> Why build this orchestration layer from scratch instead of adopting **OpenStack**, or building
> DUM360 as an OpenStack service alongside Nova (compute) and Cinder (block)?

OpenStack is a mature, widely deployed open-source cloud platform, and many of the institutions
we would want as capacity partners already run it. The question deserves a recorded answer
rather than an ad-hoc one each time it is asked.

There is a real opportunity buried in it, too — which is why this ADR both rejects the framing
and adopts a narrower version of it.

### Where the two systems genuinely rhyme

The question is not naive. OpenStack has services that map loosely onto DUM360 concerns:

| DUM360 concern | Nearest OpenStack service |
|---|---|
| Node registry, capability matching | **Placement** (resource providers, traits, aggregates) |
| Node provisioning | **Nova** (VMs), **Zun** (containers), **Ironic** (bare metal) |
| Identity, multi-tenancy | **Keystone** (projects, application credentials) |
| GPU / accelerator inventory | **Cyborg** |
| Usage metering | **Ceilometer / Gnocchi → CloudKitty** |

### Where they structurally diverge

OpenStack's founding assumption is a data centre: hardware the operator owns and trusts, stable
nodes, networking under operator control. Four mismatches make it unusable as DUM360's
foundation — and they are structural, not cosmetic.

**1. Trust is inverted — and this is our core thesis.**
[ADR-005](ADR-005-trust-model-and-node-tiers.md) is built on the premise that *a node operator
with root can read any secret that reaches their machine*, and it structures the entire product
around that fact (tiers, routing invariant, brokered credentials, creds-local mode). OpenStack
trusts the compute host and constrains the tenant — precisely backwards. Nothing upstream bounds
a malicious host operator, validates that a node executed a task honestly, or expresses
"this task may only run on nodes owned by this account". That logic is our differentiated
value and has no upstream home.

**2. The node↔core transport cannot be OpenStack's.**
OpenStack services coordinate compute agents over a trusted internal message bus
(`oslo.messaging` / RabbitMQ) inside an operator-controlled network. DUM360 nodes are elsewhere
by definition — behind NAT, on customer infrastructure, on community volunteers' machines — and
reach us by polling `GET /tasks/next` outbound over HTTPS with a node JWT. Community-tier nodes
can never be on our message bus. Adopting OpenStack would mean discarding its integration
mechanism as step one, which removes most of the reason to adopt it.

**3. The unit of work and the unit of matching are both different.**
Orchestration schedules *tasks* ("run an agent against this repo") against *qualitative
capabilities* ("has this toolchain; can push to GitHub"), recorded in the `capabilities` /
`node_capabilities` catalog ([ADR-002](ADR-002-database-schemas.md)). Nova and Placement schedule
*instances* against *quantitative inventory* — vCPU, RAM, disk, backed by flavors and allocation
accounting. Placement's traits can express booleans, but the whole model is built for
consumable resource amounts, not agent capability attestation. We would be fighting it
continuously.

**4. Language and governance.**
The stack is TypeScript/NestJS ([ADR-001](ADR-001-technology-stack.md)); OpenStack services are
Python + `oslo.*` in practice. Beyond that, becoming an OpenStack project means Foundation
governance and a release cadence tied to OpenStack's — a heavy commitment for a pre-MVP project
whose most valuable logic (tiered trust, sensitivity routing, credential brokering) is exactly
the part that would be hardest to land upstream.

### The opportunity that survives

One thing in the question is right. [ADR-005](ADR-005-trust-model-and-node-tiers.md)'s
**self-hosted tier** solves private-repo work by having the customer own the node — "the operator
*is* the owner, so there is no theft problem." Today that requires a human to install the agent
on each machine. But a customer or university that already runs OpenStack could instead hand us
a scoped tenancy and let DUM360 **provision worker nodes inside their own cloud** on demand.

That is the same trust story with dramatically less friction: a single credential exchange
instead of a per-machine IT procurement conversation. It is worth building — as a driver, not as
a foundation.

---

## Decision

Three decisions, drawing the boundary explicitly.

### 1. Rejected — DUM360 as, or on, OpenStack

DUM360 will not be implemented as an OpenStack project, and will not adopt OpenStack as its
orchestration foundation. The four reasons above are the record. This should not be
re-litigated without new evidence that materially changes one of them.

### 2. Accepted — a `ProviderDriver` interface, with OpenStack as one implementation

Introduce a **capacity provisioning layer** that sits *in front of* the Registry: drivers create
and destroy machines, and those machines then register through the **existing, unmodified**
Registry flow.

This is deliberately narrow. The driver's job ends the moment a node registers.

```
                    ┌──────────────────────────────────────┐
                    │        Orchestration :8082           │
                    │  scheduler — unchanged, sees only    │
                    │  registered nodes + capabilities     │
                    └──────────────────┬───────────────────┘
                                       │ "need capacity for
                                       │  account X, tier self-hosted"
                                       ▼
                    ┌──────────────────────────────────────┐
                    │       ProviderDriver (new)           │
                    │  provision / release / reconcile     │
                    └──────────────────┬───────────────────┘
                                       │ creates machine +
                                       │ hands it a registration token
                                       ▼
     machine boots, runs agent ──POST /register──►  Registry :8081
                                    (existing flow, untouched)
```

**Invariants this preserves — none of these may be bypassed by a driver:**

- Nodes still register through Registry and receive their JWT there. No driver mints node
  identity or writes `registry.*` tables directly.
- Drivers never see task payloads, GitHub tokens, or AI keys. The
  [ADR-005](ADR-005-trust-model-and-node-tiers.md) credential paths are untouched.
- `ownerAccountId` and `tier` are driver *configuration*, bound at registration ([#15](https://github.com/nandal/dum360/issues/15)),
  and the scheduler's sensitivity routing ([#16](https://github.com/nandal/dum360/issues/16)) continues to be the sole
  authority on what may run where.

### 3. Deferred — OpenStack-compatible client API façade

Presenting a Nova-like API *to clients submitting work* (so existing `openstacksdk` / Terraform
tooling could drive DUM360) is deferred. It is gated on demonstrated demand, not built
speculatively.

### Ideas borrowed, dependencies not taken

We will read these for design, not depend on them: **Placement's** resource-provider and trait
model (informs capability catalog evolution), **Keystone's** application-credential pattern
(scoped, revocable, non-personal credentials — directly applicable to how we hold customer cloud
access), and **CloudKitty's** rating pipeline (if usage-based billing lands).

---

## The `ProviderDriver` Interface

Illustrative TypeScript, consistent with [ADR-001](ADR-001-technology-stack.md). The intent is
normative; the exact signatures will move.

**Division of responsibility.** A driver answers *"how do I make a node exist for this account,
and how do I take it away?"* — nothing more. Scheduling, capability matching, tier routing,
credential brokering, and task lifecycle all remain in Orchestration and Registry and are
**never** delegated to a driver.

```ts
export type ProviderKind =
  | 'manual'      // status quo: a human installs the agent; it self-registers
  | 'openstack'   // customer / university OpenStack tenancy
  | 'kubernetes'  // customer cluster
  | 'cloud-vm';   // generic IaaS (post-MVP)

export interface ProviderDriver {
  readonly kind: ProviderKind;

  /** Static description of what this provider can offer. */
  capabilities(): DriverCapabilities;

  /**
   * Create machines that will self-register with Registry.
   *
   * MUST embed the supplied registrationToken so the node registers through
   * the normal flow. MUST NOT write to registry.* directly.
   * Partial fulfilment is valid — return what was created.
   */
  provision(req: ProvisionRequest): Promise<ProvisionResult>;

  /**
   * Destroy previously provisioned machines.
   * 'drain' waits for the node's current task to finish; 'immediate' does not.
   */
  release(refs: ProviderNodeRef[], mode: 'drain' | 'immediate'): Promise<void>;

  /**
   * Reconcile provider-side reality against our records, returning machines we
   * provisioned that Registry no longer knows about. Leaked VMs cost the
   * customer real money, so this is required, not optional.
   */
  reconcile(owner: AccountId): Promise<ProviderNodeRef[]>;
}

export interface ProvisionRequest {
  owner: AccountId;
  /** Bound at registration (#15); the driver does not choose this. */
  tier: 'self-hosted' | 'community' | 'fully-self-hosted';
  count: number;
  /** Capability names the provisioned image must satisfy. */
  requires: string[];
  /** Single-use, short-lived; the machine registers with this. */
  registrationToken: string;
  deadline: Date;
}

export interface ProvisionResult {
  provisioned: ProviderNodeRef[];
  /** Non-fatal partial-failure detail, for operator visibility. */
  failures: { reason: string; count: number }[];
}

/** Provider-side handle. Deliberately NOT a DUM360 nodeId — the node does not
 *  exist to us until it registers itself. Correlation happens at registration. */
export interface ProviderNodeRef {
  kind: ProviderKind;
  externalId: string;      // e.g. OpenStack server UUID
  provisionedAt: Date;
}

export interface DriverCapabilities {
  /** Which tiers this provider may supply. OpenStack tenancies are customer-owned,
   *  so they serve self-hosted — never community. */
  tiers: Array<'self-hosted' | 'community' | 'fully-self-hosted'>;
  /** False for 'manual': we cannot conjure a volunteer's laptop on demand. */
  supportsOnDemand: boolean;
  /** Whether release('drain') is honoured, or teardown is always abrupt. */
  supportsDrain: boolean;
  maxConcurrent?: number;
}
```

### Planned implementations

| Driver | Tier(s) | Notes |
|---|---|---|
| `ManualDriver` | community, self-hosted | The status quo, expressed as a driver: `supportsOnDemand: false`, `provision()` is a no-op. Existing behaviour is unchanged. |
| `OpenStackDriver` | self-hosted, fully-self-hosted | Keystone application credential scoped to a project; Nova or Zun to create workers; teardown on drain. |
| `KubernetesDriver` | self-hosted | Customers with an existing cluster. |

### `OpenStackDriver` scope

Deliberately thin, and it does not require DUM360 to operate any OpenStack service. It
authenticates with a **Keystone application credential** (scoped, revocable, not a personal
password), creates worker instances from an image containing the node agent, injects the
registration token via user-data, and deletes them on release. `reconcile()` lists instances
carrying our metadata tag and reports those Registry has lost track of.

Because the tenancy belongs to the customer, provisioned nodes are `self-hosted` tier — the
operator *is* the owner, so [ADR-005](ADR-005-trust-model-and-node-tiers.md)'s secret-theft
problem does not arise and private repositories are in scope.

---

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Adopt OpenStack as the orchestration foundation** | Mature, large ecosystem; credibility with institutional partners | Solves none of the hard problems (inverted trust, tiered routing, credential brokering, capability-based task matching); forces Python against ADR-001; adds a large control plane to operate while all differentiated logic still has to be written | **Rejected** |
| **B. Build DUM360 as an OpenStack service** | Ecosystem tooling, Keystone, Horizon, contributor pool | Must bypass `oslo.messaging` — the integration point — for NAT-traversing nodes; inverted trust model has no upstream home; ADR-005 tiering is unlikely to land upstream; Foundation governance and release cadence are heavy for a pre-MVP project | **Rejected** |
| **C. Standalone core + `ProviderDriver`, OpenStack as one driver (chosen)** | Keeps stack, transport, scheduler and cadence; captures the low-friction institutional onboarding path; seam generalises to Kubernetes and cloud VMs; Registry/Orchestration untouched | New interface designed against one real implementation; we own the whole core; adds a provisioning surface with real cost/leak consequences | **Chosen** |
| **D. Ignore OpenStack entirely** | Simplest near-term; zero new surface | Forfeits the cheapest self-hosted onboarding path; leaves a recurring partner/contributor question unanswered | **Rejected** |

---

## Consequences

### Positive

- "Why not OpenStack?" has a durable, citable answer for contributors and partners.
- Self-hosted onboarding gains a path that does not require touching individual machines —
  a scoped tenancy instead of per-machine installation.
- The seam generalises: Kubernetes and cloud-VM ingest become incremental work rather than
  architectural change.
- Registry, Orchestration, and the ADR-005 credential paths are untouched — this is additive.
- Expressing the status quo as `ManualDriver` means the interface is validated against a real
  implementation from day one rather than designed purely speculatively.

### Negative

- We own the entire orchestration core, including the parts OpenStack would have supplied.
- Provisioning introduces a genuinely new failure class: **leaked instances cost the customer
  money**. `reconcile()` is mandatory for this reason and must be exercised in tests, not just
  implemented.
- The interface is designed against `ManualDriver` (trivial) and `OpenStackDriver`
  (hypothetical). Expect at least one breaking revision once the latter is real.
- Holding customer cloud credentials is a new and meaningful security responsibility, adjacent
  to but distinct from the ADR-005 credential analysis. It needs its own review.

### Neutral / Requires Attention

- **Depends on [#15](https://github.com/nandal/dum360/issues/15) (node ownership).** `ProvisionRequest.owner` and `.tier` are
  meaningless until nodes are bound to an account and tier at registration. `OpenStackDriver`
  should not start before that lands; `ManualDriver` and the interface itself can.
- **`OpenStackDriver` must never be configured to supply the community tier.** A customer's
  tenancy is theirs; classifying it as community would place OSS-only work on private
  infrastructure and invert the ADR-005 routing invariant. This deserves a guard, not just a
  convention.
- **`DriverCapabilities` must not become a dumping ground.** Each field has to change a real
  decision; descriptive-only fields belong in documentation.
- **ADR numbering has drifted.** The "Open Architecture Decisions" table in
  [the architecture overview](../README.md) pre-assigned ADR-004 to "monorepo tooling" and
  ADR-005 to "service-to-service auth", but the written ADR-004 and ADR-005 took those numbers
  for other topics. This ADR takes 006, continuing that pattern. The accompanying README change
  stops pre-assigning IDs to unwritten ADRs so the drift does not recur.
- The OpenStack characterisations here reflect understanding as of the date above and were not
  freshly verified against upstream documentation. They should be re-checked before this
  reasoning is reused in partner-facing material.

---

## References

- [ADR-001 — Technology stack](ADR-001-technology-stack.md)
- [ADR-002 — Database schemas](ADR-002-database-schemas.md) (capability catalog)
- [ADR-005 — Trust model & node tiers](ADR-005-trust-model-and-node-tiers.md)
- [Architecture Overview](../README.md)
- Issues: [#15](https://github.com/nandal/dum360/issues/15) (node ownership), [#16](https://github.com/nandal/dum360/issues/16) (sensitivity-aware scheduling)
- OpenStack: [Placement](https://docs.openstack.org/placement/), [Keystone application credentials](https://docs.openstack.org/keystone/latest/user/application_credentials.html), [Nova](https://docs.openstack.org/nova/), [Zun](https://docs.openstack.org/zun/), [CloudKitty](https://docs.openstack.org/cloudkitty/)
