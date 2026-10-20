#!/usr/bin/env node
/**
 * What an ACP server offers, asked straight over its stdio.
 *
 * Spawns the server, opens one session and prints what it named. No ahpd in
 * between: this answers what the server itself says, before the bridge reads
 * it.
 *
 *   node scripts/acp-info-test.mjs -- copilot --acp
 *   node scripts/acp-info-test.mjs --models -- copilot --acp
 *
 * Everything after `--` is the server's command line. `--cwd` sets the
 * session's working directory, the current one by default.
 *
 * With no flag it prints the `initialize` answer: the agent, its capabilities
 * and its auth methods. A server may say who is signed in with an
 * `_auth/status_update` notification after it answers, so it waits `--wait`
 * ms (2000 by default) for one.
 *
 * Models come from the `select` config option whose category is `model`, or,
 * from a server older than config options, the `models` field of the
 * `session/new` answer.
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const split = process.argv.indexOf('--');
const flags = split === -1 ? process.argv.slice(2) : process.argv.slice(2, split);
const command = split === -1 ? [] : process.argv.slice(split + 1);
const arg = (name, fallback) => {
  const at = flags.indexOf(`--${name}`);
  return at === -1 ? fallback : flags[at + 1];
};
const cwd = arg('cwd', process.cwd());
const timeout = Number(arg('timeout', 30000));
const wait = Number(arg('wait', 2000));
const wantModels = flags.includes('--models');

if (command.length === 0) {
  console.error('usage: node scripts/acp-info-test.mjs [--models] [--cwd <dir>] [--timeout <ms>] [--wait <ms>] -- <command> [args...]');
  process.exit(2);
}

const child = spawn(command[0], command.slice(1), { stdio: ['pipe', 'pipe', 'inherit'] });
child.on('error', (error) => {
  console.error(`cannot start ${command[0]}: ${error.message}`);
  process.exit(1);
});

/** Requests sent and not yet answered, by id. */
const waiting = new Map();
/** Notifications the server sent, in order. */
const notes = [];
/** Called on every notification, while something is waiting for one. */
let noted = () => {};
let next = 1;

