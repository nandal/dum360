---
description: "CEO Dashboard — cross-team status report on DUM360 progress"
argument-hint: "[--detailed]"
---

You are running a **status check** across the **DUM360 — Distributed AI Execution Mesh** project. Act as a Chief of Staff reporting to the CEO (Sandeep Nandal).

## Context

DUM360 is building the MVP defined in `docs/PRD.md`: a server-node architecture that allows any trusted computer to become an AI execution node. The MVP demonstrates remote AI task execution on GitHub Issues via a GitHub executor.

The project has a PRD, scaffolded server/node directories, and is moving toward implementation.

## What To Check

### PRODUCT & DOCS
1. **PRD** — Is `docs/PRD.md` current and internally consistent? Any gaps?
2. **README** — Does `README.md` reflect the current MVP vision? Clear for first-time visitors?
3. **Roadmap** — Is `ROADMAP.md` aligned with the PRD's MVP success criteria?
4. **Architecture docs** — Anything in `docs/architecture/`? Component designs, sequence diagrams?

### ENGINEERING
5. **Server** — `dum360-server/`: any Go code yet? Which endpoints are implemented?
6. **Node** — `dum360-node/`: any Go code yet? GitHub executor implemented?
7. **Dashboard** — Any frontend code? Which pages exist?
8. **CLI** — Any CLI tooling?
9. **Docker Compose** — Does `docker-compose.yml` exist and work?

### TESTING
10. **Tests** — Server tests? Node tests? Integration tests? Coverage?
11. **CI** — GitHub Actions workflows? Linting, testing, building?

### COMMUNITY & OPS
12. **Contributor docs** — `CONTRIBUTING.md` up to date?
13. **Issues/PRs** — Open issues count, stale PRs, community engagement.
14. **Security** — `docs/security/` artifacts? Recent security review?

### INFRASTRUCTURE
15. **Git** — Current branch, uncommitted changes, recent commits.
16. **Consistency** — Any claim in docs/site that contradicts the PRD or current code state?

## How To Run
- Use `ls`/glob over the repo, read key files, and run `git status` / `git log --oneline -10`.
- Be honest about what does NOT exist yet — this is an early project; accuracy matters more than a green report.

## Output Format

```
DUM360 — CEO STATUS REPORT
===========================

--- PRODUCT & DOCS ---
PRD:        [current / gaps]
README:     [reflects MVP? clear for visitors?]
ROADMAP:    [aligned with MVP criteria?]
ARCHITECTURE: [docs/architecture/ artifacts present?]

--- ENGINEERING ---
SERVER:     [endpoints implemented / total]
NODE:       [components built / total]
DASHBOARD:  [pages built / total]
CLI:        [commands built / total]
DOCKER:     [compose file exists? works?]

--- TESTING ---
TESTS:      [coverage summary]
CI:         [workflows active?]

--- COMMUNITY ---
CONTRIBUTING: [up to date?]
ISSUES/PRs:   [open / stale / active]

--- INFRA ---
GIT:        [branch] [clean/dirty] [last 5 commits]
CONSISTENCY: [claims consistent? any drift?]

MVP SUCCESS CRITERIA STATUS:
1. [ ] Two nodes connected simultaneously
2. [ ] @dum360 webhook received
3. [ ] Task created from webhook
4. [ ] Scheduler allocates to node
5. [ ] Node clones repository
6. [ ] AI completes work
7. [ ] Tests pass
8. [ ] PR created
9. [ ] GitHub updated with results

TOP 3 PRIORITIES:
1. ...
2. ...
3. ...

BLOCKERS / DECISIONS NEEDED (CEO):
- ...
```

If `--detailed` is passed, expand each section with specifics, file references, and line counts.
