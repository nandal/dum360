# DUM360 Audit — Test Coverage & Type Safety

**Date:** 2026-06-28
**Tests Run:** 178 passed, 0 failed, 10 test files

---

## 1. Test Execution Results

```
✓ services/registry/test/registration.test.ts (18 tests) 4ms
✓ test/integration/flows/task-lifecycle-flow.test.ts (22 tests) 7ms
✓ test/integration/flows/http-integration.test.ts (26 tests) 3ms
✓ test/integration/security.test.ts (21 tests) 7ms
✓ services/orchestration/test/state-machine.test.ts (18 tests) 4ms
✓ services/node/test/executor.test.ts (17 tests) 16ms
✓ services/orchestration/test/webhook-scheduler.test.ts (13 tests) 3ms
✓ test/integration/flows/registration-flow.test.ts (9 tests) 3ms
✓ services/node/test/node-poller.test.ts (4 tests) 2ms
✓ packages/shared/test/schema-validation.test.ts (30 tests) 5ms

Test Files  10 passed (10)
     Tests  178 passed (178)
```

**Warnings:** executor.test.ts lines 106-108 have 3 unawaited `expect().resolves` assertions (Vitest 3 compatibility warning).

---

## 2. Coverage Patterns per Test File

### A. `packages/shared/test/schema-validation.test.ts` — 30 tests

- **What it covers:** All 5 Zod schemas validated with `safeParse` — registration, task creation, heartbeat, task result, log entry.
- **Edge cases covered:** Empty name, max length (129 chars), missing `executors`, shell injection (`; DROP TABLE`, `$(rm -rf /)`, `` `cat /etc/passwd` ``), invalid AI provider, invalid executor, timeout boundaries (30, 100000), empty instructions, missing UUID, negative CPU, zero total CPU, negative duration, invalid status, invalid log level, empty message, invalid timestamp.
- **Correct:** Good depth. The only test file that imports from `test/fixtures/mock-data.ts`.
- **Note:** The `invalidInputs` fixture object is imported at line 19 but never actually used in any test case — dead import. The individual fixture values (`validRegisterRequest`, etc.) are used directly.

### B. `services/registry/test/registration.test.ts` — 18 tests

- **What it covers:** Registration flow logic, heartbeat processing, liveness sweep algorithm, rate limiting — all as pure-logic checks against constants/plain objects.
- **Pattern:** Checks structure shapes (e.g. `expect(response.acknowledged).toBe(true)`), deduplication logic with `Set`, time-threshold arithmetic.
- **Missing:** No HTTP integration (no supertest calls, no NestJS testing module). No database interaction.

### C. `services/orchestration/test/state-machine.test.ts` — 18 tests

- **What it covers:** Valid/invalid state transitions against an inlined `VALID_TRANSITIONS` map. Happy path, failure+retry, cancel-before-execution, cancel-during-execution, terminal states.
- **Pattern:** Pure data structure validation. The test's `VALID_TRANSITIONS` constant is a copy of the one in `task-state-machine.ts`.
- **Risk:** If the source transitions map changes, tests won't catch the drift unless manually kept in sync.

### D. `services/orchestration/test/webhook-scheduler.test.ts` — 13 tests

- **What it covers:** Webhook command parser (`parseCmd` inline function), scheduler algorithm (`sched` inline function).
- **Pattern:** Inline implementations tested — not the actual source functions from `webhook.service.ts` or `scheduler.service.ts`.
- **Risk:** These are effectively algorithm sketches, not integration-verified logic.

### E. `services/node/test/executor.test.ts` — 17 tests

- **What it covers:** MockGitHubExecutor interface contract, capability detection structure, pipeline stages, task poller concurrency control, task result shapes.
- **Pattern:** Mock executor class defined inline. Tests structure and interface but no real I/O.
- **Warning (Vitest 3):** Lines 106-108: `expect(probe(...)).resolves.toBe(...)` not awaited.

