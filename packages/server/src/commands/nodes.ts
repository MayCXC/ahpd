/**
 * `ahpd node`: the hosts that joined this one, managed without a join running.
 *
 * A node's token is the credential its `ahpd join` presents, so it is minted
 * here and shown once. The nodes file has no name of its own: it sits beside the
 * users file, so the flag that names the people names both. Served over HTTP, the
 * daemon's own users file is used and the request names none.
 *
 * A hub started with no users file has nowhere to keep nodes and is told so
 * rather than answered with a file nobody would read.
 */

import { output } from '@cofold/commands';
import type { Command, CommandContext, Registry } from '@cofold/commands';
import { fileNodes, nodesFileOf, type Nodes } from '@ahpd/sdk';
import { loadConfig } from '../config.js';
import { conflict, stop, userAt } from './options.js';
import type { ServedFacts } from './served.js';

/** Said where a hub cannot keep nodes, whichever verb asked. */
const NO_USERS = 'No users file, so there is nowhere for the nodes file to sit. Pass --users <file> or set "users" in the configuration.';

/**
 * The nodes file, and the store over it.
 *
 * Read from `--users` or the configuration key and from nowhere else, as the
 * people directory is: a verb that invented a path because neither was set would
 * write a file the next daemon to start would not read.
 */
const place = (
  context: { input: Readonly<Record<string, unknown>>; error(text: string): void },
  served?: ServedFacts,
): { path: string; nodes: Nodes } => {
  if (served !== undefined) {
    const users = served.options.users;
    if (users === undefined) stop(NO_USERS);
    const path = nodesFileOf(users);
    // The daemon's own registry, so a node taken out or given a new token loses
    // the connection its old token opened.
    return { path, nodes: served.nodes ?? fileNodes({ path }) };
  }
  const input = context.input;
  const named = typeof input['users'] === 'string' ? input['users'] : undefined;
  const from = loadConfig(typeof input['configFile'] === 'string' ? input['configFile'] : undefined).values;
  const users = named ?? from.users;
  if (users === undefined) stop(NO_USERS);
  const path = nodesFileOf(users);
  return { path, nodes: fileNodes({ path, onProblem: (line) => { context.error(line); } }) };
};

/** The name a node was given, refused as an unknown flag would be when it is spelt like one. */
const nameOf = (context: Pick<CommandContext, 'value'>, command: string): string => {
  const id = context.value<string>('id');
  if (id.startsWith('-')) stop(`${command} takes a node's name: ahpd ${command} <name>`);
  return id;
};

export const declareNodes = (registry: Registry<object>, served?: ServedFacts): Command[] => {
  /** Where the file is: served, the daemon's own, so no field could name another. */
  const at = served === undefined ? userAt : {};

  const list = registry.action({
    id: 'node.list',
    summary: 'The hosts that joined this one',
    surfaces: { cli: { pattern: ['node', 'list'] }, http: { method: 'GET', path: '/node/list' } },
    // No key: this is the listing, and each row carries the `id` the other
    // verbs here take.
    effect: 'read',
    resource: { kind: 'node' },
    input: at,
    scopes: ['node:read'],
    run: async (context) => {
      const { path, nodes } = place(context, served);
      const rows = await nodes.list();
      return output(rows, rows.length === 0
        ? `no nodes in ${path}\n`
        : `${rows.map((one) => one.id).join('\n')}\n`);
    },
  });

  const add = registry.action({
    id: 'node.add',
    summary: 'Add a node, minting its token',
    description: 'The token is shown once and only its hash is kept. Adding a node that is already there replaces its token, and the old one stops working.',
    surfaces: { cli: { pattern: ['node', 'add', ':id'] }, http: { method: 'POST', path: '/node/add/{id}' } },
    // A create: the node is not there yet, and one that is trades its token for
    // a new one rather than being a row this acts on.
    effect: 'add',
    resource: { kind: 'node' },
    input: { ...at, id: { type: 'string', description: 'The name the node is listed by.' } },
    scopes: ['node:write'],
    run: async (context) => {
      const { nodes } = place(context, served);
      const id = nameOf(context, 'node add');
      const had = (await nodes.list()).some((one) => one.id === id);
      const token = await nodes.add(id).catch((error: unknown) => {
        stop(error instanceof Error ? error.message : String(error));
      });
      // The same warning a person's token gets, on stderr so stdout stays the
      // credential alone: a node's `ahpd join` is given this one value.
      context.error(had
        ? `Node ${id} was already there, so its token was replaced. Shown once; only its hash is stored.`
        : 'Shown once. Only its hash is stored, and adding the node again replaces it.');
      return output({ id, token }, `${token}\n`);
    },
  });

  const rm = registry.action({
    id: 'node.rm',
    summary: 'Take a node out of the file',
    description: 'Its token is refused from its next connection on.',
    surfaces: { cli: { pattern: ['node', 'rm', ':id'] }, http: { method: 'POST', path: '/node/rm/{id}' } },
    // The name is what says which node the confirm is about to take out.
    effect: 'remove',
    resource: { kind: 'node', key: 'id' },
    input: { ...at, id: { type: 'string', description: 'The node to take out.' } },
    scopes: ['node:write'],
    run: async (context) => {
      const { nodes } = place(context, served);
      const id = nameOf(context, 'node rm');
      const gone = await nodes.remove(id);
      if (!gone) conflict(`No node called ${id}.`);
      return output({ id }, `Removed node ${id}. Its token is refused from now on.\n`);
    },
  });

  return [list, add, rm];
};
