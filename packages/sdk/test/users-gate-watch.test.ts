import { expect, it } from 'vitest';
import { ROOT } from '../src/host.js';
import { call, directory, hello, host, peer, signIn } from './users-gate-helpers.js';
import type { Bag } from './users-gate-helpers.js';
import type { ResourceChange, ResourceProvider } from '../src/types/resources.js';
import type { Principal } from '../src/types/users.js';

/*
 * A watch on a provider's scheme.
 *
 * It answers to the scheme it watches, at `createResourceWatch` and at the
 * subscribe that follows, and the provider is told who is watching.
 */

/** A provider that can be watched, and keeps the reader each watch was opened by. */
const watchable = (open: (uri: string, reader: Principal | undefined) => boolean = () => false) => {
  const readers: (Principal | undefined)[] = [];
  const told: ((changes: ResourceChange[]) => void)[] = [];
  const provider: ResourceProvider = {
    read: async () => ({ data: '{}', encoding: 'utf-8' }),
    watch: async (_uri, _options, onChange, reader) => {
      readers.push(reader);
      told.push(onChange);
      return { close: () => {} };
    },
    authorize: async (uri, reader) => open(uri, reader),
  };
  return { provider, readers, told };
};

const opened = async (made: ReturnType<typeof host>, token: string) => {
  const client = made.accept(peer());
  await hello(client, token); await signIn(client, token);
  return client;
};

it('hands the provider the reader who asked for the watch', async () => {
  const { provider, readers } = watchable();
  const made = host({ users: directory({ ana: ['bot:watch'] }), resourceProviders: { bot: provider } });
  const ana = await opened(made, 'ana');
  expect(await call(ana, 'createResourceWatch', { channel: ROOT, uri: 'bot://' })).toMatchObject({ result: { channel: expect.any(String) } });
  expect(readers).toEqual([expect.objectContaining({ id: 'ana' })]);
});

it('gates the watch channel by the scheme it watches, not by file:watch', async () => {
  const { provider } = watchable();
  const made = host({
    users: directory({ owner: ['bot:watch'], bots: ['bot:watch'], files: ['file:watch'] }),
    resourceProviders: { bot: provider },
  });
  const owner = await opened(made, 'owner');
  const { result } = await call(owner, 'createResourceWatch', { channel: ROOT, uri: 'bot://' }) as { result: { channel: string } };

  const bots = await opened(made, 'bots');
  expect(await call(bots, 'subscribe', { channel: result.channel })).toMatchObject({ result: { snapshot: expect.anything() } });

  const files = await opened(made, 'files');
  expect(await call(files, 'subscribe', { channel: result.channel })).toMatchObject({ code: -32009, message: 'files may not bot:watch here' });
});

it('lets a provider\'s authorize open a watch and its channel to a reader with no grant', async () => {
  const { provider } = watchable((uri, reader) => reader?.id === 'ana' && uri === 'bot://');
  const made = host({ users: directory({ ana: [], bob: [] }), resourceProviders: { bot: provider } });

  const ana = await opened(made, 'ana');
  const { result } = await call(ana, 'createResourceWatch', { channel: ROOT, uri: 'bot://' }) as { result: { channel: string } };
  expect(result.channel).toMatch(/^ahp-resource-watch:\//);
  expect(await call(ana, 'subscribe', { channel: result.channel })).toMatchObject({ result: { snapshot: expect.anything() } });

  const bob = await opened(made, 'bob');
  expect(await call(bob, 'createResourceWatch', { channel: ROOT, uri: 'bot://' })).toMatchObject({ code: -32009, message: 'bob may not bot:watch here' });
  expect(await call(bob, 'subscribe', { channel: result.channel })).toMatchObject({ code: -32009, message: 'bob may not bot:watch here' });
});

it('advertises watch for a provider that has it', async () => {
  const { provider } = watchable();
  const made = host({ resourceProviders: { bot: provider, plain: { read: provider.read } } });
  const client = made.accept(peer());
  const ready = await hello(client) as Bag;
  const schemes = ready._meta['ahpd.resourceProviders'] as Bag;
  expect(schemes['bot'].operations).toEqual(['get', 'watch']);
  expect(schemes['plain'].operations).toEqual(['get']);
});
