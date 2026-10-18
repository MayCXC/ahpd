import { RpcError } from '@ahpd/sdk';
import { checkPlan, checkTask } from './record.js';
import type { PlanRecord, TaskRecord } from './record.js';
import type { RecordCollection, StoredRecord } from '@ahpd/sdk';

/**
 * The tasks and plans this daemon keeps, in the record store the host gave it.
 *
 * The `tasks` collection holds one record per task, its `body` as the long
 * text, and the `plans` collection holds one per plan, its `goal` as the body.
 * A task names its plan, and a plan names no task: the tasks of a plan are the
 * records whose `plan` is its id, which is what `find` answers.
 *
 * A record is checked on the way in and on the way out. A put of a record that
 * fails its check is refused, and a record a person edited by hand that fails
 * it is skipped and reported rather than answered as a task - the store keeps
 * every other record and the list goes on.
 *
 * The ids count up in each collection: `t1`, `t2` for tasks and `p1`, `p2` for
 * plans. A sweep takes a finished plan and the tasks that name it once the plan
 * has sat for the days the setting names, and does nothing when it names none.
 *
 * No file and no format is named here. What a record looks like on disk is the
 * record store's business, and a plugin that keeps the records in a database
 * takes that business over with one `registerRecords` call.
 */

/** The protocol's code for a body this host will not take. */
const INVALID_PARAMS = -32602;

/** One day, in milliseconds, for the sweep. */
const DAY_MS = 86_400_000;

/** What the store reads besides its collections. */
export interface TaskStoreOptions {
  /** How many days a done or dropped plan is kept. Absent keeps it forever. */
  sweepAfterDays?: number;
}

/** What a sweep took out, by id. */
export interface Swept {
  /** The plans that went. */
  plans: string[];
  /** The tasks that went with them. */
  tasks: string[];
}

/**
 * One plan's last moment: the newest stamp on the plan or on any task that
 * names it, so a plan is not swept while one of its tasks is still moving.
 */
const lastStamp = (plan: PlanRecord, tasks: StoredRecord[]): string | undefined => {
  let newest: { at: string; when: number } | undefined;
  const stamps: unknown[] = [plan.created, plan.approved, plan.finished, plan.reviewed];
  for (const task of tasks) stamps.push(task['created'], task['approved'], task['started'], task['finished'], task['reviewed']);
  for (const one of stamps) {
    const stamp = one as { at?: unknown } | undefined;
    if (stamp === undefined || stamp === null || typeof stamp.at !== 'string') continue;
    const when = Date.parse(stamp.at);
    if (!Number.isFinite(when)) continue;
    if (newest === undefined || when > newest.when) newest = { at: stamp.at, when };
  }
  return newest?.at;
};

/** The number an id of `prefix` carries, or nothing where it is not one. */
const numberOf = (id: string, prefix: string): number | undefined => {
  const match = new RegExp(`^${prefix}(\\d+)$`).exec(id);
  return match === null ? undefined : Number(match[1]);
};

/** Compare two records of one collection by the number their id carries. */
const byNumber = (one: { id: string }, other: { id: string }): number =>
  Number(one.id.slice(1)) - Number(other.id.slice(1));

/** What this plugin keeps, over the two collections the host gave it. */
export interface TaskStore {
  /** One task, or nothing when no record there is a task this host can use. */
  task(id: string): Promise<TaskRecord | undefined>;
  /** One plan, or nothing when no record there is a plan this host can use. */
  plan(id: string): Promise<PlanRecord | undefined>;
  /** Every task this host can use, by id. */
  tasks(): Promise<TaskRecord[]>;
  /** Every plan this host can use, by id. */
  plans(): Promise<PlanRecord[]>;
  /** The tasks that name a plan, by id. */
  tasksOf(plan: string): Promise<TaskRecord[]>;
  /** Keep one task, once its check passes. */
  putTask(task: TaskRecord): Promise<void>;
  /** Keep one plan, once its check passes. */
  putPlan(plan: PlanRecord): Promise<void>;
  /** The next task id, `t<n>`. */
  nextTaskId(): Promise<string>;
  /** The next plan id, `p<n>`. */
  nextPlanId(): Promise<string>;
  /** Take out each finished plan that has sat for the setting's days, and its tasks. */
  sweep(now?: Date): Promise<Swept>;
}

