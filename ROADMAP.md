# DUM360 — Roadmap

> **Honest status:** DUM360 is at the **waitlist stage**. The landing page is live, the sign-up flow works, and the platform is being designed publicly. What follows is the phased plan from the [Platform PRD](docs/PRD.md#6-success-metrics--phases).

---

## Phase 1: Alpha — Campus Waitlist & First Nodes *(Current)*

**Goal:** Launch the alpha desktop agent across 1,000 student and developer machines in select Indian colleges.

| Status | Deliverable | Notes |
|--------|------------|-------|
| ✅ | Landing page (dum360.com) | Live on Firebase Hosting |
| ✅ | Contributor sign-up flow | Firestore + Google Auth, audience-segmented |
| ✅ | Contributor portal | View/edit/withdraw signup |
| ✅ | Legal page drafts | Privacy, Terms, Cookies — pending counsel review |
| ✅ | Platform PRD + Compute Benchmark | Published in `docs/` |
| ✅ | Design spec + Deploy runbook | Published in `docs/website/` |
| ⬜ | K3s-based desktop node agent | Windows/Linux/macOS installer; sandboxed, auto-draining |
| ⬜ | Central orchestration layer | Deploy on Indian cloud provider (provisioning + scheduling) |
| ⬜ | Identity/security verification | Hardware integrity check, Secure Enclave verification |
| ⬜ | Availability scheduling ("Pre-Informing") | Calendar booking + predictive 6-hour-ahead scheduling |
| ⬜ | First distributed workload | 100 concurrent nodes, no data loss — split rendering or ETL job |
| ⬜ | UPI micro-payout prototype | Metering → rupee → VPA |

**Exit criteria:** 100 concurrent nodes running a real workload without data loss.

---

## Phase 2: Beta — Partnerships & Commercial Inference *(Months 4–6)*

**Goal:** Partner with an Indian cloud provider; run commercial AI inference workloads at 50% less cost than hyperscalers (target).

| Status | Deliverable | Notes |
|--------|------------|-------|
| ⬜ | Indian cloud provider partnership | Orchestration layer on domestic infra (E2E, CtrlS, Yotta, NIC) |
| ⬜ | Solar-grid operator agreements | Attach compute nodes in Gujarat/Rajasthan |
| ⬜ | Graceful eviction / cordon-and-drain | 30-min warning, checkpoint upload, clean exit |
| ⬜ | Deterministic redundancy (≥3×) | Mirror tasks across independent machines |
| ⬜ | Confidential computing (encrypted sandbox) | Host cannot read RAM or job data |
| ⬜ | Day/Night cost routing (solar arbitrage) | Priority to solar nodes 10am–4pm IST |
| ⬜ | Tiered inference serving (request-parallel) | Models fitting a single node replicated; whole requests to whole nodes |
| ⬜ | Institutional settlement | Compute-grants/credits/revenue-share for universities/PSUs/enterprises |
| ⬜ | Cloud Function: BD notification on signup | Real-time alerts for university/govt/AI-client signups |
| ⬜ | CI/CD + PR preview channels | GitHub Actions auto-deploy |

**Exit criteria:** 50,000 active nodes; commercial inference workloads running; spam < 5%.

---

## Phase 3: National Scale & Mobile Launch *(Months 7–12)*

**Goal:** Launch mobile WebAssembly app; establish Rashtra Seva governance with national authorities; exceed 1M active nodes.

| Status | Deliverable | Notes |
|--------|------------|-------|
| ⬜ | Android + iOS WASM sandbox app | Google Play Store + App Store |
| ⬜ | Rashtra Seva governance framework | Cryptographic multi-party auth; governance with NDMA/MeitY |
| ⬜ | NKN-backed cross-campus parallelism | Pipeline big models across institutions over National Knowledge Network |
| ⬜ | Speculative decoding | Small models on edge devices draft tokens; cluster verifies |
| ⬜ | Coastal green compute R&D track | Seawater-cooled floating rigs (deployable today) + tidal/wave R&D |
| ⬜ | Provider/client authenticated dashboards | Earnings, usage, scheduling for providers; workload management for clients |
| ⬜ | Full UPI payouts | Metered usage → rupees → instant UPI for all provider tiers |
| ⬜ | Multilingual (Hindi + regional languages) | i18n architecture is ready in the codebase |

**Exit criteria:** >1M active nodes; Rashtra Seva protocol governed and testable; mobile app live.

---

## Key Principles (All Phases)

1. **100% Indian-hosted platform** — orchestration, metadata, and relay traffic never leave Indian soil
2. **DPDP-aligned** — data fiduciary obligations from day one
3. **Honesty as moat** — every claim stays consistent with [`docs/compute-benchmark.md`](docs/compute-benchmark.md)
4. **Zero-trust on consumer hardware** — all workloads sandboxed, ≥3× redundancy
5. **Device always reclaimable** — graceful eviction, 30-min drain, uninstall anytime

---

## How to Track Progress

- **GitHub Issues** — tagged by phase (`phase-1`, `phase-2`, `phase-3`)
- **GitHub Projects** — planned for milestone tracking
- This file is updated as phases complete

---

*Last updated: 27 June 2026*
