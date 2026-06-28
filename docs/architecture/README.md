# DUM360 — Architecture Overview

> **Status:** MVP architecture designed. 4 microservices, 3 ADRs, 107 files, 4,310 lines.

---

## System Overview

DUM360 pools trusted computing power into a remotely orchestrated AI execution mesh. A user assigns an AI task, the scheduler matches it to a capable node, and the node executes and reports back.

```
                          GitHub Webhook
                               │
                               ▼
                    ┌─────────────────────┐
                    │    API Gateway      │  :8080
                    │  Auth, Rate Limit,  │
                    │  Routing, WS        │
                    └──────┬──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Registry     │  │Orchestration │  │ Log Service  │
│ :8081        │  │ :8082        │  │ :8083        │
│              │  │              │  │              │
│ Nodes        │  │ Tasks        │  │ Log Ingest   │
│ Heartbeat    │  │ Scheduler    │  │ Log Query    │
│ Capabilities │  │ Webhooks     │  │ WS Streaming │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       └────────┬────────┘                  │
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌─────────────────┐
        │ PostgreSQL   │          │ Elasticsearch   │
        │ :5432        │          │ :9200           │
        │              │          │                 │
        │ registry.*   │          │ dum360-logs-*   │
        │ orchestration│          │                 │
        └──────────────┘          └────────┬────────┘
                                           │
                                   ┌───────┴───────┐
                                   │ Kibana :5601  │
                                   │ Log Dashboard │
                                   └───────────────┘

        ┌──────────────┐
        │ Redis :6379  │
        │ BullMQ Queues│
        │ Pub/Sub      │
        └──────────────┘
```

---

## Technology Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Runtime** | Node.js 22 | LTS, broad ecosystem |
| **Language** | TypeScript 5.x | Type safety across services |
| **Framework** | NestJS 11 | SOLID by design — modules, DI, guards, interceptors |
| **ORM** | Drizzle ORM | Type-safe SQL, declarative schemas, no codegen |
| **Database** | PostgreSQL 16 | Relational, proven, JSONB support |
| **Cache / Pub-Sub** | Redis 7 | BullMQ backend, service transport |
| **Job Queue** | BullMQ 5 | Task scheduling, liveness sweeps, repeatable jobs |
| **Log Storage** | Elasticsearch 8 | Purpose-built for append-heavy log workloads |
| **Log Visualization** | Kibana 8 | Production-grade dashboards |
| **Validation** | Zod 3 | Single source of truth — schemas → types → pipes |
| **Containerization** | Docker + Compose | 8-service deployment with secrets management |

See [ADR-001](decisions/ADR-001-technology-stack.md) for the full decision record with alternatives considered.

---

## Core Components

### 1. API Gateway (`:8080`)

Single entry point for nodes, operators, and GitHub webhooks.

**Responsibilities:**

- JWT validation for node requests (delegates to Passport strategy)
- Registration token validation for `/register`
- Optional API key validation for operator endpoints
- Request routing to downstream services via HTTP proxy
- Rate limiting (1 req/s on register, 100 req/s elsewhere)
- WebSocket upgrade for log streaming and node status
- Aggregated health check across all services

**Does not own:** business logic, database tables, or task execution.

### 2. Registry Service (`:8081`)

Node lifecycle management.

**Responsibilities:**

- Node registration with name uniqueness enforcement
- JWT issuance (7-day expiry, shared secret with Gateway)
- Capability catalog — shared across nodes, upserted on registration
- Capability attestation — MVP trusts self-declaration, post-MVP probes binaries
- Heartbeat processing — append-only time-series, updates node liveness
- Liveness sweep — BullMQ job every 5s, marks nodes offline after 45s silence

**Database:** `registry` schema — `nodes`, `capabilities`, `node_capabilities`, `attestation_results`, `heartbeats`
**Queue:** `liveness:sweep`

See [ADR-002](decisions/ADR-002-database-schemas.md) for schema design.

