/*
 * `ahpd doctor`, with everything outside this process faked.
 *
 * A case puts the programs on a PATH of its own and answers their versions
 * with a fake runner, and every file the checks read sits under a temporary
 * `XDG_CONFIG_HOME` that is thrown away after the case. The daemon's record and
 * its socket are injected, so no case needs a daemon, and the socket that never
 * opens is driven by fake timers rather than by five real seconds.
 */

import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Running } from '../src/daemon.js';
import {
  agentCheck,
  checks,
  configCheck,
  daemonCheck,
  pluginCheck,
  runtimeCheck,
  serviceCheck,
  updateCheck,
  type Check,
  type DoctorFacts,
} from '../src/doctor.js';
import type { Ran, Runner } from '../src/install.js';

let root: string;
let home: string;
let configFolder: string;
let configFile: string;
let bin: string;
/** What each program says for `--version`, by the name it was found under. */
const versions = new Map<string, string>();
/** The programs whose `--version` exits non-zero. */
const failing = new Set<string>();
/** The `XDG_CONFIG_HOME` this process had before the case. */
let hadXdg: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ahpd-doctor-'));
  home = join(root, 'home');
  configFolder = join(home, 'ahpd');
  configFile = join(configFolder, 'config.json');
  bin = join(root, 'bin');
  mkdirSync(configFolder, { recursive: true });
  mkdirSync(bin, { recursive: true });
  versions.clear();
  failing.clear();
  hadXdg = process.env['XDG_CONFIG_HOME'];
  process.env['XDG_CONFIG_HOME'] = home;
});

afterEach(() => {
  if (hadXdg === undefined) delete process.env['XDG_CONFIG_HOME'];
  else process.env['XDG_CONFIG_HOME'] = hadXdg;
  rmSync(root, { recursive: true, force: true });
});

/**
 * The runner: `npm` is never asked here, and a `--version` is answered from the
 * maps above rather than by the file, which is a stub holding no code at all.
 */
const run: Runner = async (program, argv) => {
  if (argv[0] !== '--version') return { code: 0, stdout: '', stderr: '' } satisfies Ran;
  const name = basename(program).replace(/\.(?:cmd|exe|bat|com)$/iu, '');
  if (failing.has(name)) return { code: 1, stdout: '', stderr: 'no version' } satisfies Ran;
  const version = versions.get(name);
  return { code: 0, stdout: version === undefined ? '' : `${version}\n`, stderr: '' } satisfies Ran;
};

/** A command on PATH. It is never run: the runner above answers its version. */
const stub = (name: string, version?: string): void => {
  const file = join(bin, name);
  writeFileSync(file, '#!/bin/sh\n');
  chmodSync(file, 0o755);
  if (version !== undefined) versions.set(name, version);
};

/** What every check is given, with this case's PATH and a record that names no daemon. */
const facts = (over: Partial<DoctorFacts> = {}): DoctorFacts => ({
  run,
  path: bin,
  platform: 'linux',
  version: 'v22.19.0',
  record: () => undefined,
  open: async () => {},
  exists: () => false,
  ...over,
});

/** A daemon record, whose connect URL is the only field that carries the token. */
const record = (over: Partial<Running> = {}): Running => ({
  pid: process.pid,
  url: 'http://127.0.0.1:9187',
  connectUrl: 'ws://127.0.0.1:9187/?token=SECRET-TOKEN',
  paths: [],
  startedAt: '2026-10-27T00:00:00.000Z',
  ...over,
});

/** One configuration file, written the way a person writes it. */
const put = (held: unknown): void => { writeFileSync(configFile, `${JSON.stringify(held, null, 2)}\n`); };

/** The line vitest prints for a result that must have a fix. */
const fixed = (one: Check | undefined): void => {
  expect(one?.fix).toBeTypeOf('string');
};

