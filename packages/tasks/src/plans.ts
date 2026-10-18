import { RpcError } from '@ahpd/sdk';
import { isPlanStatus, PLAN_STATUSES, planLine, scopeOf, taskLine } from './record.js';
import { stampOf } from './stamp.js';
import type { PlanRecord, PlanScope } from './record.js';
import type { TaskStore } from './store.js';
import type { HostTool } from '@ahpd/sdk';

/**
 * The four tools a model makes and reads plans with.
 *
 * A plan belongs to a folder or a bot and outlives the session that made it,
 * so the tools take the scope from the input and never from the call: it is
 * what the person says the plan is for. Every answer is one line per item - a
 * plan's id, status and title - so a model reads a list in a turn rather than
 * a tree of JSON.
 *
 * None of the four asks a grant. Every user of the host sees and may change
 * every plan for now, and the stamps say who did what.
 */

/** The protocol's code for a body this host will not take. */
const INVALID_PARAMS = -32602;

/** A line of input, trimmed, where the input says one. */
const textOf = (input: Record<string, unknown>, key: string): string | undefined => {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') throw new RpcError(INVALID_PARAMS, `${key} is one line of text`);
  return value.trim();
};

/** The refs of an input, or none where it says none. */
const refsOf = (input: Record<string, unknown>): string[] => {
  const value = input.refs;
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((one) => typeof one !== 'string')) {
    throw new RpcError(INVALID_PARAMS, 'refs is a list of text');
  }
  return value;
};

/** The scope an input names, or a refusal where it names neither a folder nor a bot. */
const requiredScope = (input: Record<string, unknown>): PlanScope => {
  const scope = scopeOf(input.scope);
  // A session's plan is the translation's, and no tool makes one: the tools take a folder or a bot.
  if (scope === undefined || scope.kind === 'session') {
    throw new RpcError(INVALID_PARAMS, 'scope is a folder or a bot: {"kind":"folder","folder":"/srv/work"} or {"kind":"bot","bot":"pilot"}');
  }
  return scope;
};

/** One plan by id, refused where there is none. */
const requiredPlan = async (store: TaskStore, id: string): Promise<PlanRecord> => {
  const plan = await store.plan(id);
  if (plan === undefined) throw new RpcError(INVALID_PARAMS, `there is no plan ${id}`);
  return plan;
};

/** Whether two scopes say the same place. */
const sameScope = (one: PlanScope, other: PlanScope): boolean => {
  if (one.kind === 'folder' && other.kind === 'folder') return one.folder === other.folder;
  if (one.kind === 'bot' && other.kind === 'bot') return one.bot === other.bot;
  return false;
};

