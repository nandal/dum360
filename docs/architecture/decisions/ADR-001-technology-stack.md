# ADR-001: Technology Stack — TypeScript Microservices

**Status:** Proposed
**Date:** 2026-06-28
**Deciders:** System Architect, CEO
**Supersedes:** PRD §System Components (Go → TypeScript pivot)

---

## Context

The [PRD](../PRD.md) originally specified Go for both `dum360-server` and `dum360-node` as a two-component monolith. After review, the following requirements emerged:

1. **Microservice architecture** — independently deployable services with clear bounded contexts
2. **SOLID + DRY** — enforced at the framework level, not just convention
3. **TypeScript** — shared language across services, strong typing, broad ecosystem
4. **ORM-based persistence** — SQLAlchemy-like approach: declarative models, migrations, query building, no raw SQL in application code
5. **Reliable queuing** — open-source, production-grade, supports task scheduling and async work distribution
6. **PostgreSQL** — retained from PRD (no change)
7. **Production-grade framework** — batteries-included, not assembled from scratch

This ADR selects the technology stack and decomposes the system into microservices.

---

## Decision

### Stack

| Layer | Choice | Version |
|-------|--------|---------|
| **Runtime** | Node.js | ≥22 LTS |
| **Language** | TypeScript | 5.x |
| **Framework** | NestJS | 11.x |
| **ORM** | Drizzle ORM | ≥0.40 |
| **Database** | PostgreSQL | 16 |
| **Cache / Pub-Sub** | Redis | 7 |
| **Job Queue** | BullMQ | 5.x |
| **Service Transport** | Redis Pub/Sub (NestJS microservices) | — |
| **API Documentation** | Swagger (NestJS OpenAPI) | — |
| **Validation** | Zod (via NestJS pipes) | 3.x |
| **Testing** | Vitest + Supertest | — |
| **Containerization** | Docker + docker-compose | — |

### Microservice Decomposition (4 services)

```
                        ┌─────────────────────┐
                        │    API Gateway       │
                        │  (NestJS standalone) │
                        │  Auth, Rate Limit,   │
                        │  Route, WebSocket    │
                        └──────┬──────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │ Redis Pub/Sub                       │
            │                                     │
    ┌───────┴────────┐  ┌──────────────┐  ┌──────┴───────┐
    │ Registry       │  │ Orchestration │  │ Log          │
    │ Service        │  │ Service      │  │ Service      │
    │                │  │              │  │              │
    │ • Registration │  │ • Task CRUD  │  │ • Ingest     │
    │ • Heartbeat    │  │ • Scheduling │  │ • Store      │
    │ • Capabilities │  │ • Webhooks   │  │ • Stream     │
    │ • Liveness     │  │ • Lifecycle  │  │ • Query      │
    └───────┬────────┘  └──────┬───────┘  └──────┬───────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                        ┌──────┴───────┐
                        │  PostgreSQL  │
                        │  (per-service│
                        │   schemas)   │
                        └──────────────┘
```

| Service | Port | Schema | Owns |
|---------|------|--------|------|
| API Gateway | 8080 | — | Routes, auth, WebSocket upgrade, rate limiting |
| Registry | 8081 | `registry` | Nodes, capabilities, heartbeats, attestation |
| Orchestration | 8082 | `orchestration` | Tasks, scheduling, webhook ingestion, task lifecycle |
| Log | 8083 | `log` | Task log entries, log queries, WebSocket log streaming |

**Why 4 services (not more, not fewer):**

- **API Gateway** — single entry point for nodes and operators. Separates routing/auth from business logic. Can become a proper API gateway (Kong, Traefik) later.
- **Registry** — node lifecycle is stable, low-write, read-heavy. Independent scaling from task execution.
- **Orchestration** — the hot path. Task creation, scheduling, assignment, status transitions. Needs independent scaling and deployment.
- **Log** — append-heavy, time-series workload. Different storage and query patterns from CRUD services. Can swap to ClickHouse/TimescaleDB later without touching other services.

---

## Alternatives Considered

