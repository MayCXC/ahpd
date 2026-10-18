import { describe, expect, it } from 'vitest';
import { foldHostOptions, memoryRecords, pluginHost } from '@ahpd/sdk';
import { apply, name } from '../src/plugin.js';
import type { HostTool, LoaderContext, RecordStore, ToolCall } from '@ahpd/sdk';

/*
 * The four plan tools, called the way a model calls them.
 *
 * The plugin is folded into a host as the daemon folds it, and each tool's
 * `run` is handed an input and a call. A call names its person and its
 * session, which is what a stamp is written from; the input names no stamp at
 * all, so one the model writes has no effect.
 */

const context = (): LoaderContext => ({
  path: '/tmp/tasks',
  paths: ['/tmp/tasks'],
  version: '0.12.0',
  hostName: 'tasks-test',
  configDir: '/tmp/tasks',
  log: () => {},
  say: () => {},
});

/** A call from `person`, in `session`. */
const at = (over: { person?: string; session?: string } = {}): ToolCall => ({
  session: over.session ?? 'ahp-session:/one',
  chat: 'ahp-chat:/one',
  person: () => over.person ?? 'ana',
} as unknown as ToolCall);

/** The plugin applied over fresh records, with its tools by name. */
async function served(options: Record<string, unknown> = {}) {
  const records = memoryRecords();
  const problems: string[] = [];
  const { host, contribution, seal } = pluginHost(name, context(), {
    records: () => records,
    problem: (line) => { problems.push(line); },
  });
  await apply(host, options);
  seal();
  const folded = foldHostOptions({ path: '/tmp/tasks', agents: [] }, [contribution]);
  const tools = new Map<string, HostTool>(folded.options.tools?.map((one) => [one.definition.name, one]));
  const run = async (tool: string, input: Record<string, unknown>, call = at()): Promise<string> => {
    const found = tools.get(tool);
    if (found === undefined) throw new Error(`no ${tool}`);
    return await found.run(input, call);
  };
  return { records, problems, tools, folded, run };
}

/** A valid task record in the collection, so a plan has one to show. */
async function putTask(records: RecordStore, id: string, plan: string): Promise<void> {
  const tasks = await records.collection('tasks', { body: 'body' });
  await tasks.put({
    id,
    title: `Task ${id}`,
    status: 'todo',
    priority: 'medium',
    labels: [],
    blockedBy: [],
    refs: [],
    plan,
    created: { at: '2026-10-18T10:00:00.000Z', by: 'ana', in: 'ahp-session:/one' },
  });
}

describe('the plan tools', () => {
  it('stamps the caller\'s person and session, and ignores a stamp in the input', async () => {
    const { run, records } = await served();
    const said = await run('plan_create', {
      title: 'The host keeps one task list',
      goal: 'One list for every agent.',
      scope: { kind: 'folder', folder: '/srv/work' },
      created: { at: '1999-01-01T00:00:00.000Z', by: 'model', in: 'ahp-session:/model' },
    });
    expect(said).toBe('p1, draft, The host keeps one task list');
    const kept = await (await records.collection('plans', { body: 'goal' })).get('p1');
    expect(kept?.goal).toBe('One list for every agent.');
    expect(kept?.created).toMatchObject({ by: 'ana', in: 'ahp-session:/one' });
    const written = (kept?.created as { at: string }).at;
    expect(written).not.toBe('1999-01-01T00:00:00.000Z');
    expect(Number.isNaN(Date.parse(written))).toBe(false);

    // Another call in another session and another person writes its own.
    await run('plan_create', {
      title: 'A second plan',
      goal: 'Elsewhere.',
      scope: { kind: 'bot', bot: 'pilot' },
    }, at({ person: 'bob', session: 'ahp-session:/two' }));
    const second = await (await records.collection('plans')).get('p2');
    expect(second?.created).toMatchObject({ by: 'bob', in: 'ahp-session:/two' });
  });

  it('refuses a scope that is neither a folder nor a bot', async () => {
    const { run } = await served();
    await expect(run('plan_create', {
      title: 'Nowhere',
      goal: 'Nothing.',
      scope: { kind: 'team', team: 'backend' },
    })).rejects.toThrow('scope is a folder or a bot');
    await expect(run('plan_create', {
      title: 'Nowhere',
      goal: 'Nothing.',
      scope: '/srv/work',
    })).rejects.toThrow('scope is a folder or a bot');
  });

  it('changes a plan\'s title and status, and refuses an unknown status or plan', async () => {
    const { run } = await served();
    await run('plan_create', { title: 'First', goal: 'One.', scope: { kind: 'folder', folder: '/srv/work' } });
    expect(await run('plan_set', { plan: 'p1', title: 'Renamed', status: 'active' }))
      .toBe('p1, active, Renamed');
    expect(await run('plan_set', { plan: 'p1', status: 'done' })).toBe('p1, done, Renamed');
    await expect(run('plan_set', { plan: 'p1', status: 'open' }))
      .rejects.toThrow('status is one of draft, active, done, dropped');
    await expect(run('plan_set', { plan: 'p9', title: 'Elsewhere' })).rejects.toThrow('there is no plan p9');
  });

  it('shows a plan and one line per task that names it', async () => {
    const { run, records } = await served();
    await run('plan_create', { title: 'First', goal: 'One.', scope: { kind: 'folder', folder: '/srv/work' } });
    await putTask(records, 't1', 'p1');
    await putTask(records, 't2', 'p1');
    expect(await run('plan_show', { plan: 'p1' })).toBe([
      'p1, draft, First',
      't1, todo, medium, Task t1',
      't2, todo, medium, Task t2',
    ].join('\n'));
    await expect(run('plan_show', { plan: 'p9' })).rejects.toThrow('there is no plan p9');
  });

  it('lists plans, filtered by scope and status', async () => {
    const { run } = await served();
    await run('plan_create', { title: 'Work', goal: 'One.', scope: { kind: 'folder', folder: '/srv/work' } });
    await run('plan_create', { title: 'Pilot', goal: 'Two.', scope: { kind: 'bot', bot: 'pilot' } });
    await run('plan_set', { plan: 'p1', status: 'active' });

    expect(await run('plan_list', {})).toBe('p1, active, Work\np2, draft, Pilot');
    expect(await run('plan_list', { status: 'draft' })).toBe('p2, draft, Pilot');
    expect(await run('plan_list', { scope: { kind: 'folder', folder: '/srv/work' } })).toBe('p1, active, Work');
    expect(await run('plan_list', { scope: { kind: 'bot', bot: 'pilot' } })).toBe('p2, draft, Pilot');
    expect(await run('plan_list', { scope: { kind: 'folder', folder: '/srv/elsewhere' } })).toBe('No plans.');
    await expect(run('plan_list', { status: 'open' })).rejects.toThrow('status is one of draft, active, done, dropped');
  });

  it('offers no grant to ask, so any session may make and change a plan', async () => {
    // The tools never read `may` or `refusal`; a call that answers neither is
    // enough for every one of them.
    const { tools, problems } = await served();
    expect([...tools.keys()]).toEqual(expect.arrayContaining(['plan_create', 'plan_set', 'plan_show', 'plan_list']));
    expect(problems).toEqual([]);
  });
});