### F. `services/node/test/node-poller.test.ts` — 4 tests

- **What it covers:** Heartbeat interval config, heartbeat payload structure, running task count, graceful shutdown payload.
- **Pattern:** Constant/value checks only.

### G. `test/integration/flows/http-integration.test.ts` — 26 tests

- **Status: Mostly placeholder stubs.** Of 26 tests:
  - 4 tests (in "Registry Service — HTTP Integration") have meaningful assertions on expected response shapes.
  - 22 tests are `expect(true).toBe(true)` with commented-out supertest/NestJS code.
- The `beforeAll` in the Registry block is entirely commented out. No app is spun up.

### H. `test/integration/flows/registration-flow.test.ts` — 9 tests

- **Status: Placeholder stubs.** All `beforeAll`/`afterAll` code is commented out. Tests assert on constant values (`expect(401).toBe(401)`). The flow descriptions in comments are thorough but no code executes them.

### I. `test/integration/flows/task-lifecycle-flow.test.ts` — 22 tests

- **Status: Mostly placeholder stubs.** Tests assert on flow shape objects and constants. All supertest calls are in comments. The flow documentation is detailed but not executed.

### J. `test/integration/security.test.ts` — 21 tests

- **What it covers:** Auth guards (Bearer token validation, expired JWT), input sanitization with regex patterns (`REPO_PATTERN`, `BRANCH_PATTERN`), AI provider allowlist, executor allowlist, task status enum validation, error response shape.
- **Correct:** Tests run actual regex patterns and enum checks against inline constants. This is the most substantive integration test file.

---

## 3. Identified Uncovered Code Paths

### 3.1 Gateway Proxy Logic — NOT TESTED

- **File:** `services/gateway/src/proxy/proxy.service.ts`
- **What's untested:** The `forward()` method that makes actual HTTP requests to downstream services. The entire proxy module has zero tests.
- **Also untested in gateway:**
  - `app.gateway.ts` — WebSocket gateway (connection/disconnect/subscribe/emit)
  - `controllers/node.controller.ts` — delegates to proxy
  - `controllers/operator.controller.ts` — delegates to proxy, health aggregation
  - `controllers/webhook.controller.ts` — webhook receiver
  - `middleware/rate-limit.middleware.ts` — in-memory rate limiter
- **No test directory exists at `services/gateway/test/`.**

### 3.2 Log Service Elasticsearch Client — NOT TESTED

- **File:** `services/log/src/elasticsearch/elasticsearch.service.ts`
- **What's untested:** `onModuleInit()` connection/ping, `indexLog()`, `bulkIndexLogs()`, `queryLogs()`, `isHealthy()`, `cleanupOldIndices()`, `ensureIndexTemplate()`.
- **Also untested in log service:**
  - `ingest/ingest.controller.ts` + `ingest/ingest.service.ts`
  - `query/query.controller.ts` + `query/query.service.ts`
  - `health/health.controller.ts`
  - `stream/stream.gateway.ts` + `stream/stream.service.ts`
- **No test directory exists at `services/log/test/`.**

### 3.3 BullMQ Queue Processors — NOT DIRECTLY TESTED

- **Liveness Processor:** `services/registry/src/liveness/liveness.processor.ts`
  - Tested indirectly: `registration.test.ts` tests liveness sweep threshold logic as pure time arithmetic.
  - **Not tested:** The BullMQ worker instantiation, job handling, repeatable job scheduling in `LivenessService.scheduleSweep()`.
- **Scheduler Processor:** `services/orchestration/src/scheduler/scheduler.processor.ts`
  - Tested indirectly: `webhook-scheduler.test.ts` tests an inline `sched()` function (not the actual SchedulerService).
  - **Not tested:** The BullMQ worker, the actual `SchedulerService.runCycle()`, `SchedulerService.scheduleCycle()`, the capabilities-matching SQL query with `ANY()`.

