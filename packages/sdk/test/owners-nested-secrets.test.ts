import { expect, it } from 'vitest';
import { AGENT_SECRETS, HELD, heldAgainst, moveSecrets, resolved, writeOnlyPaths } from '../src/channels/owners.js';
import type { Vault } from '../src/types/vault.js';

/*
 * A secret below the top of an agent's config: a key inside one entry of a
 * list, and a value of a map. Each moves to the vault, a client sees `<set>`,
 * and an empty field keeps a list secret only while its entry is unchanged.
 */

const KEY = { writeOnly: true, oneOf: [{ type: 'string' }, { type: 'object' }] };

const SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    sources: {
      type: 'array',
      items: { type: 'object', properties: { fetch: { type: 'string' }, key: KEY }, required: ['fetch'] },
    },
    env: { type: 'object', additionalProperties: { type: 'string', writeOnly: true } },
    name: { type: 'string' },
  },
};

/** A vault that is a map, and says what is in it. */
const made = (): Vault & { held: Map<string, string> } => {
  const held = new Map<string, string>();
  return {
    held,
    get: async (name) => held.get(name),
    set: async (name, value) => { held.set(name, value); },
    delete: async (name) => held.delete(name),
    list: async () => [...held.keys()].sort(),
  };
};

const put = async (
  vault: Vault,
  config: Record<string, unknown>,
  held: Record<string, unknown> = {},
  owner: 'host' | `user:${string}` = 'user:ana',
): Promise<Record<string, unknown>> => moveSecrets({
  rules: AGENT_SECRETS,
  fields: writeOnlyPaths(SCHEMA, held, config),
  config,
  held,
  owner,
  id: 'one',
  vault,
  problem: () => undefined,
});

it('names a key in each list entry and each map value, from what the configs hold', () => {
  expect(writeOnlyPaths(SCHEMA, {
    sources: [{ fetch: 'https://a' }, { fetch: 'https://b', key: 'k' }],
    env: { TOKEN: 't' },
    name: 'x',
  }).sort()).toEqual(['env.TOKEN', 'sources.0.key', 'sources.1.key']);
  expect(writeOnlyPaths(SCHEMA, {})).toEqual([]);
});

it('walks a schema that names itself only as deep as the config goes', () => {
  const node: Record<string, unknown> = { type: 'object', properties: { key: { type: 'string', writeOnly: true } } };
  (node['properties'] as Record<string, unknown>)['child'] = node;
  expect(writeOnlyPaths(node, { key: 'a', child: { key: 'b', child: {} } }).sort()).toEqual(['child.child.key', 'child.key', 'key']);
});

it('moves a list key to the vault, and a client sees <set>', async () => {
  const vault = made();
  const stored = await put(vault, { sources: [{ fetch: 'https://a', key: 'sk-one' }] });
  expect(stored).toEqual({ sources: [{ fetch: 'https://a', key: { $secret: 'user:ana/agent/one/sources.0.key' } }] });
  expect(vault.held.get('user:ana/agent/one/sources.0.key')).toBe('sk-one');
  expect(JSON.stringify(heldAgainst(stored, AGENT_SECRETS))).not.toContain('sk-one');
  expect(heldAgainst(stored, AGENT_SECRETS)).toEqual({ sources: [{ fetch: 'https://a', key: HELD }] });
  expect(await resolved(stored, 'user:ana', vault, AGENT_SECRETS)).toEqual({ sources: [{ fetch: 'https://a', key: 'sk-one' }] });
});

it('keeps a list key sent empty while its entry is unchanged', async () => {
  const vault = made();
  const first = await put(vault, { sources: [{ fetch: 'https://a', key: 'sk-one' }] });
  const again = await put(vault, { sources: [{ fetch: 'https://a', key: '' }], name: 'renamed' }, first);
  expect(again).toEqual({ sources: [{ fetch: 'https://a', key: { $secret: 'user:ana/agent/one/sources.0.key' } }], name: 'renamed' });
  expect(vault.held.get('user:ana/agent/one/sources.0.key')).toBe('sk-one');
});

it('refuses an empty list key whose entry moved, so a key never reaches another endpoint', async () => {
  const vault = made();
  const first = await put(vault, { sources: [{ fetch: 'https://a', key: 'sk-a' }, { fetch: 'https://b', key: 'sk-b' }] });
  // The first entry went: the second is at position 0 now, where sk-a was kept.
  const refused = put(vault, { sources: [{ fetch: 'https://b', key: '' }] }, first);
  await expect(refused).rejects.toThrow(/sources\.0\.key sits in an entry that changed/u);
  await expect(refused).rejects.not.toThrow(/sk-/u);
  expect(vault.held.get('user:ana/agent/one/sources.0.key')).toBe('sk-a');
});

it('takes out the secret of an entry that went', async () => {
  const vault = made();
  const first = await put(vault, { sources: [{ fetch: 'https://a', key: 'sk-a' }, { fetch: 'https://b', key: 'sk-b' }] });
  await put(vault, { sources: [{ fetch: 'https://a', key: '' }] }, first);
  expect([...vault.held.keys()]).toEqual(['user:ana/agent/one/sources.0.key']);
});

it('moves a map value to the vault', async () => {
  const vault = made();
  const stored = await put(vault, { env: { TOKEN: 'tok' } }, {}, 'host');
  expect(stored).toEqual({ env: { TOKEN: { $secret: 'host:agent/one/env.TOKEN' } } });
  expect(vault.held.get('host:agent/one/env.TOKEN')).toBe('tok');
});

it('keeps a host secret a host agent names, and refuses one anyone else names', async () => {
  const vault = made();
  expect(await put(vault, { env: { TOKEN: { $secret: 'host:shared' } } }, {}, 'host'))
    .toEqual({ env: { TOKEN: { $secret: 'host:shared' } } });
  await expect(put(vault, { env: { TOKEN: { $secret: 'host:shared' } } })).rejects.toThrow(/send its value, not a reference/u);
  await expect(put(vault, { env: { TOKEN: { $secret: 'user:bo/x' } } }, {}, 'host')).rejects.toThrow(/send its value, not a reference/u);
});
