import { idOf } from '@ahpd/sdk';
import type { PlanRecord, TaskRecord } from './record.js';
import type { TaskStore } from './store.js';

/**
 * A session's plan as a turn draws it.
 *
 * The plan of a session is the plan whose scope is the session, plus the tasks
 * whose `session` field names it: a translation writes a task with the session
 * channel, while the plan's scope keeps the bare id, so both spellings are the
 * same session here. A task a translation wrote also names the plan it went
 * into, which is what a plan's own tasks are found by.
 *
 * The lines are a view of the records and never a second copy: a task that is
 * edited by hand or moved by a tool changes what the next turn draws.
 */

/** The two spellings a session has in a record: its channel and its id. */
const namesOf = (uri: string): Set<string> => new Set([uri, idOf(uri)]);

/**
 * The tasks a session's plan holds, in the order the store answers them.
 *
 * A task counts when its `session` names this session or when its `plan` is
 * the session's plan. The two are the same set for a translated task, which
 * carries both; either one is enough for a task written another way.
 */
export function sessionTasks(plans: PlanRecord[], tasks: TaskRecord[], uri: string): TaskRecord[] {
  const names = namesOf(uri);
  const sided = new Set(plans
    .filter((plan) => plan.scope.kind === 'session' && names.has(plan.scope.session))
    .map((plan) => plan.id));
  return tasks.filter((task) =>
    (task.session !== undefined && names.has(task.session))
    || (task.plan !== undefined && sided.has(task.plan)));
}

/**
 * The lines of a plan, one per task, with its status.
 *
 * A done task is a checked box and every other status is an empty one, which
 * is the whole of what a checkbox can say. The title carries the rest of what
 * a task is.
 */
export const planLines = (tasks: TaskRecord[]): string[] =>
  tasks.map((task) => `- [${task.status === 'done' ? 'x' : ' '}] ${task.title}`);

/** The lines of one session's plan, read from the store. */
export async function sessionPlanLines(store: TaskStore, uri: string): Promise<string[]> {
  return planLines(sessionTasks(await store.plans(), await store.tasks(), uri));
}