### 3.4 Node Agent ServerClient HTTP Logic — NOT TESTED

- **File:** `services/node/src/server-client.ts`
- **What's untested:** `register()`, `heartbeat()`, `pollForTask()`, `reportTaskResult()`, `uploadLog()`, the private `request()` helper with JWT header management, 401 handling, error parsing.
- **Also untested:** `services/node/src/capabilities.ts` — actual binary probing with `execSync`.
- **Also untested:** `services/node/src/poller.ts` — the `poll()` and `executeTask()` methods with real async execution flow and log upload callbacks.

### 3.5 Zod Validation Pipe Edge Cases — NOT UNIT TESTED

- **File:** `packages/shared/src/pipes/zod-validation.pipe.ts`
- **What IS tested:** The underlying schemas via `schema-validation.test.ts` using `safeParse`.
- **What is NOT tested:** The pipe's NestJS `transform()` method, its error message formatting (`issue.path.join(".")`), the `BadRequestException` shape, or how it integrates with controllers.

### 3.6 Integration Flow Tests — MOSTLY PLACEHOLDER STUBS

- **File:** `test/integration/flows/http-integration.test.ts`
  - 22 of 26 tests are `expect(true).toBe(true)`.
  - The `beforeAll` block that would spin up a NestJS app is entirely commented out.
- **File:** `test/integration/flows/registration-flow.test.ts`
  - All 9 tests assert on constant values (`expect(401).toBe(401)`, `expect(409).toBe(409)`).
  - The NestJS `beforeAll`/`afterAll` blocks are fully commented out.
  - The flow documentation in comments is excellent — but no code executes it.
- **File:** `test/integration/flows/task-lifecycle-flow.test.ts`
  - Similar pattern: assertions on flow shape objects and constants. Super test calls all in comments.

---

## 4. Type Safety Audit

### 4.1 Unsafe `as T` Casts on HTTP Responses (Blocker)

- **`services/gateway/src/proxy/proxy.service.ts:64`**

  ```ts
  if (response.status === 204) return undefined as T;
  ```

- **`services/gateway/src/proxy/proxy.service.ts:66`**

  ```ts
  return (await response.json()) as T;
  ```

- **`services/node/src/server-client.ts:119`**

  ```ts
  if (response.status === 204) return undefined as T;
  ```

- **`services/node/src/server-client.ts:130`**

  ```ts
  return (await response.json()) as T;
  ```

**Risk:** These trust the downstream service to return exactly the expected shape. A schema drift between services would produce runtime errors masquerading as type-safe code. No Zod validation is applied after the HTTP response.

### 4.2 Unsafe `as TaskStatus` Casts in Task Mapper

- **`services/orchestration/src/tasks/task-mapper.ts:20`**

  ```ts
  status: row.status as TaskStatus,
  ```

- **`services/orchestration/src/tasks/task-mapper.ts:47-48`**

  ```ts
  fromStatus: t.fromStatus as TaskStatus,
  toStatus: t.toStatus as TaskStatus,
  ```

**Risk:** If the database contains an unexpected status value (due to migration drift or manual DB edit), the cast silently coerces an invalid string into the `TaskStatus` union type. The state machine's `VALID_TRANSITIONS` lookup would then fail at runtime with an undefined key access.

### 4.3 Unsafe `as TaskArtifacts` Cast

- **`services/orchestration/src/tasks/task-mapper.ts:31`**

  ```ts
  artifacts: (row.artifacts ?? {}) as TaskArtifacts,
  ```

**Risk:** A JSON blob from the database is cast directly to `TaskArtifacts` with no structural validation.

### 4.4 Non-Null Assertions Without Runtime Guards

- **`services/node/src/server-client.ts:48`**

  ```ts
  nodeId: this.nodeId!,
  ```

  `this.nodeId` is `string | null`. If `heartbeat()` is called before `register()`, this will pass `null` as `nodeId` silently.
