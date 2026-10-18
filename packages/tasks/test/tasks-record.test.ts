import { describe, expect, it } from 'vitest';
import { checkPlan, checkTask, DEFAULT_PRIORITY, PLAN_STATUSES, PRIORITIES, TASK_STATUSES } from '../src/record.js';
import type { PlanRecord, Stamp, TaskRecord } from '../src/record.js';

/*
 * What a record may say.
 *
 * A record a person edited by hand can say anything, so every field is checked
 * before it reaches a tool. What is refused here is skipped on a read and
 * refused on a write, and one bad record costs itself and not the list.
 */

const stamp = (over: Partial<Stamp> = {}): Stamp => ({
  at: '2026-10-18T10:00:00.000Z',
  by: 'ana',
  in: 'ahp-session:/one',
  ...over,
});

const task = (over: Partial<TaskRecord> = {}): TaskRecord => ({
  id: 't1',
  title: 'Keep one task list',
  status: 'todo',
  priority: DEFAULT_PRIORITY,
  labels: ['tasks'],
  blockedBy: [],
  refs: [],
  created: stamp(),
  ...over,
});

const plan = (over: Partial<PlanRecord> = {}): PlanRecord => ({
  id: 'p1',
  scope: { kind: 'folder', folder: '/srv/work' },
  title: 'The host keeps one task list',
  goal: 'One list for every agent.',
  status: 'draft',
  refs: [],
  created: stamp(),
  ...over,
});

describe('a task record', () => {
  it('takes a task of every status and every priority', () => {
    for (const status of TASK_STATUSES) expect(checkTask(task({ status }))).toBeUndefined();
    for (const priority of PRIORITIES) expect(checkTask(task({ priority }))).toBeUndefined();
  });

  it('refuses a status or a priority it does not know', () => {
    expect(checkTask({ ...task(), status: 'later' })).toBe(
      'the status is "later", which is not one of todo, doing, blocked, review, done, dropped',
    );
    expect(checkTask({ ...task(), priority: 'urgent' })).toBe(
      'the priority is "urgent", which is not one of high, medium, low',
    );
  });

  it('keeps the long text in body and refuses more than one line in active or note', () => {
    expect(checkTask(task({ body: 'one\ntwo\nthree' }))).toBeUndefined();
    expect(checkTask({ ...task(), note: 'one\ntwo' })).toBe('note is more than one line');
    expect(checkTask({ ...task(), active: 'one\r\ntwo' })).toBe('active is more than one line');
    expect(checkTask(task({ note: 'one line', active: 'one line' }))).toBeUndefined();
  });

  it('takes a reviewed stamp with a verdict and refuses one anywhere else', () => {
    expect(checkTask(task({ reviewed: stamp({ verdict: 'approved' }) }))).toBeUndefined();
    expect(checkTask(task({ reviewed: stamp({ verdict: 'changes' }) }))).toBeUndefined();
    expect(checkTask({ ...task(), created: stamp({ verdict: 'approved' }) }))
      .toBe('created has a verdict, which only a reviewed stamp may carry');
    expect(checkTask(task({ reviewed: stamp({ verdict: 'maybe' as never }) })))
      .toBe('reviewed has the verdict "maybe", which is not one of approved, changes');
  });

  it('keeps the session and the folder as text, and a source with or without an id', () => {
    expect(checkTask(task({ session: 'ahp-session:/gone', folder: '/srv/work' }))).toBeUndefined();
    expect(checkTask(task({ source: { tool: 'claude' } }))).toBeUndefined();
    expect(checkTask(task({ source: { tool: 'claude', id: 'step-4' } }))).toBeUndefined();
    expect(checkTask(task({ source: { tool: 'claude', id: 4 } as never }))).toBe('source has an id that is not text');
  });

  it('refuses an id that is not t<n> and a missing stamp', () => {
    expect(checkTask({ ...task(), id: 'task-1' })).toBe('the id is not t<n>');
    expect(checkTask({ ...task(), created: undefined })).toBe('created is not a stamp');
  });
});

describe('a plan record', () => {
  it('takes a plan of every status', () => {
    for (const status of PLAN_STATUSES) expect(checkPlan(plan({ status }))).toBeUndefined();
  });

  it('refuses a status it does not know', () => {
    expect(checkPlan({ ...plan(), status: 'open' }))
      .toBe('the status is "open", which is not one of draft, active, done, dropped');
  });

  it('takes a scope of a folder, a bot or a session and refuses anything else', () => {
    expect(checkPlan(plan({ scope: { kind: 'folder', folder: '/srv/work' } }))).toBeUndefined();
    expect(checkPlan(plan({ scope: { kind: 'bot', bot: 'pilot' } }))).toBeUndefined();
    expect(checkPlan(plan({ scope: { kind: 'session', session: 'one' } }))).toBeUndefined();
    expect(checkPlan({ ...plan(), scope: { kind: 'session', session: '' } })).toBe('a session scope has no session');
    expect(checkPlan({ ...plan(), scope: { kind: 'team', team: 'backend' } })).toBe('scope is neither a folder, a bot nor a session');
    expect(checkPlan({ ...plan(), scope: '/srv/work' })).toBe('scope is neither a folder, a bot nor a session');
  });

  it('keeps its goal as the long text, and a reviewed verdict', () => {
    expect(checkPlan(plan({ goal: 'one\ntwo' }))).toBeUndefined();
    expect(checkPlan(plan({ reviewed: stamp({ verdict: 'changes' }) }))).toBeUndefined();
    expect(checkPlan({ ...plan(), approved: stamp({ verdict: 'approved' }) }))
      .toBe('approved has a verdict, which only a reviewed stamp may carry');
  });
});