### 3. Orchestration Service (`:8082`)

Task management and scheduling.

**Responsibilities:**

- Task CRUD with validated state machine:

  ```
  queued → running → completed
          → cancelled     failed → queued (retry)
  ```

- GitHub webhook receiver — parses `@dum360` commands from issue comments
- Scheduler — PRD algorithm: capability match + utilization sort
- Task dispatch via BullMQ
- State transition audit trail — every change recorded in `task_state_transitions`
- Repository token delegation (GitHub App installation token per task)

**Database:** `orchestration` schema — `tasks`, `task_requirements`, `task_state_transitions`, `webhook_events`, `scheduler_assignments`
**Queue:** `task:dispatch`

### 4. Log Service (`:8083`)

ELK ingestion gateway.

**Responsibilities:**

- Log ingestion — validate, enrich, bulk-index to Elasticsearch
- Log query — search by task ID, level, time range
- WebSocket log streaming — 500ms ES polling, push to subscribed clients
- Index lifecycle — daily indices (`dum360-logs-YYYY.MM.DD`), auto-template

**Does not own:** PostgreSQL tables. All storage in Elasticsearch.
**Dependency:** Elasticsearch health check required for service healthy state.

See [ADR-003](decisions/ADR-003-logging-infrastructure.md) for the ELK decision.

---

## Shared Package (`@dum360/shared`)

Single source of truth consumed by all services via workspace protocol.

| Module | Contents |
|--------|----------|
| `types/` | TypeScript interfaces — `Node`, `Task`, `Capability`, `Heartbeat`, `LogEntry` |
| `schemas/` | Zod schemas — `registerNode`, `createTask`, `heartbeat`, `logEntry` with regex validation |
| `pipes/` | `ZodValidationPipe` — one-line schema validation in controllers |
| `auth/` | `JwtNodeGuard`, `RegistrationTokenGuard`, `ApiKeyGuard`, `JwtNodeStrategy` |
| `database/` | `DrizzleModule` — connection pool factory, configurable per service |
| `exceptions/` | `ErrorCode` enum, `AllExceptionsFilter` — normalized error responses |
| `constants/` | Heartbeat intervals, service ports, queue names, DB schemas |

---

## Data Flow

### Node Registration

```
Node ──POST /register──► Gateway ──forward──► Registry
       (Bearer <reg-token>)                   │
                                              ├─ Check name uniqueness
                                              ├─ Insert node row
                                              ├─ Upsert capabilities catalog
                                              ├─ Run attestation probes
                                              ├─ Sign JWT (<sub:nodeId>)
                                              └─ Return { nodeId, jwt, attested, failed }
```

### Task Execution (Happy Path)

```
1. User comments "@dum360 fix this" on GitHub Issue
2. GitHub ──webhook──► Gateway ──forward──► Orchestration
3. Orchestration: parse command, create task (status=queued)
4. Scheduler (every 5s):
   ├─ Get next queued task
   ├─ Query Registry for matching nodes (capability match)
   ├─ Sort by utilization
   └─ Assign to least-loaded node (status=running)
5. Node polls GET /tasks/next → receives task payload
6. Node executes GitHub executor pipeline
7. Node streams logs → POST /tasks/:id/log → Log Service → ES
8. Node reports result → PATCH /tasks/:id/result → Orchestration
9. Orchestration: transitions task → completed, records artifacts
```

### Node Failure Recovery

```
1. Liveness sweep (every 5s): node.lastHeartbeatAt > 45s ago
2. Registry: mark node offline
3. Post-MVP: publish event → Orchestration re-queues orphaned task
```

---

## Database Schema (PostgreSQL)