- **`services/orchestration/src/tasks/task-state-machine.ts:108-111`**

  ```ts
  ...toTask(row!),
  repoToken: row!.repoToken ?? undefined,
  ```

  `row` comes from a separate DB query (`loadDetail`) that can return undefined if the task was deleted between calls. The `!` suppresses the null check.
- **`services/log/src/elasticsearch/elasticsearch.service.ts:112`**

  ```ts
  const logs = result.hits.hits.map((hit) => hit._source!);
  ```

  Elasticsearch's `_source` can be `undefined` for certain query types (e.g., `stored_fields` without `_source`).

### 4.5 `unknown` Types on WebSocket Emit Methods

- **`services/gateway/src/websocket/app.gateway.ts:53-57`**

  ```ts
  emitTaskLog(taskId: string, logEntry: unknown): void
  emitNodeStatus(nodeId: string, status: unknown): void
  ```

  Should use `LogDocument` and appropriate status types from `@dum360/shared`.

### 4.6 TypeScript Compilation Errors

Running `tsc --noEmit` from `services/gateway` reveals multiple build errors:

- **TS6059 (rootDir):** All imports from `@dum360/shared` fail because `packages/shared/src` is outside `services/gateway/src` rootDir. This affects every service.
- **TS2308 (duplicate exports):** Types `CreateTaskRequest`, `HeartbeatRequest`, `LogEntryRequest`, `RegisterNodeRequest`, `TaskResultRequest` are exported from both `./types` and `./schemas` in `packages/shared/src/index.ts`, causing ambiguity errors.
- **Missing `"type": "module"`:** `packages/shared/package.json` lacks `"type": "module"`, but all source files use ESM syntax. TypeScript flags these as CommonJS modules.

### 4.7 `as any` in Test Fixtures (Acceptable)

- **`test/fixtures/mock-data.ts:127-129`**

  ```ts
  executor: "bitcoin_miner" as any,
  aiProvider: "evil_ai" as any,
  priority: "ultra" as any,
  ```

  These are in the `invalidInputs` object, explicitly testing invalid enum values. Acceptable for test code.

---

## 5. Test Fixture Consistency

### 5.1 Fixture Usage Across Test Files

- **Only 1 of 10 test files imports from `test/fixtures/mock-data.ts`:**
  - `packages/shared/test/schema-validation.test.ts` — imports all 6 fixture objects
- **Other test files do NOT use the shared fixtures:**
  - `services/orchestration/test/state-machine.test.ts` — inlines `VALID_TRANSITIONS`
  - `services/orchestration/test/webhook-scheduler.test.ts` — inlines `parseCmd`, `sched`, and Node array
  - `services/registry/test/registration.test.ts` — constructs test data inline
  - `services/node/test/executor.test.ts` — defines `MockGitHubExecutor` inline
  - `services/node/test/node-poller.test.ts` — constructs heartbeat objects inline
  - All integration tests — use inline constants/commented-out supertest calls
  - `test/integration/security.test.ts` — inlines all regex patterns and allowlists

### 5.2 Dead Import

- **`packages/shared/test/schema-validation.test.ts:19`** imports `invalidInputs` from mock-data but never references it in any test. The `invalidInputs` object (lines 117-130 of mock-data.ts) is dead code at the test level.

### 5.3 Duplicate Test Data

- The `VALID_TRANSITIONS` map appears in both:
  - `services/orchestration/src/tasks/task-state-machine.ts` (source)
  - `services/orchestration/test/state-machine.test.ts` (test copy)
- The `parseCmd` function is inlined in `webhook-scheduler.test.ts` rather than importing/using the one from `webhook.service.ts`.
- The `sched` function is inlined in `webhook-scheduler.test.ts` rather than testing the actual `SchedulerService.runCycle()`.

---

## 6. Integration Flow Test Analysis

### `test/integration/flows/http-integration.test.ts` (26 tests)

