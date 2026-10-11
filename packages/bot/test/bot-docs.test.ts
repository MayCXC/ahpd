import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { readRecordFile } from '../../server/src/records.js';
import { memoryRecords } from '../../sdk/src/records.js';
import { botStore } from '../src/store.js';

/*
 * The bot file `docs/BOTS.md` shows, read the way the daemon reads one.
 *
 * The page prints a file a person may copy, so it is a file the daemon has to
 * accept: frontmatter, a body, and every field a bot needs. A change on either
 * side the other did not follow is a doc that has stopped being true.
 */

const PAGE = join(import.meta.dirname, '../../../docs/BOTS.md');

/** The one fenced block a section of the page shows, as the text between its fences. */
const sample = (markdown: string, heading: string): string => {
  const from = markdown.indexOf(`\n## ${heading}\n`);
  if (from === -1) throw new Error(`docs/BOTS.md has no ${heading} section`);
  const next = markdown.indexOf('\n## ', from + 1);
  const opened = /^```md\n([\s\S]*?)^```$/m.exec(markdown.slice(from, next === -1 ? undefined : next));
  if (opened === null) throw new Error(`the ${heading} section of docs/BOTS.md shows no file`);
  return opened[1] ?? '';
};

it('shows a bot file the daemon reads as a bot', async () => {
  const record = readRecordFile(sample(readFileSync(PAGE, 'utf8'), 'The file'), 'instructions');
  expect(record['id']).toBe('motion');

  /*
   * Read into a store, which is the check every record from a collection
   * passes: a field that is missing or of the wrong type is a problem line
   * rather than a bot, and the file the page prints has to be neither.
   */
  const problems: string[] = [];
  const records = memoryRecords();
  await (await records.collection('bots', { body: 'instructions' })).put(record);
  const store = botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    (line) => problems.push(line),
  );
  await store.ready();

  expect(problems).toEqual([]);
  expect(store.get('motion')).toMatchObject({ name: 'Motion', color: 'teal', body: 'robot' });
  expect(store.get('motion')?.instructions).toMatch(/^You review pull requests\./);
});
