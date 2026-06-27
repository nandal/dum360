# Contributing to DUM360

Thanks for wanting to build India's sovereign compute mesh. This document tells you how.

---

## Before You Start

1. **Read the [`README`](README.md)** for what DUM360 is and what stage we're at.
2. **Read [`docs/PRD.md`](docs/PRD.md)** for the full platform vision and functional requirements.
3. **Read [`docs/compute-benchmark.md`](docs/compute-benchmark.md)** — it defines the honest claims. Every piece of code, copy, and marketing must stay consistent with it.
4. **Read the [website design spec](docs/website/DESIGN_SPEC.md)** if you're working on the frontend.

---

## What We Need Right Now

DUM360 is at **Phase 1 (Waitlist + Landing Page)**. The platform itself — node agent, orchestrator, inference engine, mobile app — doesn't exist yet. Here's what contributors can work on today:

### Frontend / Web

- Improve the landing page (performance, a11y audits, Core Web Vitals)
- Add multilingual support (Hindi, Tamil, Telugu, etc.) — the code is i18n-ready
- Dark mode (design tokens are structured for it; see design spec §2.8)
- Cookie consent banner implementation
- GA4 analytics integration with consent
- Benchmark / honesty page (render `docs/compute-benchmark.md` as a public page)

### Platform Prototyping (Greenfield)

- **Node agent spec & prototype:** Lightweight K3s/KubeEdge-based agent for Windows/Linux/macOS
- **WASM mobile sandbox:** WebAssembly-based execution sandbox for Android/iOS
- **Orchestrator design:** Central scheduling, churn management (≥3× redundancy), graceful eviction
- **Inference serving layer:** Request-parallel routing, model sharding within clusters
- **UPI micro-payout engine:** Usage metering → rupee conversion → UPI transfer
- **Confidential computing:** Encrypted sandbox for workloads on untrusted hosts
- **Rashtra Seva protocol:** Cryptographically-authenticated emergency mode trigger spec

### Documentation

- Architecture decision records (`docs/architecture/`)
- Security threat model and sandbox/attestation design (`docs/security/`)
- Community onboarding guide (`docs/community/`)
- Marketing / positioning strategy (`docs/marketing/`)
- Business development pipeline (`docs/bizdev/`)
- Research memos beyond the benchmark (`docs/research/`)

### Infrastructure / Ops

- CI/CD pipeline (GitHub Actions for Firebase deploy + PR previews)
- Cloud Function for server-side signup validation, rate-limiting, and BD notifications
- Monitoring and logging for the Firestore backend

---

## How to Contribute

### 1. Find or Create an Issue

Check the [GitHub Issues](https://github.com/nandal/dum360/issues) for tasks tagged `good-first-issue` or `help-wanted`. If nothing fits, open a new issue describing what you want to work on.

### 2. Set Up Locally

```bash
git clone https://github.com/nandal/dum360.git
cd dum360
```

The site is a static HTML page — no build step required:

```bash
python3 -m http.server 8000   # or any static server
open http://localhost:8000
```

For Firebase emulation (if you want to test the sign-up flow locally):

```bash
npm install -g firebase-tools
firebase login
firebase emulators:start --only hosting
```

### 3. Branch and Build

```bash
git checkout -b feat/your-feature-name
# make your changes
git commit -m "feat(scope): description of change"
```

We use [conventional commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`.

### 4. Open a Pull Request

Push your branch and open a PR against `main`. Include:

- What problem your change solves
- How you tested it
- Any design decisions or trade-offs

---

## Design & Honesty Rules (Non-Negotiable)

All contributors must follow the honesty guardrails from the [benchmark doc](docs/compute-benchmark.md):

1. **Never claim "we beat AWS"** — we're a few percent of hyperscaler total fleets
2. **Inference, not frontier training** — always qualify
3. **"A few EF/s usable"** — use this for *usable* throughput, not peak
4. **1–2 orders of magnitude beyond India's public HPC** — that's our strongest true claim
5. **Don't mix FP16-peak and FP64-sustained without labelling**
6. **Estimates are estimates** — always label them as illustrative bottom-up figures
7. **Green energy honesty** — tidal/wave is nascent R&D, not today's capacity
8. **Rashtra Seva is a *designed* protocol** — not operational yet, don't imply it is
9. **"50% cheaper" is a Phase-2 target** — not a measured fact
10. **Sovereignty precision** — "100% Indian-hosted" = the platform, not necessarily this website

---

## Code of Conduct

Be respectful. This is national infrastructure — we're building something serious. Harassment, spam, and dishonesty won't be tolerated.

---

## Questions?

- **General:** [hello@dum360.com](mailto:hello@dum360.com)
- **Legal/Privacy:** [info@balaji.it](mailto:info@balaji.it)
- **Issues:** Use [GitHub Issues](https://github.com/nandal/dum360/issues)