| Block | Tests | Real Assertions | `expect(true).toBe(true)` |
|-------|-------|-----------------|---------------------------|
| Registry Service HTTP | 9 | 1 (health response shape) | 8 |
| Orchestration Service HTTP | 8 | 0 | 8 |
| API Gateway HTTP | 3 | 1 (health shape) | 2 |
| Log Service HTTP | 3 | 0 | 3 |
| Database Schema Isolation | 3 | 2 (table lists) | 1 |
| **Total** | **26** | **4** | **22** |

**Verdict:** This file is 85% placeholder stubs. The `beforeAll` hook that would instantiate NestJS apps is fully commented out. No supertest HTTP assertions actually execute.

### `test/integration/flows/registration-flow.test.ts` (9 tests)

- All 9 tests assert on constant values (`expect(401).toBe(401)`, etc.).
- The `beforeAll`/`afterAll` NestJS setup is fully commented out.
- Flow documentation in comments is excellent but not executed.

### `test/integration/flows/task-lifecycle-flow.test.ts` (22 tests)

- Tests assert on flow shape objects and constants.
- All actual supertest calls are in comments.
- From a test execution perspective, these don't exercise HTTP, database, or queue logic.

---

## 7. Test-to-Service Coverage Matrix

| Service | Source Files | Test Files | Tests | Coverage Assessment |
|---------|-------------|------------|-------|---------------------|
| **Gateway** | 10 files | **0** | **0** | ⛔ Zero coverage |
| **Registry** | 11 files | 1 file | 18 | ⚠️ Logic only; no HTTP/DB/queue |
| **Orchestration** | 11 files | 2 files | 31 | ⚠️ Inline algorithm tests only; no service/DB/queue |
| **Log** | 10 files | **0** | **0** | ⛔ Zero coverage |
| **Node Agent** | 9 files | 2 files | 21 | ⚠️ Interface/structure tests only; no HTTP client or real I/O |
| **Shared** | 20 files | 1 file | 30 | ✅ Schemas well-tested; pipes/guards/filters not unit-tested |
| **Integration** | — | 4 files | 78 | ⛔ 85% placeholder stubs (`expect(true).toBe(true)`) |

---

## Summary of Findings

### Blocker

1. **Gateway + Log services have zero tests** — 20 source files across 2 microservices with no test coverage.
2. **85% of integration flow tests are `expect(true).toBe(true)` stubs** — The CI pipeline shows 178 passing tests, but most integration tests are no-ops.
3. **TypeScript compilation fails** — rootDir config is broken across all services; duplicate type exports in shared package; missing `"type": "module"` in shared package.json. The project cannot be typechecked.

### Correct

- Zod schema validation tests are thorough (30 tests covering edge cases, shell injection, boundary values).
- Security test file exercises regex patterns and allowlists against real data.
- State machine transition logic is well-documented and tested (though via a copy of the transitions map).
- Test runner executes successfully (Vitest 3.x, 178/178 pass).

### Fixed

- None (no modifications made per instructions).

### Note

1. **Vitest 3 deprecation warning** in `executor.test.ts:106-108` — 3 `expect().resolves` assertions need `await`.
2. **Fixture underutilization** — `test/fixtures/mock-data.ts` has 8 exports but only 1 test file uses them. The `invalidInputs` export is imported but never used.
3. **Inline algorithm copies** — Tests redefine functions (`parseCmd`, `sched`, `VALID_TRANSITIONS`) instead of importing from source, risking drift.
4. **The `x-idempotency-key` header** is referenced in `operator.controller.ts` but no test validates idempotent task creation.
5. **The `LOG_RETENTION_DAYS` constant** is used in `cleanupOldIndices()` but the function always returns 0 — it's a known MVP stub with a TODO comment about ILM policies.
6. **WebSocket gateways** in both `gateway` and `log` services have no tests for connection, subscription, or message emission.