const write = (frame) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...frame })}\n`);

const request = (method, params) => new Promise((resolve, reject) => {
  const id = next++;
  waiting.set(id, { resolve, reject, method });
  write({ id, method, params });
});

createInterface({ input: child.stdout }).on('line', (line) => {
  if (line.trim() === '') return;
  let frame;
  try {
    frame = JSON.parse(line);
  } catch {
    console.error(`not JSON: ${line}`);
    return;
  }
  if (frame.method !== undefined && frame.id !== undefined) {
    // The server asking the client something: this client offers nothing.
    write({ id: frame.id, error: { code: -32601, message: `${frame.method} not supported` } });
    return;
  }
  if (frame.id === undefined) {
    notes.push(frame);
    noted();
    return;
  }
  const pending = waiting.get(frame.id);
  if (pending === undefined) return;
  waiting.delete(frame.id);
  if (frame.error !== undefined) pending.reject(new Error(`${pending.method}: ${frame.error.message}`));
  else pending.resolve(frame.result);
});

child.on('exit', (code) => {
  for (const pending of waiting.values()) pending.reject(new Error(`${command[0]} exited with ${code} during ${pending.method}`));
  waiting.clear();
});

/** A select's values, with any groups flattened. */
const values = (option) => option.options.flatMap((entry) => ('group' in entry ? entry.options : [entry]));

/** The models a `session/new` answer names, and the one in force. */
const modelsOf = (session) => {
  const option = (session.configOptions ?? []).find((one) => one.type === 'select' && one.category === 'model');
  if (option !== undefined) {
    return {
      source: `configOptions[${option.id}]`,
      current: option.currentValue,
      list: values(option).map((one) => ({ id: one.value, name: one.name, description: one.description })),
    };
  }
  const legacy = session.models;
  if (legacy !== undefined && Array.isArray(legacy.availableModels)) {
    return {
      source: 'models',
      current: legacy.currentModelId,
      list: legacy.availableModels.map((one) => ({ id: one.modelId, name: one.name, description: one.description })),
    };
  }
  return undefined;
};

/** The first notification `match` accepts, or undefined after `ms`. */
const noteOf = (match, ms) => new Promise((resolve) => {
  const seen = notes.find(match);
  if (seen !== undefined) return resolve(seen);
  const stop = setTimeout(() => resolve(undefined), ms);
  noted = () => {
    const found = notes.find(match);
    if (found === undefined) return;
    clearTimeout(stop);
    resolve(found);
  };
});

/** Capability paths, flattened: `sessionCapabilities.list`, `promptCapabilities.image=false`. */
const paths = (value, prefix = '') => Object.entries(value ?? {}).flatMap(([key, one]) => {
  if (key === '_meta') return [];
  const at = prefix === '' ? key : `${prefix}.${key}`;
  if (one !== null && typeof one === 'object' && !Array.isArray(one) && Object.keys(one).length > 0) return paths(one, at);
  if (one === true || (one !== null && typeof one === 'object' && Object.keys(one).length === 0)) return [at];
  return [`${at}=${JSON.stringify(one)}`];
});

/** An auth status, as one line. */
const statusLine = (status) => {
  const account = status.account ?? {};
  return [status.kind, status.label, account.email, account.plan && `plan ${account.plan}`].filter(Boolean).join(', ');
};

/** Print the `initialize` answer, then any auth status the server sends after it. */
const printInfo = async (init) => {
  console.log(`protocol: ${init.protocolVersion}`);
  console.log('capabilities:');
  for (const one of paths(init.agentCapabilities)) console.log(`  ${one}`);
  const extensions = [...Object.keys(init.agentCapabilities?._meta ?? {}), ...Object.keys(init._meta ?? {})];
  if (extensions.length > 0) console.log(`extensions (_meta): ${extensions.join(', ')}`);

  const methods = init.authMethods ?? [];
  console.log(`auth methods (${methods.length}):`);
  for (const one of methods) {
    const description = one.description ? `  - ${one.description}` : '';
    const kind = one.type ?? Object.keys(one._meta ?? {})[0];
    console.log(`  ${one.id}  ${one.name}${kind ? ` [${kind}]` : ''}${description}`);
  }

  const update = await noteOf((note) => note.method === '_auth/status_update', wait);
  const status = update?.params?.authStatus ?? init.agentCapabilities?._meta?.authStatus;
  console.log(`auth status: ${status && Object.keys(status).length > 0 ? statusLine(status) : `none said in ${wait} ms`}`);
};

/** Print the models a `session/new` answer names, the one in force marked `*`. */
const printModels = (session) => {
  const models = modelsOf(session);
  if (models === undefined) {
    console.log('models: none named');
    return;
  }
  console.log(`models (${models.list.length}, from ${models.source}):`);
  for (const one of models.list) {
    const mark = one.id === models.current ? '*' : ' ';
    const name = one.name && one.name !== one.id ? `  ${one.name}` : '';
    const description = one.description && one.description !== one.name ? `  - ${one.description}` : '';
    console.log(`${mark} ${one.id}${name}${description}`);
  }
};

const timer = setTimeout(() => {
  console.error(`no answer in ${timeout} ms`);
  child.kill();
  process.exit(1);
}, timeout);

let status = 0;
try {
  const init = await request('initialize', {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: { name: 'acp-info-test', version: '1.0.0' },
  });
  const agent = init.agentInfo;
  const title = agent?.title && agent.title !== agent.name ? ` (${agent.title})` : '';
  console.log(`agent: ${agent ? `${agent.name} ${agent.version ?? ''}`.trim() + title : command.join(' ')}`);
  if (wantModels) await printModels(await request('session/new', { cwd, mcpServers: [] }));
  else await printInfo(init);
} catch (error) {
  console.error(error.message);
  status = 1;
} finally {
  clearTimeout(timer);
  child.stdin.end();
  child.kill();
}
process.exit(status);
