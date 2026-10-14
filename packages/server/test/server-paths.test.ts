/*
 * `ahpd paths list`, `add` and `remove`, run in this process.
 *
 * The terminal's commands are run through the registry the program is built
 * from; the served ones through the handler a daemon answers with. The
 * configuration is a temporary directory, so every case writes the file it reads
 * and no case sees the configuration or the daemon record of whoever runs the
 * suite.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Output } from '@cofold/commands';
import { Program } from '@cofold/terminal';
import { fileUsers, type Users } from '@ahpd/sdk';
import type { Options } from '../src/commands/options.js';
import { programGlobals } from '../src/commands/options.js';
import { cliRegistry } from '../src/commands/registry.js';
import { apiOrigins } from '../src/commands/run.js';
import { servedRegistry, type ServedFacts } from '../src/commands/served.js';
import { apiHandler } from '../src/http.js';

/** The origin the cases' daemon is reached on, which its routes and grants are read against. */
const AUTHORITY = '127.0.0.1:9350';

let home: string;
let config: string;
let had: string | undefined;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-paths-'));
  had = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = home;
  mkdirSync(join(home, 'ahpd'), { recursive: true });
  config = join(home, 'ahpd', 'config.json');
});
afterEach(() => {
  if (had === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = had;
  rmSync(home, { recursive: true, force: true });
});

const put = (held: unknown): void => { writeFileSync(config, `${JSON.stringify(held, null, 2)}\n`); };
const read = (): Record<string, unknown> => JSON.parse(readFileSync(config, 'utf8')) as Record<string, unknown>;

/** A folder under this case's own root, made so it can be served. */
const folder = (...parts: string[]): string => {
  const at = join(home, ...parts);
  mkdirSync(at, { recursive: true });
  return at;
};

/** The record a detached daemon writes of itself, which is what says one is up. */
const record = (paths: string[] = []): void => {
  writeFileSync(join(home, 'ahpd', 'daemon.json'), JSON.stringify({
    pid: process.pid, url: 'ws://127.0.0.1:9187', connectUrl: 'ws://127.0.0.1:9187/', paths, startedAt: '',
  }));
};

/** One terminal command, as what it answered and what it said. */
const run = async (id: string, input: Record<string, unknown> = {}): Promise<{ output: Output | null; said: string }> => {
  const registry = cliRegistry();
  const command = registry.find(id);
  if (command === undefined) throw new Error(`no ${id}`);
  let said = '';
  const output = await registry.execute(command, {
    surface: 'cli',
    input: { configFile: config, ...input },
    io: { out: (text) => { said += text; }, err: (text) => { said += text; } },
  });
  return { output, said };
};

/**
 * One line as `ahpd` reads it, in this process.
 *
 * The registry and the globals are the ones `main.ts` builds its program from.
 * What the command wrote and what it said are kept apart, because with `--json`
 * the answer is stdout and every line about it is stderr.
 */
const line = async (words: string[]): Promise<{ code: number; out: string; err: string }> => {
  let out = '';
  let err = '';
  const program = new Program({
    name: 'ahpd',
    version: '0.0.0',
    registry: cliRegistry(),
    globals: programGlobals,
    io: { out: (text) => { out += text; }, err: (text) => { err += text; } },
  });
  return { code: await program.run(words), out, err };
};

describe('ahpd paths at the terminal', () => {
  it('lists the folders the configuration names', async () => {
    const one = folder('one');
    put({ paths: [one, '/tmp/two'] });
    const listed = await run('paths.list');
    expect(listed.output?.data).toEqual([one, '/tmp/two']);
    const shown = await line(['paths', 'list', '--config-file', config]);
    expect(shown.code).toBe(0);
    expect(shown.out).toBe(`${one}\n/tmp/two\n`);
  });

  it('says none is named when the configuration names none', async () => {
    put({ port: 1234 });
    const listed = await run('paths.list');
    expect(listed.output?.data).toEqual([]);
    const shown = await line(['paths', 'list', '--config-file', config]);
    expect(shown.out).toBe('paths: none named\n');
  });

  it('adds a folder to a configuration that is not there yet', async () => {
    const work = folder('work');
    const added = await run('paths.add', { folder: work });
    expect(added.said).toBe(`Added ${work} to "paths" in ${config}.\n`);
    expect(added.output?.data).toEqual({ paths: [work] });
    expect(read()).toEqual({ paths: [work] });
  });

  it('writes the folder it resolves, not the words typed', async () => {
    const work = folder('work');
    await run('paths.add', { folder: `${work}${sep}.` });
    expect(read().paths).toEqual([work]);
  });

  it('refuses a folder that is not there, and a file, writing nothing', async () => {
    const gone = join(home, 'gone');
    await expect(run('paths.add', { folder: gone })).rejects.toThrow(`No folder at ${gone}.`);
    const file = join(home, 'a-file');
    writeFileSync(file, 'x');
    await expect(run('paths.add', { folder: file })).rejects.toThrow(`${file} is not a folder.`);
    expect(existsSync(config)).toBe(false);
  });

  it('says a folder under a served one is already served, and writes nothing', async () => {
    const above = folder('work');
    const inside = folder('work', 'sub');
    put({ port: 1234, paths: [above] });
    const before = readFileSync(config, 'utf8');

    const under = await run('paths.add', { folder: inside });
    expect(under.said).toBe(`${inside} is under ${above}, which is served.\n`);
    expect(under.output?.data).toEqual({ paths: [above] });

    // The folder itself is one of the folders, so it is served already too.
    const same = await run('paths.add', { folder: above });
    expect(same.said).toBe(`${above} is already served.\n`);
    expect(readFileSync(config, 'utf8')).toBe(before);
  });

  it('removes a folder, and keeps every other key', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ port: 1234, paths: [one, two], advancedTools: true });
    const removed = await run('paths.remove', { folder: two });
    expect(removed.said).toBe(`Removed ${two} from "paths" in ${config}.\n`);
    expect(removed.output?.data).toEqual({ paths: [one] });
    expect(read()).toEqual({ port: 1234, paths: [one], advancedTools: true });
  });

  it('refuses a folder "paths" does not name', async () => {
    const one = folder('one');
    const other = folder('other');
    put({ paths: [one] });
    await expect(run('paths.remove', { folder: other }))
      .rejects.toThrow(`${other} is not in "paths" in ${config}.`);
    expect(read().paths).toEqual([one]);
  });

  it('refuses to remove the last folder, and keeps it', async () => {
    const one = folder('one');
    put({ paths: [one] });
    await expect(run('paths.remove', { folder: one }))
      .rejects.toThrow(`The last folder in "paths" cannot be removed, because a daemon with no "paths" serves the folder it is started in.`);
    expect(read().paths).toEqual([one]);
  });

  it('answers the folders with --json, and the new list after a write', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one] });

    const listed = await line(['paths', 'list', '--json', '--config-file', config]);
    expect(listed.code).toBe(0);
    expect(JSON.parse(listed.out) as unknown).toEqual([one]);
    expect(listed.err).toBe('');

    const added = await line(['paths', 'add', two, '--json', '--config-file', config]);
    expect(added.code).toBe(0);
    expect(JSON.parse(added.out) as unknown).toEqual({ paths: [one, two] });
    // The line a person reads goes to stderr, because stdout is the answer.
    expect(added.err).toContain(`Added ${two} to "paths" in ${config}.`);
  });

  it('says a restart applies the change, or a served call, when a daemon is recorded', async () => {
    const one = folder('one');
    const two = folder('two');
    record();
    const added = await run('paths.add', { folder: one });
    expect(added.said).toBe(`Added ${one} to "paths" in ${config}.\n`
      + `Restart the daemon to apply the change: ahpd restart. To reach it now: ahpd --remote <url> paths add ${one}\n`);
    expect(added.output?.data).toEqual({ paths: [one], restart: true });

    // With no record, nothing is said about a restart, and no key is carried.
    rmSync(join(home, 'ahpd', 'daemon.json'));
    await run('paths.add', { folder: two });
    const removed = await run('paths.remove', { folder: two });
    expect(removed.said).toBe(`Removed ${two} from "paths" in ${config}.\n`);
    expect(removed.output?.data).toEqual({ paths: [one] });
  });
});