---

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Full audit completed: ran vitest (178/178 pass), reviewed all 10 test files, inspected all 61 source files across 5 services + shared package, checked type safety (as casts, non-null assertions, unknown types, compilation errors), verified fixture usage, and analyzed integration flow test quality. No files modified."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "npx vitest run",
      "result": "passed",
      "summary": "178 tests passed across 10 files in 965ms; 3 Vitest 3 unawaited promise warnings in executor.test.ts"
    },
    {
      "command": "npx tsc --noEmit (services/gateway)",
      "result": "failed",
      "summary": "Multiple TS6059 rootDir errors, TS2308 duplicate export errors in shared package — project cannot typecheck"
    }
  ],
  "validationOutput": [
    "10/10 test files pass (178 tests)",
    "2/4 microservices (gateway, log) have zero test files",
    "3/4 integration flow test files are 85%+ placeholder stubs (expect(true).toBe(true))",
    "4 unsafe 'as T' casts on HTTP responses (proxy.service.ts, server-client.ts)",
    "3 unsafe 'as TaskStatus' casts in task-mapper.ts",
    "5 non-null assertions on nullable values (poller.ts, server-client.ts, task-state-machine.ts, elasticsearch.service.ts)",
    "2 'unknown' type parameters on websocket emit methods (app.gateway.ts)",
    "TypeScript build: broken — rootDir misconfiguration + duplicate type exports"
  ],
  "residualRisks": [
    "Gateway proxy logic completely untested — all routing/auth/proxy decisions unverified",
    "Log service Elasticsearch client untested — no guarantee index/query/cleanup works",
    "Node agent ServerClient HTTP layer untested — register/heartbeat/poll/result/log calls unverified",
    "Integration tests are non-functional stubs — CI green light is misleading",
    "TypeScript compilation errors block any production build"
  ],
  "noStagedFiles": true,
  "diffSummary": "No files modified — audit only",
  "reviewFindings": [
    "blocker: services/gateway/ — entire service has zero tests (10 source files)",
    "blocker: services/log/ — entire service has zero tests (10 source files)",
    "blocker: test/integration/flows/http-integration.test.ts — 22 of 26 tests are expect(true).toBe(true) stubs",
    "blocker: test/integration/flows/registration-flow.test.ts — all 9 tests are no-op constant assertions",
    "blocker: test/integration/flows/task-lifecycle-flow.test.ts — all supertest calls in comments, no real HTTP assertions",
    "blocker: packages/shared/src/index.ts — TS2308 duplicate type exports (CreateTaskRequest, HeartbeatRequest, etc. from both ./types and ./schemas)",
    "blocker: services/*/tsconfig.json — rootDir './src' excludes packages/shared/src, causing TS6059 across all services",
    "blocker: packages/shared/package.json — missing 'type': 'module' for ESM source files",
    "note: services/node/src/server-client.ts:48 — nodeId! non-null assertion without null guard",
    "note: services/orchestration/src/tasks/task-mapper.ts:20,47,48 — as TaskStatus casts without validation",
    "note: services/log/src/elasticsearch/elasticsearch.service.ts:112 — hit._source! non-null assertion on ES response",
    "note: services/node/test/executor.test.ts:106-108 — 3 unawaited expect().resolves (Vitest 3 deprecation)",
    "note: test/fixtures/mock-data.ts:19 — invalidInputs imported but never used in schema-validation.test.ts",
    "note: 8 of 10 test files don't use shared test/fixtures/mock-data.ts — data duplicated inline"
  ],
  "manualNotes": "The 178 passing tests give a false sense of security. Only schema-validation.test.ts (30 tests) and security.test.ts (21 tests) exercise actual code paths. The remaining 127 tests are either pure-data-structure checks or no-op stubs. Priority remediation order: (1) fix TypeScript build, (2) add gateway/log service tests, (3) uncomment/flush-out integration flow tests with real supertest + NestJS testing module, (4) add ServerClient and Elasticsearch client tests."
}
```
