import { describe, expect, it } from 'vitest';
import { foldHostOptions, memoryRecords, pluginHost } from '@ahpd/sdk';
import { apply, name } from '../src/plugin.js';
import type { HostTool, LoaderContext, RecordCollection, RecordStore, ToolCall } from '@ahpd/sdk';

/*
 * The three task tools, called the way a model calls them.
 *
 * A task is made in `todo` and changes by id; the stamps are the host's, never
 * the input's. `task_list` answers one line per task. The approval setting is
 * applied by the plugin, so a host that turns it on refuses a start nobody
 * approved.
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
    alert: (alert) => { problems.push(alert.text); },
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

/** The tasks collection, as the plugin opened it. */
async function tasksOf(records: RecordStore): Promise<RecordCollection> {
  return await records.collection('tasks', { body: 'body' });
}

/** One kept task, as the store has it. */
async function kept(records: RecordStore, id: string): Promise<Record<string, unknown> | undefined> {
  return await (await tasksOf(records)).get(id);
}

describe('the task tools', () => {
  it('adds a task in todo, with the fields it names and the caller\'s stamp', async () => {
    const { run, records } = await served();
    await run('plan_create', { title: 'The plan', goal: 'One.', scope: { kind: 'folder', folder: '/srv/work' } });
    const said = await run('task_add', {
      title: 'Read the plan',
      priority: 'high',
      labels: ['docs'],
      topic: 'tasks',
      plan: 'p1',
      bot: 'pilot',
      folder: '/srv/work',
      active: 'reading',
      note: 'a start',
      refs: ['https://example.com'],
      body: 'The long text.',
      status: 'done',
      created: { at: '1999-01-01T00:00:00.000Z', by: 'model', in: 'ahp-session:/model' },
    });
    expect(said).toBe('t1, todo, high, Read the plan');
    const task = await kept(records, 't1');
    expect(task).toMatchObject({
      title: 'Read the plan',
      status: 'todo',
      priority: 'high',
      labels: ['docs'],
      topic: 'tasks',
      plan: 'p1',
      bot: 'pilot',
      folder: '/srv/work',
      session: 'ahp-session:/one',
      active: 'reading',
      note: 'a start',
      refs: ['https://example.com'],
      body: 'The long text.',
      blockedBy: [],
    });
    expect(task?.created).toMatchObject({ by: 'ana', in: 'ahp-session:/one' });
    expect(task?.created).not.toMatchObject({ at: '1999-01-01T00:00:00.000Z' });

    // A second call counts up and writes its own stamp.
    expect(await run('task_add', { title: 'Second' }, at({ person: 'bob', session: 'ahp-session:/two' })))
      .toBe('t2, todo, medium, Second');
    expect((await kept(records, 't2'))?.created).toMatchObject({ by: 'bob', in: 'ahp-session:/two' });
  });

  it('refuses a plan or a blocker that names no record', async () => {
    const { run } = await served();
    await expect(run('task_add', { title: 'Orphan', plan: 'p9' })).rejects.toThrow('there is no plan p9');
    await expect(run('task_add', { title: 'Orphan', blockedBy: ['t9'] })).rejects.toThrow('there is no task t9');
    await run('task_add', { title: 'First' });
    await expect(run('task_set', { task: 't1', plan: 'p9' })).rejects.toThrow('there is no plan p9');
    await expect(run('task_set', { task: 't1', blockedBy: ['t9'] })).rejects.toThrow('there is no task t9');
  });

  it('changes the fields a task names, by id, and refuses what is not one', async () => {
    const { run, records } = await served();
    await run('task_add', { title: 'First' });
    expect(await run('task_set', { task: 't1', title: 'Renamed', priority: 'low', labels: ['x'], note: 'a note' }))
      .toBe('t1, todo, low, Renamed');
    expect(await kept(records, 't1')).toMatchObject({ title: 'Renamed', priority: 'low', labels: ['x'], note: 'a note' });
    await expect(run('task_set', { task: 't9', title: 'Elsewhere' })).rejects.toThrow('there is no task t9');
    await expect(run('task_set', { task: 't1', status: 'open' }))
      .rejects.toThrow('status is one of todo, doing, blocked, review, done, dropped');
    await expect(run('task_set', { task: 't1', priority: 'urgent' }))
      .rejects.toThrow('priority is one of high, medium, low');
  });

  it('stamps started at the first doing, finished once, and clears active on leaving doing', async () => {
    const { run, records } = await served();
    await run('task_add', { title: 'First', active: 'reading' });
    await run('task_set', { task: 't1', status: 'doing' });
    const started = (await kept(records, 't1'))?.started;
    expect(started).toMatchObject({ by: 'ana', in: 'ahp-session:/one' });

    // Back to todo: nothing is active, and the task has not started again.
    await run('task_set', { task: 't1', status: 'todo' });
    expect((await kept(records, 't1'))?.active).toBeUndefined();
    await run('task_set', { task: 't1', status: 'doing' });
    expect((await kept(records, 't1'))?.started).toEqual(started);

    await run('task_set', { task: 't1', status: 'review' });
    const finished = (await kept(records, 't1'))?.finished;
    expect(finished).toMatchObject({ by: 'ana', in: 'ahp-session:/one' });
    await run('task_set', { task: 't1', status: 'done' });
    expect((await kept(records, 't1'))?.finished).toEqual(finished);
  });

  it('refuses doing for an unapproved task when approval is on, and lists it as not ready', async () => {
    const { run, records } = await served({ requireApproval: true });
    await run('task_add', { title: 'First' });
    await expect(run('task_set', { task: 't1', status: 'doing' }))
      .rejects.toThrow('task t1 is not approved, so it may not start');
    expect(await run('task_list', { ready: true })).toBe('No tasks.');
    expect(await run('task_list', { status: 'todo' })).toBe('t1, todo, medium, First');

    // A person approves it by writing the stamp the approval tool will write.
    const tasks = await tasksOf(records);
    const task = await tasks.get('t1');
    if (task === undefined) throw new Error('no t1');
    await tasks.put({ ...task, approved: { at: new Date().toISOString(), by: 'bob', in: 'ahp-session:/two' } });
    expect(await run('task_list', { ready: true })).toBe('t1, todo, medium, First');
    expect(await run('task_set', { task: 't1', status: 'doing' })).toBe('t1, doing, medium, First');
  });

  it('lists tasks by status, approval, readiness, person and since', async () => {
    const { run, records } = await served();
    await run('task_add', { title: 'First' });
    await run('task_add', { title: 'Second', blockedBy: ['t1'] }, at({ person: 'bob', session: 'ahp-session:/two' }));

    // One session changes a task another session made, and the stamps stay.
    await run('task_set', { task: 't2', note: 'ana read it' });
    expect(await kept(records, 't2')).toMatchObject({
      note: 'ana read it',
      created: { by: 'bob', in: 'ahp-session:/two' },
    });

    expect(await run('task_list', {})).toBe('t1, todo, medium, First\nt2, todo, medium, Second');
    expect(await run('task_list', { status: 'todo' })).toBe('t1, todo, medium, First\nt2, todo, medium, Second');
    expect(await run('task_list', { status: 'done' })).toBe('No tasks.');
    expect(await run('task_list', { by: 'ana' })).toBe('t1, todo, medium, First');
    expect(await run('task_list', { since: '2999-01-01' })).toBe('No tasks.');
    expect(await run('task_list', { since: '2000-01-01' })).toBe('t1, todo, medium, First\nt2, todo, medium, Second');
    expect(await run('task_list', { approved: false })).toBe('t1, todo, medium, First\nt2, todo, medium, Second');

    // Ready is todo with every blocker done.
    expect(await run('task_list', { ready: true })).toBe('t1, todo, medium, First');
    await run('task_set', { task: 't1', status: 'done' });
    expect(await run('task_list', { ready: true })).toBe('t2, todo, medium, Second');
    expect(await run('task_list', { ready: false })).toBe('t1, done, medium, First');

    await expect(run('task_list', { status: 'open' }))
      .rejects.toThrow('status is one of todo, doing, blocked, review, done, dropped');
    await expect(run('task_list', { since: 'yesterday' })).rejects.toThrow('since is a date');
  });

  it('offers the three task tools beside the plan tools, and none asks a grant', async () => {
    const { tools, problems } = await served();
    expect([...tools.keys()]).toEqual(expect.arrayContaining([
      'plan_create', 'plan_set', 'plan_show', 'plan_list',
      'task_add', 'task_set', 'task_list',
    ]));
    expect(problems).toEqual([]);
  });
});
