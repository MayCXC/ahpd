/*
 * The host's maps, as a client draws them and as the host checks them.
 *
 * A map value now carries a schema, so a client draws a name and a value row
 * rather than `[object Object]`. cofold 0.3.0's `check` copies a map value
 * without holding it, so the value schemas are for drawing only: each value is
 * still checked by the host, and one bad `mcpServers` entry is still named and
 * left out rather than refusing the start.
 */

import { describe, expect, it } from 'vitest';
import { check, type JsonSchema } from '@cofold/commands';
import { configSchema, mcpServers, mcpServerSchema } from '../src/commands/options.js';
import { modelEntrySchema, proxyProblems, proxySchema } from '../src/proxy/providers.js';
import { shellEnvProblems } from '../src/config.js';
import { schemaGaps } from '../../sdk/src/plugins/schemagaps.js';

/** The properties of one object schema, as a case reads them. */
const propertiesOf = (schema: JsonSchema): Record<string, JsonSchema> => schema.properties ?? {};

/** A key the daemon knows, which every case here reads. */
const at = (key: string): JsonSchema => propertiesOf(configSchema)[key] as JsonSchema;

/** A `config.json` that holds a valid value for each map. */
const VALID = {
  shellEnv: { HOME: '/home/me', PORT: null },
  modelProxy: {
    models: { 'acme/one': [{ provider: 'claude', id: 'one' }] },
    sessionCalls: 'record',
  },
  mcpServers: { files: { type: 'stdio', command: 'mcp-files' } },
};

describe('the maps name the values a client draws', () => {
  it('names the one variable of shellEnv, as text or null', () => {
    expect(at('shellEnv')['additionalProperties']).toEqual({ type: ['string', 'null'] });
  });

  it('names the one server of mcpServers, and the one model value of the proxy', () => {
    expect(at('mcpServers')['additionalProperties']).toEqual(mcpServerSchema);
    expect(propertiesOf(at('modelProxy'))['models']?.['additionalProperties'])
      .toEqual({ type: 'array', items: modelEntrySchema });
  });

  it('names the one model value of the proxy schema itself', () => {
    expect(propertiesOf(proxySchema)['models']?.['additionalProperties'])
      .toEqual({ type: 'array', items: modelEntrySchema });
  });

  it('has no gap in the host config or in the proxy schema', () => {
    expect(schemaGaps(configSchema)).toEqual([]);
    expect(schemaGaps(proxySchema)).toEqual([]);
    expect(schemaGaps(mcpServerSchema)).toEqual([]);
  });
});

describe('cofold check accepts the maps', () => {
  it('accepts a valid config.json, value schemas and all', () => {
    expect(() => check(VALID, configSchema, 'config')).not.toThrow();
  });

  it('copies a map value without holding it, so one bad value does not refuse the file', () => {
    expect(() => check({ shellEnv: { PORT: 5 } }, at('shellEnv'), 'shellEnv')).not.toThrow();
    expect(() => check({ models: { 'acme/one': 'nope' } }, at('modelProxy'), 'modelProxy')).not.toThrow();
    expect(() => check({ bad: { type: 'nope' } }, at('mcpServers'), 'mcpServers')).not.toThrow();
  });
});

describe('the host still checks each value itself', () => {
  it('names a shellEnv value that is neither text nor null', () => {
    expect(shellEnvProblems({ HOME: '/home/me' })).toEqual([]);
    expect(shellEnvProblems({ PORT: 5 })).toEqual(['shellEnv.PORT must be text or null']);
    expect(shellEnvProblems({ '2FA': 'on' })).toEqual(['shellEnv.2FA is not a shell variable name']);
  });

  it('names a model value that is not a list of entries', () => {
    expect(proxyProblems({ models: { 'acme/one': [{ provider: 'claude', id: 'one' }] } })).toEqual([]);
    expect(proxyProblems({ models: { 'acme/one': 'nope' } })).toEqual([
      'modelProxy.models.acme/one must be a list',
    ]);
    expect(proxyProblems({ models: { 'acme/one': [{ provider: 'claude' }] } })).toEqual([
      'modelProxy.models.acme/one[0].id is required',
    ]);
  });

  it('keeps a bad mcpServers entry out, names it, and keeps the others', () => {
    const { servers, warnings } = mcpServers(
      { files: { type: 'stdio', command: 'mcp-files' }, broken: { type: 'stdio' } },
      () => '/tmp/config.json',
    );

    expect(Object.keys(servers)).toEqual(['files']);
    expect(warnings).toEqual(['/tmp/config.json: mcpServers.broken is a stdio server with no command; ignored']);
  });

  it('names a bad entry by its place and keeps the start', () => {
    const { servers, warnings } = mcpServers({ bad: { type: 'nope' } }, () => '/tmp/config.json');

    expect(servers).toEqual({});
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('/tmp/config.json: mcpServers.bad');
    expect(warnings[0]).not.toContain('undefined');
  });
});
