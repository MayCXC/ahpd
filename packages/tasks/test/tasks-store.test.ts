import { describe, expect, it } from 'vitest';
import { memoryRecords } from '@ahpd/sdk';
import { taskStore } from '../src/store.js';
import { DEFAULT_PRIORITY } from '../src/record.js';
import type { PlanRecord, Stamp, TaskRecord } from '../src/record.js';
import type { TaskStoreOptions } from '../src/store.js';

/*
 * The store over the two collections.
 *
 * The bodies round-trip, the ids count up, a plan's tasks are the records that
 * name it, and the sweep takes a finished plan and its tasks once the plan has
 * sat for the setting's days. A record that is not one is reported and skipped.
 */

const stamp = (at: string, over: Partial<Stamp> = {}): Stamp => ({
  at,
  by: 'ana',
  in: 'ahp-session:/one',
  ...over,
});

const task = (over: Partial<TaskRecord> = {}): TaskRecord => ({
  id: 't1',
  title: 'Keep one task list',
  status: 'todo',
  priority: DEFAULT_PRIORITY,
  labels: [],
  blockedBy: [],
  refs: [],
  created: stamp('2026-10-18T10:00:00.000Z'),
  ...over,
});

const plan = (over: Partial<PlanRecord> = {}): PlanRecord => ({
  id: 'p1',
  scope: { kind: 'folder', folder: '/srv/work' },
  title: 'The host keeps one task list',
  goal: 'One list for every agent.',
  status: 'draft',
  refs: [],
  created: stamp('2026-10-18T10:00:00.000Z'),
  ...over,
});

/** A store over fresh in-memory collections, and the problems it reported. */
async function made(options?: TaskStoreOptions) {
  const records = memoryRecords();
  const problems: string[] = [];
  const store = taskStore(
    await records.collection('tasks', { body: 'body' }),
    await records.collection('plans', { body: 'goal' }),
    (line) => { problems.push(line); },
    options,
  );
  return { records, store, problems };
}

describe('the store', () => {
  it('answers the body of a task and the goal of a plan as they were kept', async () => {
    const { store } = await made();
    await store.putTask(task({ body: 'first line\nsecond line' }));
    await store.putPlan(plan({ goal: 'one\ntwo' }));
    expect((await store.task('t1'))?.body).toBe('first line\nsecond line');
    expect((await store.plan('p1'))?.goal).toBe('one\ntwo');
  });

  it('counts each collection up from its highest id', async () => {
    const { store } = await made();
    expect(await store.nextTaskId()).toBe('t1');
    expect(await store.nextPlanId()).toBe('p1');
    await store.putTask(task({ id: 't1' }));
    await store.putTask(task({ id: 't2' }));
    await store.putPlan(plan({ id: 'p1' }));
    expect(await store.nextTaskId()).toBe('t3');
    expect(await store.nextPlanId()).toBe('p2');
    // The number is counted, not the text: t9 is not past t10.
    await store.putTask(task({ id: 't10' }));
    expect(await store.nextTaskId()).toBe('t11');
  });

  it('finds the tasks of a plan by the plan they name', async () => {
    const { store } = await made();
    await store.putPlan(plan());
    await store.putTask(task({ id: 't1', plan: 'p1' }));
    await store.putTask(task({ id: 't2' }));
    await store.putTask(task({ id: 't3', plan: 'p1' }));
    expect((await store.tasksOf('p1')).map((one) => one.id)).toEqual(['t1', 't3']);
  });

  it('refuses a record that is not one on write, and reports and skips it on read', async () => {
    const { records, store, problems } = await made();
    await expect(store.putTask({ ...task(), status: 'later' } as never))
      .rejects.toThrow('task t1: the status is "later"');
    await store.putTask(task());
    // A hand edit, or a store that answers something else: the task is kept,
    // the bad record is reported, and the list goes on.
    await records.collection('tasks').then((one) => one.put({ id: 't2', title: 'no', status: 'todo' }));
    expect((await store.tasks()).map((one) => one.id)).toEqual(['t1']);
    expect(problems).toEqual(['task t2: the priority is undefined, which is not one of high, medium, low']);
  });

  it('keeps a done plan when the sweep is off', async () => {
    const { store } = await made();
    await store.putPlan(plan({ status: 'done', created: stamp('2020-01-01T00:00:00.000Z') }));
    expect(await store.sweep(new Date('2026-10-18T00:00:00.000Z'))).toEqual({ plans: [], tasks: [] });
    expect(await store.plan('p1')).toBeDefined();
  });

  it('removes an old finished plan and its tasks, and keeps the rest', async () => {
    const { store } = await made({ sweepAfterDays: 30 });
    await store.putPlan(plan({ id: 'p1', status: 'done', created: stamp('2020-01-01T00:00:00.000Z') }));
    await store.putPlan(plan({ id: 'p2', status: 'active', created: stamp('2020-01-01T00:00:00.000Z') }));
    await store.putPlan(plan({ id: 'p3', status: 'dropped', created: stamp('2020-01-01T00:00:00.000Z'), reviewed: stamp('2026-10-17T00:00:00.000Z') }));
    // A plan made long ago and approved a week ago is not old: its last stamp is.
    await store.putPlan(plan({ id: 'p4', status: 'done', created: stamp('2020-01-01T00:00:00.000Z'), approved: stamp('2026-10-11T00:00:00.000Z') }));
    await store.putTask(task({ id: 't1', plan: 'p1', created: stamp('2020-01-01T00:00:00.000Z') }));
    await store.putTask(task({ id: 't2', plan: 'p2' }));

    expect(await store.sweep(new Date('2026-10-18T00:00:00.000Z'))).toEqual({ plans: ['p1'], tasks: ['t1'] });
    expect((await store.plans()).map((one) => one.id)).toEqual(['p2', 'p3', 'p4']);
    expect((await store.tasks()).map((one) => one.id)).toEqual(['t2']);
  });
  it('counts from when a plan finished, and from its newest task', async () => {
    const { store } = await made({ sweepAfterDays: 30 });
    // Made long ago and set to done yesterday: it sat one day, not six years.
    await store.putPlan(plan({ id: 'p1', status: 'done', created: stamp('2020-01-01T00:00:00.000Z'), finished: stamp('2026-10-17T00:00:00.000Z') }));
    // Done long ago, with a task that moved yesterday.
    await store.putPlan(plan({ id: 'p2', status: 'done', created: stamp('2020-01-01T00:00:00.000Z') }));
    await store.putTask(task({ id: 't1', plan: 'p2', created: stamp('2020-01-01T00:00:00.000Z'), started: stamp('2026-10-17T00:00:00.000Z') }));

    expect(await store.sweep(new Date('2026-10-18T00:00:00.000Z'))).toEqual({ plans: [], tasks: [] });
  });
});
