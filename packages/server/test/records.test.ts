import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordChange, RecordCollection } from '@ahpd/sdk';
import { echo } from '../../../examples/echo/agent.js';
import { loadPlugins } from '../src/plugins.js';
import { fileRecords, readRecordFile, recordFile } from '../src/records.js';

/*
 * The daemon's record store: a folder per collection, a Markdown file per
 * record, and a watch that reads a hand edit again.
 */

let dir: string;
let problems: string[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ahpd-records-'));
  problems = [];
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const store = () => fileRecords(dir, { onProblem: (message) => { problems.push(message); } });

const bot = {
  id: 'helper',
  name: 'Helper',
  labels: ['a', 'b'],
  count: 2,
  instructions: 'Answer briefly.\n\nUse the tools: a, b.\n',
};

/** Every change a collection tells, from now on. */
const heard = (collection: RecordCollection): RecordChange[] => {
  const changes: RecordChange[] = [];
  collection.watch((change) => { changes.push(change); });
  return changes;
};

describe('recordFile and readRecordFile', () => {
  it('writes the fields as frontmatter and the body field as the body', () => {
    const text = recordFile(bot, 'instructions');

    expect(text).toBe('---\nid: helper\nname: Helper\nlabels:\n  - a\n  - b\ncount: 2\n---\nAnswer briefly.\n\nUse the tools: a, b.\n\n');
    expect(readRecordFile(text, 'instructions')).toEqual(bot);
  });

  it('writes an empty body where the collection has no body field', () => {
    const text = recordFile({ id: 'one', note: 'x' });

    expect(text).toBe('---\nid: one\nnote: x\n---\n');
    expect(readRecordFile(`${text}text nobody asked for\n`)).toEqual({ id: 'one', note: 'x' });
  });

  it('reads a body an editor saved without its last newline', () => {
    expect(readRecordFile('---\nid: one\n---\nhello', 'text')).toEqual({ id: 'one', text: 'hello' });
  });

  it('refuses a file with no frontmatter, or a frontmatter that is not a mapping', () => {
    expect(() => readRecordFile('id: one\n')).toThrow('---');
    expect(() => readRecordFile('---\nid: one\n')).toThrow('closing');
    expect(() => readRecordFile('---\n- one\n---\n')).toThrow('mapping');
  });
});

describe('fileRecords', () => {
  it('keeps a record with a multi-line body as plain text below the frontmatter', async () => {
    const bots = await store().collection('bots', { body: 'instructions' });
    await bots.put(bot);

    const file = join(dir, 'bots', 'helper.md');
    const text = readFileSync(file, 'utf8');
    expect(text.endsWith('---\nAnswer briefly.\n\nUse the tools: a, b.\n\n')).toBe(true);
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(await bots.get('helper')).toEqual(bot);
  });

  it('reads back what it put, from a store opened again', async () => {
    const bots = await store().collection('bots', { body: 'instructions' });
    await bots.put(bot);
    await bots.put({ id: 'other', name: 'Other', owner: 'ana' });

    const again = await store().collection('bots', { body: 'instructions' });
    expect(await again.get('helper')).toEqual(bot);
    expect(await again.get('other')).toEqual({ id: 'other', name: 'Other', owner: 'ana', instructions: '' });
    expect((await again.list()).map((one) => one.id).sort()).toEqual(['helper', 'other']);
    expect(await again.find({ owner: 'ana' })).toEqual([{ id: 'other', name: 'Other', owner: 'ana', instructions: '' }]);
  });

  it('refuses a record whose id is not a slug, and a body that is not text', async () => {
    const bots = await store().collection('bots', { body: 'instructions' });

    await expect(bots.put({ id: 'Not A Slug' })).rejects.toThrow('not a record id');
    await expect(bots.put({ id: 'one', instructions: 3 })).rejects.toThrow('body');
    await expect(store().collection('../up')).rejects.toThrow('not a collection name');
  });

  it('refuses a collection named after a folder the daemon keeps its own files in', async () => {
    mkdirSync(join(dir, 'sessions'));
    writeFileSync(join(dir, 'sessions', 'abc.json'), JSON.stringify({ id: 'abc' }));

    await expect(store().collection('sessions')).rejects.toThrow('the daemon keeps its own files');
    await expect(store().collection('usage')).rejects.toThrow('the daemon keeps its own files');
    expect(existsSync(join(dir, 'sessions', 'abc.json'))).toBe(true);
  });

  it('refuses to remove a record whose id is not a slug', async () => {
    const bots = await store().collection('bots');
    writeFileSync(join(dir, 'outside.md'), 'kept\n');

    await expect(bots.remove('../outside')).rejects.toThrow('not a record id');
    expect(existsSync(join(dir, 'outside.md'))).toBe(true);
  });

  it('removes a record and its file', async () => {
    const bots = await store().collection('bots');
    await bots.put({ id: 'one' });

    expect(await bots.remove('one')).toBe(true);
    expect(await bots.remove('one')).toBe(false);
    expect(existsSync(join(dir, 'bots', 'one.md'))).toBe(false);
  });

  it('converts each <id>.json once, and keeps it as <id>.json.migrated', async () => {
    const folder = join(dir, 'bots');
    mkdirSync(folder);
    writeFileSync(join(folder, 'helper.json'), JSON.stringify(bot));
    writeFileSync(join(folder, 'wrong.json'), JSON.stringify({ id: 'other' }));

    const bots = await store().collection('bots', { body: 'instructions' });
    expect(await bots.get('helper')).toEqual(bot);
    expect(existsSync(join(folder, 'helper.json'))).toBe(false);
    expect(JSON.parse(readFileSync(join(folder, 'helper.json.migrated'), 'utf8'))).toEqual(bot);
    expect(existsSync(join(folder, 'wrong.json'))).toBe(true);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('wrong.json');

    // A second start finds the Markdown file and converts nothing.
    writeFileSync(join(folder, 'helper.json'), JSON.stringify({ ...bot, name: 'Stale' }));
    const again = await store().collection('bots', { body: 'instructions' });
    expect(await again.get('helper')).toEqual(bot);
    expect(existsSync(join(folder, 'helper.json'))).toBe(true);
  });

  it('refuses a file whose frontmatter id is not its file name', async () => {
    const folder = join(dir, 'bots');
    mkdirSync(folder);
    writeFileSync(join(folder, 'one.md'), '---\nid: two\n---\n');

    const bots = await store().collection('bots');
    expect(await bots.list()).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('one.md');
  });

  it('tells a watcher of a hand edit as updated, and of its own put once', async () => {
    const bots = await store().collection('bots', { body: 'instructions' });
    const changes = heard(bots);
    await bots.put(bot);

    // Long enough for the watch to have seen the store's own write.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(changes).toEqual([{ id: 'helper', type: 'added' }]);

    writeFileSync(join(dir, 'bots', 'helper.md'), recordFile({ ...bot, name: 'Edited' }, 'instructions'));
    await vi.waitFor(() => { expect(changes).toHaveLength(2); });
    expect(changes[1]).toEqual({ id: 'helper', type: 'updated' });
    expect(await bots.get('helper')).toEqual({ ...bot, name: 'Edited' });

    writeFileSync(join(dir, 'bots', 'new.md'), '---\nid: new\n---\nhi\n');
    await vi.waitFor(() => { expect(changes).toHaveLength(3); });
    expect(changes[2]).toEqual({ id: 'new', type: 'added' });

    rmSync(join(dir, 'bots', 'new.md'));
    await vi.waitFor(() => { expect(changes).toHaveLength(4); });
    expect(changes[3]).toEqual({ id: 'new', type: 'deleted' });
  });

  it('reports a file with a broken frontmatter, and keeps the record from before', async () => {
    const bots = await store().collection('bots', { body: 'instructions' });
    const changes = heard(bots);
    await bots.put(bot);

    writeFileSync(join(dir, 'bots', 'helper.md'), '---\nid: helper\nname: [unclosed\n');
    await vi.waitFor(() => { expect(problems).toHaveLength(1); });
    expect(problems[0]).toContain('helper.md');
    expect(changes).toEqual([{ id: 'helper', type: 'added' }]);
    expect(await bots.get('helper')).toEqual(bot);
  });
});

describe('the loader', () => {
  it('gives a plugin a collection over the folded store, and refuses its name to a second plugin', async () => {
    const here = import.meta.dirname;
    const base = { path: '/tmp/plugin-records', agents: [echo({ path: '/tmp/plugin-records' })], records: fileRecords(dir) };
    const loaded = await loadPlugins(['./fixtures/plugin-notes/index.ts', './fixtures/plugin-notes-again/index.ts'], {
      base,
      configDir: join(here, 'fixtures'),
      cwd: here,
      log: () => {},
    });

    expect(loaded.loaded.map((one) => one.name)).toEqual(['notes']);
    expect(loaded.problems).toHaveLength(1);
    expect(loaded.problems[0]).toContain('plugin notes opened it');

    const notes = (globalThis as Record<string, unknown>).__notesCollection as RecordCollection | undefined;
    await notes?.put({ id: 'first', text: 'A note.' });
    expect(readFileSync(join(dir, 'notes', 'first.md'), 'utf8')).toBe('---\nid: first\n---\nA note.\n');
  });
});
