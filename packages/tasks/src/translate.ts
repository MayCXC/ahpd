import { idOf } from '@ahpd/sdk';
import { DEFAULT_PRIORITY, isPriority } from './record.js';
import type { PlanRecord, Stamp, TaskRecord, TaskStatus } from './record.js';
import type { TaskStore } from './store.js';
import type { PlanUpdateEvent } from '@ahpd/sdk';

/**
 * A harness's list, written into the session's plan.
 *
 * A backend hands the host a whole list or one change, and the host raises it;
 * this is what the tasks plugin makes of it. The plan is the session's - one per
 * session, kept across turns - so every turn of a session writes the same
 * tasks. A whole list matches by text, and a step the list no longer holds is
 * dropped rather than removed: the record is the history of what the harness
 * asked for.
 *
 * Nothing here names a harness. A status is one of the four Claude and ACP
 * send, and a priority is the same `high`, `medium`, `low` a host task has.
 */

/** The host status each harness status means. */
const STATUSES: Record<string, TaskStatus> = {
  pending: 'todo',
  in_progress: 'doing',
  completed: 'done',
  deleted: 'dropped',
};

/** The host status a harness status means, or nothing where it is not one of the four. */
const statusOf = (status: string | undefined): TaskStatus | undefined => {
  if (status === undefined) return undefined;
  return Object.hasOwn(STATUSES, status) ? STATUSES[status] : undefined;
};

/**
 * The stamp a translated list writes.
 *
 * The event carries the session and who sent the turn, so the stamp says the
 * same thing a tool call's does: when it was written, who was behind it and
 * where. A turn nobody sent is stamped `host`.
 */
const stampOf = (event: PlanUpdateEvent): Stamp => ({
  at: new Date().toISOString(),
  by: event.sender ?? 'host',
  in: event.session,
});

/** Move a task to a status, writing the stamps the move writes. */
const move = (task: TaskRecord, status: TaskStatus, at: Stamp): void => {
  if (status === 'doing') {
    if (task.started === undefined) task.started = at;
  }
  else {
    // Nothing is being done once the task leaves doing.
    delete task.active;
  }
  if (status === 'review' || status === 'done' || status === 'dropped') {
    if (task.finished === undefined) task.finished = at;
  }
  task.status = status;
};

/**
 * The session's plan, made on the first list.
 *
 * A plan is called by the session's title, and `Session <id>` until the session
 * has one. A later list that brings a title renames the plan, so the plan keeps
 * the name the session has now. The goal stays empty: a harness's list is the
 * plan, and it says nothing about what the plan is for.
 */
const sessionPlan = async (store: TaskStore, event: PlanUpdateEvent): Promise<PlanRecord> => {
  const session = idOf(event.session);
  const found = (await store.plans()).find((one) =>
    one.scope.kind === 'session' && one.scope.session === session);
  const title = event.title === undefined || event.title.trim() === '' ? undefined : event.title;
  if (found !== undefined) {
    if (title !== undefined && found.title !== title) {
      found.title = title;
      await store.putPlan(found);
    }
    return found;
  }
  const plan: PlanRecord = {
    id: await store.nextPlanId(),
    scope: { kind: 'session', session },
    title: title ?? `Session ${session}`,
    goal: '',
    status: 'draft',
    refs: [],
    created: stampOf(event),
  };
  await store.putPlan(plan);
  return plan;
};

/**
 * Write a whole list: match by text, add what matches nothing, drop the rest.
 *
 * An entry takes the first task of the plan with its text that no earlier entry
 * took, so two steps that say the same thing keep their own records. An entry
 * that matches none is a task with `source` set to the tool and no id, because
 * a whole list names no id. A task the list does not hold is `dropped`, not
 * removed. A list cleared after every step was `done` drops nothing: that is a
 * harness tidying up, not a plan nobody wants.
 */
const writeList = async (
  store: TaskStore,
  plan: PlanRecord,
  event: PlanUpdateEvent,
  entries: NonNullable<PlanUpdateEvent['entries']>,
): Promise<void> => {
  const tasks = await store.tasksOf(plan.id);
  const held = new Set<string>();
  const stamp = stampOf(event);
  for (const entry of entries) {
    const status = statusOf(entry.status);
    const task = tasks.find((one) => !held.has(one.id) && one.title === entry.text);
    if (task !== undefined) {
      held.add(task.id);
      if (status !== undefined) move(task, status, stamp);
      if (isPriority(entry.priority)) task.priority = entry.priority;
      await store.putTask(task);
      continue;
    }
    const added: TaskRecord = {
      id: await store.nextTaskId(),
      title: entry.text,
      status: 'todo',
      priority: isPriority(entry.priority) ? entry.priority : DEFAULT_PRIORITY,
      labels: [],
      plan: plan.id,
      session: event.session,
      blockedBy: [],
      refs: [],
      source: { tool: event.tool },
      created: stamp,
    };
    if (status !== undefined) move(added, status, stamp);
    await store.putTask(added);
    tasks.push(added);
    held.add(added.id);
  }
  if (entries.length === 0 && tasks.every((one) => one.status === 'done')) return;
  for (const task of tasks) {
    if (held.has(task.id) || task.status === 'dropped') continue;
    move(task, 'dropped', stamp);
    await store.putTask(task);
  }
};

/**
 * Write one change: find its task by the harness's id, or add it.
 *
 * A change names no text it does not change, so a change to a task this plan
 * does not hold needs the text to add one. A change with no status leaves the
 * status where it is, and an added task starts `todo` as any task does.
 */
const writeChange = async (
  store: TaskStore,
  plan: PlanRecord,
  event: PlanUpdateEvent,
  change: NonNullable<PlanUpdateEvent['change']>,
): Promise<void> => {
  const tasks = await store.tasksOf(plan.id);
  const found = change.id === undefined
    ? undefined
    : tasks.find((one) => one.source?.id === change.id);
  const status = statusOf(change.status);
  const priority = isPriority(change.priority) ? change.priority : undefined;
  const stamp = stampOf(event);
  if (found !== undefined) {
    if (change.text !== undefined) found.title = change.text;
    if (status !== undefined) move(found, status, stamp);
    if (priority !== undefined) found.priority = priority;
    await store.putTask(found);
    return;
  }
  if (change.text === undefined) {
    throw new Error(`a ${event.tool} change names a task the plan ${plan.id} does not hold and says no text`);
  }
  const added: TaskRecord = {
    id: await store.nextTaskId(),
    title: change.text,
    status: 'todo',
    priority: priority ?? DEFAULT_PRIORITY,
    labels: [],
    plan: plan.id,
    session: event.session,
    blockedBy: [],
    refs: [],
    source: change.id === undefined ? { tool: event.tool } : { tool: event.tool, id: change.id },
    created: stamp,
  };
  if (status !== undefined) move(added, status, stamp);
  await store.putTask(added);
};

/** Write the plan update a backend handed the host. */
export async function writePlanList(store: TaskStore, event: PlanUpdateEvent): Promise<void> {
  const plan = await sessionPlan(store, event);
  if (event.change !== undefined) {
    await writeChange(store, plan, event, event.change);
    return;
  }
  await writeList(store, plan, event, event.entries ?? []);
}
