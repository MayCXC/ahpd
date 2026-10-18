/**
 * What a task and a plan are, and what a record may say about one.
 *
 * A task and a plan are records of the host's record store, so a person can
 * edit one by hand and a store that keeps rows may answer something no tool
 * wrote. Everything here is about one record: what it holds, what a value of
 * each field may be, and the sentence a record that is not one is refused
 * with. The store and the tools are the other files.
 *
 * Nothing here names a session's state. A task keeps the session and the
 * folder as text, so a session that is gone leaves a task that still reads.
 */

/** The statuses a task may have, in the order a board draws them. */
export const TASK_STATUSES = ['todo', 'doing', 'blocked', 'review', 'done', 'dropped'] as const;
/** One of `TASK_STATUSES`. */
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** The statuses a plan may have. */
export const PLAN_STATUSES = ['draft', 'active', 'done', 'dropped'] as const;
/** One of `PLAN_STATUSES`. */
export type PlanStatus = (typeof PLAN_STATUSES)[number];

/** The priorities a task may have, the values of an ACP plan entry. */
export const PRIORITIES = ['high', 'medium', 'low'] as const;
/** One of `PRIORITIES`. */
export type TaskPriority = (typeof PRIORITIES)[number];

/** The priority a task is given when it names none. */
export const DEFAULT_PRIORITY: TaskPriority = 'medium';

/** What a review decided. */
export const VERDICTS = ['approved', 'changes'] as const;
/** One of `VERDICTS`. */
export type Verdict = (typeof VERDICTS)[number];

/**
 * When a stamp was written, who wrote it and in which session.
 *
 * The host writes every stamp from the caller, so a model has no input for
 * one. `in` is the session channel as text rather than a link to a session,
 * because the session may be removed and the task stays.
 */
export interface Stamp {
  /** When it was written, as an ISO date. */
  at: string;
  /** Who the call was made by: a person, a session's owner, or `host`. */
  by: string;
  /** The session the call was made in. */
  in: string;
  /** `reviewed` only: what the review decided. A `created` stamp has none. */
  verdict?: Verdict;
}

/**
 * Where a translated task came from.
 *
 * A task a harness's own list wrote says which tool translated it, and the id
 * the entry has in that harness where it names one. A task added with
 * `task_add` has no source, because the host wrote it and not a translation.
 */
export interface TaskSource {
  /** The tool that wrote the translated entry. */
  tool: string;
  /** The id the entry has in that harness, where it names one. */
  id?: string;
}

/**
 * What the `tasks` collection keeps of one task.
 *
 * `body` is the record's Markdown body: the long text of the task, while
 * `note` is the one line a list shows. A task names its plan, and a plan does
 * not list its tasks: the store finds them with `find({ plan })`.
 */
export interface TaskRecord {
  /** The id, `t<n>`, counted up in the collection. */
  id: string;
  /** What the task is, in one line. */
  title: string;
  /** Where it is on the board. */
  status: TaskStatus;
  /** How urgent it is. */
  priority: TaskPriority;
  /** Words a client groups tasks by. */
  labels: string[];
  /** What the task is about, where it says one word for it. */
  topic?: string;
  /** The plan it belongs to, by plan id, where it names one. */
  plan?: string;
  /** The bot it belongs to, where it names one. */
  bot?: string;
  /** The folder it was made in, as text. */
  folder?: string;
  /** The session it was made in, as text, so a removed session leaves a valid task. */
  session?: string;
  /** The tasks that must be `done` before this one is ready, by task id. */
  blockedBy: string[];
  /** What is being done right now, in one line, while the status is `doing`. */
  active?: string;
  /** One line about where the task stands. */
  note?: string;
  /** Links and references the task needs. */
  refs: string[];
  /** Where a translated task came from, on one that a translation wrote. */
  source?: TaskSource;
  /** The long text of the task, as the record's Markdown body. */
  body?: string;
  /** When, by whom and where it was made. */
  created: Stamp;
  /** When, by whom and where it was approved. */
  approved?: Stamp;
  /** When, by whom and where it first started. */
  started?: Stamp;
  /** When, by whom and where it first reached `review`, `done` or `dropped`. */
  finished?: Stamp;
  /** When, by whom and where it was reviewed, with the verdict where there was one. */
  reviewed?: Stamp;
}

