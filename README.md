# DUM360 — Distributed Unified Mesh 360

> **An Initiative by [BALAJI IT Solutions](https://balaji.it)**

**India's citizen-powered sovereign inference engine.**

DUM360 pools India's already-paid-for idle compute — phones, gaming PCs, university & PSU labs, MSME machines, and solar GPU rigs — into the country's largest sovereign AI-inference engine. Built for inference and parallel workloads, not frontier training. Earn via UPI. Indian-hosted platform, DPDP-aligned.

> **Current stage: Waitlist + Landing Page.** The platform (node agent, orchestrator, inference engine) is in design. This repo is where it's being built — publicly, from the ground up.

---

## What's Here

| Directory/File | What it is |
|---|---|
| `index.html` | Landing page at [dum360.com](https://dum360.com) — the public front door |
| `portal.html` | Authenticated contributor portal (view/manage your signup) |
| `privacy.html`, `terms.html`, `cookies.html` | Legal pages |
| `firebase-config.js` | Firebase SDK bridge — signup writes to Firestore, Google Auth |
| `firestore.rules` | Firestore security rules (PII-protected, one-entry-per-account) |
| `firebase.json` | Firebase Hosting config + security headers |
| `scripts/setup-firebase.sh` | Automated Firebase project setup |
| `docs/PRD.md` | **Product Requirements Document** — the full platform spec |
| `docs/compute-benchmark.md` | **Honest benchmark** — where DUM360 would stand in global compute |
| `docs/partnership-note.md` | University partner outreach template |
| `docs/website/PRD.md` | Website PRD — content, data model, rollout phases |
| `docs/website/DESIGN_SPEC.md` | Design & UX specification |
| `docs/website/DEPLOY.md` | Deploy runbook (Firebase Hosting + Firestore) |
| `docs/website/legal/` | Legal copy source-of-truth (Privacy, Terms, Cookies) |

---

## What We're Building

DUM360 treats **every powered-on, under-utilized processor in India as latent national infrastructure.** Rather than building new data centres, it harvests capacity that already exists:

| Source | Typical idle window | Why it matters |
|---|---|---|
| Consumer phones & PCs | Nights / off-hours | Largest device count; burst throughput |
| University & research labs (IIT/NIT/IIIT) | Evenings, weekends, vacations | LAN-clustered + NKN-linked → real parallelism |
| Government & PSU labs | Off-hours, spare capacity | High trust, sovereign by default |
| Enterprise / MSME / startup machines | Outside business hours | Wired, powered, predictable |
| Solar GPU rigs (Gujarat / Rajasthan) | Daytime surplus generation | Cheapest, greenest cycles |

**Dual-use mandate:** Commercial peace-time mode (affordable AI inference for Indian startups) + **Rashtra Seva** emergency mode (national strategic compute reserve for disaster response).

For the full vision, architecture, and functional requirements, read [`docs/PRD.md`](docs/PRD.md).

---

## Honest Scale (Not Hype)

We don't claim to beat hyperscalers. Read the full analysis in [`docs/compute-benchmark.md`](docs/compute-benchmark.md). The honest bottom line:

> DUM360 could plausibly deliver **a few exaFLOP/s of usable AI-inference throughput — 1–2 orders of magnitude beyond India's entire current public supercomputing capacity — without building a single new data centre.** It is built for **inference and parallel workloads, not frontier model training**, which consumer networks physically cannot support.

---

## Current Status — Phase 1 (Waitlist)

- [x] Landing page live at [dum360.com](https://dum360.com)
- [x] Contributor sign-up flow (Firebase Firestore + Google Auth)
- [x] Contributor portal (view/edit/withdraw your signup)
- [x] Legal page drafts (pending counsel review)
- [ ] Alpha desktop app — K3s-based node agent for 1,000 student/dev machines
- [ ] Central orchestration layer on Indian cloud provider
- [ ] First distributed workload (100 concurrent nodes, no data loss)

See [`ROADMAP.md`](ROADMAP.md) for the full phased plan.

---

## Contributing

We need builders across the stack — distributed systems, WASM/K3s edge agents, secure enclaves, UPI integration, and more. This is an early-stage project, which means early contributors shape the architecture.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to get started.

---

## Quick Links

- **Live site:** [dum360.com](https://dum360.com)
- **Sign up:** [dum360.com/#join](https://dum360.com/#join)
- **Honest benchmark:** [`docs/compute-benchmark.md`](docs/compute-benchmark.md)
- **Platform PRD:** [`docs/PRD.md`](docs/PRD.md)

---

## License

MIT — see [`LICENSE`](LICENSE).

---

*Made in India 🇮🇳*
