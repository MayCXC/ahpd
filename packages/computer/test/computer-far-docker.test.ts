import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { fileResources } from '../../sdk/src/resources/resources.js';
import { loadPlugins } from '../../server/src/plugins.js';
import { dockerAddressOf } from '../src/plugin.js';
import { closeAll, keeping } from './support/closing.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { Usage, UsageEntry, UsageTotal } from '../../sdk/src/types/usage.js';

/*
 * A profile whose machines are made on a box's Docker, reached as
 * `DOCKER_HOST=ssh://<destination>`.
 *
 * The scripted `docker` keeps one file per `DOCKER_HOST`, so the box's Docker
 * is a second daemon here: a machine found in its file was made with the
 * address in the run's environment. The scripted `ssh` answers the server
 * check from a file, so the box has a Docker without this host having one.
 */

const REPO = join(import.meta.dirname, '../../..');
const SOURCE = './packages/computer/src/index.ts';
const DOCKER = fileURLToPath(new URL('./fixtures/docker.mjs', import.meta.url));
const SSH = fileURLToPath(new URL('./fixtures/ssh.mjs', import.meta.url));

let loose: string[] = [];
afterEach(async () => {
  await closeAll();
  for (const one of loose) rmSync(one, { recursive: true, force: true });
  loose = [];
});
const temp = (): string => {
  const made = mkdtempSync(join(tmpdir(), 'ahpd-far-docker-'));
  loose.push(made);
  return made;
};

/** What a box with a Docker this account reaches answers the server check with. */
const ready = [
  'os_id=debian', 'os_like=', 'os_name=Debian GNU/Linux 13 (trixie)', 'arch=x86_64', 'cpus=6',
  'memory_kb=11718656', 'home_free_kb=52428800', 'varlib_free_kb=20971520',
  'docker=26.1.5+dfsg1', 'docker_access=yes', 'user=softov',
].join('\n');

interface Held {
  machines: { name: string; image: string; labels?: Record<string, string>; state?: string }[];
  calls: string[][];
  failPs?: boolean;
}
const held = (file: string): Held => (existsSync(file)
  ? JSON.parse(readFileSync(file, 'utf8')) as Held
  : { machines: [], calls: [] });

/** The file the scripted Docker keeps for the box at this address. */
const farFile = (local: string, address = 'ssh://dev02'): string => `${local}.${encodeURIComponent(address)}`;

const until = async (check: () => boolean, times = 1000): Promise<void> => {
  for (let i = 0; i < times; i++) {
    if (check()) return;
    await new Promise((r) => { setTimeout(r, 5); });
  }
  throw new Error(`still waiting after ${times} tries`);
};

function meter(): Usage & { entries: UsageEntry[] } {
  const entries: UsageEntry[] = [];
  return {
    entries,
    record: async (entry: UsageEntry) => { entries.push(entry); },
    total: async (): Promise<UsageTotal> => ({}),
    pools: async () => [],
    records: async () => [],
    groups: async () => [],
  };
}

/** One test's files: the local Docker, the box's check answer, and ssh's log. */
const files = () => {
  const dir = temp();
  const check = join(dir, 'check.txt');
  writeFileSync(check, ready);
  return { dir, local: join(dir, 'docker.json'), check, log: join(dir, 'ssh.jsonl') };
};

/** The plugin loaded with the box `dev02`, the profiles given, and every line it said. */
const load = async (
  at: ReturnType<typeof files>,
  profiles: Record<string, unknown>,
  { box = {}, env = {}, hostId = 'host-a', usage }: {
    box?: Record<string, unknown>; env?: Record<string, string>; hostId?: string; usage?: Usage;
  } = {},
) => {
  const lines: string[] = [];
  const base: HostOptions = {
    path: '/tmp/computer-far-docker',
    hostName: 'box.local',
    agents: [],
    resources: fileResources(),
    ...(usage === undefined ? {} : { usage }),
  };
  const result = await loadPlugins(
    [{
      name: SOURCE,
      options: {
        command: process.execPath,
        args: [DOCKER],
        env: { DOCKER_FAKE_STATE: at.local, SSH_FAKE_LOG: at.log, SSH_FAKE_CHECK: at.check, ...env },
        ssh: { command: process.execPath, args: [SSH], machines: { dev02: { destination: 'dev02', ...box } } },
        profiles,
      },
    }],
    { base, configDir: join(at.dir, `state-${hostId}`), cwd: REPO, log: (line) => { lines.push(line); }, hostId },
  );
  keeping(result.options);
  const provider = result.options.resourceProviders?.computer as {
    write(uri: string, content: { data: string; encoding: string }, owner?: string): Promise<void>;
    list(uri: string): Promise<{ name: string }[]>;
  };
  // The Docker machines alone: the box itself is listed too, as `ssh.dev02`.
  const listed = async (): Promise<string[]> => (await provider.list('computer://'))
    .map((one) => one.name).filter((one) => !one.startsWith('ssh.')).sort();
  return { ...result, lines, provider, listed };
};

const said = (body: string) => ({ data: body, encoding: 'utf-8' });

it('spells a box as Docker\'s ssh address, with its port when it sets one', () => {
  expect(dockerAddressOf({ destination: 'softov@dev02' })).toBe('ssh://softov@dev02');
  expect(dockerAddressOf({ destination: 'dev02', port: '2222' })).toBe('ssh://dev02:2222');
});

