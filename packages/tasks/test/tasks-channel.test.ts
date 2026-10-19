import { describe, expect, it } from 'vitest';
import { createHost, foldHostOptions, memoryRecords, pluginHost } from '@ahpd/sdk';
import { echo } from '../../../examples/echo/agent.js';
import { apply, name } from '../src/plugin.js';
import type { HostOptions, HostTool, LoaderContext, RecordCollection, ToolCall, Users } from '@ahpd/sdk';
import type { PlanRecord, Stamp, TaskRecord } from '../src/record.js';

/*
 * The plan channel.
 *
 * A plan is one channel URI, `x-ahpd-plans://<plan id>`, and a subscriber is
 * answered with the plan and its tasks. After that each record change is one
 * action, which is what a window draws: the task as the store holds it, not a
 * diff a client has to apply.
 */

const STAMP: Stamp = { at: '2026-10-18T10:00:00.000Z', by: 'host', in: 'ahp-session:/one' };

const context = (): LoaderContext => ({
  path: '/tmp/tasks',
  paths: ['/tmp/tasks'],
  version: '0.12.0',
  hostName: 'tasks-test',
  configDir: '/tmp/tasks',
  log: () => {},
  say: () => {},
});

const plan = (): PlanRecord => ({
  id: 'p1',
  scope: { kind: 'folder', folder: '/tmp/tasks' },
  title: 'Ship the list',
  goal: '',
  status: 'active',
  refs: [],
  created: STAMP,
});

const task = (id: string, title: string): TaskRecord => ({
  id,
  title,
  status: 'todo',
  priority: 'medium',
  labels: [],
  blockedBy: [],
  refs: [],
  plan: 'p1',
  created: STAMP,
});

/** The messages the host sends one client, as it sends them. */
interface Sent {
  method: string;
  params: { channel?: string; action?: Record<string, unknown> };
}

/** A client with no socket, which keeps what it is told. */
const peer = () => {
  const notes: Sent[] = [];
  return {
    notes,
    send: (): void => {},
    notify: (method: string, params: unknown): void => { notes.push({ method, params: params as Sent['params'] }); },
    request: async (): Promise<unknown> => ({}),
    answered: (): void => {},
    close: (): void => {},
  };
};

/** Waits for `check`, turning the event loop, and throws after `ms`. */
const when = async (check: () => boolean, ms = 5000): Promise<void> => {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error('timed out waiting');
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
};

/** The actions the host sent on the plan channel. */
const heard = (notes: Sent[]): { type?: string; task?: TaskRecord; taskId?: string; plan?: PlanRecord }[] => notes
  .filter((one) => one.method === 'action' && one.params.channel === 'x-ahpd-plans://p1')
  .map((one) => one.params.action as { type?: string; task?: TaskRecord; taskId?: string; plan?: PlanRecord });

/** A call a tool is run for, as the host hands one to it. */
const callOf = (session: string): ToolCall => ({
  session,
  chat: 'ahp-chat:/one',
  person: () => 'ana',
  may: () => true,
} as unknown as ToolCall);

/** A users directory nobody has signed in to, so a subscribe is refused. */
const noOne = (): Users => ({
  resource: { resource: 'ahpd://users', resource_name: 'ahpd users', authorization_servers: ['https://example.test'], required: false },
  verify: async () => undefined,
  list: async () => [],
  grantsOfRoles: async () => [],
  grantsOfPerson: async () => undefined,
  add: async () => {},
  roles: async () => [],
  addRole: async () => {},
  removeRole: async () => false,
  teams: async () => [],
  projects: async () => [],
  addTeam: async () => {},
  addProject: async () => {},
  removeTeam: async () => false,
  removeProject: async () => false,
  remove: async () => false,
  mint: async () => '',
});

/** A host serving echo with the tasks plugin folded in, and a plan already written. */
async function hostOf(extra: Partial<HostOptions> = {}, withPlan = true): Promise<{
  host: ReturnType<typeof createHost>;
  tools: HostTool[];
  tasks: RecordCollection;
  plans: RecordCollection;
}> {
  const records = memoryRecords();
  const plans = await records.collection('plans', { body: 'goal' });
  if (withPlan) await plans.put({ ...plan() });
  const { host: plugin, contribution, seal } = pluginHost(name, context(), {
    records: () => records,
    problem: () => {},
  });
  await apply(plugin, {});
  seal();
  const options = foldHostOptions({
    path: '/tmp/tasks',
    agents: [echo({ path: '/tmp/tasks', pace: 0 })],
    records,
    ...extra,
  }, [contribution]).options;
  return {
    host: createHost(options),
    tools: options.tools ?? [],
    tasks: await records.collection('tasks', { body: 'body' }),
    plans,
  };
}

