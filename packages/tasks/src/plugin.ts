import { reason } from '@ahpd/sdk';
import { approveTools } from './approve.js';
import { planTools } from './plans.js';
import { taskStore } from './store.js';
import { taskTools } from './tasks.js';
import { writePlanList } from './translate.js';
import type { Plugin } from '@ahpd/sdk';

/**
 * The package as a plugin: one list of tasks and plans for every agent.
 *
 * A task and a plan are records of the host's record store, so every session
 * that is offered a host tool reads and writes the same list. A task names its
 * plan, and a plan belongs to a folder or a bot and outlives the session that
 * made it.
 *
 * Two settings change how the list lives. `requireApproval` keeps an agent
 * from starting a task nobody approved, and `sweepAfterDays` lets a finished
 * plan and the tasks that name it go after a while. Both are off by default: a
 * host that says nothing keeps every task, and an agent starts one when it is
 * ready.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = 'tasks';

/** What a listing prints. */
export const title = 'Tasks';

/** What an option falls back to. */
export const defaults = {
  requireApproval: false,
} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    requireApproval: {
      type: 'boolean',
      description: 'Whether an agent may set a task to doing before somebody approved it. Off by default.',
    },
    sweepAfterDays: {
      type: 'integer',
      minimum: 1,
      description: 'How many days a done or dropped plan is kept. Absent, a finished plan is kept forever.',
    },
  },
};

/** The two settings `apply` reads. */
export interface TaskSettings {
  /** Whether a task needs an `approved` stamp before it may start. */
  requireApproval: boolean;
  /** How many days a finished plan is kept. Absent keeps it forever. */
  sweepAfterDays?: number;
}

/**
 * The settings as `apply` reads them, with a value of the wrong kind reported.
 *
 * The schema checks the kinds of the options the daemon applies, and this
 * checks them again because a host built by hand in a test or in an embedding
 * does not run the schema. A value that is not the kind the setting wants is
 * reported and the setting's default stands, so a typo costs the setting and
 * not the list.
 */
export function settingsOf(options: Record<string, unknown>, problem: (line: string) => void): TaskSettings {
  const askedApproval = options.requireApproval;
  if (askedApproval !== undefined && typeof askedApproval !== 'boolean') {
    problem(`${name}: requireApproval is ${JSON.stringify(askedApproval)}, which is not true or false; using false`);
  }
  const askedSweep = options.sweepAfterDays;
  const integer = typeof askedSweep === 'number' && Number.isInteger(askedSweep) && askedSweep >= 1;
  if (askedSweep !== undefined && !integer) {
    problem(`${name}: sweepAfterDays is ${JSON.stringify(askedSweep)}, which is not a whole number of days; keeping finished plans forever`);
  }
  return {
    requireApproval: typeof askedApproval === 'boolean' ? askedApproval : defaults.requireApproval,
    ...(integer ? { sweepAfterDays: askedSweep } : {}),
  };
}

/** How often a finished plan is looked at, when the sweep is on. */
const SWEEP_MS = 60 * 60 * 1000;

export const apply: Plugin['apply'] = (host, options) => {
  const settings = settingsOf(options, (line) => { host.problem(line); });
  /*
   * The two collections the list lives in, each with its long text as the
   * record's body: `body` for a task and `goal` for a plan. The store checks
   * every record on the way in and out, so a record a person edited by hand
   * cannot reach a tool as one it is not.
   */
  const store = taskStore(
    host.records('tasks', { body: 'body' }),
    host.records('plans', { body: 'goal' }),
    (line) => { host.problem(`${name}: ${line}`); },
    settings.sweepAfterDays === undefined ? undefined : { sweepAfterDays: settings.sweepAfterDays },
  );
  /*
   * One call at a time, the sweep among them. A new id is one past the highest
   * there is and an edit reads the record before it writes it, so two calls at
   * once would give two tasks one id or lose one of two edits.
   */
  let last: Promise<unknown> = Promise.resolve();
  const oneAtATime = <T>(work: () => Promise<T>): Promise<T> => {
    const next = last.then(work, work);
    last = next.catch(() => undefined);
    return next;
  };
  /*
   * The tools every session is offered. A host tool is the one road into the
   * list an agent inside a session cannot take for itself: the plugin holds the
   * store, and the model holds the tool.
   */
  const tools = [
    ...planTools(store),
    ...taskTools(store, { requireApproval: settings.requireApproval }),
    ...approveTools(store),
  ];
  for (const tool of tools) {
    host.registerTool({ ...tool, run: (input, at) => oneAtATime(async () => tool.run(input, at)) });
  }
  /*
   * A harness's own list, brought by its backend. It writes the session's plan
   * one update at a time with the tool calls, because it reads a record before
   * it writes it like they do.
   */
  host.on('plan_update', (event) => oneAtATime(() => writePlanList(store, event)));
  /*
   * A finished plan is held for the days the setting names, and looked at once
   * when the plugin is applied and then every hour. The timer is unref'd, so a
   * daemon with nothing else to do is not kept up by it, and it is cleared when
   * the daemon stops.
   */
  if (settings.sweepAfterDays !== undefined) {
    const look = (): void => {
      void oneAtATime(() => store.sweep()).catch((error: unknown) => {
        host.problem(`${name}: the sweep did not finish: ${reason(error)}`);
      });
    };
    let sweeping: ReturnType<typeof setInterval> | undefined = setInterval(look, SWEEP_MS);
    (sweeping as { unref?: () => void }).unref?.();
    look();
    host.on('stopping', () => {
      if (sweeping !== undefined) clearInterval(sweeping);
      sweeping = undefined;
    });
  }
};
