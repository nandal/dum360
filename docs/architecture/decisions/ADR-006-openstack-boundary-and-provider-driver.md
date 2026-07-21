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

  /**
   * Static description of what this provider may offer.
   *
   * `tiers` is an ALLOW-LIST, not an advertisement. See "Tier enforcement"
   * below — it is checked, and a driver must also enforce it itself.
   */
  capabilities(): DriverCapabilities;

  /**
   * Create machines that will self-register with Registry.
   *
   * MUST reject with TierNotPermittedError if req.tier is not in
   * capabilities().tiers — before creating any resource.
   * MUST embed the supplied registrationToken so the node registers through
   * the normal flow. MUST NOT write to registry.* directly.
   * Partial fulfilment is valid — return what was created.
   */
  provision(req: ProvisionRequest): Promise<ProvisionResult>;

  /**
   * Destroy previously provisioned machines.
   * 'drain' waits for the node's current task to finish; 'immediate' does not.
   *
   * MUST reject with NotSupportedError if capabilities().supportsOnDemand
   * is false — see "Drivers that cannot provision" below.
   */
  release(refs: ProviderNodeRef[], mode: 'drain' | 'immediate'): Promise<void>;

  /**
   * Report machines we provisioned that Registry no longer knows about.
   *
   * This is a REPORT, not a cleanup: it MUST NOT delete anything. The caller
   * owns disposal — see "Leak disposal" below. Leaked instances cost the
   * customer real money, so implementing this is required, not optional.
   *
   * Unlike provision/release, this returns [] rather than throwing when the
   * driver provisions nothing — "nothing leaked" is a truthful answer.
   */
  reconcile(owner: AccountId): Promise<ProviderNodeRef[]>;
}

export interface ProvisionRequest {
  owner: AccountId;
  /** Bound at registration (#15); the driver does not choose this. */
  tier: 'self-hosted' | 'community' | 'fully-self-hosted';
  /** Capability names the provisioned image must satisfy. */
  requires: string[];
  /**
   * One grant per requested machine — grants.length IS the requested count.
   * Each carries its own single-use token, so instances cannot share one.
   */
  grants: ProvisionGrant[];
  deadline: Date;
}

/** Minted per machine by the provisioning layer, before any resource exists. */
export interface ProvisionGrant {
  /** Non-secret correlation id. Survives; joins provider-side to Registry. */
  provisioningRef: string;
  /** Secret, single-use, minutes-scale expiry. Scrubbed after redemption. */
  registrationToken: string;
}

export interface ProvisionResult {
  provisioned: ProviderNodeRef[];
  /**
   * Per-grant failure detail. Names the refs so the caller can revoke their
   * unredeemed tokens and retry precisely, rather than guessing from a count.
   */
  failures: { reason: string; provisioningRefs: string[] }[];
}

/** Provider-side handle. Deliberately NOT a DUM360 nodeId — the node does not
 *  exist to us until it registers itself. See "Correlation" below. */