/*
 * The same three verbs over HTTP, against the daemon's own facts.
 *
 * The options object is the one the daemon was started with and `running()`
 * reads its folders per request, so a case sees a change the way `ahpd status`
 * does. Served, the file is the daemon's own, so the case's `configFile` is
 * never named by a request.
 */
describe('ahpd paths, served', () => {
  /** A daemon serving `paths`, and the API handler it answers with. */
  const daemon = (paths: string[], people?: Users) => {
    const own = { paths } as Options;
    const facts: ServedFacts = {
      options: own,
      configFile: config,
      running: () => ({
        pid: process.pid, url: `ws://${AUTHORITY}`, host: '127.0.0.1', port: 9350, paths: own.paths, startedAt: '',
      }),
      turning: () => [],
      restart: () => {},
    };
    const handler = apiHandler({
      registry: servedRegistry(facts),
      token: 'root-secret',
      ...(people === undefined ? {} : { users: people }),
      program: { name: 'ahpd', version: '0.0.0' },
      origins: () => apiOrigins('127.0.0.1', undefined, 9350),
    });
    return {
      own,
      running: facts.running,
      ask: (method: string, path: string, body?: unknown, token = 'root-secret'): Promise<Response> =>
        handler(new Request(`http://${AUTHORITY}/api${path}`, {
          method,
          headers: { host: AUTHORITY, 'content-type': 'application/json', authorization: `Bearer ${token}` },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        })),
    };
  };

  it('writes the daemon\'s own file, and the list it serves, when a folder is added', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one] });
    const served = daemon([one]);

    const added = await served.ask('POST', '/paths/add', { folder: two });
    expect(added.status).toBe(200);
    expect(await added.json()).toEqual({ paths: [one, two] });
    expect(read().paths).toEqual([one, two]);
    expect(served.own.paths).toEqual([one, two]);
  });

  it('answers the folders the daemon serves now, not the file', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one] });
    const listed = await daemon([one, two]).ask('GET', '/paths/list');
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual([one, two]);
  });

  it('shows a new folder in the list the daemon reports, so status names it with no restart', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one] });
    const served = daemon([one]);
    expect(served.running().paths).toEqual([one]);

    await served.ask('POST', '/paths/add', { folder: two });
    expect(served.running().paths).toEqual([one, two]);
  });

  it('takes a folder out of the file and out of the list when one is removed', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one, two] });
    const served = daemon([one, two]);

    const removed = await served.ask('POST', '/paths/remove', { folder: two });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ paths: [one] });
    expect(read().paths).toEqual([one]);
    expect(served.running().paths).toEqual([one]);
  });

  it('refuses a person\'s token, whoever they are, and takes the deployment\'s', async () => {
    const one = folder('one');
    const two = folder('two');
    put({ paths: [one] });
    const people = fileUsers({ path: join(home, 'users.json') });
    // An administrator, so what refuses her is the deployment-only rule and not
    // a grant she is missing.
    await people.add('ada', ['admin']);
    const served = daemon([one], people);

    const refused = await served.ask('POST', '/paths/add', { folder: two }, await people.mint('ada'));
    expect(refused.status).toBe(403);
    expect((await refused.json() as { message: string }).message)
      .toBe('ada may not add or remove a served folder here; only the deployment token may');
    expect(read().paths).toEqual([one]);
    expect(served.running().paths).toEqual([one]);

    const taken = await served.ask('POST', '/paths/add', { folder: two });
    expect(taken.status).toBe(200);
    expect(read().paths).toEqual([one, two]);
  });

  it('answers the new list and no restart, because this daemon already serves it', async () => {
    const one = folder('one');
    put({ port: 1234 });
    const added = await daemon([]).ask('POST', '/paths/add', { folder: one });
    expect(added.status).toBe(200);
    // The whole answer: the folders, and no key or line about a restart.
    expect(await added.json()).toEqual({ paths: [one] });
  });
});