/** The four plan tools, over one store. */
export function planTools(store: TaskStore): HostTool[] {
  return [
    {
      definition: {
        name: 'plan_create',
        title: 'Create Plan',
        description: 'Make a plan of a folder or a bot. The plan starts as a draft, and tasks name it with task_add. Answer: its id, status and title.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'What the plan is, in one line.' },
            goal: { type: 'string', description: 'What the plan is for, in Markdown.' },
            scope: {
              type: 'object',
              description: 'Where the plan belongs: {"kind":"folder","folder":"/srv/work"} or {"kind":"bot","bot":"pilot"}.',
              properties: {
                kind: { type: 'string', enum: ['folder', 'bot'] },
                folder: { type: 'string', description: 'The folder, when kind is folder.' },
                bot: { type: 'string', description: 'The bot, when kind is bot.' },
              },
              required: ['kind'],
            },
            refs: { type: 'array', items: { type: 'string' }, description: 'Links and references the plan needs.' },
          },
          required: ['title', 'goal', 'scope'],
        },
        annotations: { title: 'Create Plan', readOnlyHint: false, destructiveHint: false },
      },
      run: async (input, at) => {
        const title = textOf(input, 'title');
        if (title === undefined) throw new RpcError(INVALID_PARAMS, 'title is one line of text');
        if (typeof input.goal !== 'string') throw new RpcError(INVALID_PARAMS, 'goal is the plan, in Markdown');
        const plan: PlanRecord = {
          id: await store.nextPlanId(),
          scope: requiredScope(input),
          title,
          goal: input.goal,
          status: 'draft',
          refs: refsOf(input),
          created: stampOf(at),
        };
        await store.putPlan(plan);
        return planLine(plan);
      },
    },
    {
      definition: {
        name: 'plan_set',
        title: 'Set Plan',
        description: 'Change a plan\'s title or status, by plan id. Answer: its id, status and title.',
        inputSchema: {
          type: 'object',
          properties: {
            plan: { type: 'string', description: 'The plan id, as p1.' },
            title: { type: 'string', description: 'A new title, in one line.' },
            status: { type: 'string', enum: [...PLAN_STATUSES], description: 'A new status.' },
          },
          required: ['plan'],
        },
        annotations: { title: 'Set Plan', readOnlyHint: false, destructiveHint: false },
      },
      run: async (input, at) => {
        const id = textOf(input, 'plan');
        if (id === undefined) throw new RpcError(INVALID_PARAMS, 'plan is a plan id');
        const plan = await requiredPlan(store, id);
        const title = textOf(input, 'title');
        const status = input.status;
        if (status !== undefined && !isPlanStatus(status)) {
          throw new RpcError(INVALID_PARAMS, `status is one of ${PLAN_STATUSES.join(', ')}, and ${JSON.stringify(status)} is not`);
        }
        if (title !== undefined) plan.title = title;
        // Moving into `done` or `dropped` stamps `finished`, which is what the sweep counts from.
        const ends = (one: string): boolean => one === 'done' || one === 'dropped';
        if (status !== undefined && ends(status) && !ends(plan.status)) plan.finished = stampOf(at);
        if (status !== undefined) plan.status = status;
        await store.putPlan(plan);
        return planLine(plan);
      },
    },
    {
      definition: {
        name: 'plan_show',
        title: 'Show Plan',
        description: 'Read a plan and the tasks that name it. Answer: the plan, then one line per task.',
        inputSchema: {
          type: 'object',
          properties: {
            plan: { type: 'string', description: 'The plan id, as p1.' },
          },
          required: ['plan'],
        },
        annotations: { title: 'Show Plan', readOnlyHint: true, destructiveHint: false },
      },
      run: async (input) => {
        const id = textOf(input, 'plan');
        if (id === undefined) throw new RpcError(INVALID_PARAMS, 'plan is a plan id');
        const plan = await requiredPlan(store, id);
        return [planLine(plan), ...(await store.tasksOf(plan.id)).map(taskLine)].join('\n');
      },
    },
    {
      definition: {
        name: 'plan_list',
        title: 'List Plans',
        description: 'List plans, optionally of one scope or one status. Answer: one line per plan, with its id, status and title.',
        inputSchema: {
          type: 'object',
          properties: {
            scope: {
              type: 'object',
              description: 'Only plans of this scope: {"kind":"folder","folder":"/srv/work"} or {"kind":"bot","bot":"pilot"}.',
              properties: {
                kind: { type: 'string', enum: ['folder', 'bot'] },
                folder: { type: 'string' },
                bot: { type: 'string' },
              },
              required: ['kind'],
            },
            status: { type: 'string', enum: [...PLAN_STATUSES], description: 'Only plans with this status.' },
          },
        },
        annotations: { title: 'List Plans', readOnlyHint: true, destructiveHint: false },
      },
      run: async (input) => {
        const status = input.status;
        if (status !== undefined && !isPlanStatus(status)) {
          throw new RpcError(INVALID_PARAMS, `status is one of ${PLAN_STATUSES.join(', ')}, and ${JSON.stringify(status)} is not`);
        }
        const scope = input.scope === undefined ? undefined : scopeOf(input.scope);
        if (input.scope !== undefined && (scope === undefined || scope.kind === 'session')) {
          throw new RpcError(INVALID_PARAMS, 'scope is a folder or a bot: {"kind":"folder","folder":"/srv/work"} or {"kind":"bot","bot":"pilot"}');
        }
        const plans = (await store.plans()).filter((one) =>
          (status === undefined || one.status === status)
          && (scope === undefined || sameScope(one.scope, scope)));
        return plans.length === 0 ? 'No plans.' : plans.map(planLine).join('\n');
      },
    },
  ];
}
