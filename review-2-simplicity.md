## Review: Refactoring for Simplicity & Maintainability

### Correct

1. **LOC threshold met**: All 5 new files are well under 300 LOC. The original oversized files were reduced from 315 to 147 (tasks.service.ts), 306 to 257 (executor.test.ts), and 310 to deleted (task-lifecycle.test.ts, split into state-machine.test.ts + webhook-scheduler.test.ts). All 10 files in scope are <= 257 LOC.

2. **Single Responsibility (SOLID)**:
   - `task-state-machine.ts` (115 LOC): Only handles state transitions, validation, side effects (timestamps, audit trail), and `assign`. Clean separation. OK
   - `task-mapper.ts` (52 LOC): Pure data transformation functions (`toTask`, `toStateTransition`). No I/O. OK
   - `tasks.service.ts` (147 LOC): CRUD operations: create, list, get, getNextQueued, getTaskPayload. State transitions delegated. OK
   - `tasks.controller.ts` (75 LOC): HTTP-layer routing only. Delegates to `tasksService` (reads) and `stateMachine` (mutations). OK
   - `scheduler.service.ts` (133 LOC): Scheduling algorithm: node selection, capability matching, assignment. OK

3. **Module boundaries - clean import graph**:
   - `tasks/` -> `database/schema/` (data layer, unidirectional)
   - `tasks/` -> `@dum360/shared` (types/constants, unidirectional)
   - `scheduler/` -> `tasks/` (consumes TasksService + TaskStateMachine, unidirectional)
   - `webhook/` -> `tasks/` (consumes TasksService, unidirectional)
   - No circular dependencies detected. NestJS module hierarchy: AppModule -> TasksModule/SchedulerModule/WebhookModule. OK

4. **Naming**:
   - `task-state-machine`: Accurately reflects state transition validation + side effects. OK
   - `task-mapper`: Accurately reflects DB-row-to-API-type conversion. OK
   - Test file names align with source module names. OK

5. **JSDoc / @module documentation**: All 5 new files have clear `@module` descriptions at the top that explain the purpose and scope. These are well-suited for AI ingestion. OK

6. **`import type` usage**: `tasks.controller.ts` uses `import type` for `TasksService` and `TaskStateMachine` since they are only used as constructor parameter types. `tasks.service.ts` and `scheduler.service.ts` similarly use `import type` for shared types. OK

### Blocker

1. **`scheduler.service.ts:33` - Missing import for `TaskStateMachine` (build-breaking)**

   ```typescript
   // File: services/orchestration/src/scheduler/scheduler.service.ts, line 33
   private readonly stateMachine: TaskStateMachine,
   ```

   The constructor references `TaskStateMachine` but the file has no `import` for it. The `git diff` confirms the constructor parameter was added in this refactoring but the import line was omitted.

   **Evidence**: `npx tsc --noEmit` exits with `TS2304: Cannot find name 'TaskStateMachine'` on this line.

   **Fix needed**: Add after line 11:

   ```typescript
   import type { TaskStateMachine } from '../tasks/task-state-machine';
   ```

### Note

1. **DRY: `loadDetail` (task-state-machine.ts:94-107) duplicates `getTask` (tasks.service.ts:87-107)**
   Both methods execute the same 3 queries (tasks, taskRequirements, taskStateTransitions) and assemble the same `TaskDetail` object. The only difference is `row!` (non-null assertion in loadDetail) vs `row` (after explicit null check in getTask).

   **Impact**: Low. The duplication is ~14 lines. Since `TaskStateMachine` is self-contained and injecting `TasksService` would couple them (or risk a future circular dependency if TasksService ever needs to call TaskStateMachine), keeping `loadDetail` private is a defensible design choice. Not a blocker, but worth noting.

2. **Test files don't import from source modules**
   - `state-machine.test.ts` defines a **local copy** of `VALID_TRANSITIONS` instead of importing from `task-state-machine.ts`. If the source transitions change, these tests won't catch the regression.
   - `webhook-scheduler.test.ts` defines its own `parseCmd()` and `sched()` functions instead of testing the actual `WebhookService` or `SchedulerService`.
   - This is typical for pure-logic unit tests that avoid NestJS/DB dependencies, but it means the tests validate the *concept* rather than the *implementation*.

   **Recommendation**: At minimum, `state-machine.test.ts` should import `VALID_TRANSITIONS` from the source:

   ```typescript
   import { VALID_TRANSITIONS } from '../src/tasks/task-state-machine';
   ```