### Language: Go vs TypeScript

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Go** | Fast, single binary, low memory, excellent concurrency | Smaller ecosystem for web frameworks, fewer developers, manual SQL | PRD choice, but lacks ORM/SOLID ecosystem |
| **TypeScript (chosen)** | Huge ecosystem, NestJS enforces SOLID, Drizzle ORM, shared types across services, faster iteration | Higher memory, cold starts, need Node.js runtime | Better fit for SOLID/DRY/ORM requirements |

### Framework

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **NestJS (chosen)** | SOLID by design (modules, DI, decorators), built-in microservice transports, OpenAPI, guards/interceptors/pipes, massive ecosystem | Opinionated, decorator-heavy, learning curve | Only TypeScript framework that enforces SOLID at the framework level |
| Fastify | Fast, lightweight, good plugin system | No built-in DI, no module system, no microservice transport — assemble yourself | Too much assembly required |
| Hono | Very fast, edge-ready, simple | Minimal — no DI, no ORM integration patterns, no built-in queuing | Great for edge, not for multi-service backends |
| Express | Universal, familiar | No structure, no DI, no microservice support, callback-based | Legacy choice |

### ORM

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Drizzle ORM (chosen)** | Type-safe, SQL-like API, excellent migrations, no codegen, lightweight, great NestJS integration | Newer ecosystem, fewer community recipes | SQLAlchemy-adjacent philosophy: declarative schema, query builder, raw SQL escape hatch |
| Prisma | Schema-first, great DX, auto-generated client | Heavy codegen step (binary), slow cold starts, limited for complex queries, migration issues at scale | Good for simple CRUD, frustrating for complex queries |
| TypeORM | Longest in market, decorators, ActiveRecord + DataMapper | Maintenance issues, buggy migrations, type safety gaps | Declining in favor of Drizzle/Prisma |
| MikroORM | Unit of Work, Identity Map, closest to SQLAlchemy/Hibernate | Smaller community, NestJS integration less mature than TypeORM | Closest philosophical match but ecosystem risk |

### Queue

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **BullMQ (chosen)** | Redis-based (already in stack), production-proven, job priorities, delayed jobs, concurrency control, TypeScript types, NestJS integration (`@nestjs/bullmq`) | Requires Redis, not a traditional message broker | Perfect fit: already have Redis, task scheduling is core to DUM360 |
| RabbitMQ | Mature, AMQP standard, many features | Additional infrastructure, operational complexity, TypeScript client less ergonomic | Overkill for MVP — BullMQ on Redis is simpler |
| NATS | Lightweight, high-performance, great for microservices | Additional infrastructure, smaller TypeScript ecosystem | Candidate for post-MVP when scale demands it |
| Apache Kafka | Enterprise streaming, replayable logs | Massive operational overhead, heavy JVM footprint | Not appropriate for MVP |

---

## Consequences

### Positive

- **SOLID enforced by framework.** NestJS modules = single responsibility, providers = dependency inversion, guards/interceptors = open/closed.
- **DRY through shared packages.** Common types, DTOs, auth guards, and middleware live in a `@dum360/shared` package consumed by all services.
- **Type-safe from database to API.** Drizzle schema → TypeScript types → Zod validation → NestJS DTOs = end-to-end type safety without manual type stubbing.
- **Independent deployability.** Each service has its own Dockerfile. Can deploy, scale, and rollback independently.
- **Migration path to full microservices.** Redis Pub/Sub can be swapped for NATS/Kafka later. Shared database can be split per-service. API Gateway can become Kong/Traefik. All changes are infrastructure-only, not code rewrites.
- **OpenAPI auto-generated.** NestJS Swagger decorators produce OpenAPI 3.0 specs at build time. No manual doc writing.

### Negative

- **Go → TypeScript pivot.** Loses single-binary deployment, low memory footprint, and goroutine concurrency model. Node.js workers + BullMQ compensate but are not equivalent.
- **4 services to manage vs 2 in PRD.** More Dockerfiles, more CI pipelines, more config. Acceptable given the microservice requirement.
- **nestjs CLI dependency.** Scaffolding uses `@nestjs/cli`. Not a runtime dependency, but a dev workflow dependency.
- **Drizzle is younger than Prisma.** Ecosystem risk is real but mitigated by Drizzle's strong adoption trajectory and active maintenance.