/** One such host, with a client connected to it. */
async function served(): Promise<{
  client: ReturnType<ReturnType<typeof createHost>['accept']>;
  notes: Sent[];
  host: ReturnType<typeof createHost>;
  tools: HostTool[];
  tasks: RecordCollection;
  plans: RecordCollection;
}> {
  const { host, tools, tasks, plans } = await hostOf();
  const p = peer();
  const client = host.accept(p);
  await client.handle({
    method: 'initialize',
    params: { channel: 'ahp-root://', clientId: 'probe', protocolVersions: ['0.9.0'] },
  });
  return { client, notes: p.notes, host, tools, tasks, plans };
}

describe('the plan channel', () => {
  it('answers a subscribe with the plan and its tasks, and publishes a task_add', async () => {
    const { client, notes, host, tools, plans } = await served();
    const state = (await client.handle({ method: 'subscribe', params: { channel: 'x-ahpd-plans://p1' } }) as {
      snapshot: { state: { plan?: PlanRecord; tasks?: TaskRecord[] } };
    }).snapshot.state;
    expect(state.plan?.id).toBe('p1');
    expect(state.tasks).toEqual([]);

    const add = tools.find((one) => one.definition.name === 'task_add');
    if (add === undefined) throw new Error('no task_add');
    const answer = String(await add.run({ title: 'Write the answer', plan: 'p1' }, callOf('ahp-session:/one')));
    expect(answer).toContain('Write the answer');

    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/taskAdded'));
    const added = heard(notes).find((one) => one.type === 'x-ahpd-plans/taskAdded');
    expect(added?.task?.title).toBe('Write the answer');
    expect(added?.task?.plan).toBe('p1');

    // And the plan itself moving is its own action.
    await plans.put({ ...plan(), title: 'Ship the list today' });
    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/set'));
    expect(heard(notes).find((one) => one.type === 'x-ahpd-plans/set')?.plan?.title).toBe('Ship the list today');
    await host.close();
  });

  it('publishes a task_set with the task as the store holds it', async () => {
    const { client, notes, host, tools } = await served();
    await client.handle({ method: 'subscribe', params: { channel: 'x-ahpd-plans://p1' } });
    const add = tools.find((one) => one.definition.name === 'task_add');
    if (add === undefined) throw new Error('no task_add');
    const answer = String(await add.run({ title: 'Read the file', plan: 'p1' }, callOf('ahp-session:/one')));
    const id = answer.slice(0, answer.indexOf(','));
    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/taskAdded'));

    const set = tools.find((one) => one.definition.name === 'task_set');
    if (set === undefined) throw new Error('no task_set');
    await set.run({ task: id, status: 'done' }, callOf('ahp-session:/one'));
    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/taskSet'));
    const changed = heard(notes).find((one) => one.type === 'x-ahpd-plans/taskSet');
    expect(changed?.task?.id).toBe(id);
    expect(changed?.task?.status).toBe('done');
    await host.close();
  });

  it('publishes a task_removed with the task id when a task leaves the store', async () => {
    const { client, notes, host, tools, tasks } = await served();
    await client.handle({ method: 'subscribe', params: { channel: 'x-ahpd-plans://p1' } });
    const add = tools.find((one) => one.definition.name === 'task_add');
    if (add === undefined) throw new Error('no task_add');
    const answer = String(await add.run({ title: 'Read the file', plan: 'p1' }, callOf('ahp-session:/one')));
    const id = answer.slice(0, answer.indexOf(','));
    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/taskAdded'));

    // The record taken out of the collection, as the sweep takes one out.
    expect(await tasks.remove(id)).toBe(true);
    await when(() => heard(notes).some((one) => one.type === 'x-ahpd-plans/taskRemoved'));
    const removed = heard(notes).find((one) => one.type === 'x-ahpd-plans/taskRemoved');
    expect(removed?.taskId).toBe(id);
    await host.close();
  });

  it('refuses a subscribe from a reader without the grant', async () => {
    const { host } = await hostOf({ users: noOne() }, false);
    const client = host.accept(peer());
    await client.handle({
      method: 'initialize',
      params: { channel: 'ahp-root://', clientId: 'probe', protocolVersions: ['0.9.0'] },
    });
    await expect(client.handle({ method: 'subscribe', params: { channel: 'x-ahpd-plans://p1' } }))
      .rejects.toThrow(/Sign in/);
    await host.close();
  });
});