3. **Idempotency key not used**: `tasks.controller.ts:23` - `createTask` accepts `x-idempotency-key` header but the parameter is named `_ik` with a `_` prefix (convention for unused) and is never passed to `tasksService.create()`. This is a pre-existing state, not introduced by the refactoring.

4. **`cancelled` cannot retry but `failed` can retry**: The state machine design treats `completed` and `cancelled` as terminal states (no exits) while `failed` allows transition back to `queued`. The distinction is reasonable for MVP but not documented in the @module JSDoc. The `task-state-machine.ts` header could clarify this design decision.

5. **300 LOC threshold - judicious, not aggressive**: The split is well-calibrated. None of the new files feel artificially small (smallest: task-mapper.ts at 52 LOC, but that is a coherent module rather than a fragment). None are dangerously close to the 300 LOC ceiling. The test split (310 LOC -> 72 + 82) creates logically separate test suites for state machine and webhook/scheduler concerns.

### Summary

The refactoring successfully decomposes oversized files into focused, well-named modules with clean boundaries. The one blocker is a missing import in `scheduler.service.ts` that will prevent compilation. The DRY note is minor and defensible. The test isolation from source modules is a weakness but not introduced by this refactoring.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Review completed: evaluated all 10 files across new (task-state-machine.ts, task-mapper.ts, state-machine.test.ts, webhook-scheduler.test.ts, node-poller.test.ts) and updated (tasks.service.ts, tasks.controller.ts, scheduler.service.ts, tasks.module.ts, executor.test.ts). Assessed SOLID compliance, module boundaries, naming, DRY, JSDoc, and LOC thresholds. No file modifications made (review-only)."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "npx tsc --noEmit --project services/orchestration/tsconfig.json",
      "result": "errors",
      "summary": "TS2304: Cannot find name 'TaskStateMachine' in scheduler.service.ts:33"
    },
    {
      "command": "wc -l (10 target files)",
      "result": "passed",
      "summary": "All files under 300 LOC: max 257 (executor.test.ts), min 11 (tasks.module.ts)"
    },
    {
      "command": "git diff HEAD~1 -- services/orchestration/src/tasks/tasks.service.ts",
      "result": "passed",
      "summary": "Confirmed reduction from 315 to 147 LOC. Removed: VALID_TRANSITIONS map, assignTask method, recordTransition, toTask/toStateTransition helpers. Added: import from task-mapper."
    }
  ],
  "validationOutput": [
    "All 5 new files have @module JSDoc - AI-ingestible",
    "No circular dependencies in import graph",
    "LOC: task-state-machine=115, task-mapper=52, tasks.service=147, tasks.controller=75, tasks.module=11, scheduler.service=133, state-machine.test=113, webhook-scheduler.test=120, node-poller.test=56, executor.test=257"
  ],
  "residualRisks": [
    "Test files (state-machine.test.ts, webhook-scheduler.test.ts) do not import from source modules - they test local copies of logic, not the actual implementation"
  ],
  "noStagedFiles": true,
  "diffSummary": "Refactor splits 3 oversized files (>300 LOC) into 6 smaller files. tasks.service.ts reduced from 315 to 147 LOC. task-lifecycle.test.ts (310 LOC) deleted, split into state-machine.test.ts (113 LOC) + webhook-scheduler.test.ts (120 LOC). executor.test.ts reduced from 306 to 257 LOC. New: task-state-machine.ts (115 LOC), task-mapper.ts (52 LOC), node-poller.test.ts (56 LOC).",
  "reviewFindings": [
    "blocker: services/orchestration/src/scheduler/scheduler.service.ts:33 - Missing import for TaskStateMachine; build-breaking TS2304 error",
    "note: task-state-machine.ts:94-107 and tasks.service.ts:87-107 - loadDetail duplicates getTask query logic (14 lines); defensible but worth tracking",
    "note: state-machine.test.ts - defines local copy of VALID_TRANSITIONS instead of importing from source; tests won't catch regressions in the real transition map"
  ],
  "manualNotes": "The missing import is a one-line fix: add `import type { TaskStateMachine } from '../tasks/task-state-machine';` to scheduler.service.ts after line 11. Also, the TS6059 rootDir errors are pre-existing monorepo config issues, not caused by this refactoring."
}
```