/**
 * The store over the `tasks` and `plans` collections.
 *
 * `onProblem` is told about each record that is there and could not be used,
 * one line each, and the store keeps every other record.
 */
export function taskStore(
  tasks_: RecordCollection,
  plans_: RecordCollection,
  onProblem: (line: string) => void,
  options: TaskStoreOptions = {},
): TaskStore {
  /** One record as a task, or nothing when it is not one. */
  const asTask = (record: StoredRecord | undefined): TaskRecord | undefined => {
    if (record === undefined) return undefined;
    const why = checkTask(record);
    if (why !== undefined) {
      onProblem(`task ${record.id}: ${why}`);
      return undefined;
    }
    return record as unknown as TaskRecord;
  };

  /** One record as a plan, or nothing when it is not one. */
  const asPlan = (record: StoredRecord | undefined): PlanRecord | undefined => {
    if (record === undefined) return undefined;
    const why = checkPlan(record);
    if (why !== undefined) {
      onProblem(`plan ${record.id}: ${why}`);
      return undefined;
    }
    return record as unknown as PlanRecord;
  };

  /** The next id of `prefix`, one past the highest there is. */
  const nextId = async (collection: RecordCollection, prefix: string): Promise<string> => {
    const numbers = (await collection.list())
      .map((record) => numberOf(record.id, prefix))
      .filter((number): number is number => number !== undefined);
    return `${prefix}${Math.max(0, ...numbers) + 1}`;
  };

  return {
    task: async (id) => asTask(await tasks_.get(id)),
    plan: async (id) => asPlan(await plans_.get(id)),
    tasks: async () => (await tasks_.list()).map(asTask).filter((one): one is TaskRecord => one !== undefined).sort(byNumber),
    plans: async () => (await plans_.list()).map(asPlan).filter((one): one is PlanRecord => one !== undefined).sort(byNumber),
    tasksOf: async (plan) => (await tasks_.find({ plan }))
      .map(asTask)
      .filter((one): one is TaskRecord => one !== undefined)
      .sort(byNumber),
    putTask: async (task) => {
      const why = checkTask(task);
      if (why !== undefined) throw new RpcError(INVALID_PARAMS, `task ${task.id}: ${why}`);
      await tasks_.put(task as unknown as StoredRecord);
    },
    putPlan: async (plan) => {
      const why = checkPlan(plan);
      if (why !== undefined) throw new RpcError(INVALID_PARAMS, `plan ${plan.id}: ${why}`);
      await plans_.put(plan as unknown as StoredRecord);
    },
    nextTaskId: async () => nextId(tasks_, 't'),
    nextPlanId: async () => nextId(plans_, 'p'),
    sweep: async (now = new Date()) => {
      const swept: Swept = { plans: [], tasks: [] };
      const days = options.sweepAfterDays;
      if (days === undefined) return swept;
      /*
       * A plan that is done or dropped and whose newest stamp is older than
       * the setting goes, and the tasks that name it go with it: a task whose
       * plan is gone would be a line in a list nobody can open.
       */
      for (const plan of (await plans_.list()).map(asPlan)) {
        if (plan === undefined || (plan.status !== 'done' && plan.status !== 'dropped')) continue;
        const named = await tasks_.find({ plan: plan.id });
        const last = lastStamp(plan, named);
        if (last === undefined || now.getTime() - Date.parse(last) < days * DAY_MS) continue;
        for (const task of named) {
          if (await tasks_.remove(task.id)) swept.tasks.push(task.id);
        }
        if (await plans_.remove(plan.id)) swept.plans.push(plan.id);
      }
      return swept;
    },
  };
}
