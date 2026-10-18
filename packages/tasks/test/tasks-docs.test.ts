import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { readRecordFile } from '../../server/src/records.js';
import { taskStore } from '../src/store.js';

/*
 * The task record `docs/plugins/TASK-LIST.md` shows, read the way the daemon reads
 * it.
 *
 * The page prints a record a person may copy, so it is a file the plugin has to
 * accept: every field a task needs, no field it does not, and a body below the
 * frontmatter. A change on either side the other did not follow is a doc that
 * has stopped being true.
 */

const PAGE = join(import.meta.dirname, '../../../docs/plugins/TASK-LIST.md');

/**
 * The page's level-2 sections, by heading.
 *
 * A fenced block may hold a `## ` line of its own, so a heading counts only
 * outside a fence.
 */
const sections = (markdown: string): Map<string, string> => {
  const found = new Map<string, string>();
  let heading: string | undefined;
  let body: string[] = [];
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const at = fenced ? null : /^## (.+)$/.exec(line);
    if (at !== null) {
      if (heading !== undefined) found.set(heading, body.join('\n'));
      heading = at[1] ?? '';
      body = [];
      continue;
    }
    body.push(line);
  }
  if (heading !== undefined) found.set(heading, body.join('\n'));
  return found;
};

/** The one fenced block a section of the page shows, as the text between its fences. */
const sample = (markdown: string, heading: string): string => {
  const body = sections(markdown).get(heading);
  if (body === undefined) throw new Error(`docs/plugins/TASK-LIST.md has no ${heading} section`);
  const opened = /^```md\n([\s\S]*?)^```$/m.exec(body);
  if (opened === null) throw new Error(`the ${heading} section of docs/plugins/TASK-LIST.md shows no file`);
  return opened[1] ?? '';
};

it('shows a task record the store reads without a problem', async () => {
  const record = readRecordFile(sample(readFileSync(PAGE, 'utf8'), 'The task record'), 'body');
  const problems: string[] = [];
  const records = memoryRecords();
  const tasks = await records.collection('tasks', { body: 'body' });
  await tasks.put(record);
  const store = taskStore(
    tasks,
    await records.collection('plans', { body: 'goal' }),
    (line) => { problems.push(line); },
  );

  expect(problems).toEqual([]);
  const kept = await store.task('t1');
  expect(kept).toMatchObject({
    title: 'Read the plan',
    status: 'doing',
    priority: 'high',
    labels: ['docs'],
    topic: 'tasks',
    plan: 'p1',
    bot: 'pilot',
    folder: '/srv/work',
    session: 'ahp-session:/one',
    blockedBy: [],
    refs: [],
    active: 'Reading the plan',
    created: { by: 'ana', in: 'ahp-session:/one' },
    approved: { by: 'bob', in: 'ahp-session:/two' },
    started: { by: 'ana', in: 'ahp-session:/one' },
  });
  expect(kept?.body?.trim()).toBe('The long text of the task.');
});
