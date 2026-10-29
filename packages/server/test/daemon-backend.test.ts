import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

/*
 * What a daemon with no backend does.
 *
 * The daemon bundles none of its own - decision
 * `the-daemon-bundles-no-agent-and-starts-without-one` - so "no agent is
 * configured" is an ordinary configuration, not an impossible one. The daemon
 * starts anyway and says what fixes it, because a client can install the
 * plugin over the daemon's own channel.
 *
 * A process, because `main.ts` runs the daemon on import and the exit code is
 * half of what is being checked.
 */

const REPO = join(import.meta.dirname, '../../..');

let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'ahpd-backend-')); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

/**
 * The daemon on a pipe, answered with its exit code and what it said.
 *
 * Everything it says is on stderr here, because stdout is the protocol in
 * `--stdio` mode and a line written there would be a frame nobody sent.
 * `named` is whether the file is handed over with `--config-file`; without it
 * the file is the one under the configuration directory, which is `home`'s.
 * `written` is whether there is one at all, which is what a first run has not.
 */
const run = async (config: Record<string, unknown>, named = true, written = true): Promise<{ code: number | null; said: string; path: string }> => {
  const path = named ? join(home, 'config.json') : join(home, 'ahpd', 'config.json');
  if (!named) mkdirSync(join(home, 'ahpd'));
  if (written) {
    writeFileSync(path, JSON.stringify({ paths: [], withoutConnectionToken: true, sessions: 'memory', automations: 'memory', ...config }));
  }
  const child = spawn(
    process.execPath,
    ['--conditions', 'development', '--import', './scripts/dev.mjs', 'packages/server/src/main.ts', '--stdio', ...(named ? ['--config-file', path] : [])],
    { cwd: REPO, env: { ...process.env, CI: '1', XDG_CONFIG_HOME: home }, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  // The peer's end of the pipe, closed at once: a host on stdio serves until
  // the client goes away, and this one has nothing to say to it. Without this
  // the run would have to be killed, and a killed process loses whatever it
  // had buffered for stdout - which is the announcement being read below.
  child.stdin.end();
  let said = '';
  child.stderr.on('data', (chunk: Buffer) => { said += String(chunk); });
  child.stdout.resume();
  return await new Promise((done) => {
    // A daemon that does start is one this test has to stop, so a run that
    // somehow sat on the pipe fails on an assertion rather than a timeout.
    const timer = setTimeout(() => { child.kill(); }, 15000);
    child.on('exit', (code) => { clearTimeout(timer); done({ code, said, path }); });
  });
};

it('starts when nothing contributed a backend, and names the fix', async () => {
  const { code, said, path } = await run({});
  // Announced, then ended the way a host on stdio ends: the peer left.
  expect(said).toContain('ahpd over stdio');
  expect(code).toBe(0);
  expect(said).toContain('No backend is loaded');
  // Started on a pipe, so it is offered no configuration and asked nothing.
  expect(said).not.toContain('Run ahpd configure now?');
  // The sentence is for somebody holding a configuration file, so it names
  // the key they have to edit, the file it is in, and a package they can put
  // in it. The file because this is the sentence an upgrade from a daemon
  // that bundled Claude ends at, and the one that was read is not always the
  // one under the configuration directory.
  expect(said).toContain('"plugins"');
  expect(said).toContain(path);
  expect(said).toContain('@ahpd/agent-claude');
}, 60000);

it('names the command that installs Claude Code, and npm i as the other way', async () => {
  const { code, said, path } = await run({}, false);
  expect(code).toBe(0);
  // The file read is the default one, so the command needs no flag to edit it.
  expect(said).toContain('ahpd plugin install @ahpd/agent-claude ');
  expect(said).not.toContain('--config-file');
  expect(said).toContain('"plugins"');
  expect(said).toContain(path);
  expect(said).toContain(`npm i in ${join(home, 'ahpd')}`);
}, 60000);

it('names the command with the file the daemon was started with', async () => {
  const { code, said, path } = await run({});
  expect(code).toBe(0);
  // Without the flag the command would name the plugin in a file this daemon
  // does not read.
  expect(said).toContain(`ahpd plugin install @ahpd/agent-claude --config-file ${path}`);
  expect(said).toContain('npm i in');
}, 60000);

it('asks nothing when there is no configuration file and no terminal, and starts', async () => {
  const { code, said } = await run({}, false, false);
  expect(code).toBe(0);
  // Nothing was written, so the offer was open; stdin is a pipe, so it was not
  // put, and the run says what a first run is missing.
  expect(said).not.toContain('Run ahpd configure now?');
  expect(said).toContain('No backend is loaded');
  expect(said).toContain('ahpd plugin install @ahpd/agent-claude ');
}, 60000);

it('names the update when the plugins it was given loaded no backend', async () => {
  // A plugin of the release before 0.14, which wrote its options in
  // ahpd.options: what a daemon updated by npm meets in its plugin folder.
  const old = join(home, 'old-agent');
  mkdirSync(old);
  writeFileSync(join(old, 'package.json'), JSON.stringify({
    name: 'old-agent', version: '0.13.0', type: 'module', ahpd: { entry: './index.mjs', options: { paths: {} } },
  }));
  writeFileSync(join(old, 'index.mjs'), 'export function apply() {}\n');
  const { code, said } = await run({ plugins: [old] });
  expect(code).toBe(0);
  expect(said).toContain('No backend is loaded');
  expect(said).toContain('ahpd plugin update all');
  // The plugin is installed, so installing it is not the fix.
  expect(said).not.toContain('ahpd plugin install');
}, 60000);

it('starts when a plugin brought one', async () => {
  const { code, said } = await run({ plugins: [join(REPO, 'packages/server/test/fixtures/plugin-echo')] });
  // It got as far as announcing itself, and then
  // ended the way a host on stdio ends: the peer at the other end left.
  expect(said).toContain('ahpd over stdio');
  expect(said).toContain('plugins echo-plugin');
  expect(said).not.toContain('No backend is loaded');
  expect(code).toBe(0);
}, 60000);

it('hands a plugin every path the daemon serves', async () => {
  const first = join(home, 'first');
  const second = join(home, 'second');
  mkdirSync(first);
  mkdirSync(second);
  const { code, said } = await run({ paths: [first, second], plugins: [join(REPO, 'packages/server/test/fixtures/plugin-paths')] });
  expect(said).toContain(`plugin paths ${JSON.stringify([first, second])}`);
  expect(code).toBe(0);
}, 60000);
