import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { botProvider } from '../src/provider.js';
import { botStore } from '../src/store.js';
import type { BotProvider } from '../src/provider.js';
import type { BotStore } from '../src/store.js';
import type { RecordCollection, RecordStore, StoredRecord } from '../../sdk/src/types/records.js';
import type { Write } from '../../sdk/src/types/resources.js';

/*
 * The bot store, as two collections of the host's record store.
 *
 * The store keeps a cache that every read is answered from, and a tombstone for
 * each slug that had a bot. What is checked here is that shape: a record read
 * into the cache, a write that reaches the collection, a delete that leaves a
 * tombstone, and the refusals the cache is what makes possible.
 */

/** A write of one JSON body, as a client makes one. */
const said = (body: unknown, extra: Partial<Write> = {}): Write =>
  ({ data: JSON.stringify(body), encoding: 'utf-8', ...extra });

/** One bot's record as a read answers it. */
const record = async (provider: BotProvider, uri: string): Promise<Record<string, unknown>> =>
  JSON.parse((await provider.read(uri)).data) as Record<string, unknown>;

/** One record as a collection holds it, which a case has just written. */
const held = async (collection: RecordCollection, id: string): Promise<StoredRecord> => {
  const one = await collection.get(id);
  if (one === undefined) throw new Error(`${id} is not in the collection`);
  return one;
};

/** A record as the `bots` collection holds one, with the parts a bot needs. */
const bot = (id: string, rest: Record<string, unknown> = {}): StoredRecord => ({
  id,
  name: id,
  labels: [],
  body: 'robot',
  color: 'red',
  workspace: `/tmp/bots/${id}`,
  owner: 'user:soft',
  createdAt: '2026-10-11T00:00:00.000Z',
  updatedAt: '2026-10-11T00:00:00.000Z',
  ...rest,
});

/** A provider over one store, and the two collections behind it. */
async function made() {
  const records: RecordStore = memoryRecords();
  const problems: string[] = [];
  const bots: RecordCollection = await records.collection('bots', { body: 'instructions' });
  const graves: RecordCollection = await records.collection('bots-gone');
  const store: BotStore = botStore(bots, graves, (line) => problems.push(line));
  const provider = botProvider({
    root: '/tmp/bots',
    store,
    sessions: { owner: async () => undefined, start: async () => 'echo:/one' },
    hostName: 'test',
  });
  return { records, bots, graves, store, provider, problems };
}

it('keeps a bot in the collection, and answers it from the cache', async () => {
  const { store, provider, problems } = await made();

  await provider.write('bot://motion', said({ name: 'Motion', instructions: 'Be brief.' }));

  // The cache is what a synchronous read is answered from, and it holds the
  // record the provider composed rather than what the write's body said.
  expect(store.get('motion')).toMatchObject({ id: 'motion', name: 'Motion', owner: 'root:test' });
  expect(store.all().map((one) => one.id)).toEqual(['motion']);
  expect(store.gone('motion')).toBe(false);
  expect(problems).toEqual([]);
});

it('writes the record whole, with the body field the plugin named', async () => {
  const { bots, provider } = await made();

  await provider.write('bot://motion', said({ name: 'Motion', instructions: 'Be brief.' }));

  expect(await bots.get('motion')).toMatchObject({ id: 'motion', name: 'Motion', instructions: 'Be brief.' });
});

it('leaves a tombstone where a bot is deleted, and refuses to make it again', async () => {
  const { graves, store, provider } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));

  await provider.remove('bot://motion');

  expect(store.get('motion')).toBeUndefined();
  expect(store.gone('motion')).toBe(true);
  expect(await graves.get('motion')).toMatchObject({ id: 'motion' });
  // The name is spent: a client holding `bot://motion` is never handed another
  // bot under it, so the make is refused rather than allowed.
  await expect(provider.write('bot://motion', said({ name: 'Another' }))).rejects.toMatchObject({ code: -32010 });
});

it('reads the collections back, as a daemon that started again does', async () => {
  const { records, provider } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  await provider.remove('bot://motion');
  await provider.write('bot://other', said({ name: 'Other' }));

  // A second store over the same collections, which is what a restart is.
  const problems: string[] = [];
  const again = botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    (line) => problems.push(line),
  );
  await again.ready();

  expect(again.all().map((one) => one.id)).toEqual(['other']);
  expect(again.gone('motion')).toBe(true);
  expect(problems).toEqual([]);
});

