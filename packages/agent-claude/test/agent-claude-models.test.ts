import { expect, it } from 'vitest';
import { AGENT_SECRETS, resolved } from '../../sdk/src/channels/owners.js';
import { modelsProblem, offeredModels, ownModels, sourcesProblem } from '../src/models.js';
import type { ModelEntry, ModelSource } from '../src/models.js';

/*
 * The models a Claude harness offers when its operator names them: written by
 * id in `models`, or fetched from an endpoint's model list in `modelSources`
 * and filtered, in place of the CLI's list or added to it.
 */

const CLI = [{ id: 'default', name: 'Default' }, { id: 'opus', name: 'Opus' }];

/** An endpoint answering an OpenAI-shaped model list, and the requests it saw. */
const endpoint = (data: unknown[], status = 200) => {
  const seen: { url: string; auth?: string }[] = [];
  const get = (async (url: string, init?: { headers?: Record<string, string> }) => {
    seen.push({ url, ...(init?.headers?.authorization === undefined ? {} : { auth: init.headers.authorization }) });
    return new Response(JSON.stringify({ data }), { status });
  }) as unknown as typeof fetch;
  return { get, seen };
};

it('offers written models, each once, in order', async () => {
  expect(await ownModels([
    { id: 'stealth/space-bunny-alpha' },
    { id: 'anthropic/fable-5', name: 'Fable 5' },
    { id: 'stealth/space-bunny-alpha' },
  ])).toEqual([{ id: 'stealth/space-bunny-alpha', name: 'stealth/space-bunny-alpha' }, { id: 'anthropic/fable-5', name: 'Fable 5' }]);
});

it('offers the written models first, then each source, each id once', async () => {
  const { get } = endpoint([{ id: 'anthropic/fable-5' }, { id: 'openai/gpt-5' }]);
  expect(await ownModels(
    [{ id: 'anthropic/fable-5', name: 'Fable 5' }],
    [{ fetch: 'https://models.test/v1/models' }],
    () => {},
    get,
  )).toEqual([{ id: 'anthropic/fable-5', name: 'Fable 5' }, { id: 'openai/gpt-5', name: 'openai/gpt-5' }]);
});

it('fetches an endpoint list and keeps the ids its pattern covers, with the key from the daemon', async () => {
  process.env.AHPD_MODELS_KEY = 'sk-test';
  const { get, seen } = endpoint([
    { id: 'stealth/space-bunny-alpha', name: 'Space Bunny' },
    { id: 'anthropic/fable-5' },
    { id: 'openai/gpt-5' },
  ]);
  const models = await ownModels([], [{ fetch: 'https://models.test/v1/models', match: 'stealth/*', key: { fromEnv: 'AHPD_MODELS_KEY' } }], () => {}, get);
  delete process.env.AHPD_MODELS_KEY;
  expect(models).toEqual([{ id: 'stealth/space-bunny-alpha', name: 'Space Bunny' }]);
  expect(seen).toEqual([{ url: 'https://models.test/v1/models', auth: 'Bearer sk-test' }]);
  // No pattern keeps every model, named by its id when the endpoint gives no name.
  expect((await ownModels([], [{ fetch: 'https://models.test/v1/models' }], () => {}, get)).map((one) => one.name))
    .toEqual(['Space Bunny', 'anthropic/fable-5', 'openai/gpt-5']);
});

it('sends the key a record resolved to text, whether it was fromEnv or a secret', async () => {
  process.env.AHPD_MODELS_KEY = 'sk-from-the-environment';
  const { get, seen } = endpoint([{ id: 'deepseek/deepseek-chat' }]);
  // The record holds `{ fromEnv }`, and the channel resolves a record's config
  // before the kind opens it, so the source entry the kind is handed carries
  // the key's text.
  const record = { modelSources: [{ fetch: 'https://models.test/v1/models', key: { fromEnv: 'AHPD_MODELS_KEY' } }] };
  const view = await resolved(record, 'host', undefined, AGENT_SECRETS);
  const sources = view['modelSources'] as ModelSource[];
  const models = await ownModels([], sources, () => {}, get);
  delete process.env.AHPD_MODELS_KEY;

  expect(models).toEqual([{ id: 'deepseek/deepseek-chat', name: 'deepseek/deepseek-chat' }]);
  expect(seen).toEqual([{ url: 'https://models.test/v1/models', auth: 'Bearer sk-from-the-environment' }]);
});

it('says so and offers the written models when a fetch fails', async () => {
  const said: string[] = [];
  const { get } = endpoint([], 503);
  const models = await ownModels(
    [{ id: 'anthropic/fable-5' }],
    [{ fetch: 'https://models.test/v1/models' }],
    (line) => said.push(line),
    get,
  );
  expect(models).toEqual([{ id: 'anthropic/fable-5', name: 'anthropic/fable-5' }]);
  expect(said).toEqual(['models from https://models.test/v1/models could not be read: HTTP 503']);
});

it('replaces the CLI list, adds to it with keepCliModels, and is the CLI list without either list', () => {
  const own = [{ id: 'stealth/space-bunny-alpha', name: 'Space Bunny' }, { id: 'opus', name: 'Opus again' }];
  expect(offeredModels(CLI, undefined, undefined)).toEqual(CLI);
  expect(offeredModels(CLI, own, undefined)).toEqual(own);
  expect(offeredModels(CLI, own, true)).toEqual([...CLI, { id: 'stealth/space-bunny-alpha', name: 'Space Bunny' }]);
});

it('names what is wrong with a models option', () => {
  expect(modelsProblem(undefined)).toBeUndefined();
  expect(modelsProblem([{ id: 'c/d', name: 'D' }])).toBeUndefined();
  // A string entry is the old shape, which the start rewrites rather than keeps.
  expect(modelsProblem(['a/b'])).toBe('options.models[0] is not an object with an id');
  expect(modelsProblem([{ name: 'x' }])).toBe('options.models[0] has no id');
  expect(modelsProblem([{ id: 'x', name: 5 }])).toBe('options.models[0].name is not a string');
  expect(modelsProblem('a/b')).toBe('options.models is not a list');
});

it('names what is wrong with a modelSources option', () => {
  expect(sourcesProblem(undefined)).toBeUndefined();
  expect(sourcesProblem([{ fetch: 'https://x', match: 'a/*', key: { fromEnv: 'K' } }])).toBeUndefined();
  // A record's key is the text the channel resolved, and a preset's is the
  // variable it is read from: both are keys.
  expect(sourcesProblem([{ fetch: 'https://x', key: 'a-token' }])).toBeUndefined();
  expect(sourcesProblem('https://x')).toBe('options.modelSources is not a list');
  expect(sourcesProblem([{}])).toBe('options.modelSources[0] has no fetch');
  expect(sourcesProblem([{ fetch: 'https://x', match: 5 }])).toBe('options.modelSources[0].match is not a string');
  expect(sourcesProblem([{ fetch: 'https://x', key: 5 }])).toBe('options.modelSources[0].key is not a string or { fromEnv }');
  expect(sourcesProblem([{ fetch: 'https://x', key: {} }])).toBe('options.modelSources[0].key is not a string or { fromEnv }');
});

it('reads back a stored record whose models were split into the two lists', () => {
  // The shape a start leaves behind: one written model and one source.
  const models: ModelEntry[] = [{ id: 'deepseek-flash' }];
  const sources: ModelSource[] = [{ fetch: 'https://models.test/v1/models', match: 'deepseek/*', key: { fromEnv: 'K' } }];
  expect(modelsProblem(models)).toBeUndefined();
  expect(sourcesProblem(sources)).toBeUndefined();
});
