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
   - [Server API](#1-dum360-server-api)
     - [Node-Facing Endpoints](#12-node-facing-endpoints)
     - [Operator-Facing Endpoints](#13-operator-facing-endpoints)
     - [Webhook Endpoints](#14-webhook-endpoints)
     - [WebSocket API](#15-websocket-api)
   - [Node API](#2-dum360-node-api)
     - [Health & Status](#22-health--status)
     - [Operational Control](#23-operational-control)
   - [Executor Interface](#3-executor-interface-node-internal)
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
        ├── Docker Executor      (MVP — see ADR-004)
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

**Example: Docker Executor (MVP — [ADR-004](architecture/decisions/ADR-004-docker-executor.md))**

A *self-contained agent image*: the node injects task context as env vars and
runs the container, which performs the full clone → AI → tests → PR pipeline
itself and writes `/artifacts/result.json`.

```
Input:  { image, registryCredentials?, repository, branch, issue, instructions, repoToken }
  │
  ├── (optional) docker login   (private registry)
  ├── docker pull <image>
  ├── docker run --rm  (env: DUM360_*, AI_API_KEY, GITHUB_TOKEN; volume: /artifacts)
  │      └── container does clone → AI → tests → commit → push → PR
  ├── Read /artifacts/result.json  (prUrl, branch, commitSha, diff)
  └── Report status + exit code → Done
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

DUM360 exposes APIs on two surfaces:

| Surface | Audience | Protocol | Base URL |
|---------|----------|----------|----------|
| **Server API** | Nodes, operators, external systems, GitHub | REST + WebSocket | `http://<server>:8080` |
| **Node API** | Local operators, monitoring tools | REST | `http://<node>:9090` |

The **Server API** is the primary integration point — nodes call it to register and poll for work, operators call it to manage tasks and nodes, and GitHub calls it via webhooks.

The **Node API** is a local management interface on each node for health checks, configuration, and debugging.

---

### 1. DUM360 Server API

The server exposes a unified REST API on port `8080`. It has three audiences: nodes (internal), operators (external), and webhooks.

#### 1.1 Authentication

| Auth Method | Audience | How It Works |
|-------------|----------|-------------|
| **Registration Token** | Nodes (initial) | Pre-shared bearer token in `Authorization` header; validated once at `/register` |
| **JWT** | Nodes (ongoing) | Issued at registration; sent in `Authorization: Bearer <jwt>` on all subsequent calls |
| **API Key** | Operators / Dashboard | Optional in MVP; static key in `X-API-Key` header for management endpoints |
| **HMAC** | GitHub Webhooks | Standard GitHub webhook signature validation (`X-Hub-Signature-256`) |

#### 1.2 Node-Facing Endpoints

Endpoints called by DUM360 nodes during their lifecycle.

---

**`POST /register`** — Register a new node

```
Auth:       Bearer <registration-token>
Rate limit: 1 per second per IP
```

**Request:**
```json
{
  "name": "macbook-pro-m2",
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
  }
}
```

**Response `201 Created`:**
```json
{
  "nodeId": "n_abc123def456",
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "heartbeatInterval": 15,
  "pollInterval": 5,
  "attestedCapabilities": {
    "executors": [{ "id": "github" }],
    "resources": [
      { "id": "cpu", "value": 16 },
      { "id": "ram", "value": "64GB" }
    ],
    "tools": [{ "id": "git" }, { "id": "gh" }],
    "runtimes": [{ "id": "go", "version": "1.25" }],
    "services": [{ "id": "claude" }]
  },
  "failedAttestations": [
    { "id": "docker", "reason": "docker daemon not running" },
    { "id": "python", "reason": "version check timed out" },
    { "id": "codex", "reason": "binary not found in PATH" }
  ]
}
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| `401` | Missing or invalid registration token |
| `409` | Node name already registered (must deregister first) |
| `422` | Invalid capabilities format |
| `429` | Rate limited |

---

**`POST /heartbeat`** — Node health check and status update

```
Auth:  Bearer <jwt>
Every: 15 seconds
```

**Request:**
```json
{
  "nodeId": "n_abc123def456",
  "status": "online",
  "resources": {
    "cpu": { "used": 30, "total": 16 },
    "ram": { "used": "24GB", "total": "64GB" }
  },
  "runningTasks": 1,
  "version": "0.1.0"
}
```

**Response `200 OK`:**
```json
{
  "acknowledged": true,
  "serverTime": "2026-06-28T12:00:00Z",
  "nextHeartbeatIn": 15
}
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| `401` | Invalid or expired JWT |
| `404` | Node not found (re-register) |
| `410` | Node has been evicted (registration revoked) |

---

**`GET /tasks/next`** — Poll for next assigned task

```
Auth:     Bearer <jwt>
Poll:     Every 5 seconds (configurable)
Blocking: Optional — add ?wait=30s for long-poll
```

**Response `200 OK` (task available):**
```json
{
  "taskId": "t_xyz789abc012",
  "executor": "github",
  "timeout": 3600,
  "repository": "nandal/dum360",
  "branch": "main",
  "issue": {
    "number": 42,
    "title": "Fix authentication bug",
    "body": "Users cannot log in when...",
    "labels": ["bug", "priority-high"]
  },
  "instructions": "@dum360 fix this issue. Keep API compatible. Run tests. Open PR.",
  "aiProvider": "claude",
  "repoToken": "ghs_installation_abc123...",
  "tokenExpiresAt": "2026-06-28T13:00:00Z"
}
```

**Response `204 No Content` (no task available):**
```
(empty body — node should poll again after pollInterval)
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| `401` | Invalid or expired JWT |
| `409` | Node already has an in-flight task |

---

**`PATCH /tasks/:id/result`** — Report task completion or failure

```
Auth: Bearer <jwt>
```

**Request (success):**
```json
{
  "nodeId": "n_abc123def456",
  "status": "completed",
  "artifacts": {
    "branch": "dum360/t_xyz789abc012",
    "prUrl": "https://github.com/nandal/dum360/pull/99",
    "commitSha": "a1b2c3d4e5f6",
    "diff": "+120/-45 across 3 files",
    "testResults": {
      "passed": 42,
      "failed": 0,
      "skipped": 0
    }
  },
  "duration": 287
}
```

**Request (failure):**
```json
{
  "nodeId": "n_abc123def456",
  "status": "failed",
  "error": "AI invocation timed out after 3600s",
  "duration": 3600
}
```

**Response `200 OK`:**
```json
{
  "acknowledged": true,
  "taskStatus": "completed"
}
```

---

**`POST /tasks/:id/log`** — Stream a log entry for a running task

```
Auth:  Bearer <jwt>
Rate:  Up to 10/second (batched)
```

**Request:**
```json
{
  "nodeId": "n_abc123def456",
  "timestamp": "2026-06-28T12:05:00Z",
  "level": "info",
  "step": "clone",
  "message": "Cloning repository nandal/dum360..."
}
```

**Response `201 Created`:**
```json
{
  "acknowledged": true,
  "logCount": 47
}
```

**Log Levels:** `debug | info | warn | error`

---

#### 1.3 Operator-Facing Endpoints

Endpoints for the dashboard, CLI, and external integrations.

---

**`GET /health`** — Server health check

```
Auth: None
```

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 86400,
  "db": "connected",
  "redis": "connected",
  "nodes": { "online": 3, "offline": 1, "busy": 2 }
}
```

---

**`GET /nodes`** — List all registered nodes

```
Auth:    Optional (X-API-Key)
Query:   ?status=online&executor=github
```

**Response `200 OK`:**
```json
{
  "nodes": [
    {
      "nodeId": "n_abc123def456",
      "name": "macbook-pro-m2",
      "status": "busy",
      "version": "0.1.0",
      "resources": {
        "cpu": { "used": 50, "total": 16 },
        "ram": { "used": "32GB", "total": "64GB" }
      },
      "executors": ["github"],
      "services": ["claude", "codex"],
      "currentTask": "t_xyz789abc012",
      "lastHeartbeat": "2026-06-28T12:00:00Z",
      "registeredAt": "2026-06-28T10:00:00Z"
    },
    {
      "nodeId": "n_def456ghi789",
      "name": "linux-build-box",
      "status": "online",
      "version": "0.1.0",
      "resources": {
        "cpu": { "used": 5, "total": 32 },
        "ram": { "used": "8GB", "total": "128GB" }
      },
      "executors": ["github", "docker"],
      "services": ["claude", "gemini"],
      "currentTask": null,
      "lastHeartbeat": "2026-06-28T11:59:45Z",
      "registeredAt": "2026-06-28T09:30:00Z"
    }
  ],
  "total": 2
}
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `online`, `offline`, `busy` |
| `executor` | string | Filter by executor ID (e.g., `github`) |

---

**`GET /nodes/:id`** — Get detailed node information

```
Auth: Optional (X-API-Key)
```

**Response `200 OK`:**
```json
{
  "nodeId": "n_abc123def456",
  "name": "macbook-pro-m2",
  "status": "busy",
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
  "currentTask": "t_xyz789abc012",
  "taskHistory": {
    "total": 47,
    "completed": 42,
    "failed": 5
  },
  "lastHeartbeat": "2026-06-28T12:00:00Z",
  "registeredAt": "2026-06-28T10:00:00Z"
}
```

---

**`POST /tasks`** — Create a new task (manual submission)

```
Auth:      X-API-Key (operator)
Body:      JSON
Idempotent: X-Idempotency-Key header supported
```

**Request:**
```json
{
  "executor": "github",
  "repository": "nandal/dum360",
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
      { "id": "gh" }
    ]
  },
  "timeout": 3600,
  "priority": "normal"
}
```

**Response `201 Created`:**
```json
{
  "taskId": "t_xyz789abc012",
  "status": "queued",
  "executor": "github",
  "repository": "nandal/dum360",
  "createdAt": "2026-06-28T12:01:00Z",
  "position": 3
}
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| `400` | Invalid task payload |
| `401` | Missing API key |
| `422` | Validation failed (see errors array) |

---

**`GET /tasks`** — List tasks

```
Auth:  Optional (X-API-Key)
Query: ?status=queued&executor=github&limit=20&offset=0
```

**Response `200 OK`:**
```json
{
  "tasks": [
    {
      "taskId": "t_xyz789abc012",
      "executor": "github",
      "status": "running",
      "repository": "nandal/dum360",
      "nodeId": "n_abc123def456",
      "createdAt": "2026-06-28T12:01:00Z",
      "startedAt": "2026-06-28T12:02:00Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `queued`, `running`, `completed`, `failed`, `cancelled` |
| `executor` | string | Filter by executor type |
| `nodeId` | string | Filter by assigned node |
| `repository` | string | Filter by repo (e.g., `nandal/dum360`) |
| `limit` | int | Max results (default 20, max 100) |
| `offset` | int | Pagination offset |

---

**`GET /tasks/:id`** — Get full task detail

```
Auth: Optional (X-API-Key)
```

**Response `200 OK`:**
```json
{
  "taskId": "t_xyz789abc012",
  "executor": "github",
  "status": "completed",
  "repository": "nandal/dum360",
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
      { "id": "gh" }
    ]
  },
  "timeout": 3600,
  "nodeId": "n_abc123def456",
  "nodeName": "macbook-pro-m2",
  "artifacts": {
    "branch": "dum360/t_xyz789abc012",
    "prUrl": "https://github.com/nandal/dum360/pull/99",
    "commitSha": "a1b2c3d4e5f6",
    "diff": "+120/-45 across 3 files",
    "testResults": {
      "passed": 42,
      "failed": 0,
      "skipped": 0
    }
  },
  "duration": 287,
  "createdAt": "2026-06-28T12:01:00Z",
  "startedAt": "2026-06-28T12:02:00Z",
  "completedAt": "2026-06-28T12:06:47Z"
}
```

---

**`DELETE /tasks/:id`** — Cancel a queued or running task

```
Auth: X-API-Key
```

**Response `200 OK`:**
```json
{
  "taskId": "t_xyz789abc012",
  "status": "cancelled",
  "previousStatus": "queued"
}
```

**Error Responses:**
| Code | Meaning |
|------|---------|
| `404` | Task not found |
| `409` | Task already in terminal state (completed/failed) |
| `401` | Missing API key |

---

#### 1.4 Webhook Endpoints

**`POST /webhook/github`** — GitHub webhook receiver

```
Auth:      HMAC (X-Hub-Signature-256)
Source IP: GitHub hook IP ranges (validated)
```

**Supported Events:**

| Event | Action | Behavior |
|-------|--------|----------|
| `issue_comment` | `created` | Parse `@dum360` command → create task |
| `issues` | `opened` | If body contains `@dum360` → create task |
| `pull_request_review_comment` | `created` | If body contains `@dum360` → create task |

**Trigger format:**
```
@dum360 fix this issue
@dum360 review this PR
@dum360 run tests and open PR
```

**Response `202 Accepted`:**
```json
{
  "accepted": true,
  "tasksCreated": 1,
  "tasks": ["t_xyz789abc012"]
}
```

**Response `200 OK` (no action):**
```json
{
  "accepted": true,
  "tasksCreated": 0,
  "reason": "no @dum360 command found"
}
```

---

#### 1.5 WebSocket API

Live streaming connections for real-time updates.

**`WS /ws/tasks/:id`** — Live task log stream

```
Auth: Optional (X-API-Key as query param)
```

**Server → Client messages:**
```json
{ "type": "log", "timestamp": "...", "level": "info", "step": "clone", "message": "Cloning..." }
{ "type": "log", "timestamp": "...", "level": "info", "step": "ai", "message": "Invoking Claude..." }
{ "type": "status", "status": "running", "timestamp": "..." }
{ "type": "status", "status": "completed", "timestamp": "...", "artifacts": {...} }
{ "type": "error", "message": "Task timed out", "timestamp": "..." }
```

---

**`WS /ws/nodes`** — Live node status feed

```
Auth: Optional (X-API-Key as query param)
```

**Server → Client messages:**
```json
{ "type": "node_online", "nodeId": "n_abc123", "name": "macbook-pro-m2", "timestamp": "..." }
{ "type": "node_offline", "nodeId": "n_def456", "name": "linux-box", "timestamp": "..." }
{ "type": "node_busy", "nodeId": "n_abc123", "taskId": "t_xyz789", "timestamp": "..." }
{ "type": "node_idle", "nodeId": "n_abc123", "timestamp": "..." }
```

---

#### 1.6 Server API — Node Registration Flow

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
Server runs capability attestation probes
    │
    ▼
Server returns:
  { nodeId, jwt, heartbeatInterval: 15, pollInterval: 5,
    attestedCapabilities, failedAttestations }
    │
    ▼
Node becomes "online"
    │
    ▼
Heartbeat every 15s → POST /heartbeat
  Payload: { nodeId, status, resources, runningTasks, version }
    │
    ▼
Poll for work every 5s → GET /tasks/next
    │
    ▼
Server updates availability from heartbeats
```

---

#### 1.7 Registration Security

Node registration is the trust bootstrap point. The server requires a **pre-shared registration token** (configured via Docker secret `registration_token`). Without it, registration is rejected with `401 Unauthorized`.

```
Registration token → Server validates → Node gets JWT
```

This prevents unauthorized actors from:
- Registering rogue nodes
- Flooding the system with fake registrations
- Impersonating legitimate workers

---

#### 1.8 Capability Attestation

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
5. The registration response includes both `attestedCapabilities` and `failedAttestations`

Capabilities that fail attestation are **dropped** — the node cannot receive tasks requiring them.

---

#### 1.9 Heartbeat & Node Liveness

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

---

#### 1.10 Repository Access Delegation

A node's local `GITHUB_TOKEN` may not have access to every repository. To guarantee access:

1. The server holds a **GitHub App installation token** (central, scoped to the org/repos DUM360 is installed on)
2. When assigning a task to a node, the server:
   - Verifies the GitHub App installation covers the target repository
   - Generates a **short-lived installation access token** for that repository
   - Includes the token (`repoToken`) in the task payload sent to the node via `GET /tasks/next`
3. The node uses this delegated token for `git clone`, `git push`, and `gh pr create`
4. Token expires after `tokenExpiresAt` — invalid after use

This ensures:
- No central GitHub token is stored on nodes
- Server controls which repos a task can access
- Tokens are ephemeral and per-task

---

### 2. DUM360 Node API

Each node exposes a **local HTTP API** on port `9090` for health checks, monitoring, and operational control. This API is **not exposed to the internet** — it is bound to `127.0.0.1` by default.

#### 2.1 Authentication

The Node API is intended for local access only. No authentication is required by default (localhost-only binding). For production, an optional `NODE_API_KEY` can be set to require a bearer token.

#### 2.2 Health & Status

**`GET /health`** — Node health check

```
Auth: None (localhost)
```

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 3600,
  "serverConnected": true,
  "serverUrl": "http://dum360-server:8080",
  "currentTask": "t_xyz789abc012",
  "git": { "available": true, "version": "2.43.0" },
  "docker": { "available": true, "version": "26.0.0" },
  "aiProviders": {
    "claude": { "available": true, "version": "2.0.0" },
    "codex": { "available": true, "version": "1.5.0" },
    "gemini": { "available": false, "reason": "binary not found" }
  }
}
```

---

**`GET /status`** — Full node status and resource snapshot

```
Auth: None (localhost)
```

**Response `200 OK`:**
```json
{
  "nodeId": "n_abc123def456",
  "name": "macbook-pro-m2",
  "status": "busy",
  "version": "0.1.0",
  "serverUrl": "http://dum360-server:8080",
  "serverConnected": true,
  "lastHeartbeat": "2026-06-28T12:00:00Z",
  "uptime": 3600,
  "resources": {
    "cpu": { "used": 50, "total": 16, "percent": 50.0 },
    "ram": { "used": "32GB", "total": "64GB", "percent": 50.0 },
    "disk": { "used": "120GB", "total": "1TB", "percent": 12.0 }
  },
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
  "currentTask": {
    "taskId": "t_xyz789abc012",
    "executor": "github",
    "repository": "nandal/dum360",
    "startedAt": "2026-06-28T12:02:00Z",
    "elapsed": 287
  }
}
```

---

**`GET /capabilities`** — List current capabilities with attestation status

```
Auth: None (localhost)
```

**Response `200 OK`:**
```json
{
  "executors": [
    { "id": "github", "attested": true }
  ],
  "resources": [
    { "id": "cpu", "value": 16, "attested": true },
    { "id": "ram", "value": "64GB", "attested": true }
  ],
  "tools": [
    { "id": "git", "attested": true },
    { "id": "gh", "attested": true },
    { "id": "docker", "attested": false, "reason": "daemon not running" }
  ],
  "runtimes": [
    { "id": "go", "version": "1.25", "attested": true },
    { "id": "python", "version": "3.13", "attested": true }
  ],
  "services": [
    { "id": "claude", "attested": true },
    { "id": "codex", "attested": true },
    { "id": "gemini", "attested": false, "reason": "binary not found" }
  ]
}
```

#### 2.3 Operational Control

**`POST /capabilities/refresh`** — Re-detect local capabilities

```
Auth: None (localhost)
```

Scans the local environment for tools, runtimes, and services. Updates the internal capability set. Does **not** automatically re-attest — use `POST /register/refresh` for that.

**Response `200 OK`:**
```json
{
  "detected": true,
  "changes": {
    "added": [{ "id": "rust", "version": "stable" }],
    "removed": [],
    "updated": []
  }
}
```

---

**`POST /register/refresh`** — Re-register with the server (re-attest capabilities)

```
Auth: None (localhost)
```

Sends a fresh `POST /register` to the server with current capabilities. Useful after installing new tools or when attestation previously failed.

**Response `200 OK`:**
```json
{
  "registered": true,
  "nodeId": "n_abc123def456",
  "attestedCapabilities": { "..." },
  "failedAttestations": []
}
```

---

**`GET /logs`** — Retrieve recent local node logs

```
Auth:  None (localhost)
Query: ?tail=100&level=error
```

**Response `200 OK`:**
```json
{
  "logs": [
    {
      "timestamp": "2026-06-28T12:05:00Z",
      "level": "info",
      "message": "Task t_xyz789abc012 completed successfully"
    },
    {
      "timestamp": "2026-06-28T12:02:00Z",
      "level": "info",
      "message": "Received task t_xyz789abc012 from server"
    }
  ],
  "total": 2
}
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `tail` | int | Last N log lines (default 50, max 500) |
| `level` | string | Filter: `debug`, `info`, `warn`, `error` |
| `since` | ISO8601 | Logs after this timestamp |

---

**`POST /config/reload`** — Reload node configuration

```
Auth: None (localhost)
```

Re-reads the node configuration file and environment variables. Does not restart the node.

**Response `200 OK`:**
```json
{
  "reloaded": true,
  "config": {
    "serverUrl": "http://dum360-server:8080",
    "nodeName": "macbook-pro-m2",
    "aiProvider": "claude",
    "heartbeatInterval": 15,
    "pollInterval": 5
  }
}
```

---

**`POST /shutdown`** — Graceful shutdown

```
Auth: None (localhost)
```

Finishes the current task (if any), sends a final heartbeat with `status: "offline"`, then exits.

**Response `202 Accepted`:**
```json
{
  "shuttingDown": true,
  "currentTask": "t_xyz789abc012",
  "message": "Will complete current task before shutdown"
}
```

If no task is running:
```json
{
  "shuttingDown": true,
  "currentTask": null,
  "message": "Shutting down immediately"
}
```

---

### 3. Executor Interface (Node Internal)

The executor interface is how the node runtime invokes different execution strategies. It is not an HTTP API — it is a **Go interface** implemented by each executor.

```go
// Executor is the standard interface all executors must implement.
type Executor interface {
    // ID returns the unique executor identifier (e.g., "github", "docker").
    ID() string

    // CanHandle checks whether this executor can process the given task.
    CanHandle(task Task) bool

    // Execute runs the task and returns the result.
    // The task payload is executor-specific and validated before execution.
    Execute(ctx context.Context, task Task, logFn func(LogEntry)) (*Result, error)

    // Probe performs a lightweight capability check.
    // Called during attestation to verify the executor is functional.
    Probe(ctx context.Context) error
}

// Task is a generic task payload.
type Task struct {
    TaskID       string            `json:"taskId"`
    Executor     string            `json:"executor"`
    Timeout      int               `json:"timeout"`
    Repository   string            `json:"repository"`
    Branch       string            `json:"branch"`
    Issue        IssueRef          `json:"issue"`
    Instructions string            `json:"instructions"`
    AIProvider   string            `json:"aiProvider"`
    RepoToken    string            `json:"repoToken"`
    TokenExpiry  time.Time         `json:"tokenExpiresAt"`
    Payload      json.RawMessage   `json:"payload,omitempty"`  // executor-specific
}

// Result is returned by Execute.
type Result struct {
    Status    TaskStatus          `json:"status"`
    Artifacts map[string]any      `json:"artifacts,omitempty"`
    Error     string              `json:"error,omitempty"`
    Duration  int                 `json:"duration"`
}
```

Each executor registers itself at startup:

```go
node.RegisterExecutor(&executors.GitHubExecutor{
    GitPath:  "/usr/bin/git",
    GHPath:   "/usr/bin/gh",
    WorkDir:  "/var/dum360/workspaces",
})
```

When the node receives a task, it dispatches to the matching executor:

```go
func (n *Node) executeTask(task Task) {
    executor := n.findExecutor(task.Executor)
    if executor == nil {
        n.reportFailure(task, "no executor found for: "+task.Executor)
        return
    }

    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(task.Timeout)*time.Second)
    defer cancel()

    result, err := executor.Execute(ctx, task, n.streamLog)
    if err != nil {
        n.reportFailure(task, err.Error())
        return
    }
    n.reportResult(task, result)
}
```

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
