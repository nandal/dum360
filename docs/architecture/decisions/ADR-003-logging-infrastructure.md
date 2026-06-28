# ADR-003: Logging Infrastructure — ELK Stack

**Status:** Proposed
**Date:** 2026-06-28
**Deciders:** System Architect, CEO
**Depends on:** ADR-001 (Technology Stack), ADR-002 (Database Schemas)
**Supersedes:** ADR-001 §Log Service (PostgreSQL → Elasticsearch)

---

## Context

ADR-001 originally scoped a **Log Service** with PostgreSQL storage for task log entries with WebSocket streaming. The PRD specifies:

- Nodes upload log entries via `POST /tasks/:id/log`
- Server stores them for retrieval and streaming
- Dashboard displays real-time task logs

PostgreSQL is not an ideal log store — it's a row-oriented relational database, not a time-series append-optimized engine. Building log search, aggregation, retention, and visualization from scratch duplicates what mature open-source observability stacks already solve.

**Requirement:** Use an existing production-grade logging system instead of building our own.

---

## Decision

**ELK Stack** (Elasticsearch + Logstash + Kibana) for all DUM360 log storage, querying, and visualization.

```
Node                     Log Service            Elasticsearch         Kibana
  │                          │                      │                   │
  │ POST /tasks/:id/log      │                      │                   │
  ├─────────────────────────►│                      │                   │
  │                          │                      │                   │
  │                     Validate JWT                │                   │
  │                     Parse + enrich              │                   │
  │                          │                      │                   │
  │                          │  Bulk index           │                   │
  │                          ├─────────────────────►│                   │
  │                          │                      │                   │
  │                          │                 Index: dum360-logs-*    │
  │                          │                 Sharded by day          │
  │                          │                      │                   │
  │                          │                      │     Query API     │
  │                          │                      │◄─────────────────┤
  │                          │                      │                   │
  │  WS /ws/tasks/:id        │                      │                   │
  │◄─────────────────────────┤                      │                   │
  │                     Poll ES for new logs         │                   │
```

### Stack Components

| Component | Role | Justification |
|-----------|------|---------------|
| **Elasticsearch** | Log storage, indexing, full-text search, aggregation | Purpose-built for time-series append-heavy workloads. Horizontally scalable. REST API. |
| **Kibana** | Log visualization, dashboards, ad-hoc queries | Production-grade UI for log exploration. Pre-built dashboards. Replaces need for custom log viewer in Dashboard. |
| **Logstash** | **Excluded from MVP** — optional log processing pipeline. Not needed when the Log Service already validates and enriches log entries. |
| **Log Service** | Thin ingestion gateway — receives logs from nodes, validates JWT, enriches with task metadata, bulk-indexes to Elasticsearch | Authentication boundary. Keeps Elasticsearch not exposed to nodes. |

### Why not Logstash in MVP?

- The Log Service already validates and enriches log entries (JWT check, task association, timestamp normalization)
- Logstash would add a JVM dependency and another service to manage
- Direct Elasticsearch bulk indexing from the Log Service is simpler and faster
- Post-MVP: add Logstash if log transformation needs grow beyond what the Log Service should handle

### Log Service Redesign

The Log Service becomes a **thin ingestion gateway** — no PostgreSQL tables. Its only responsibilities:

```
Log Service (port 8083)
├── POST /tasks/:id/log         # Receive log entry, validate JWT + task ownership, index to ES
├── GET  /tasks/:id/logs        # Query Elasticsearch for historical logs (proxied to Kibana in MVP)
└── WS   /ws/tasks/:id          # WebSocket — poll ES for new logs every 500ms, push to client
```

#### Elasticsearch Index Design

```
Index pattern:  dum360-logs-{YYYY.MM.DD}

Document mapping:
{
  "taskId":       "t_xyz789abc012",
  "nodeId":       "n_abc123def456",
  "timestamp":    "2026-06-28T12:05:00.000Z",
  "level":        "info",
  "step":         "clone",
  "message":      "Cloning repository nandal/dum360...",
  "metadata": {                                    // optional enrichment
    "repository": "nandal/dum360",
    "executor":   "github"
  }
}
```

**Index lifecycle (ILM):**

| Phase | Duration | Action |
|-------|----------|--------|
| Hot | 0-7 days | Active indexing, fast queries |
| Warm | 7-30 days | Reduced replicas, slower queries |
| Delete | 30+ days | Automatic cleanup |

MVP runs a single-node Elasticsearch — no ILM needed. Policy is applied at the application level: a BullMQ scheduled job deletes indices older than 30 days.

### Dashboard Integration

