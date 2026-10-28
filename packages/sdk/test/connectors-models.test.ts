import { describe, expect, it } from 'vitest';
import { connectorsChannel } from '../src/connectors/channel.js';
import { memoryRecords } from '../src/resources/records.js';
import type { ConnectorModels, ProviderConnector, ServedAdapter } from '../src/types/connectors.js';
import type { Grant, Principal } from '../src/types/users.js';
import type { Vault } from '../src/types/vault.js';

/*
 * `x-ahpd/connectors/models`: one open provider connector's models, for one
 * reader.
 *
 * The list and what a reader may call belong to the server's proxy, which the
 * channel is handed as `models`. These cases check what the channel itself
 * owns: the command is served only with that option, a reader reads only a
 * connector it may read, and a connector that serves no models says so.
 */

const MODELS = 'x-ahpd/connectors/models';
const PUT = 'x-ahpd/connectors/put';
/** The client a call comes from. */
const CLIENT = 'test';

/** A vault that is a map. */
const made = (): Vault => {
  const held = new Map<string, string>();
  return {
    get: async (name) => held.get(name),
    set: async (name, value) => { held.set(name, value); },
    delete: async (name) => held.delete(name),
    list: async () => [...held.keys()].sort(),
  };
};

/** An adapter that serves models, and one that does not. */
const ADAPTERS: Record<string, ServedAdapter> = {
  provider: {
    name: 'provider',
    title: 'Provider',
    description: 'Serves models.',
    by: 'test',
    schema: { type: 'object', properties: {} },
    capabilities: [{ type: 'models', name: 'models', title: 'Serves models', description: '' }],
    open: () => undefined,
    provider: () => ({ endpoint: 'http://127.0.0.1:1/v1', accepts: ['openai-chat'] }),
    models: async () => [{ id: 'one' }],
  },
  plain: {
    name: 'plain',
    title: 'Plain',
    description: 'Serves nothing.',
    by: 'test',
    schema: { type: 'object', properties: {} },
    capabilities: [],
    open: () => undefined,
  },
};

/** A person holding `grants`, on no team. */
const person = (id: string, grants: string[]): Principal => ({
  id,
  roles: [],
  can: (grant: Grant) => grants.includes(grant),
} as unknown as Principal);

/** The answer the server's proxy would give, and what it was asked. */
const ANSWER: ConnectorModels = { models: [{ id: 'one', model: 'provider/one', callable: true }], at: '2026-10-28T00:00:00.000Z' };

const world = async (withModels = true) => {
  const asked: { connector: ProviderConnector; reader: Principal | undefined }[] = [];
  const collection = await memoryRecords().collection('connectors', { format: 'json' });
  const connectors = connectorsChannel({
    collection,
    adapters: () => ADAPTERS,
    vault: made,
    check: () => undefined,
    ...(withModels ? { models: async (connector: ProviderConnector, reader: Principal | undefined) => { asked.push({ connector, reader }); return ANSWER; } } : {}),
  });
  const put = connectors.methods[PUT]!;
  await put.handle({ id: 'or', adapter: 'provider', owner: 'user:ana', config: {} }, undefined, CLIENT);
  await put.handle({ id: 'bare', adapter: 'plain', owner: 'host', config: {} }, undefined, CLIENT);
  return { connectors, asked };
};

describe('x-ahpd/connectors/models', () => {
  it('is served only on a host that hands the channel a models reader', async () => {
    const { connectors } = await world(false);
    expect(connectors.methods[MODELS]).toBeUndefined();
  });

  it('answers the proxy\'s list for the open connector, asked for that reader', async () => {
    const { connectors, asked } = await world();
    const ana = person('ana', ['connector:list']);
    const answer = await connectors.methods[MODELS]!.handle({ id: 'or' }, ana, CLIENT);
    expect(answer).toEqual(ANSWER);
    expect(asked).toHaveLength(1);
    expect(asked[0]?.connector.id).toBe('or');
    expect(asked[0]?.reader).toBe(ana);
  });

  it('refuses a reader who cannot read the connector', async () => {
    const { connectors, asked } = await world();
    const method = connectors.methods[MODELS]!;
    const gus = person('gus', ['connector:list']);
    expect(await method.authorize!({ id: 'or' }, gus)).toBe(false);
    await expect(method.handle({ id: 'or' }, gus, CLIENT)).rejects.toThrow('not gus\'s to read');
    expect(await method.authorize!({ id: 'or' }, person('ana', ['connector:list']))).toBe(true);
    expect(asked).toEqual([]);
  });

  it('says a connector whose adapter serves no models serves none', async () => {
    const { connectors } = await world();
    await expect(connectors.methods[MODELS]!.handle({ id: 'bare' }, undefined, CLIENT)).rejects.toThrow('bare serves no models');
    await expect(connectors.methods[MODELS]!.handle({ id: 'gone' }, undefined, CLIENT)).rejects.toThrow('holds no gone');
  });
});