it('reports a record that is not a bot, and keeps every other one', async () => {
  const { bots, store, problems } = await made();
  await bots.put(bot('motion'));
  await bots.put(bot('broken', { name: '' }));

  await store.ready();

  expect(store.all().map((one) => one.id)).toEqual(['motion']);
  expect(problems.join('\n')).toMatch(/broken is not a bot record/);
});

it('answers a read of a bot that was put straight into the collection', async () => {
  const { bots, store, provider } = await made();
  await bots.put(bot('motion', { instructions: 'Be brief.' }));

  await store.ready();

  expect(await record(provider, 'bot://motion')).toMatchObject({ id: 'motion', name: 'motion' });
});

/*
 * A change made where the store is not looking: a person editing the file, or a
 * program writing to the store. The collection's watch is the one road in, and
 * what it does with the change is what these cases check.
 */

/** What one watcher on `bot://` was told, as `type slug` lines. */
const watching = async (provider: BotProvider): Promise<string[]> => {
  const heard: string[] = [];
  await provider.watch('bot://', {}, (changes) => {
    for (const change of changes) heard.push(`${change.type} ${change.uri.slice('bot://'.length)}`);
  });
  return heard;
};

it('takes a bot edited in the collection, and tells a watcher', async () => {
  const { bots, store, provider } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  // What a person's edit leaves behind: the record, written whole, with the
  // fields they did not touch as they were.
  await bots.put({ ...await held(bots, 'motion'), name: 'Motion two' });
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual(['updated motion']);
  expect(store.get('motion')).toMatchObject({ name: 'Motion two' });
});

it('takes a bot put into the collection from outside, and tells a watcher', async () => {
  const { bots, provider } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  await bots.put(bot('other'));
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual(['added other']);
  expect(await record(provider, 'bot://other')).toMatchObject({ id: 'other' });
});

it('buries a bot deleted in the collection, and refuses to make it again', async () => {
  const { bots, graves, store, provider } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  await bots.remove('motion');
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual(['deleted motion']);
  expect(store.get('motion')).toBeUndefined();
  expect(store.gone('motion')).toBe(true);
  expect(await graves.get('motion')).toMatchObject({ id: 'motion' });
  await expect(provider.write('bot://motion', said({ name: 'Another' }))).rejects.toMatchObject({ code: -32010 });
});

it('leaves a bot alone when a hand edit changes its owner', async () => {
  const { bots, store, provider, problems } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  await bots.put({ ...await held(bots, 'motion'), owner: 'user:somebody-else' });
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual([]);
  expect(store.get('motion')).toMatchObject({ owner: 'root:test' });
  expect(problems.join('\n')).toMatch(/motion changed owner/);
});

it('leaves a bot alone when a hand edit changes its workspace', async () => {
  const { bots, store, provider, problems } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  await bots.put({ ...await held(bots, 'motion'), workspace: '/tmp/elsewhere' });
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual([]);
  expect(store.get('motion')).toMatchObject({ workspace: '/tmp/bots/motion' });
  expect(problems.join('\n')).toMatch(/motion changed workspace/);
});

it('reports a record that fails kept, and leaves the bot as it was', async () => {
  const { bots, store, provider, problems } = await made();
  await provider.write('bot://motion', said({ name: 'Motion' }));
  const heard = await watching(provider);

  await bots.put(bot('motion', { color: 'chartreuse' }));
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual([]);
  expect(store.get('motion')).toMatchObject({ name: 'Motion' });
  expect((await record(provider, 'bot://motion'))['name']).toBe('Motion');
  expect(problems.join('\n')).toMatch(/motion is not a bot record/);
});

it('says a write made through the scheme once, and not again for the store', async () => {
  const { store, provider } = await made();
  await store.ready();
  const heard = await watching(provider);

  // The collection tells the store about the store's own put, and the store
  // tells the provider once: a write through `bot://` is one event, not two.
  await provider.write('bot://motion', said({ name: 'Motion' }));
  await new Promise((resolve) => { setTimeout(resolve, 5); });

  expect(heard).toEqual(['added motion']);
});
