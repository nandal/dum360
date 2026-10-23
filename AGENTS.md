# AGENTS.md — DUM360 contributor agent guidance

DUM360 is a public, open-source repo building India's citizen-powered
sovereign inference mesh. Current stage is **Phase 1 (Waitlist + Landing
Page)**: a no-build static site (`index.html`, `portal.html`, legal pages,
`firebase-config.js`) backed by Firebase Hosting + Firestore (Mumbai,
`asia-south1`). The platform (node agent, orchestrator) is in design under
`docs/`; prototype backend work lives on the `mvp` branch, not `dev`.

## Setup / run / test

```bash
# Preview the site locally (no build step, no dependencies)
python3 -m http.server 8000
# open http://localhost:8000

# Secret scan (same tool CI runs)
gitleaks detect --no-git --source .

# Full Firebase wiring + deploy (needs firebase-tools + project access)
./scripts/setup-firebase.sh <project-id> [--create]
# Manual Console steps that remain are in docs/website/DEPLOY.md
```

There is no test harness on `dev` (static site only). Backend services and
their vitest suite live on the `mvp` branch.

## Conventions a change must honour

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`); PRs target
  `dev` (the default branch) and fill in `.github/PULL_REQUEST_TEMPLATE.md`,
  including the Honesty Checklist.
- Every claim in copy, code, and marketing must stay consistent with
  `docs/compute-benchmark.md` (honest scale, no hype). Sovereignty claims stay
  precise (Indian-hosted platform vs global CDN); Rashtra Seva is a "designed
  protocol", not operational; numbers are labeled (peak/usable,
  illustrative/measured, target/current); no fabricated partnerships.
- Firebase web API keys in `firebase-config.js` are **not** secrets (see
  `.gitleaks.toml` allowlist); security comes from `firestore.rules` + App
  Check, so never "fix" a key leak by rotating it into a secret.
- CI (`Secret Scan`) must stay green: third-party Actions pinned to full
  commit SHAs (`owner/action@<sha> # vX`), top-level least-privilege
  `permissions:`, per-job `timeout-minutes`, and a `concurrency` group.
  Dependabot proposes the SHA bumps — merge them promptly.
- Key docs: `README.md` (vision/status), `CONTRIBUTING.md` (how to help),
  `ROADMAP.md` (phased plan), `SECURITY.md` (reporting), `docs/PRD.md` (full
  spec), `docs/website/DEPLOY.md` (deploy runbook).