describe('the Runtime check', () => {
  it('says ok when this Node runs ahpd', async () => {
    stub('node', 'v22.19.0');
    const one = await runtimeCheck(facts());
    expect(one).toEqual({ name: 'Runtime', result: 'ok', line: 'Node v22.19.0 runs ahpd' });
  });

  it('says warn when the node on PATH did not answer', async () => {
    stub('node');
    failing.add('node');
    const one = await runtimeCheck(facts());
    expect(one.result).toBe('warn');
    expect(one.line).toContain('did not answer --version');
    fixed(one);
  });

  it('says fail when this runtime does not run ahpd', async () => {
    stub('node', 'v22.19.0');
    const one = await runtimeCheck(facts({ version: 'v20.11.0' }));
    expect(one.result).toBe('fail');
    expect(one.line).toContain('Node 22.18 or newer');
    fixed(one);
  });
});

describe('the Config check', () => {
  it('says ok when there is no file', () => {
    const one = configCheck(facts());
    expect(one).toEqual({ name: 'Config', result: 'ok', line: 'no file is there, so the defaults are used' });
  });

  it('says warn for a key with its old name, and names the file', () => {
    put({ http: true });
    const one = configCheck(facts());
    expect(one.result).toBe('warn');
    expect(one.line).toContain(configFile);
    fixed(one);
  });

  it('says fail for a file that does not parse', () => {
    writeFileSync(configFile, '{\n');
    const one = configCheck(facts());
    expect(one.result).toBe('fail');
    expect(one.line).toContain(configFile);
    fixed(one);
  });
});

describe('the Daemon check', () => {
  it('says ok when the record answers on its socket', async () => {
    const one = await daemonCheck(facts({ record: () => record() }));
    expect(one).toEqual({ name: 'Daemon', result: 'ok', line: 'a daemon answers at http://127.0.0.1:9187' });
  });

  it('says warn when no daemon is running', async () => {
    const one = await daemonCheck(facts());
    expect(one).toEqual({ name: 'Daemon', result: 'warn', line: 'no daemon is running', fix: 'ahpd start' });
  });

  it('says fail when the record does not answer', async () => {
    const one = await daemonCheck(facts({
      record: () => record(),
      open: async () => { throw new Error('refused'); },
    }));
    expect(one.result).toBe('fail');
    expect(one.fix).toBe('ahpd restart');
  });

  it('says fail after five seconds when the socket never opens', async () => {
    vi.useFakeTimers();
    try {
      let settled = false;
      const pending = daemonCheck(facts({
        record: () => record(),
        open: () => new Promise<void>(() => {}),
      })).then((one) => { settled = true; return one; });
      await vi.advanceTimersByTimeAsync(4999);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const one = await pending;
      expect(one.result).toBe('fail');
      expect(one.fix).toBe('ahpd restart');
    }
    finally {
      vi.useRealTimers();
    }
  });
});

describe('the Service check', () => {
  it('says ok when the unit file is there', () => {
    const one = serviceCheck(facts({ exists: () => true }));
    expect(one?.result).toBe('ok');
    expect(one?.line).toContain('systemd');
    expect(one?.line).toContain('ahpd.service');
  });

  it('says warn when it is not', () => {
    const one = serviceCheck(facts({ exists: () => false }));
    expect(one?.result).toBe('warn');
    expect(one?.fix).toBe('ahpd service install');
  });

  it('gives no line on a system with no service manager', async () => {
    expect(serviceCheck(facts({ platform: 'freebsd' }))).toBeUndefined();
    const said = await checks(facts({ platform: 'freebsd' }));
    expect(said.map((check) => check.name)).not.toContain('Service');
  });
});

