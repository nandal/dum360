# DUM360 MVP — Product Requirements Document

**Version:** MVP v0.1
**Codename:** Distributed AI Execution Mesh
**Status:** Draft

---

## Table of Contents

1. [Vision](#vision)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Core Architecture](#core-architecture)
4. [System Components](#system-components)
5. [Data Models](#data-models)
6. [API Specification](#api-specification)
7. [Execution Pipeline](#execution-pipeline)
8. [Scheduler](#scheduler)
9. [Security Model](#security-model)
10. [Deployment](#deployment)
11. [Dashboard](#dashboard)
12. [MVP Success Criteria](#mvp-success-criteria)
13. [Future Extensions](#future-extensions)

---

## Vision

> Allow any trusted computer to become an AI execution node.

A user should be able to assign an AI task (starting with GitHub Issues/PRs), and DUM360 automatically selects an available node, securely executes the task, and reports the results.

The MVP proves that AI work can be executed on **any connected machine** without the user caring where that machine is.

This is **not** about distributed computing. It is about **remote AI task execution on trusted devices**.

---

## Goals & Non-Goals

### Goals

| # | Goal |
|---|------|
| 1 | Demonstrate distributed execution across multiple nodes |
| 2 | Keep architecture simple and composable |
| 3 | Support multiple worker nodes registered simultaneously |
| 4 | Execute real AI coding tasks on real repositories |
| 5 | Create Pull Requests automatically from completed tasks |
| 6 | Deployable end-to-end with `docker compose up` |

### Non-Goals (MVP)

- Marketplace / billing / payments
- Multi-tenant security / RBAC
- Wasm execution runtime
- Distributed scheduling optimizations
- Resource pricing / metering
- Public node marketplace
- P2P networking / mesh topology
- GPU-aware scheduling
- Mobile / browser / IoT nodes

---

## Core Architecture

DUM360 is built around **four foundational abstractions** that scale from MVP to the full Distributed Unified Mesh vision:

```
                    DUM360
                      │
           ┌──────────┼──────────┐
         Tasks     Executors    Nodes
                      │
                Capabilities
```

| Abstraction | Question It Answers | Role |
|-------------|-------------------|------|
| **Task** | *What* needs to be done? | Unit of work — generic payload with requirements |
| **Executor** | *How* to perform that class of work? | Execution strategy — understands a task protocol |
| **Node** | *Where* does it run? | Machine that polls for work, executes, reports back |
| **Capability** | *What* can the node provide? | Composable, typed attributes the scheduler matches against |

These four concepts are the **core of DUM's architecture from day one**, even though the initial implementation only includes a single executor (GitHub) and a handful of capabilities.

---

## System Components

### 1. DUM360 Server (`dum360-server/`)

The orchestration layer. **No task execution happens here.**

#### Responsibilities

| Function | Description |
|----------|-------------|
| Node Registration | Accept node registrations, issue JWTs |
| Heartbeat Processing | Track node liveness and availability |
| Capability Discovery | Store and index node capabilities |
| Task Queue | Accept, persist, and order incoming tasks |
| Task Scheduling | Match tasks to capable, available nodes |
| GitHub Webhook Receiver | Ingest `@dum360` commands from GitHub |
| Task Status Tracking | Maintain task lifecycle state machine |
| Log Aggregation | Receive and store streaming task logs |
| REST API | Expose CRUD operations for all entities |
| Dashboard | Serve a real-time web UI |

#### Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Go |
| Database | PostgreSQL |
| Message Broker / Cache | Redis |
| API Protocol | REST + WebSocket (for live logs/status) |
| Auth | JWT (node auth) + GitHub App token (repo access) |

---

### 2. DUM360 Node (`dum360-node/`)

Installed on any machine. Polls the server for work.

#### Responsibilities

| Function | Description |
|----------|-------------|
| Register | Announce presence and capabilities to server |
| Heartbeat | Periodically report health, load, and status |
| Advertise Capabilities | Declare resources, tools, runtimes, services, and executors |
| Poll for Work | Fetch next pending task from server |
| Execute Tasks | Run the assigned executor with the task payload |
| Clone Repositories | Fetch target repos for GitHub executor tasks |
| Invoke AI CLI | Call configurable AI tool (Codex, Claude, Gemini) |
| Run Tests | Execute test suites and collect results |
| Commit Changes | Create commits with AI-generated changes |
| Push Branch | Push to remote repository |
| Create Pull Request | Open PR via GitHub CLI / API |
| Upload Logs | Stream execution logs back to server |
| Return Status | Report completion/failure to server |

#### Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Go |
| Git | Native `git` binary |
| Docker | For isolated execution if needed |
| AI CLI | Configurable: Claude Code / Codex CLI / Gemini CLI |
| GitHub CLI | `gh` for PR creation and repo operations |

---

### Executors vs. Capabilities

These are **two completely different concepts**, modeled as first-class objects.

#### Executor = *How to Execute*

An executor understands a **task protocol**. It defines a class of work the node knows how to perform.

```
Node
  │
  └── Executors
        ├── GitHub Executor      (MVP)
        ├── Docker Executor      (future)
        ├── Wasm Executor        (future)
        ├── Python Executor      (future)
        ├── Flutter Executor     (future)
        ├── Android Executor     (future)
        └── ...
```

**Example: GitHub Executor**

```
Input:  { repository, branch, issue, instructions, aiProvider }
  │
  ├── Clone repository
  ├── Checkout branch
  ├── Download issue context
  ├── Invoke AI CLI with instructions
  ├── Generate code changes
  ├── Run tests
  ├── Commit changes
  ├── Push branch
  ├── Open Pull Request
  └── Upload logs → Done
```

**Example: Docker Executor (future)**

```
Input:  { image, command, mounts, environment }
  │
  ├── Pull image
  ├── Run container
  ├── Collect logs
  └── Return output
```

#### Capability = *What the Node Can Provide*

Capabilities are **composable, extensible, typed attributes** describing node resources and tools. They are organized into five categories:

```
Node
  │
  └── Capabilities
        ├── Resources    (CPU, RAM, GPU, disk)
        ├── Tools        (git, gh, ffmpeg, docker)
        ├── Runtimes     (python, node, go, rust)
        ├── Services     (codex, claude, gemini)
        └── Executors    (github, docker, wasm — what the node *can* run)
```

**Example capability advertisement:**

```yaml
executors:
  - id: github

resources:
  - id: cpu
    value: 16
  - id: ram
    value: 64GB
  - id: gpu
    value: RTX4090

tools:
  - id: git
  - id: gh
  - id: docker
  - id: ffmpeg

runtimes:
  - id: python
    version: "3.13"
  - id: node
    version: "22"
  - id: go
    version: "1.25"
  - id: rust
    version: stable

services:
  - id: codex
  - id: claude
  - id: gemini
```

Each capability is a first-class object:

```json
{ "id": "python", "version": "3.13" }
{ "id": "ram", "value": "64GB" }
{ "id": "cuda" }
{ "id": "git" }
```

This makes capabilities **composable and extensible** — new capabilities can be added without changing the schema or scheduler.

---

### GitHub Workflow (MVP Executor)

```
User comments "@dum360 fix this issue"
on a GitHub Issue
        │
        ▼
GitHub Webhook → DUM360 Server
        │
        ▼
Server creates Task with executor: "github"
        │
        ▼
Scheduler selects a Node with matching capabilities
        │
        ▼
Node polls → downloads Task
        │
        ▼
Node executes GitHub Executor pipeline:
  Clone → AI → Tests → Commit → Push → PR
        │
        ▼
Node uploads results → Server
        │
        ▼
Server comments on GitHub Issue with PR link
```

---

## Data Models

### Task

```json
{
  "taskId": "uuid",
  "executor": "github",
  "status": "queued | running | completed | failed | cancelled",
  "repository": "owner/repo",
  "branch": "main",
  "issue": {
    "number": 42,
    "title": "Fix authentication bug"
  },
  "instructions": "@dum360 fix this issue. Keep API compatible. Run tests. Open PR.",
  "aiProvider": "claude",
  "requirements": {
    "capabilities": [
      { "id": "git" },
      { "id": "claude" },
      { "id": "docker" },
      { "id": "gh" }
    ]
  },
  "timeout": 3600,
  "nodeId": "uuid | null",
  "artifacts": {
    "branch": "dum360/fix-auth-bug",
    "prUrl": "https://github.com/owner/repo/pull/99"
  },
  "logs": [],
  "createdAt": "ISO8601",
  "startedAt": "ISO8601 | null",
  "completedAt": "ISO8601 | null"
}
```

### Node

```json
{
  "nodeId": "uuid",
  "name": "macbook-pro-m2",
  "status": "online | offline | busy",
  "version": "0.1.0",
  "capabilities": {
    "executors": [{ "id": "github" }],
    "resources": [
      { "id": "cpu", "value": 16 },
      { "id": "ram", "value": "64GB" }
    ],
    "tools": [
      { "id": "git" },
      { "id": "gh" },
      { "id": "docker" }
    ],
    "runtimes": [
      { "id": "go", "version": "1.25" },
      { "id": "python", "version": "3.13" }
    ],
    "services": [
      { "id": "claude" },
      { "id": "codex" }
    ]
  },
  "currentTask": "uuid | null",
  "lastHeartbeat": "ISO8601",
  "registeredAt": "ISO8601"
}
```

### Heartbeat

```json
{
  "nodeId": "uuid",
  "status": "online",
  "resources": {
    "cpu": { "used": 30, "total": 16 },
    "ram": { "used": "24GB", "total": "64GB" }
  },
  "runningTasks": 1,
  "version": "0.1.0",
  "capabilities": { "..." }
}
```

---

## API Specification

### Server REST API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Register a new node | Pre-shared registration token |
| `POST` | `/heartbeat` | Node heartbeat + status update | JWT |
| `GET` | `/tasks/next` | Node polls for next assigned task | JWT |
| `PATCH` | `/tasks/:id/result` | Node reports task completion | JWT |
| `POST` | `/tasks/:id/log` | Node streams log entry | JWT |
| `GET` | `/nodes` | List all registered nodes | — |
| `GET` | `/nodes/:id` | Get node detail + capabilities | — |
| `GET` | `/tasks` | List all tasks | — |
| `GET` | `/tasks/:id` | Get task detail + logs | — |
| `POST` | `/webhook/github` | GitHub webhook receiver | HMAC |

### Node Registration Flow

```
Node starts
    │
    ▼
POST /register
  Headers: { Authorization: Bearer <registration-token> }
  Payload: { name, version, capabilities }
    │
    ▼
Server validates registration token
    │
    ▼
Server runs capability attestation
    │
    ▼
Server returns:
  { nodeId, jwt, heartbeatInterval: 15, pollInterval: 5 }
    │
    ▼
Node becomes "online"
    │
    ▼
Heartbeat every 15s
  Payload: { nodeId, status, resources, runningTasks, version, capabilities }
    │
    ▼
Server updates availability
```

### Registration Security

Node registration is the trust bootstrap point. The server requires a **pre-shared registration token** (configured via `REGISTRATION_TOKEN` env var / Docker secret). Without it, registration is rejected with `401 Unauthorized`.

```
Registration token → Server validates → Node gets JWT
```

This prevents unauthorized actors from:
- Registering rogue nodes
- Flooding the system with fake registrations
- Impersonating legitimate workers

### Capability Attestation

Self-declared capabilities are **verified by the server** at registration time before a node can receive work.

**Attestation mechanism (MVP):**

1. Node declares capabilities in the registration payload
2. Server runs lightweight probes:
   - **Executors:** server sends a no-op probe task; node must acknowledge it understands the executor protocol
   - **Tools:** server requests version output (e.g., `git --version`, `gh --version`)
   - **Runtimes:** server requests runtime version (e.g., `go version`, `python --version`)
   - **Services:** server requests service availability check (e.g., `claude --version`)
3. Only **attested** capabilities are stored and used for scheduling
4. Node re-attests on restart or capability change

Capabilities that fail attestation are **dropped** — the node cannot receive tasks requiring them.

### Heartbeat & Node Liveness

Nodes send heartbeats every **15 seconds**. The server enforces liveness:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Heartbeat Interval | 15s | How often nodes report status |
| Grace Period | 30s | Additional window after missed heartbeat |
| Offline Threshold | 45s | Node marked "offline" after 45s of silence |

**Offline Detection:**

```
Heartbeat received → lastHeartbeat = now()
Every 5s sweep → if now() - lastHeartbeat > 45s:
  ├── Mark node status = "offline"
  └── If node had currentTask:
        ├── Mark task status = "failed"
        └── Re-queue task for reassignment
```

**Orphaned Task Recovery:** If a node disappears mid-execution, its in-flight task is immediately re-queued. The next scheduling cycle picks it up and assigns it to another available node.

### Repository Access Delegation

A node's local `GITHUB_TOKEN` may not have access to every repository. To guarantee access:

1. The server holds a **GitHub App installation token** (central, scoped to the org/repos DUM360 is installed on)
2. When assigning a task to a node, the server:
   - Verifies the GitHub App installation covers the target repository
   - Generates a **short-lived installation access token** for that repository
   - Includes the token in the task payload sent to the node
3. The node uses this delegated token for `git clone`, `git push`, and `gh pr create`
4. Token expires after the task timeout — invalid after use

This ensures:
- No central GitHub token is stored on nodes
- Server controls which repos a task can access
- Tokens are ephemeral and per-task

---

## Execution Pipeline

### Input Sanitization

All user-supplied fields in a task payload are validated and sanitized before reaching the executor:

| Field | Validation |
|-------|-----------|
| `repository` | Must match `^[\w.-]+/[\w.-]+$` — no shell metacharacters |
| `branch` | Must match `^[\w./-]+$` — no `;`, `|`, `$()`, backticks |
| `instructions` | Stored as-is but passed to AI CLI via **stdin or temp file** — never interpolated into shell commands |
| `aiProvider` | Must be one of an allowlisted set: `claude`, `codex`, `gemini` |
| `executor` | Must match a registered executor ID on the node |

The executor constructs all commands using **parameterized execution** (Go's `exec.Command` with separate args array), never string interpolation. Example:

```go
// Safe: args are passed separately, no shell parsing
cmd := exec.Command("git", "clone", repoURL, workDir)

// Unsafe: shell interprets metacharacters
cmd := exec.Command("sh", "-c", fmt.Sprintf("git clone %s %s", repoURL, workDir))
```

### GitHub Executor — Step by Step

```
  1. Receive Task
         │
  2. Clone Repository       → git clone <repo>
         │
  3. Checkout Branch        → git checkout <base-branch>
         │
  4. Create Work Branch     → git checkout -b dum360/<task-id>
         │
  5. Download Context       → Fetch issue body, comments, repo structure
         │
  6. Invoke AI              → <ai-cli> "Fix this issue: <instructions>"
         │                       Provide repo context + issue details
         │
  7. Generate Changes       → AI produces code diff
         │
  8. Run Tests              → Execute test suite, collect results
         │                       ↳ Tests fail? → Feed back to AI → Loop
         │
  9. Commit Changes         → git add && git commit
         │
 10. Push Branch            → git push origin dum360/<task-id>
         │
 11. Create Pull Request    → gh pr create
         │
 12. Upload Logs            → Stream full execution log to server
         │
 13. Report Done            → PATCH /tasks/:id/result { status, artifacts }
```

---

## Scheduler

The MVP scheduler is intentionally **simple**. No complex optimization.

### Algorithm

```
1. Filter nodes
   ├── Status = "online"
   ├── Current Task = null (idle)
   └── lastHeartbeat within offline threshold (45s)

2. Filter by capability match
   └── Node has ALL required capabilities (matched by ID across all categories)

3. Sort by utilization (ascending — least utilized first)
   └── utilization = (cpu.used/cpu.total + ram.used/ram.total) / 2
   └── In case of tie, prefer higher total RAM

4. Take first match
   └── Assign task to that node
```

This load-balancing approach ensures work spreads across nodes rather than always hitting the largest one, preventing a single large node from being overloaded while smaller nodes sit idle.

### Capability Matching Semantics

Task requirements specify capabilities as a flat list of IDs. The scheduler matches **across all capability categories** (executors, resources, tools, runtimes, services) — a capability ID is globally unique within a node's declared set.

The scheduler asks:

> *"Can you satisfy the requirements of this task?"*

Not:

> *"Can you execute GitHub?"*

```yaml
Task Requirements:
  capabilities:
    - id: git
    - id: claude
    - id: docker
    - id: gh

Node capability pool = flatten(all categories) → { git, gh, docker, claude, codex, go, python, … }

Node matches if:
  ∀ required ⊆ node capability pool
```

Future iterations may add optional **category scoping** for stricter matching:

```yaml
requirements:
  capabilities:
    - category: tools
      ids: [git, gh]
    - category: services
      ids: [claude]
```

---

## Security Model

| Concern | Approach |
|---------|----------|
| **Registration Auth** | Pre-shared registration token required; server validates before issuing JWT |
| **Node Authentication** | JWT issued at registration, verified on every request |
| **Capability Attestation** | Server probes node capabilities at registration; only attested capabilities are trusted for scheduling |
| **Repository Access** | GitHub App installation token delegated by server per-task; server verifies repo coverage before assignment |
| **Input Sanitization** | All user-supplied fields validated against allowlists; commands use parameterized execution, never raw shell |
| **Network Direction** | Nodes always initiate connections to server — no inbound to nodes |
| **No Remote Shell** | Nodes execute predefined executor pipelines only — no arbitrary commands |
| **Approved Task Types** | Server whitelists executable task types |
| **Task Isolation** | Each task runs in its own worktree / clone |
| **Secrets** | Tokens are per-task and ephemeral; secrets managed via Docker secrets or external vault |

---

## Deployment

### docker-compose.yaml (root level)

```yaml
version: "3.9"

services:
  server:
    build: ./dum360-server
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://dum360:dum360@postgres:5432/dum360
      - REDIS_URL=redis://redis:6379
      - GITHUB_APP_ID=${GITHUB_APP_ID}
    secrets:
      - github_app_private_key
      - jwt_secret
      - registration_token
    depends_on:
      - postgres
      - redis

  node:
    build: ./dum360-node
    environment:
      - SERVER_URL=http://server:8080
      - NODE_NAME=local-node
      - AI_PROVIDER=claude
    secrets:
      - registration_token
    depends_on:
      - server

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=dum360
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    secrets:
      - postgres_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

secrets:
  github_app_private_key:
    file: ./secrets/github_app_private_key.pem
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  registration_token:
    file: ./secrets/registration_token.txt
  postgres_password:
    file: ./secrets/postgres_password.txt

volumes:
  pgdata:
```

> **Secrets are never stored as plain environment variables.** All sensitive values (GitHub App private key, JWT secret, registration token, database password) are injected via Docker secrets and mounted as files at `/run/secrets/<name>`. The server reads them from the filesystem, not the environment.

### Running

```bash
docker compose up
```

Starts: **Server**, **PostgreSQL**, **Redis**, **One Local Node**

Additional nodes simply point `SERVER_URL` to the server and run independently.

---

## Dashboard

### Pages

| Page | Content |
|------|---------|
| **Nodes** | Online / Offline / Busy status, last seen, capabilities grid |
| **Tasks** | Queued, Running, Completed, Failed, Cancelled — with filters |
| **Task Detail** | Full lifecycle timeline, live streaming logs, artifacts (PR link) |
| **Logs** | Per-task live log viewer via WebSocket |

---

## MVP Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | Two nodes connected simultaneously | Dashboard shows both online |
| 2 | User comments `@dum360` on a GitHub Issue | Webhook received by server |
| 3 | Server creates a task from the webhook | Task appears in queue |
| 4 | Scheduler allocates the task to an available node | Task assigned, node shows busy |
| 5 | Node clones the target repository | Log shows clone step complete |
| 6 | AI completes the requested work | Code diff generated |
| 7 | Tests pass | Test output logged, all green |
| 8 | Pull Request created on the repository | PR URL in task artifacts |
| 9 | GitHub Issue updated with execution results | Comment posted with PR link + summary |

> ✅ **All 9 criteria met = MVP proven.** This demonstrates that DUM360 can transform any trusted machine into a remotely orchestrated AI execution node.

---

## Future Extensions

Post-MVP, the architecture naturally extends to:

| Extension | How It Fits |
|-----------|-------------|
| **Wasm Executor** | New executor — server unchanged |
| **Docker Executor** | New executor — server unchanged |
| **GPU Scheduling** | New capability: `{ id: "cuda", memory: "24GB" }` |
| **Capability-Based Scheduler** | Match on richer capability requirements |
| **Marketplace** | Nodes publish capabilities + price; users bid |
| **P2P Networking** | Nodes discover each other via server → mesh |
| **AI Agent Graphs** | Tasks become DAGs of sub-tasks across executors |
| **Mobile / Browser / IoT Nodes** | Lightweight node implementations |
| **Enterprise Deployments** | Multi-tenancy, RBAC, audit logging |
| **Custom AI Agents** | Executor = custom agent protocol |

---

## Repository Structure

```
dum360/
├── dum360-server/          # Orchestration server (Go)
│   ├── cmd/
│   ├── internal/
│   │   ├── api/
│   │   ├── scheduler/
│   │   ├── models/
│   │   └── webhook/
│   ├── Dockerfile
│   └── go.mod
│
├── dum360-node/            # Worker node (Go)
│   ├── cmd/
│   ├── internal/
│   │   ├── executors/
│   │   │   └── github/
│   │   ├── capabilities/
│   │   ├── heartbeat/
│   │   └── poller/
│   ├── Dockerfile
│   └── go.mod
│
├── docker-compose.yml      # Full stack deployment
├── docs/
│   └── PRD.md              # This document
└── ...
```

---

*This PRD captures the design discussion and architectural decisions for DUM360 MVP v0.1. The four core abstractions — Tasks, Executors, Nodes, Capabilities — form the foundation that scales from a simple remote AI executor to the full Distributed Unified Mesh vision.*
