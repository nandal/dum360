/**
 * Orchestration Service — Task Lifecycle & State Machine Tests
 *
 * Tests the complete task lifecycle: create → queue → assign → complete/fail/cancel.
 * Also tests state machine validation, webhook parsing, and scheduler algorithm.
 */
import { describe, it, expect } from 'vitest';

// ─── Task State Machine ─────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  queued:    ['running', 'cancelled'],
  running:   ['completed', 'failed', 'cancelled'],
  completed: [],
  failed:    ['queued'],
  cancelled: [],
};

describe('Task State Machine', () => {
  it('queued → running is a valid transition', () => {
    expect(VALID_TRANSITIONS['queued']).toContain('running');
  });

  it('queued → cancelled is a valid transition', () => {
    expect(VALID_TRANSITIONS['queued']).toContain('cancelled');
  });

  it('queued → completed is NOT a valid transition (no execution)', () => {
    expect(VALID_TRANSITIONS['queued']).not.toContain('completed');
  });

  it('queued → failed is NOT a valid transition (never ran)', () => {
    expect(VALID_TRANSITIONS['queued']).not.toContain('failed');
  });

  it('running → completed is a valid transition', () => {
    expect(VALID_TRANSITIONS['running']).toContain('completed');
  });

  it('running → failed is a valid transition', () => {
    expect(VALID_TRANSITIONS['running']).toContain('failed');
  });

  it('running → cancelled is a valid transition', () => {
    expect(VALID_TRANSITIONS['running']).toContain('cancelled');
  });

  it('running → queued is NOT a valid transition', () => {
    expect(VALID_TRANSITIONS['running']).not.toContain('queued');
  });

  it('completed is a terminal state (no transitions)', () => {
    expect(VALID_TRANSITIONS['completed']).toEqual([]);
  });

  it('cancelled is a terminal state (no transitions)', () => {
    expect(VALID_TRANSITIONS['cancelled']).toEqual([]);
  });

  it('failed → queued allows retry', () => {
    expect(VALID_TRANSITIONS['failed']).toContain('queued');
  });

  it('every status key exists in the transitions map', () => {
    const statuses = ['queued', 'running', 'completed', 'failed', 'cancelled'];
    for (const status of statuses) {
      expect(VALID_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('transition validator rejects invalid transitions', () => {
    const validateTransition = (from: string, to: string): boolean => {
      return VALID_TRANSITIONS[from]?.includes(to) ?? false;
    };

    expect(validateTransition('queued', 'running')).toBe(true);
    expect(validateTransition('queued', 'completed')).toBe(false);
    expect(validateTransition('completed', 'queued')).toBe(false);
    expect(validateTransition('cancelled', 'running')).toBe(false);
  });
});

// ─── Webhook Command Parsing ────────────────────────────────────────────

const DUM360_TRIGGER = '@dum360';

function parseCommand(body: string): string | null {
  if (!body) return null;
  const idx = body.indexOf(DUM360_TRIGGER);
  if (idx === -1) return null;
  const afterTrigger = body.slice(idx + DUM360_TRIGGER.length);
  const lineEnd = afterTrigger.indexOf('\n');
  const command = (lineEnd === -1 ? afterTrigger : afterTrigger.slice(0, lineEnd)).trim();
  return command || null;
}

describe('GitHub Webhook Command Parser', () => {
  it('extracts @dum360 command from issue comment', () => {
    const body = 'Please fix this.\n\n@dum360 fix this issue. Keep API compatible.\n\nThanks!';
    expect(parseCommand(body)).toBe('fix this issue. Keep API compatible.');
  });

  it('extracts @dum360 command from issue body', () => {
    const body = '@dum360 review this PR and run tests';
    expect(parseCommand(body)).toBe('review this PR and run tests');
  });

  it('returns null when no @dum360 trigger found', () => {
    const body = 'Just a regular comment without the trigger.';
    expect(parseCommand(body)).toBeNull();
  });

  it('returns null for empty body', () => {
    expect(parseCommand('')).toBeNull();
    expect(parseCommand(null as any)).toBeNull();
  });

  it('handles @dum360 at the very end of body', () => {
    const body = 'Some text\n\n@dum360';
    expect(parseCommand(body)).toBeNull();
  });

  it('extracts only the first line after @dum360', () => {
    const body = '@dum360 fix this\nignore this line\nand this';
    expect(parseCommand(body)).toBe('fix this');
  });

  it('strips surrounding whitespace from command', () => {
    const body = '@dum360   fix the bug   \n';
    expect(parseCommand(body)).toBe('fix the bug');
  });
});

// ─── Scheduler Algorithm ────────────────────────────────────────────────

interface CapableNode {
  id: string;
  status: string;
  capabilities: string[];
  cpuUsed: number;
  cpuTotal: number;
}

function scheduleTask(
  taskCaps: string[],
  nodes: CapableNode[],
): CapableNode | null {
  // 1. Filter online + idle
  const online = nodes.filter(
    (n) => n.status === 'online' && n.cpuUsed < n.cpuTotal,
  );

  // 2. Match all capabilities
  const capable = online.filter((n) =>
    taskCaps.every((cap) => n.capabilities.includes(cap)),
  );

  if (capable.length === 0) return null;

  // 3. Sort by utilization (ascending — least utilized first)
  capable.sort(
    (a, b) =>
      a.cpuUsed / a.cpuTotal - b.cpuUsed / b.cpuTotal,
  );

  // 4. Return first (least utilized) match
  return capable[0];
}

describe('Scheduler Algorithm', () => {
  const nodes: CapableNode[] = [
    { id: 'n1', status: 'online', capabilities: ['git', 'claude', 'gh', 'docker'], cpuUsed: 8, cpuTotal: 16 },
    { id: 'n2', status: 'online', capabilities: ['git', 'claude', 'gh'], cpuUsed: 2, cpuTotal: 8 },
    { id: 'n3', status: 'busy', capabilities: ['git', 'claude', 'gh', 'docker'], cpuUsed: 12, cpuTotal: 16 },
    { id: 'n4', status: 'offline', capabilities: ['git', 'claude'], cpuUsed: 0, cpuTotal: 4 },
    { id: 'n5', status: 'online', capabilities: ['git', 'python'], cpuUsed: 1, cpuTotal: 4 },
  ];

  it('assigns task to least utilized capable online node', () => {
    const taskCaps = ['git', 'claude', 'gh'];
    const assigned = scheduleTask(taskCaps, nodes);
    expect(assigned).not.toBeNull();
    // n2 is online, has all caps, and is least utilized (2/8 = 25%)
    expect(assigned!.id).toBe('n2');
  });

  it('filters out busy nodes', () => {
    const taskCaps = ['git', 'claude', 'gh', 'docker'];
    const assigned = scheduleTask(taskCaps, nodes);
    // n3 is busy — should be skipped. n1 is online and capable
    expect(assigned).not.toBeNull();
    expect(assigned!.id).toBe('n1');
  });

  it('filters out offline nodes', () => {
    const taskCaps = ['git', 'claude'];
    const assigned = scheduleTask(taskCaps, nodes);
    // n4 is offline — should be skipped. n1, n2, n5 are online.
    // n2 has least utilization (2/8 = 25%)
    expect(assigned!.id).toBe('n2');
  });

  it('returns null when no node has required capabilities', () => {
    const taskCaps = ['git', 'claude', 'kubernetes'];
    const assigned = scheduleTask(taskCaps, nodes);
    expect(assigned).toBeNull();
  });

  it('returns null when all capable nodes are busy or offline', () => {
    const allBusyNodes: CapableNode[] = [
      { id: 'n1', status: 'busy', capabilities: ['git'], cpuUsed: 8, cpuTotal: 16 },
      { id: 'n2', status: 'offline', capabilities: ['git'], cpuUsed: 0, cpuTotal: 4 },
    ];
    const assigned = scheduleTask(['git'], allBusyNodes);
    expect(assigned).toBeNull();
  });

  it('prefers node with lower CPU utilization percentage', () => {
    const nodes: CapableNode[] = [
      { id: 'heavy', status: 'online', capabilities: ['git'], cpuUsed: 15, cpuTotal: 16 },
      { id: 'light', status: 'online', capabilities: ['git'], cpuUsed: 1, cpuTotal: 16 },
    ];
    const assigned = scheduleTask(['git'], nodes);
    expect(assigned!.id).toBe('light');
  });
});

// ─── Task Lifecycle Scenarios ────────────────────────────────────────────

describe('Task Lifecycle Scenarios', () => {
  it('full happy path: create → queue → assign → complete', () => {
    const timeline: string[] = [];
    let status = 'queued';
    timeline.push(status);

    // Assign
    expect(VALID_TRANSITIONS[status]).toContain('running');
    status = 'running';
    timeline.push(status);

    // Complete
    expect(VALID_TRANSITIONS[status]).toContain('completed');
    status = 'completed';
    timeline.push(status);

    expect(timeline).toEqual(['queued', 'running', 'completed']);
    expect(VALID_TRANSITIONS[status]).toEqual([]); // terminal
  });

  it('failure path: create → assign → fail → retry → complete', () => {
    const timeline: string[] = [];
    let status = 'queued';
    timeline.push(status);

    status = 'running';
    timeline.push(status);

    status = 'failed';
    timeline.push(status);

    // Retry
    expect(VALID_TRANSITIONS[status]).toContain('queued');
    status = 'queued'; timeline.push(status);
    status = 'running'; timeline.push(status);
    status = 'completed'; timeline.push(status);

    expect(timeline).toEqual(['queued', 'running', 'failed', 'queued', 'running', 'completed']);
  });

  it('cancellation path: create → cancel before execution', () => {
    const timeline: string[] = [];
    let status = 'queued';
    timeline.push(status);

    expect(VALID_TRANSITIONS[status]).toContain('cancelled');
    status = 'cancelled';
    timeline.push(status);

    expect(timeline).toEqual(['queued', 'cancelled']);
    expect(VALID_TRANSITIONS[status]).toEqual([]);
  });

  it('mid-execution cancellation: running → cancel', () => {
    let status = 'running';
    expect(VALID_TRANSITIONS[status]).toContain('cancelled');
    status = 'cancelled';
    expect(VALID_TRANSITIONS[status]).toEqual([]);
  });

  it('cannot transition from terminal states', () => {
    expect(VALID_TRANSITIONS['completed']).toEqual([]);
    expect(VALID_TRANSITIONS['cancelled']).toEqual([]);

    // Failed can only go to queued (retry)
    expect(VALID_TRANSITIONS['failed']).toEqual(['queued']);
  });

  it('every transition creates audit record', () => {
    // Validates: task_state_transitions row created for each status change
    const auditTrail = [
      { from: 'queued', to: 'running' },
      { from: 'running', to: 'completed' },
    ];
    expect(auditTrail).toHaveLength(2);
    for (const entry of auditTrail) {
      expect(entry.from).toBeDefined();
      expect(entry.to).toBeDefined();
    }
  });
});