/** A plan of a folder: it belongs where the work lives. */
export interface FolderScope {
  kind: 'folder';
  /** The folder the plan belongs to, as text. */
  folder: string;
}

/** A plan of a bot: it belongs to the bot wherever the bot works. */
export interface BotScope {
  kind: 'bot';
  /** The bot the plan belongs to, by slug. */
  bot: string;
}

/** A plan of a session: it holds the list a harness wrote in that session. */
export interface SessionScope {
  kind: 'session';
  /** The session it belongs to, by id. */
  session: string;
}

/** Where a plan belongs. A plan outlives the session that made it. */
export type PlanScope = FolderScope | BotScope | SessionScope;

/**
 * What the `plans` collection keeps of one plan.
 *
 * `goal` is the record's Markdown body. A plan keeps no task list: a task
 * names its plan, and the store answers a plan's tasks by that name.
 */
export interface PlanRecord {
  /** The id, `p<n>`, counted up in the collection. */
  id: string;
  /** The folder, bot or session it belongs to. */
  scope: PlanScope;
  /** What the plan is, in one line. */
  title: string;
  /** What it is for, as the record's Markdown body. */
  goal: string;
  /** Where it has got to. */
  status: PlanStatus;
  /** Links and references the plan needs. */
  refs: string[];
  /** When, by whom and where it was made. */
  created: Stamp;
  /** When, by whom and where it was approved. */
  approved?: Stamp;
  /** When, by whom and where it last moved to `done` or `dropped`. */
  finished?: Stamp;
  /** When, by whom and where it was reviewed, with the verdict where there was one. */
  reviewed?: Stamp;
}

/** Whether `value` is one of `values`. */
const oneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

/** Whether `value` is a task status. */
export const isTaskStatus = (value: unknown): value is TaskStatus => oneOf(value, TASK_STATUSES);

/** Whether `value` is a plan status. */
export const isPlanStatus = (value: unknown): value is PlanStatus => oneOf(value, PLAN_STATUSES);

/** Whether `value` is a task priority. */
export const isPriority = (value: unknown): value is TaskPriority => oneOf(value, PRIORITIES);

/** Whether a value is one of `VERDICTS`. */
export const isVerdict = (value: unknown): value is Verdict => oneOf(value, VERDICTS);

/** Whether `value` is a line of text: a string with no line break in it. */
const isLine = (value: unknown): value is string => typeof value === 'string' && !/[\r\n]/.test(value);

/** Whether `value` is a list of text. */
const isLines = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((one) => typeof one === 'string');

/** Whether `value` is an object a record field may be. */
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Why one stamp is not a stamp, or nothing when it is one.
 *
 * A verdict belongs to `reviewed` and to no other stamp, and only one of
 * `VERDICTS` may be there: the model has no input for a stamp, and a record
 * edited by hand must not put the answer of a review on the moment a task was
 * made.
 */
const checkStamp = (value: unknown, where: string): string | undefined => {
  if (!isObject(value)) return `${where} is not a stamp`;
  for (const field of ['at', 'by', 'in']) {
    if (typeof value[field] !== 'string' || value[field] === '') return `${where} has no ${field}`;
  }
  if (value.verdict === undefined) return undefined;
  if (where !== 'reviewed') return `${where} has a verdict, which only a reviewed stamp may carry`;
  if (!oneOf(value.verdict, VERDICTS)) {
    return `${where} has the verdict ${JSON.stringify(value.verdict)}, which is not one of ${VERDICTS.join(', ')}`;
  }
  return undefined;
};

/** The scope a value names, or nothing when it names no folder, bot or session. */
export function scopeOf(value: unknown): PlanScope | undefined {
  if (!isObject(value)) return undefined;
  if (value.kind === 'folder' && typeof value.folder === 'string' && value.folder !== '') {
    return { kind: 'folder', folder: value.folder };
  }
  if (value.kind === 'bot' && typeof value.bot === 'string' && value.bot !== '') {
    return { kind: 'bot', bot: value.bot };
  }
  if (value.kind === 'session' && typeof value.session === 'string' && value.session !== '') {
    return { kind: 'session', session: value.session };
  }
  return undefined;
}

