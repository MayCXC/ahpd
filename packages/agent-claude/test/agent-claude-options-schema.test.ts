import { join } from 'node:path';
import { expect, it } from 'vitest';
import { loadPlugins } from '../../server/src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import { DECLARED } from '../src/options.js';
import type { AgentKind, Bag } from '@ahpd/sdk';

/*
 * The kind schema a client reads, against the options a record holds.
 *
 * Every declared option is a property of the kind's schema, so a client that draws a record sees each one. A property is the declaration's own `schema`, so the value a record may carry and the value a session is held to cannot drift.
 */

const REPO = join(import.meta.dirname, '../../..');
const SOURCE = './packages/agent-claude/src/index.ts';

/** The `claude` kind one load registered. */
const kindOf = async (): Promise<AgentKind> => {
  const { problems, options: served } = await loadPlugins([{ name: SOURCE, options: {} }], {
    base: { path: '/tmp/ahpd-preset', agents: [echo({ path: '/tmp/ahpd-preset' })] },
    configDir: REPO,
    cwd: REPO,
    log: () => {},
  });
  expect(problems).toEqual([]);
  const kind = served.agentKinds?.['claude'];
  if (kind === undefined) throw new Error('no claude kind was registered');
  return kind;
};

it('declares every option a record holds as a property of the kind schema', async () => {
  const properties = ((await kindOf()).schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  for (const [name, one] of Object.entries(DECLARED)) expect(properties[name], name).toEqual(one.schema);
  // Beside the declared options are the two fields a record holds as an agent
  // of this kind rather than as a set of values.
  expect(properties['models']).toMatchObject({ type: 'array' });
  expect(properties['keepCliModels']).toMatchObject({ type: 'boolean' });
});

it('names the values a record may hold, not only their types', async () => {
  const properties = ((await kindOf()).schema.properties ?? {}) as Bag;
  // What a client draws, and what the channel holds a record to: a preset with
  // thinking 5 used to be checked here, and the schema is what answers now.
  expect(properties['thinking']).toMatchObject({ type: 'string', enum: ['adaptive', 'disabled'] });
  expect(properties['sandbox']).toMatchObject({ enum: ['default', 'on', 'off'] });
});
