# ADR-004: Docker Executor — Containerised Agentic Execution

**Status:** Proposed
**Date:** 2026-06-28
**Deciders:** System Architect, CEO
**Relates to:** [Issue #11](https://github.com/nandal/dum360/issues/11), PRD §Executors (promotes "Docker Executor (future)" to MVP)

---

## Context

The MVP GitHub executor runs the agentic pipeline (clone → AI → tests → PR)
**directly on the node host** (`services/node/src/executors/github.executor.ts`).
The target consumer flow requires a node to instead **pull a container image
from a registry (DockerHub) and run the agentic job inside that container**,
giving isolation and letting partners ship their own agent images.

A task therefore needs to carry a container image (and optional registry
credentials), the scheduler must route such tasks only to nodes that can run
containers, and the node needs a second executor that drives the Docker daemon.

## Decision

### 1. Self-contained agent image
The image **is** the agent. The node only launches it and harvests results;
it does not orchestrate git/PR steps for docker tasks.

**Node → container (env):** `DUM360_TASK_ID`, `DUM360_REPOSITORY`,
`DUM360_BRANCH`, `DUM360_ISSUE_NUMBER/_TITLE/_BODY`, `DUM360_INSTRUCTIONS`,
`DUM360_AI_PROVIDER`, `AI_API_KEY`, `GITHUB_TOKEN`.

**Container → node:** writes `/artifacts/result.json`
(`{ prUrl, branch, commitSha, diff, testResults }`) on a mounted volume; exit
code `0` = success, non-zero = failure. stdout/stderr is streamed to the log
service.

### 2. Task model
`CreateTaskRequest` / `TaskAssignPayload` gain `image` and optional
`registryCredentials`. The Zod schema requires `image` when
`executor === "docker"` and rejects flag-like image refs. The `tasks` table
gains `image` and `registry_credentials` columns.

### 3. Scheduling
Docker capability is advertised by a node **only when the Docker daemon is
reachable** (`docker info`), as an `executor` capability named `docker`. Task
creation auto-injects a `docker` capability requirement for docker tasks, so the
existing name-based scheduler routes them only to docker-capable nodes. GitHub
task routing is unchanged.

### 4. Node executor
`DockerExecutor` validates inputs, optionally `docker login`s (password via
stdin), `docker pull`s, then `docker run --rm` with resource limits
(`--memory`, `--cpus`, `--pids-limit`), env injection, and an `/artifacts`
volume mount, streaming output and reading the result file. The `GITHUB_TOKEN`
and registry password are never logged.

### 5. Deployment
Node containers mount the host Docker socket (`/var/run/docker.sock`) and the
node image installs `docker-cli`.

## Consequences

**Positive:** partners ship their own agent images; container isolation; the
existing executor-registry/poll/report machinery is reused unchanged.

**Hardening applied (PR #12 review):**
- Secrets (`GITHUB_TOKEN`, `AI_API_KEY`) injected via a 0600 `--env-file`, not
  `--env` argv, so they don't appear in the node host's process list.
- `docker run --security-opt no-new-privileges` on the (untrusted) image.
- Internal services (registry/orchestration/log) are no longer published to the
  host — the gateway is the sole authenticated entry point, and it sets
  `x-node-id` from the verified node JWT (clients cannot spoof it).
- Queue position computed atomically inside the INSERT (no count→insert race).

**Trade-offs / follow-ups:**
- **Socket mount** still gives the node broad host privileges (sibling
  containers). DinD or a rootless-daemon setup is a hardening follow-up.
- **Secrets at rest:** `registry_credentials` is stored unencrypted for MVP
  (see #13).
- **GitHub token:** still the static `GITHUB_TOKEN` placeholder; per-task GitHub
  App minting tracked in #13.
- **Orphaned tasks & internal service-to-service auth:** tracked in #14.
- Container images run arbitrary code — agent images must be trusted/curated;
  the env-var token is still readable from inside the container (Grade-3 in #13).

## Out of scope
GPU scheduling, image cache hints, container telemetry in heartbeat, encrypted
secret storage, GitHub App token minting.