/** Why a scope is not one of the three, or nothing when it is one. */
const checkScope = (value: unknown): string | undefined => {
  if (scopeOf(value) !== undefined) return undefined;
  if (isObject(value) && value.kind === 'folder') return 'a folder scope has no folder';
  if (isObject(value) && value.kind === 'bot') return 'a bot scope has no bot';
  if (isObject(value) && value.kind === 'session') return 'a session scope has no session';
  return 'scope is neither a folder, a bot nor a session';
};

/** One line for a plan in a listing: its id, its status and its title. */
export const planLine = (plan: PlanRecord): string => `${plan.id}, ${plan.status}, ${plan.title}`;

/** One line for a task in a listing: its id, its status, its priority and its title. */
export const taskLine = (task: TaskRecord): string => `${task.id}, ${task.status}, ${task.priority}, ${task.title}`;

/** Why a task record is not one, or nothing when it is. */
export function checkTask(record: unknown): string | undefined {
  if (!isObject(record)) return 'it is not an object';
  if (typeof record.id !== 'string' || !/^t\d+$/.test(record.id)) return 'the id is not t<n>';
  if (typeof record.title !== 'string' || record.title.trim() === '') return 'the title is empty';
  if (!oneOf(record.status, TASK_STATUSES)) {
    return `the status is ${JSON.stringify(record.status)}, which is not one of ${TASK_STATUSES.join(', ')}`;
  }
  if (!oneOf(record.priority, PRIORITIES)) {
    return `the priority is ${JSON.stringify(record.priority)}, which is not one of ${PRIORITIES.join(', ')}`;
  }
  if (!isLines(record.labels)) return 'labels is not a list of text';
  if (!isLines(record.blockedBy)) return 'blockedBy is not a list of task ids';
  if (!isLines(record.refs)) return 'refs is not a list of text';
  for (const field of ['topic', 'plan', 'bot', 'folder', 'session', 'body']) {
    if (record[field] !== undefined && typeof record[field] !== 'string') return `${field} is not text`;
  }
  for (const field of ['active', 'note']) {
    if (record[field] === undefined) continue;
    if (!isLine(record[field])) return `${field} is more than one line`;
  }
  if (record.source !== undefined) {
    if (!isObject(record.source) || typeof record.source.tool !== 'string' || record.source.tool === '') {
      return 'source is not a tool';
    }
    if (record.source.id !== undefined && typeof record.source.id !== 'string') return 'source has an id that is not text';
  }
  const created = checkStamp(record.created, 'created');
  if (created !== undefined) return created;
  for (const field of ['approved', 'started', 'finished', 'reviewed']) {
    if (record[field] === undefined) continue;
    const why = checkStamp(record[field], field);
    if (why !== undefined) return why;
  }
  return undefined;
}

/** Why a plan record is not one, or nothing when it is. */
export function checkPlan(record: unknown): string | undefined {
  if (!isObject(record)) return 'it is not an object';
  if (typeof record.id !== 'string' || !/^p\d+$/.test(record.id)) return 'the id is not p<n>';
  if (typeof record.title !== 'string' || record.title.trim() === '') return 'the title is empty';
  if (typeof record.goal !== 'string') return 'the goal is not text';
  if (!oneOf(record.status, PLAN_STATUSES)) {
    return `the status is ${JSON.stringify(record.status)}, which is not one of ${PLAN_STATUSES.join(', ')}`;
  }
  const scope = checkScope(record.scope);
  if (scope !== undefined) return scope;
  if (!isLines(record.refs)) return 'refs is not a list of text';
  const created = checkStamp(record.created, 'created');
  if (created !== undefined) return created;
  for (const field of ['approved', 'finished', 'reviewed']) {
    if (record[field] === undefined) continue;
    const why = checkStamp(record[field], field);
    if (why !== undefined) return why;
  }
  return undefined;
}
