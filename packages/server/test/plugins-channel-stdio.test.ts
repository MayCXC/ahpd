/*
 * The plugins channel on a `--stdio` daemon, where stdout is the wire.
 *
 * A stdio daemon writes frames to stdout and its log to stderr, so any line the
 * daemon puts on stdout that is not a frame breaks the client reading it. An
 * install is the loud case: npm runs in a child, and what the install path says
 * while it runs used to be taken to the daemon's `onProblem`, which is a log
 * line. The case runs the daemon for real, with a stand-in npm on the `PATH`,
 * and holds stdout to frames only.
 *
 * Every run gets temporary configuration, data and state directories, so
 * nothing here reads or writes the configuration of whoever runs the suite.
 * The model credentials this suite's environment may carry are removed from the
 * child: this daemon serves one plugins channel and nothing about a model.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { posix } from '../../../tools/posix.ts';

const REPO = join(import.meta.dirname, '../../..');
const MAIN = 'packages/server/src/main.ts';
/** A directory holding an `npm` that lands a plugin without a registry. */
const FAKE_NPM = join(import.meta.dirname, 'fixtures', 'npm-fake');
/** A registry nothing listens on, so nothing here asks one. */
const NO_REGISTRY = 'http://127.0.0.1:1';

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-plugins-stdio-'));
  mkdirSync(join(home, 'ahpd'), { recursive: true });
  // A backend, so the daemon has an agent to serve; the
  // echo fixture is this suite's example agent.
  writeFileSync(join(home, 'config.json'), JSON.stringify({
    plugins: ['./packages/server/test/fixtures/plugin-echo'],
  }));
});
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

/** The child's environment: its own directories, the fake npm, no model credentials. */
const environment = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    XDG_CONFIG_HOME: home,
    XDG_DATA_HOME: join(home, 'data'),
    XDG_STATE_HOME: join(home, 'state'),
    XDG_CACHE_HOME: join(home, 'cache'),
    PATH: `${FAKE_NPM}:${process.env['PATH'] ?? ''}`,
    npm_config_registry: NO_REGISTRY,
    CI: '1',
    NODE_OPTIONS: '--conditions development --import ./scripts/dev.mjs',
  };
  for (const key of Object.keys(env)) {
    if (key.startsWith('CLAUDE') || key.startsWith('ANTHROPIC')) delete env[key];
  }
  return env;
};

interface Frame {
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

interface Run {
  /** Every non-empty line stdout held, in the order it arrived. */
  lines: string[];
  stderr: string;
  answered: Frame[];
}

const HANDSHAKE = JSON.stringify({
  id: 1,
  method: 'initialize',
  params: { clientId: 'probe', protocolVersions: ['0.9.0'], initialSubscriptions: ['ahp-root://'] },
});

const INSTALL = JSON.stringify({
  id: 2,
  method: 'x-ahpd/plugins/install',
  params: { source: '@acme/foo' },
});

/**
 * A stdio daemon asked to install a plugin, then to subscribe to the channel.
 *
 * The subscribe is written once the install has answered, so the rows it reads
 * are the ones the install added. The daemon serves until the client goes away,
 * so the pipes are closed once the subscribe is answered.
 */
const run = (): Promise<Run> => {
  const child = spawn(
    process.execPath,
    [MAIN, '--stdio', '--config-file', join(home, 'config.json'), '--no-update-check'],
    { cwd: REPO, env: environment(), stdio: ['pipe', 'pipe', 'pipe'] },
  );
  const lines: string[] = [];
  const answered: Frame[] = [];
  let stderr = '';
  let held = '';
  let listed = false;
  const close = (): void => { child.stdin.end(); };
  child.stderr.on('data', (chunk: Buffer) => { stderr += String(chunk); });
  child.stdout.on('data', (chunk: Buffer) => {
    held += String(chunk);
    let at = held.indexOf('\n');
    while (at !== -1) {
      const line = held.slice(0, at);
      held = held.slice(at + 1);
      at = held.indexOf('\n');
      if (line.trim() === '') continue;
      lines.push(line);
      let frame: Frame;
      try {
        frame = JSON.parse(line) as Frame;
      }
      catch {
        continue;
      }
      if (frame.id === undefined) continue;
      answered.push(frame);
      if (frame.id === 2 && !listed) {
        listed = true;
        child.stdin.write(`${JSON.stringify({
          id: 3,
          method: 'subscribe',
          params: { channel: 'x-ahpd-plugins://' },
        })}\n`);
      }
      if (frame.id === 3) close();
    }
  });
  child.stdin.write(`${HANDSHAKE}\n${INSTALL}\n`);
  return new Promise((done) => {
    // A case that never gets the list is a case that failed rather than one
    // that hung: the client goes away and the run ends.
    const give = setTimeout(close, 20000);
    child.on('exit', () => {
      clearTimeout(give);
      done({ lines, stderr, answered });
    });
  });
};

// The stand-in npm is a shell script, which Windows does not run.
it.skipIf(!posix)('puts no line on stdout that is not a frame while a channel install runs', async () => {
  const { lines, stderr, answered } = await run();

  // stdout is the wire: every line is a frame the client can parse.
  for (const line of lines) expect(() => JSON.parse(line) as unknown).not.toThrow();

  const install = answered.find((one) => one.id === 2);
  expect(install?.error).toBeUndefined();
  // The row id, not the package npm installed: the module opened the package
  // and named itself `foo`.
  expect(install?.result?.['id']).toBe('foo');

  // And the row the install added is listed under that same id.
  const list = answered.find((one) => one.id === 3);
  const records = (list?.result?.['snapshot'] as { state?: { records?: { id: string }[] } } | undefined)
    ?.state?.records ?? [];
  expect(records.map((one) => one.id)).toContain('foo');

  // The install's own progress is not a problem, so it reaches neither the
  // wire nor the log: what npm installed is what the answer says.
  expect(stderr).not.toContain('Installing');
  expect(stderr).not.toContain('Installed');
}, 60000);
