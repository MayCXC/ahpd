import { expect, it, vi } from 'vitest';
import type { Bag, BoundTool } from '@ahpd/sdk';

/*
 * A client's tool list, kept only once the SDK has taken it.
 *
 * This lives beside `clienttools.ts` and not in `packages/sdk`, where the task
 * placed it, because what is under test is this backend's `setTools` and its
 * `ctx.declared`: the holder and the entry a call is raised against are the
 * sdk's, but "kept only once the SDK has taken it" is this file's. So the
 * cases build the small part of a session's context `setTools` reads and drive
 * the one method, rather than a whole host.
 */

/** The one argument the SDK server was built from, held for the cases. */
const seen = vi.hoisted(() => ({ given: undefined as Record<string, unknown> | undefined }));

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => {
    seen.given = given;
    return { type: 'sdk', name: given.name, tools: given.tools };
  },
}));

const { createClientTools } = await import('../src/session/clienttools.js');

/** A tool a client offers, which is all `setTools` reads of one. */
const offeredTool = (name: string, owner = 'probe'): BoundTool => ({
  owner,
  definition: { name, description: name, inputSchema: { type: 'object', properties: {} } },
}) as unknown as BoundTool;

/**
 * A session whose `setMcpServers` refuses while `refuse` is true.
 *
 * Only the fields `setTools` reads are here. `declared` starts as the host's
 * own server does - the host tools this session was built with - so a case can
 * see that a set the SDK refused left those beside it untouched.
 */
const session = () => {
  let refuse = false;
  const sent: Record<string, Bag>[] = [];
  const hostServer = { type: 'sdk', name: 'host' } as Bag;
  const ctx = {
    options: { chatUri: 'ahp-chat:/contributed' },
    emit: () => {},
    declared: { host: hostServer } as Record<string, Bag>,
    offering: [] as BoundTool[],
    handle: {
      setMcpServers: async (servers: Record<string, Bag>) => {
        if (refuse) throw new Error('the CLI said no');
        sent.push(servers);
      },
    },
  };
  const tools = createClientTools(ctx as never);
  return {
    setTools: tools.methods.setTools,
    sent,
    /** What the session offers and declares now, which `setTools` moves. */
    state: () => ({ offering: ctx.offering, declared: ctx.declared }),
    refusing: (on: boolean) => { refuse = on; },
  };
};

it('sends a list the SDK refused again when the same list comes back', async () => {
  const held = session();
  held.refusing(true);
  const list = [offeredTool('openFile')];
  expect(await held.setTools(list)).toBe(false);
  // Nothing came of it, so nothing moved: the list is not one this session is
  // holding, and the host's own server is still beside it.
  expect(held.state().offering).toEqual([]);
  expect(Object.keys(held.state().declared)).toEqual(['host']);

  held.refusing(false);
  expect(await held.setTools(list)).toBe(true);
  // The same list, sent again because the session never took it the first time.
  expect(held.sent).toHaveLength(1);
  expect(held.state().offering).toEqual(list);
});

it('does not send a list the SDK took when it comes again', async () => {
  const held = session();
  expect(await held.setTools([offeredTool('openFile')])).toBe(true);
  expect(held.sent).toHaveLength(1);
  // Taken, so what comes again is what is already there.
  expect(await held.setTools([offeredTool('openFile')])).toBe(true);
  expect(held.sent).toHaveLength(1);
});

it('declares the set whole, so a re-declare cannot take the host server away', async () => {
  const held = session();
  await held.setTools([offeredTool('openFile')]);
  const set = held.sent.at(-1) as Record<string, Bag>;
  expect(Object.keys(set).sort()).toEqual(['ahp', 'host']);
  expect((set.ahp as { name: string }).name).toBe('ahp');
  expect(seen.given?.name).toBe('ahp');
});