Kibana replaces the custom "Task Detail → Logs" page in the Dashboard:

- **Kibana Discover** — ad-hoc log exploration by task ID, level, step, timestamp
- **Kibana Dashboard** — pre-built views:
  - *Task Execution Timeline*: all logs for a task, color-coded by level
  - *Node Activity*: logs grouped by node, show task throughput
  - *Error Dashboard*: all `error` level logs, grouped by task/node
- **Kibana iframe embed** — the Dashboard SPA can embed Kibana views for seamless UX

### WebSocket Log Streaming

Nodes and operators expect real-time log streaming via WebSocket. With Elasticsearch:

```
Client opens WS /ws/tasks/:id
         │
         ▼
Log Service starts polling ES:
  GET dum360-logs-*/_search
  { query: { term: { taskId } },
    sort: { timestamp: "desc" },
    size: 50 }
         │
         ▼
Poll every 500ms while WS is open
         │
         ▼
Push new log entries to WS client as JSON frames
```

**Poll vs. Elasticsearch Changes API:** MVP uses polling (simpler, no ES plugin dependencies). Post-MVP: switch to Elasticsearch's `_changes` feed or WebSocket subscription for push-based streaming.

---

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **ELK Stack (chosen)** | Production-grade, purpose-built for logs, full-text search, Kibana dashboards, horizontal scaling, REST API, massive ecosystem | JVM footprint (Elasticsearch), operational complexity, additional Docker services | Best-in-class for log storage and visualization |
| PostgreSQL (original) | Already in stack, simple, no new infra | Not a log store — row-oriented, no full-text search, no visualization, custom WebSocket streaming required, retention = manual DELETE | Rejected: building a log system on PG duplicates ELK features |
| Grafana Loki | Lightweight, designed for logs, integrates with Grafana, lower resource usage | Smaller ecosystem than ELK, Grafana for visualization (less log-specific than Kibana), S3 dependency for production | Strong alternative. Rejected for MVP due to ELK's broader adoption and richer log-specific features |
| ClickHouse | Blazing fast analytics, columnar, great for log aggregation | Complex operations, smaller ecosystem, no built-in visualization (needs Grafana) | Overqualified for MVP log volume. Candidate if log volume exceeds Elasticsearch capacity |
| OpenSearch (AWS fork of ES) | API-compatible with ES, Apache 2.0 license | Smaller community, Kibana fork is less polished | Fallback if Elastic license becomes an issue |

---

## docker-compose Additions

```yaml
services:
  elasticsearch:
    image: elasticsearch:8.15.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false       # MVP: no auth on internal network
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"  # MVP memory budget
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200/_cluster/health"]
      interval: 10s
      retries: 5

  kibana:
    image: kibana:8.15.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy

  log-service:
    build: ./services/log
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - LOG_RETENTION_DAYS=30
    ports:
      - "8083:8083"
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  esdata:
```

---

## Consequences

### Positive

- **Production-grade log infrastructure.** Elasticsearch scales to terabytes of logs. Kibana provides professional visualization without writing a single UI component.
- **Full-text search.** `message` field is analyzed — operators can search for "connection refused" or "timeout" across all tasks.
- **Automatic retention.** ILM policies auto-delete old indices. No custom cleanup logic needed.
- **Separation of concerns.** Log Service owns transport/auth/routing. Elasticsearch owns storage/query. Kibana owns visualization.
- **PostgreSQL freed from log storage.** Removes the highest-write table from PostgreSQL, reducing bloat and vacuum pressure.

### Negative

- **JVM footprint.** Elasticsearch requires 512MB-1GB RAM minimum. Adds operational cost for small deployments.
- **Additional infrastructure.** 2 new Docker services (ES + Kibana) to manage, monitor, and back up.
- **WebSocket polling.** 500ms poll intervals add latency vs. direct push. Acceptable for MVP logs.
- **Elastic license changes.** Elasticsearch moved to SSPL/Elastic License. OpenSearch is the Apache 2.0 fallback if licensing becomes an issue.

### Neutral / Requires Attention

- **Kibana authentication.** MVP runs without auth (docker-compose internal network). Production must add Kibana auth (basic auth or SSO via reverse proxy).
- **Single-node ES in MVP.** No replication, no failover. Acceptable for MVP — add clustering post-MVP.
- **Log Service → ES retry logic.** The ingestion gateway must handle ES being temporarily unavailable (retry with backoff, dead-letter queue via Redis/BullMQ).

---

## References

- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Elasticsearch ILM](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [ADR-001: Technology Stack](./ADR-001-technology-stack.md)
- [ADR-002: Database Schemas](./ADR-002-database-schemas.md)