### Neutral / Requires Attention

- **Shared database (per-service schemas).** Pragmatic for MVP — avoids distributed transactions. Must enforce that services never cross schema boundaries at the application level. Schema isolation is by convention, not enforced by Postgres.
- **Redis Pub/Sub is at-most-once delivery.** Critical task state changes must be idempotent. BullMQ (Redis streams) provides at-least-once for task dispatching.
- **Service-to-service auth is deferred.** MVP uses internal network trust (docker-compose network). Post-MVP: mTLS or API key exchange between services.

---

## Package Structure

```
dum360/
├── packages/
│   └── shared/                  # @dum360/shared — types, DTOs, guards, pipes
│       ├── src/
│       │   ├── auth/            # JWT guard, registration-token guard
│       │   ├── dto/             # Shared DTOs (TaskStatus, Capability, etc.)
│       │   ├── types/           # TypeScript interfaces
│       │   ├── pipes/           # Zod validation pipes
│       │   └── database/        # Shared Drizzle connection factory
│       └── package.json
│
├── services/
│   ├── gateway/                 # API Gateway
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/            # Auth guards, JWT strategies
│   │   │   ├── proxy/           # Service proxies (Registry, Orchestration, Log)
│   │   │   └── websocket/       # WebSocket gateway for live logs/nodes
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── registry/                # Registry Service
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── nodes/           # Node CRUD, registration
│   │   │   ├── heartbeat/       # Heartbeat processing, liveness sweep
│   │   │   ├── capabilities/    # Capability store, attestation
│   │   │   └── database/        # Drizzle schema + migrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── orchestration/           # Orchestration Service
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── tasks/           # Task CRUD, lifecycle state machine
│   │   │   ├── scheduler/       # Capability matching, node assignment
│   │   │   ├── webhook/         # GitHub webhook receiver, command parser
│   │   │   ├── queue/           # BullMQ task queue consumer
│   │   │   └── database/        # Drizzle schema + migrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── log/                     # Log Service
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── ingest/          # Log ingestion endpoint
│       │   ├── stream/          # WebSocket log streaming
│       │   ├── query/           # Log query/retrieval
│       │   └── database/        # Drizzle schema + migrations
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml           # Full stack
├── turbo.json                   # Turborepo for monorepo orchestration
├── package.json                 # Root workspace
└── docs/
    ├── PRD.md
    └── architecture/
        └── decisions/
            └── ADR-001-technology-stack.md  ← this file
```

### Shared Package (`@dum360/shared`)

All services depend on `@dum360/shared` via workspace protocol (`"@dum360/shared": "workspace:*"`). Contains:

- **Type definitions** — `Node`, `Task`, `Capability`, `Heartbeat`, `LogEntry`, `TaskStatus`, `Executor`
- **Zod schemas** — `NodeSchema`, `TaskSchema`, `RegisterNodeSchema`, etc. (single source of truth for validation)
- **NestJS pipes** — `ZodValidationPipe` that validates request bodies against Zod schemas
- **Auth module** — `JwtAuthGuard`, `RegistrationTokenGuard`, `ApiKeyGuard` (shared across services)
- **Database module** — shared `DrizzleModule` with connection factory, configurable per service
- **DTOs** — NestJS-compatible DTO classes with Swagger decorators

### Database Schema Isolation

Each service owns its Drizzle schema in `src/database/schema/`. Migrations are per-service:

```
services/registry/src/database/
├── schema/
│   ├── nodes.ts          # nodes table
│   ├── heartbeats.ts     # heartbeats table
│   └── capabilities.ts   # attested capabilities
├── migrations/           # Generated by drizzle-kit
└── drizzle.config.ts
```

Tables are prefixed by service namespace (e.g., `registry.nodes`, `orchestration.tasks`) to prevent accidental cross-service joins. Application code must never query another service's tables directly — always go through the service API/transport.

---

## References

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Drizzle ORM](https://orm.drizzle.team)
- [BullMQ](https://bullmq.io)
- [NestJS + BullMQ Integration](https://docs.nestjs.com/techniques/queues)
- [DUM360 PRD](../PRD.md)