### `registry` Schema

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `nodes` | Registered nodes | `(status)`, `(last_heartbeat_at)`, `(status, last_heartbeat_at)` |
| `capabilities` | Capability catalog | `(category, name)` unique |
| `node_capabilities` | Node ↔ capability mapping | Composite PK `(node_id, capability_id)` |
| `attestation_results` | Immutable attestation audit | `(node_id)`, `(created_at)` |
| `heartbeats` | Append-only time series | `(node_id)`, `(received_at)` |

### `orchestration` Schema

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `tasks` | Task lifecycle | `(status, priority, position)`, `(status, node_id)`, `(repository)` |
| `task_requirements` | Capability requirements per task | `(task_id)`, `(capability_name)` |
| `task_state_transitions` | Immutable state audit | `(task_id)`, `(transitioned_at)` |
| `webhook_events` | GitHub webhook payloads | `(processed)`, `(repository)` |
| `scheduler_assignments` | Task ↔ node assignment log | `(task_id)`, `(deassigned_at)` |

---

## Queue Architecture (BullMQ / Redis)

| Queue | Service | Schedule | Purpose |
|-------|---------|----------|---------|
| `liveness:sweep` | Registry | Every 5s | Detect stale nodes, mark offline |
| `task:dispatch` | Orchestration | Every 5s | Run scheduling cycle, dispatch notifications |

---

## Deployment

```bash
# 1. Create secrets
mkdir -p secrets
echo "dumpass"       > secrets/postgres_password.txt
openssl rand -hex 32 > secrets/jwt_secret.txt
openssl rand -hex 32 > secrets/registration_token.txt
touch secrets/github_app_private_key.pem

# 2. Start everything
docker compose up

# 3. Verify
curl http://localhost:8080/health
# → { status: "healthy", services: { registry: "healthy", orchestration: "healthy", log: "healthy" } }

# 4. Access dashboards
# Kibana: http://localhost:5601
# Swagger: http://localhost:8080/api (when enabled)
```

---

## Architecture Decision Records

| ADR | Topic | Status |
|-----|-------|--------|
| [ADR-001](decisions/ADR-001-technology-stack.md) | Technology stack — NestJS, Drizzle, BullMQ, Redis Pub/Sub | Proposed |
| [ADR-002](decisions/ADR-002-database-schemas.md) | Database schemas — 10 tables across registry + orchestration | Proposed |
| [ADR-003](decisions/ADR-003-logging-infrastructure.md) | Logging infrastructure — ELK stack over PostgreSQL | Proposed |

---

## Open Architecture Decisions

| ID | Decision | Context |
|----|----------|---------|
| ADR-004 | Monorepo tooling | Turborepo vs Nx vs npm workspaces |
| ADR-005 | Service-to-service auth | mTLS vs API keys vs internal trust (MVP) |
| ADR-006 | API Gateway evolution | Stay NestJS vs migrate to Kong/Traefik |
| ADR-007 | Cross-service data access | Direct DB queries (MVP) vs HTTP API + caching |
| ADR-008 | Testing strategy | Vitest + Supertest with test containers |
| ADR-009 | CI/CD pipeline | GitHub Actions vs alternative |

---

## Getting Started by Skill Area

| Area | Skills | Start |
|------|--------|-------|
| Backend (Registry) | NestJS, Drizzle, PostgreSQL | `services/registry/src/` |
| Backend (Orchestration) | NestJS, Drizzle, state machines | `services/orchestration/src/` |
| Backend (Gateway) | NestJS, HTTP proxy, WebSocket | `services/gateway/src/` |
| Backend (Log) | NestJS, Elasticsearch, Socket.IO | `services/log/src/` |
| Shared Package | TypeScript, Zod, Passport | `packages/shared/src/` |
| Infrastructure | Docker, Compose, secrets | `docker-compose.yml` |
| Database | PostgreSQL, Drizzle Kit | `services/*/drizzle.config.ts` |
| Dashboard | React, Kibana embed | `:5601` |

---

*This document reflects the MVP architecture designed June 2026. See `docs/architecture/decisions/` for detailed decision records with alternatives considered and consequences analyzed.*
