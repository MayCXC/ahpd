import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { adapterOf } from './mapping.js';
import { isAnswer } from './wire.js';
import type { ChildProcess } from 'node:child_process';
import type { RunCallArgs } from './mapping.js';
import type { Answer, Question } from './wire.js';
import type { Plugin, PluginHost } from '@ahpd/sdk';

/**
 * The package as a plugin.
 *
 * The `pieces` option names one Activepieces package for each piece the
 * daemon offers. `apply` forks a child process and asks it what those pieces
 * are; each piece that loads becomes an adapter, and each of its actions is a
 * tool the host offers to a session or a bot that binds a connector of it.
 *
 * The child is separate because a piece turns off TLS checks for the process
 * it runs in. It answers as plain JSON, and it carries no secret from one call
 * to the next: every request brings its own.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = 'connector-activepieces';

/** What a listing prints. */
export const title = 'Activepieces connectors';

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    pieces: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^@activepieces/piece-[a-z0-9][a-z0-9-]*$',
      },
      description: 'The package of each Activepieces piece this plugin offers, such as @activepieces/piece-resend.',
    },
  },
  required: ['pieces'],
};

/** One line saying what went wrong, without a stack. */
const reason = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The child's entry: the source beside this module in development, the build otherwise. */
const childPath = (here: URL = new URL(import.meta.url)): string =>
  fileURLToPath(new URL(here.pathname.endsWith('.ts') ? './child.ts' : './child.js', here));

/** The piece packages named in the options. */
const asked = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string' && one !== '') : [];

/**
 * The variables the child is given from the daemon's environment.
 *
 * A piece is third-party code, and the daemon's environment holds its own
 * token and whatever keys its agents read. The child gets what it needs to
 * find files and reach the network, and nothing else.
 */
const PASSED = new Set([
  'PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'LANG', 'LC_ALL', 'TZ',
  'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy',
  'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR', 'NODE_TLS_REJECT_UNAUTHORIZED',
]);

/** The child's environment: the variables `PASSED` names, from this one. */
export const childEnv = (env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(env).filter(([key]) => PASSED.has(key)));

/** One answer waiting for its request, by the request's id. */
type Waiting = Map<number, (answer: Answer) => void>;

/** The child process, and the answers it still owes. */
interface Running {
  process: ChildProcess;
  waiting: Waiting;
}

/** The child, started on demand and started again after it exits. */
export interface Child {
  /** Ask one question, and answer its answer. */
  ask(request: Question): Promise<Answer>;
  /** Close the channel, which the child exits on. */
  stop(): void;
}

/**
 * The child process this plugin talks to.
 *
 * Nothing is started until the first question, and a child that exited is
 * started again by the next one. A question that was in flight when the child
 * went away is answered as failed rather than left waiting.
 */
export function child(host: PluginHost): Child {
  let running: Running | undefined;
  let seq = 0;

  const start = (): Running => {
    const forked = fork(childPath(), [], {
      /*
       * No inherited flags: the daemon may be run with `--watch`, which would
       * restart this child on a source change and break the channel under a
       * call. The child is built beside this module, or it is the source, which
       * Node reads with its types stripped.
       */
      execArgv: [],
      env: childEnv(),
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    });
    const waiting: Waiting = new Map();
    const opened: Running = { process: forked, waiting };

    const fail = (message: string): void => {
      for (const [id, done] of waiting) {
        waiting.delete(id);
        done({ type: 'failed', id, message });
      }
    };

    forked.on('message', (message: unknown) => {
      if (!isAnswer(message)) return;
      const done = waiting.get(message.id);
      if (done === undefined) return;
      waiting.delete(message.id);
      done(message);
    });
    forked.on('error', (error: unknown) => {
      host.problem(`${name}: the piece process failed: ${reason(error)}`);
      fail(`the piece process failed: ${reason(error)}`);
    });
    forked.on('exit', (code, signal) => {
      if (running === opened) running = undefined;
      fail(`the piece process exited (${signal ?? String(code)})`);
    });

    running = opened;
    return opened;
  };

  return {
    ask: (request) => {
      const opened = running ?? start();
      const id = ++seq;
      return new Promise<Answer>((resolve) => {
        opened.waiting.set(id, resolve);
        opened.process.send({ ...request, id }, undefined, undefined, (error) => {
          if (error === null) return;
          const done = opened.waiting.get(id);
          if (done === undefined) return;
          opened.waiting.delete(id);
          done({ type: 'failed', id, message: reason(error) });
        });
      });
    },
    stop: () => {
      const opened = running;
      running = undefined;
      opened?.process.disconnect();
    },
  };
}

/** How long one action may take before its call fails. */
const CALL_TIMEOUT_MS = 60_000;

/**
 * The answer to one call, or a failure when it takes longer than the timeout.
 *
 * A late answer arrives at a promise nothing waits on, which is how a call
 * that gave up is dropped. The child stays up, and its next call answers.
 */
const awaited = async (answer: Promise<Answer>): Promise<Answer> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<Answer>((resolve) => {
    timer = setTimeout(() => {
      resolve({ type: 'failed', id: 0, message: `the action took longer than ${CALL_TIMEOUT_MS / 1000} seconds` });
    }, CALL_TIMEOUT_MS);
  });
  try {
    return await Promise.race([answer, late]);
  } finally {
    clearTimeout(timer);
  }
};

/** Run one action in the child, and answer its result. */
const callAction = async (channel: Child, piece: string, call: RunCallArgs): Promise<unknown> => {
  const answer = await awaited(channel.ask({ type: 'run', piece, ...call }));
  if (answer.type === 'ran') return answer.result;
  throw new Error(answer.type === 'failed' ? answer.message : 'the child answered a call with a description');
};

export const apply: Plugin['apply'] = async (host, options) => {
  const pieces = asked(options['pieces']);
  const channel = child(host);
  host.registerClose(() => { channel.stop(); });

  const answer = await channel.ask({ type: 'describe', pieces });
  if (answer.type !== 'described') {
    const message = answer.type === 'failed' ? answer.message : 'the child answered a description with a run';
    host.problem(`${name}: ${message}`);
    return;
  }
  for (const error of answer.errors) host.problem(`${name}: ${error}`);
  for (const piece of answer.pieces) {
    const mapped = adapterOf(piece, (call) => callAction(channel, piece.package, call));
    for (const note of mapped.notes) host.problem(`${name}: ${note}`);
    if (mapped.adapter !== undefined) host.registerAdapter(mapped.adapter);
  }
};
