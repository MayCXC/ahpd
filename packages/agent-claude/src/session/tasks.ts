import type { Bag, HarnessPlanChange, HarnessPlanEntry, PlanUpdate } from '@ahpd/sdk';
import { hostHoldsTasks } from '../options.js';
import type { SessionContext } from './context.js';
import { bag, list, str } from './common.js';

/**
 * Claude's own task calls, written into the session's plan.
 *
 * A session that keeps Claude's task tools writes the same list the tasks
 * plugin keeps for a host's `task_add`. `TodoWrite` sends the whole list,
 * `TaskCreate` and `TaskUpdate` one task each, and each is handed to the host
 * through `planUpdate` - so this backend knows Claude's shapes, and a plugin
 * decides what a plan is.
 *
 * `TaskCreate` waits for its result. The tool's input carries no id and the
 * harness makes one when it creates the task; its structured output on the
 * result is where that id is.
 */

/** What this area offers the rest of the session. */
export interface Tasks {
  /** A complete call of one of Claude's task tools, as the update it makes. */
  called: (turn: string, call: string, name: string, input: Bag) => void;
  /** A tool result, where a `TaskCreate` learns the id the harness gave the task. */
  ended: (call: string, result: unknown) => void;
}

/** A value as a word, where it is one: an empty string says nothing. */
const wordOf = (value: unknown): string | undefined => {
  const said = str(value);
  return said === undefined || said.trim() === '' ? undefined : said;
};

/**
 * The whole list a `TodoWrite` writes.
 *
 * A todo is its `content` and its `status`, and one without either is not a
 * step this host can write: a task needs both.
 */
const entriesOf = (input: Bag): HarnessPlanEntry[] => {
  const out: HarnessPlanEntry[] = [];
  for (const raw of list(input.todos)) {
    const todo = bag(raw);
    const text = wordOf(todo.content);
    const status = wordOf(todo.status);
    if (text === undefined || status === undefined) continue;
    out.push({ text, status });
  }
  return out;
};

/**
 * The one change a `TaskUpdate` makes.
 *
 * The id is read under all three names the model gives it: Claude Code repairs
 * `id` and `task_id` to `taskId` before it runs a call, and the repair is not
 * what the stream carries.
 */
const changeOf = (input: Bag): HarnessPlanChange | undefined => {
  const id = wordOf(input.taskId) ?? wordOf(input.id) ?? wordOf(input.task_id);
  if (id === undefined) return undefined;
  const text = wordOf(input.subject);
  const status = wordOf(input.status);
  return {
    id,
    ...(text === undefined ? {} : { text }),
    ...(status === undefined ? {} : { status }),
  };
};

/**
 * The change a `TaskCreate` made, once its result says which task it is.
 *
 * `TaskCreateOutput` is `{ task: { id, subject } }`, and a result that holds
 * no task - one that failed - is a change there is nothing to make.
 */
const createdOf = (subject: string, result: unknown): HarnessPlanChange | undefined => {
  const id = wordOf(bag(bag(result).task).id);
  return id === undefined ? undefined : { id, text: subject, status: 'pending' };
};

export function createTasks(ctx: SessionContext): Tasks {
  /** The subject of each `TaskCreate` whose result has not come back, by the call's id. */
  const creating = new Map<string, { turn: string; subject: string }>();

  const hand = (update: PlanUpdate): void => { ctx.options.planUpdate?.(update); };

  /** Nothing is written where the host holds the list: its tools already write it. */
  const ours = (): boolean => !hostHoldsTasks(ctx.values, ctx.offering);

  const called = (turn: string, call: string, name: string, input: Bag): void => {
    if (!ours()) return;
    if (name === 'TodoWrite') {
      hand({ turn, tool: name, entries: entriesOf(input) });
      return;
    }
    if (name === 'TaskCreate') {
      const subject = wordOf(input.subject);
      if (subject !== undefined) creating.set(call, { turn, subject });
      return;
    }
    if (name === 'TaskUpdate') {
      const change = changeOf(input);
      if (change !== undefined) hand({ turn, tool: name, change });
    }
  };

  const ended = (call: string, result: unknown): void => {
    const made = creating.get(call);
    if (made === undefined) return;
    creating.delete(call);
    if (!ours()) return;
    const change = createdOf(made.subject, result);
    if (change !== undefined) hand({ turn: made.turn, tool: 'TaskCreate', change });
  };

  return { called, ended };
}