describe('the Plugins check', () => {
  it('says ok when there is no plugin', async () => {
    const one = await pluginCheck(facts());
    expect(one).toEqual({ name: 'Plugins', result: 'ok', line: 'no plugin is configured' });
  });

  it('says ok for a plugin that resolves and has a manifest', async () => {
    const folder = join(root, 'demo-plugin');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), `${JSON.stringify({
      name: 'demo-plugin',
      version: '1.0.0',
      ahpd: { entry: './index.js' },
    })}\n`);
    writeFileSync(join(folder, 'index.js'), 'export function apply() {}\n');
    put({ plugins: [join(folder, 'index.js')] });
    const one = await pluginCheck(facts());
    expect(one.result).toBe('ok');
    expect(one.line).toBe('1 plugin loads');
  });

  it('says fail for a plugin that does not resolve', async () => {
    put({ plugins: ['@ahpd/not-here'] });
    const one = await pluginCheck(facts());
    expect(one.result).toBe('fail');
    expect(one.line).toContain('@ahpd/not-here');
    fixed(one);
  });

  it('replaces the userinfo of a spec that carries one', async () => {
    put({ plugins: ['git+https://user:hunter2@example.com/repo.git'] });
    const one = await pluginCheck(facts());
    expect(one.result).toBe('fail');
    expect(one.line).not.toContain('hunter2');
    expect(one.line).toContain('<set>@example.com');
  });
});

describe('the Agents check', () => {
  it('says ok when no agent command is on PATH', async () => {
    const one = await agentCheck(facts());
    expect(one).toEqual({ name: 'Agents', result: 'ok', line: 'no agent command was found on PATH' });
  });

  it('says warn for an agent on PATH that is not configured', async () => {
    stub('gemini', '1.0.0');
    const one = await agentCheck(facts());
    expect(one.result).toBe('warn');
    expect(one.line).toContain('Gemini');
    expect(one.fix).toBe('ahpd configure');
  });

  it('says fail for a configured agent that is not on PATH, with its install line', async () => {
    put({ plugins: ['@ahpd/agent-acp'] });
    mkdirSync(join(configFolder, 'agents'), { recursive: true });
    writeFileSync(join(configFolder, 'agents', 'gemini.json'), `${JSON.stringify({ id: 'gemini', engine: 'acp', config: {} }, null, 2)}\n`);
    const one = await agentCheck(facts());
    expect(one.result).toBe('fail');
    expect(one.line).toContain('Gemini');
    expect(one.fix).toContain('@google/gemini-cli');
  });

  it('does not make the agents folder when it is absent', async () => {
    const folder = join(configFolder, 'agents');
    expect(existsSync(folder)).toBe(false);
    await agentCheck(facts());
    expect(existsSync(folder)).toBe(false);
  });
});

describe('the Update check', () => {
  it('says ok when no newer release is on record', () => {
    const one = updateCheck(facts());
    expect(one.result).toBe('ok');
  });

  it('says warn when one is', () => {
    writeFileSync(join(configFolder, 'update.json'), `${JSON.stringify({
      name: '@ahpd/server',
      latest: '99.0.0',
      checkedAt: '2026-10-27T00:00:00.000Z',
    })}\n`);
    const one = updateCheck(facts());
    expect(one.result).toBe('warn');
    expect(one.line).toContain('99.0.0');
    expect(one.fix).toBe('ahpd update');
  });
});

describe('the report', () => {
  it('runs the checks in the plan order', async () => {
    const said = await checks(facts());
    expect(said.map((check) => check.name)).toEqual(['Runtime', 'Config', 'Daemon', 'Service', 'Plugins', 'Agents', 'Update']);
  });

  it('holds no token in any field of any check', async () => {
    stub('node', 'v22.19.0');
    const token = 'SECRET-TOKEN-4f1c2a';
    const said = await checks(facts({
      record: () => record({ connectUrl: `ws://127.0.0.1:9187/?token=${token}` }),
      open: async () => { throw new Error('refused'); },
      exists: () => true,
    }));
    expect(said.find((check) => check.name === 'Daemon')?.result).toBe('fail');
    expect(JSON.stringify(said)).not.toContain(token);
  });
});
