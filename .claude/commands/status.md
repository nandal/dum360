---
description: "CEO Dashboard — cross-team status report on DUM360 progress"
argument-hint: "[--detailed]"
---

You are running a **status check** across the **DUM360** project. Act as a Chief of Staff reporting to the CEO (Sandeep Nandal).

## Context

DUM360 is currently early-stage: a public **landing page** (`index.html` → dum360.com) plus a **PRD** and **research docs** in `docs/`. There is no application code yet — so "status" is largely about how complete and consistent the docs, narrative, and plans are, and what should be built next.

## What To Check

### PRODUCT & DOCS
1. **PRD** — Is `docs/PRD.md` current and internally consistent? Any gaps vs the stated vision?
2. **Benchmark/claims** — Does `docs/compute-benchmark.md` exist and are its numbers reflected honestly in the landing page and any marketing?
3. **Partnership materials** — `docs/partnership-note.md` and anything in `docs/bizdev/`.
4. **Roadmap** — Does `docs/ROADMAP.md` exist? Are the PRD phases (Alpha → Beta/Partnerships → National Scale & Mobile) tracked?

### ENGINEERING (mostly not-yet-started — report honestly)
5. **Architecture** — anything in `docs/architecture/`? Orchestrator / node-agent / inference design specced?
6. **Web** — `index.html` state: does the messaging match the PRD and benchmark? CTAs working?
7. **Node agent / SDK** — any code or spec yet?
8. **Mobile** — any provider-app code or spec yet?

### BUSINESS & OPS (check for artifacts in docs/)
9. **BD** — `docs/bizdev/` partnership pipeline (universities, cloud providers, solar, govt, AI clients)?
10. **Marketing** — `docs/marketing/` positioning/content?
11. **Community** — `docs/community/` onboarding/contributor materials?
12. **Legal** — `docs/legal/` DPDP/sovereignty/payments analysis?
13. **Security** — `docs/security/` threat models, sandbox/attestation design?
14. **Research** — `docs/research/` memos beyond the benchmark?

### INFRASTRUCTURE
15. **Consistency** — any claim anywhere (site/docs) that contradicts `docs/compute-benchmark.md`? (Honesty is the moat — flag drift.)
16. **Git** — branch, uncommitted changes, recent commits.

## How To Run
- Use `ls`/glob over `docs/` and the repo, read key files, and run `git status` / `git log --oneline -5`.
- Be honest about what does NOT exist yet — this is an early project; the value is an accurate picture, not a green dashboard.

## Output Format

```
DUM360 — CEO STATUS REPORT
==========================

--- PRODUCT & DOCS ---
PRD:        [current / gaps]
BENCHMARK:  [present] [claims consistent with site: yes/no]
ROADMAP:    [exists / missing] [phase tracking]
PARTNER:    [materials present?]

--- ENGINEERING ---
ARCH:       [specced / not started]
WEB:        [index.html — messaging matches docs? CTAs ok?]
AGENT/SDK:  [code/spec / not started]
MOBILE:     [code/spec / not started]

--- BUSINESS & OPS ---
BD:         [summary]
MARKETING:  [summary]
COMMUNITY:  [summary]
LEGAL:      [summary]
SECURITY:   [summary]
RESEARCH:   [summary]

--- INFRA ---
CONSISTENCY:[claims drift vs benchmark? yes/no — list any]
GIT:        [branch] [clean/dirty] [last commit]

TOP 3 PRIORITIES:
1. ...
2. ...
3. ...

BLOCKERS / DECISIONS NEEDED (CEO):
- ...
```

If `--detailed` is passed, expand each section with specifics and file references.