it('leaves out a profile whose box names an identity, saying to name the key in ssh\'s configuration', async () => {
  const at = files();
  const { problems, lines } = await load(at, { far: { server: 'dev02' } }, { box: { identity: '/keys/dev02' } });
  expect(problems).toEqual([]);
  expect(lines.some((line) => line.includes('profiles.far names the server dev02, whose identity Docker cannot be given; name the key for dev02 in ssh\'s own configuration instead, so the profile is left out'))).toBe(true);
});

it('gives a box whose Docker is the plugin\'s own no runner of its own, and loads the rest', async () => {
  const at = files();
  const { problems, lines, listed } = await load(
    at,
    { same: { server: 'dev02' } },
    { env: { DOCKER_HOST: 'ssh://dev02' } },
  );
  expect(problems).toEqual([]);
  expect(lines.some((line) => line.includes('profiles.same names the server dev02, whose Docker is this plugin\'s own, so its machines are made on that one'))).toBe(true);
  expect(await listed()).toEqual([]);
});

it('makes a profile\'s machine on its box\'s Docker, lists it by that runner and meters it to its owner', async () => {
  const at = files();
  const usage = meter();
  const { problems, provider, listed } = await load(at, { far: { server: 'dev02' } }, { usage });
  expect(problems).toEqual([]);

  await provider.write('computer://box', said(JSON.stringify({ image: 'node:22', profile: 'far' })), 'user:ana');
  // Made by the box's Docker, and never by this host's.
  const made = held(farFile(at.local)).machines;
  expect(made.map((one) => one.name)).toEqual(['box']);
  expect(made[0]?.labels).toMatchObject({ 'ahpd.profile': 'far', 'ahpd.host': 'host-a' });
  expect(held(at.local).machines).toEqual([]);
  // The box was checked first, over ssh.
  expect(readFileSync(at.log, 'utf8')).toContain('sh -s');

  expect(await listed()).toEqual(['docker-far.box']);

  await provider.write('computer://docker-far.box/state', said('stopped'));
  expect(usage.entries).toHaveLength(1);
  expect(usage.entries[0]).toMatchObject({ computer: 'docker-far.box', owner: 'user:ana' });
});

it('refuses to make a machine on a box with no Docker, with the fix lines', async () => {
  const at = files();
  writeFileSync(at.check, ready.replace(/^docker.*$/gmu, ''));
  const { provider } = await load(at, { far: { server: 'dev02' } });
  await expect(provider.write('computer://box', said(JSON.stringify({ image: 'node:22', profile: 'far' })), 'user:ana'))
    .rejects.toThrow(/dev02 cannot run this profile's machines: it lacks docker/u);
  expect(held(farFile(at.local)).machines).toEqual([]);
});

/** A machine on the box's Docker, labelled as one profile's on one host. */
const machine = (name: string, profile: string, host: string) => ({
  name,
  image: 'node:22',
  labels: { 'ahpd.profile': profile, 'ahpd.host': host },
});

it('lists, for two profiles on one box, only each profile\'s own machines', async () => {
  const at = files();
  writeFileSync(farFile(at.local), JSON.stringify({
    machines: [machine('one', 'far', 'host-a'), machine('two', 'near', 'host-a')],
    calls: [],
  }));
  const { listed } = await load(at, { far: { server: 'dev02' }, near: { server: 'dev02' } });
  expect(await listed()).toEqual(['docker-far.one', 'docker-near.two']);
});

it('lists, for two hosts on one box\'s Docker, only the machines each host made', async () => {
  const at = files();
  writeFileSync(farFile(at.local), JSON.stringify({
    machines: [machine('mine', 'far', 'host-a'), machine('theirs', 'far', 'host-b')],
    calls: [],
  }));
  const a = await load(at, { far: { server: 'dev02' } }, { hostId: 'host-a' });
  const b = await load(at, { far: { server: 'dev02' } }, { hostId: 'host-b' });
  expect(await a.listed()).toEqual(['docker-far.mine']);
  expect(await b.listed()).toEqual(['docker-far.theirs']);
});

it('lists the local machines when a box\'s Docker refuses, naming it', async () => {
  const at = files();
  writeFileSync(at.local, JSON.stringify({ machines: [{ name: 'here', image: 'node:22' }], calls: [] }));
  writeFileSync(farFile(at.local), JSON.stringify({ machines: [], calls: [], failPs: true }));
  const { listed, lines } = await load(at, { far: { server: 'dev02' } });
  expect(await listed()).toEqual(['here']);
  expect(lines.some((line) => line.includes('the docker-far runtime did not list its machines'))).toBe(true);
});

it('adopts a box\'s disposable machines at the next listing that reaches it, when the startup listing did not', async () => {
  const at = files();
  const far = farFile(at.local);
  writeFileSync(far, JSON.stringify({
    machines: [{
      name: 'left',
      image: 'node:22',
      labels: { ...machine('left', 'far', 'host-a').labels, 'ahpd.disposable': 'far' },
    }],
    calls: [],
    failPs: true,
  }));
  const { listed, lines } = await load(at, { far: { server: 'dev02', disposable: true } });
  await until(() => lines.some((line) => line.includes('the docker-far runtime\'s machines are adopted at the next listing that reaches it')));
  expect(lines.some((line) => line.includes('found the disposable machine docker-far.left'))).toBe(false);

  writeFileSync(far, JSON.stringify({ ...held(far), failPs: false }));
  expect(await listed()).toEqual(['docker-far.left']);
  await until(() => lines.some((line) => line.includes('found the disposable machine docker-far.left left behind')));
});