export interface ProviderNodeRef {
  kind: ProviderKind;
  externalId: string;      // e.g. OpenStack server UUID
  /** The grant this machine was built from — the join key to Registry. */
  provisioningRef: string;
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

### Correlation (bridging provisioning and registration)

An earlier draft said "correlation happens at registration" without specifying a mechanism —
a genuine gap. Without one, a `ProviderNodeRef` returned by `reconcile()` cannot be mapped to a
registered node, so the caller cannot drain before teardown, cannot avoid deleting a node
mid-task, and cannot detect double-disposal.

The join key is the **`provisioningRef`**, not the `externalId`. The ordering forces this: the
provider assigns `externalId` only *after* the create call, but the machine's user-data must be
written *at* create time — so the identifier that both sides can agree on has to be minted by us,
beforehand.

```
provisioning layer mints grant  ──►  { provisioningRef, registrationToken }
         │                                        │
         │ passes grant to driver                 │ injected into user-data
         ▼                                        ▼
driver creates instance                   machine boots, agent reads grant
returns ProviderNodeRef{externalId,               │
        provisioningRef}                          │ POST /register
         │                                        ▼
         │                            Registry: validate + consume token,
         │                            persist provisioningRef on node row
         └────────────── join on provisioningRef ─┘
```

Requirements:

- `provisioningRef` is a **non-secret** UUID, distinct from `registrationToken`. The token is a
  secret that is consumed and scrubbed; it must never be used as a database join key.
- Registry persists `provisioningRef` on the node row at registration (nullable — manually
  registered nodes have none).
- A `ProviderNodeRef` whose `provisioningRef` matches no node row is what "leaked" means, and is
  exactly what `reconcile()` reports.
- Disposal resolves `provisioningRef → node` first, so a node with a running task can be drained
  rather than destroyed under load.

### Drivers that cannot provision

`ManualDriver` represents nodes a human installed; DUM360 cannot conjure or destroy a
volunteer's laptop. Expressing that as silently-successful no-ops would be a trap: a caller that
forgot to check `supportsOnDemand` would get an empty-but-successful `ProvisionResult` and
conclude capacity was requested when nothing happened — a silent failure whose consequence is
"work never executes."

Following the same principle as tier enforcement — *the flag informs, the throw enforces*:

- `provision()` and `release()` MUST throw `NotSupportedError` when
  `capabilities().supportsOnDemand` is false.
- `reconcile()` is the deliberate exception: it MUST return `[]`. A driver that provisions
  nothing leaks nothing, so an empty result is truthful, and the `provider:reconcile` sweep can
  iterate every driver uniformly instead of special-casing by capability. (This is the one place
  where the review's "throw on all three" recommendation is not followed, and the asymmetry is
  intentional: an empty `provision()` result is a lie, an empty `reconcile()` result is a fact.)

### Tier enforcement (hard guard, not convention)

An earlier draft of this ADR stated only that `OpenStackDriver` "must never be configured for
the community tier". A convention in prose is not an enforcement mechanism, so the guard is
specified here at two layers.

**What actually goes wrong.** The `community` tier means *other people's* public/OSS work runs
on that node. If a customer's own OpenStack tenancy were registered as `community`, DUM360 would
schedule untrusted third-party tasks onto that customer's private infrastructure — they would
bear the compute cost and the blast radius of workloads they never agreed to run. (Note this is
the inverse of the more obvious fear: the ADR-005 routing invariant already prevents *private*
work reaching community nodes. The risk introduced by provisioning is the other direction.)

1. **Provisioning layer (caller):** MUST verify `req.tier ∈ driver.capabilities().tiers` before
   calling `provision()`, and fail closed if not.
2. **Driver (callee):** MUST re-check and throw `TierNotPermittedError` before creating any
   resource. `OpenStackDriver` additionally rejects a `community` tier at **construction**, so a
   bad configuration fails at startup rather than at first provision.

Defence in depth is warranted because these are different failure modes — a caller bug versus a
deployment misconfiguration. Neither layer may be treated as the other's backstop.

### Leak disposal (who deletes what)

`reconcile()` reports; it does not delete. Disposal is the caller's obligation, and it is explicit:

- The caller **MUST** pass everything `reconcile()` returns to `release(refs, 'immediate')`.
  A reported-but-undisposed instance is a billing leak on the customer's account.
- This runs as a **repeatable BullMQ job (`provider:reconcile`)**, following the existing
  `liveness:sweep` pattern in Registry rather than inventing a second scheduling mechanism.
- Disposal is deliberately **not** folded into `reconcile()` itself: a delete-on-detect
  implementation that mis-detects destroys live customer machines, and separating report from
  action keeps the destructive step logged, attributable, and independently testable.
- Reconciliation results (found / disposed / failed) must be logged, since silent success here is
  indistinguishable from a driver that never ran.

### Registration token handling

The `OpenStackDriver` sketch injects `registrationToken` via cloud-init user-data, which on a
typical OpenStack deployment is readable by **any process on the instance** through the metadata
service at `169.254.169.254`. Given ADR-005's premise about node operators, this deserves
explicit treatment rather than being left implicit.

The precise threat is narrower than it first appears, and worth stating accurately: on a
`self-hosted` node the operator *is* the account owner, so the operator reading their own token
grants them nothing they do not already have. The real exposures are (a) an unprivileged or
compromised process on the instance escalating to a **rogue node registration** against the
owner's account, and (b) a token that outlives the boot it was minted for.

Requirements:

- **One token per machine** — tokens are minted per `ProvisionGrant`, never shared across a
  batch. A shared token is not single-use by construction, and one compromised instance would
  otherwise taint its whole cohort.
- **Single-use and short-lived** — Registry MUST reject reuse and MUST expire the token on the
  order of minutes, not hours. A token valid only until first successful registration bounds the
  window regardless of who reads it.
- **Unredeemed grants revoked** — tokens for machines that failed to provision (reported in
  `ProvisionResult.failures`) MUST be revoked immediately rather than left to expire, since they
  are valid credentials for a node that will never exist.
- **Scoped** — the token binds `ownerAccountId` and `tier` at mint time ([#15](https://github.com/nandal/dum360/issues/15)), so a stolen token
  cannot be redeemed for a node in a different account or a different tier.
- **Scrubbed after use** — the node agent removes the token from cloud-init/user-data once
  consumed, so it does not persist in instance metadata for the machine's lifetime.
- **Transport** — delivered and redeemed over HTTPS only.
- **Post-MVP:** consider delivering the token out of band (short-lived pre-signed URL, or mTLS
  client credentials baked into a customer-specific image) instead of user-data. Recorded here so
  the metadata-service exposure is a known, accepted MVP trade-off rather than an oversight.

### Planned implementations

| Driver | Tier(s) | Notes |
|---|---|---|
| `ManualDriver` | community, self-hosted | The status quo, expressed as a driver: `supportsOnDemand: false`; `provision()`/`release()` throw `NotSupportedError`, `reconcile()` returns `[]`. Existing behaviour is unchanged. |
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

#### Prerequisite: customer cloud credential handling (merge gate)

Holding a customer's Keystone application credential is a **new class of secret for DUM360**.
ADR-005 analysed secrets travelling *to* nodes; this is a long-lived secret held *by the server*
that grants the ability to create billable infrastructure in someone else's cloud. It is a
high-value target and enables lateral movement into customer infrastructure if leaked.

This ADR does not solve that, and `OpenStackDriver` **must not merge before it is solved**. The
design must be recorded (ADR or security spec) and must cover, at minimum:

- **Encryption at rest** — envelope encryption under a KMS; never plaintext in PostgreSQL or env
- **Least privilege** — the credential is scoped to a single project, with only the roles needed
  to create and delete instances; broad or admin-scoped credentials are rejected at onboarding
- **Rotation and revocation** — routine rotation, plus a customer-facing revoke path that is
  effective immediately
- **Audit logging** — every access to the credential is attributable to a task or operator

Keystone application credentials are the right primitive precisely because they are scoped,
independently revocable, and not the user's password — but that is a starting condition, not a
substitute for the controls above.

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
  money**. `reconcile()` plus the `provider:reconcile` disposal job are mandatory for this reason
  and must be exercised in tests — including the mis-detection case, since disposal deletes real
  customer machines.
- The interface is designed against `ManualDriver` (trivial) and `OpenStackDriver`
  (hypothetical). Expect at least one breaking revision once the latter is real.
- Holding customer cloud credentials is a new and meaningful security responsibility, adjacent
  to but distinct from the ADR-005 credential analysis. It is now a **merge gate** on
  `OpenStackDriver` rather than a deferred note — which means that driver cannot be built
  incrementally without the credential design landing first.
- The MVP accepts a known weakness: the registration token is exposed to any process on the
  provisioned instance via the metadata service. It is bounded by single-use, short expiry and
  owner/tier scoping rather than eliminated.

### Neutral / Requires Attention

- **Depends on [#15](https://github.com/nandal/dum360/issues/15) (node ownership).** `ProvisionRequest.owner` and `.tier` are
  meaningless until nodes are bound to an account and tier at registration. `OpenStackDriver`
  should not start before that lands; `ManualDriver` and the interface itself can.
- **`DriverCapabilities` must not become a dumping ground.** Each field has to change a real
  decision; descriptive-only fields belong in documentation.
- **`TierNotPermittedError`, `NotSupportedError` and `provider:reconcile` are load-bearing
  names.** All are specified above as normative; implementers should not quietly substitute a
  soft warning for the errors or an ad-hoc cron for the sweep.
- **`provisioningRef` requires a Registry schema change** — a nullable column on `registry.nodes`
  plus acceptance of the field in the registration payload. Small, but it is the one place this
  ADR touches an existing service, and it should land with the interface rather than with
  `OpenStackDriver`.
- **Interface Segregation is knowingly traded off.** `ManualDriver` implements three methods it
  cannot honour, two of which throw. At three drivers this is acceptable; if the roster grows
  past ~5, split provisioning out of `ProviderDriver` rather than accumulating throwers.
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
