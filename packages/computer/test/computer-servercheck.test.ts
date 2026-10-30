import { posix } from '../../../tools/posix.ts';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { fileResources } from '../../sdk/src/resources/resources.js';
import { loadPlugins } from '../../server/src/plugins.js';
import { closeAll, keeping } from './support/closing.js';
import { profilesOf } from '../src/plugin.js';
import { checkServer, fixesOf, osOf, reportFrom, SERVER_CHECK, SERVER_ITEMS, serverGate } from '../src/servercheck.js';
import { sshRuntime } from '../src/ssh.js';

/*
 * The server check: the script a box runs, the report read from its answer,
 * and the lines that fix what the box lacks.
 */

const FIXTURE = fileURLToPath(new URL('./fixtures/ssh.mjs', import.meta.url));
const DOCKER_FIXTURE = fileURLToPath(new URL('./fixtures/docker.mjs', import.meta.url));
const REPO = join(import.meta.dirname, '../../..');

/** A temporary directory removed after the test that made it. */
let loose: string | undefined;
afterEach(async () => {
  await closeAll();
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});
const temp = (): string => (loose ??= mkdtempSync(join(tmpdir(), 'ahpd-servercheck-')));

/** What a Debian box with everything answers, with lines a case replaces or drops. */
const answer = (over: Record<string, string | undefined> = {}): string => {
  const said: Record<string, string | undefined> = {
    os_id: 'debian',
    os_like: '',
    os_name: 'Debian GNU/Linux 13 (trixie)',
    arch: 'x86_64',
    cpus: '6',
    memory_kb: '11718656',
    home_free_kb: '52428800',
    varlib_free_kb: '20971520',
    docker: '26.1.5+dfsg1',
    docker_access: 'yes',
    kvm: 'yes',
    kvm_access: 'yes',
    libvirt: '11.3.0',
    libvirt_access: 'yes',
    ahpd: '0.13.0',
    user: 'softov',
    ...over,
  };
  return Object.entries(said)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
};

const checked = (text: string) => fixesOf(reportFrom(text), osOf(text));

it('reads a box with everything as every item ok, and no fix', () => {
  const report = checked(answer());
  expect(report.user).toBe('softov');
  for (const name of SERVER_ITEMS) {
    expect(report.items[name], name).toMatchObject({ ok: true, fix: [] });
  }
  expect(report.items.memory.found).toBe('11.2 GiB');
  expect(report.items.disk.found).toBe('50.0 GiB free in the home folder, 20.0 GiB free in /var/lib');
});

it('gives the two Docker lines for a box with no Docker, with the box user in the group line', () => {
  const report = checked(answer({ docker: undefined, docker_access: undefined }));
  expect(report.items.docker.ok).toBe(false);
  expect(report.items.docker.fix).toEqual([
    'sudo apt install docker.io',
    'sudo usermod -aG docker softov',
    '# log in to the box again, so the new group applies',
  ]);
  // The access item is not ok either, and its fix is already the one above.
  expect(report.items.dockerAccess).toMatchObject({ ok: false, fix: [] });
});

it('gives only the group line for a Docker the user cannot reach', () => {
  const report = checked(answer({ docker_access: 'no' }));
  expect(report.items.docker.ok).toBe(true);
  expect(report.items.dockerAccess.fix[0]).toBe('sudo usermod -aG docker softov');
});

it('gives the libvirt packages, and a note with no command for a box without KVM', () => {
  const report = checked(answer({ libvirt: undefined, libvirt_access: undefined, kvm: 'no', kvm_access: 'no' }));
  expect(report.items.libvirt.fix[0]).toBe('sudo apt install libvirt-daemon-system qemu-system-x86 qemu-utils virtinst cloud-image-utils');
  expect(report.items.kvm.fix).toEqual(['# the CPU, or the machine this box runs on, does not offer KVM']);
});

it('reads an Ubuntu box as one the apt lines are for', () => {
  const report = checked(answer({ os_id: 'pop', os_like: 'ubuntu debian', docker: undefined }));
  expect(report.items.docker.fix[0]).toBe('sudo apt install docker.io');
});

it('names the package and gives no apt line on a system that is not Debian or Ubuntu', () => {
  const report = checked(answer({ os_id: 'fedora', os_like: '', os_name: 'Fedora Linux 42', docker: undefined }));
  expect(report.items.docker.fix[0]).toBe("# install Docker with this system's package manager");
  expect(report.items.docker.fix.join('\n')).not.toContain('apt');
});

it('ignores a key it does not know', () => {
  const report = reportFrom(`${answer()}\nshell=/bin/zsh\nrm -rf=/`);
  expect(Object.keys(report.items)).toEqual([...SERVER_ITEMS]);
  expect(JSON.stringify(report)).not.toContain('zsh');
});

// POSIX-only: the script is run with this host's own `/bin/sh`, which on
// Debian is `dash`, the strictest shell a box is likely to have.
it.skipIf(!posix)('runs its own script under sh, and reads what this host has', async () => {
  const report = await checkServer(async () => {
    const ran = spawnSync('/bin/sh', ['-s'], { input: SERVER_CHECK.script, encoding: 'utf8' });
    expect(ran.status).toBe(0);
    return ran.stdout;
  });
  expect(report.items.arch.ok).toBe(true);
  expect(report.items.cpus.ok).toBe(true);
  expect(report.items.memory.ok).toBe(true);
  expect(report.user).not.toBe('');
});

/** The ssh runtime over the scripted ssh, with one box that answers the check from a file. */
const box = (env: Record<string, string> = {}) => {
  const said = join(temp(), 'check.txt');
  writeFileSync(said, answer({ docker: undefined, docker_access: undefined }));
  return sshRuntime({
    command: process.execPath,
    args: [FIXTURE],
    env: { SSH_FAKE_LOG: join(temp(), 'ssh.jsonl'), SSH_FAKE_CHECK: said, ...env },
    machines: { dev02: { destination: 'dev02' } },
    connectTimeout: 1,
  });
};

it('sends the check to a box, and answers its report with the fixes', async () => {
  const runtime = box();
  expect(runtime.checks?.('dev02')).toBe(true);
  expect(runtime.checks?.('nope')).toBe(false);
  const report = await runtime.check?.('dev02');
  expect(report?.items.os.found).toBe('Debian GNU/Linux 13 (trixie)');
  expect(report?.items.docker.fix).toContain('sudo usermod -aG docker softov');
  expect(await runtime.check?.('nope')).toBeUndefined();
});

it('refuses with the box named when the box does not answer', async () => {
  const runtime = box({ SSH_FAKE_UNREACHABLE: 'dev02' });
  await expect(runtime.check?.('dev02')).rejects.toThrow(/^dev02 did not answer the server check: ssh: connect to host dev02/);
});

/*
 * A profile's `server`, and the gate a machine on that box goes through.
 */

it('reads a profile\'s server as the name it gives', () => {
  expect(profilesOf({ remote: { server: 'dev02' }, blank: { server: ' ' } })).toEqual({ remote: { server: 'dev02' }, blank: {} });
});

/** The plugin loaded with one box and the profiles given, and every line it logged. */
const loadWith = async (profiles: Record<string, unknown>) => {
  const lines: string[] = [];
  const result = await loadPlugins(
    [{
      name: './packages/computer/src/index.ts',
      options: {
        command: process.execPath,
        args: [DOCKER_FIXTURE],
        env: { DOCKER_FAKE_STATE: join(temp(), 'docker.json'), SSH_FAKE_LOG: join(temp(), 'ssh.jsonl') },
        ssh: { command: process.execPath, args: [FIXTURE], machines: { dev02: { destination: 'dev02' } } },
        profiles,
      },
    }],
    {
      base: { path: '/tmp/computer-servercheck', hostName: 'box.local', agents: [], resources: fileResources() },
      configDir: join(temp(), 'state'),
      cwd: REPO,
      log: (line) => { lines.push(line); },
    },
  );
  keeping(result.options);
  return { ...result, lines };
};

it('keeps a profile whose server is a box, and leaves out one whose server is not, with a line', async () => {
  const { problems, lines } = await loadWith({ remote: { server: 'dev02' }, lost: { server: 'nope' } });
  expect(problems).toEqual([]);
  const said = lines.filter((line) => line.includes('names the server'));
  expect(said).toHaveLength(1);
  expect(said[0]).toContain('profiles.lost names the server nope, which ssh.machines does not, so the profile is left out');
});

it('refuses a box without Docker with both Docker fix lines, and lets a box with it through', async () => {
  const gate = serverGate(async (server) => checked(answer(server === 'bare' ? { docker: undefined, docker_access: undefined } : {})));
  await expect(gate.requireOn('dev02', ['docker', 'dockerAccess'])).resolves.toBeUndefined();
  const refused = gate.requireOn('bare', ['docker', 'dockerAccess']);
  await expect(refused).rejects.toThrow(/^bare cannot run this profile's machines: it lacks docker \(not installed\), dockerAccess \(no docker to reach\)\. Run on bare:/);
  await expect(gate.requireOn('bare', ['docker'])).rejects.toThrow('sudo apt install docker.io\nsudo usermod -aG docker softov\n# log in to the box again, so the new group applies');
});

it('checks a box once in a minute, and again after it', async () => {
  let clock = 0;
  let checks = 0;
  const gate = serverGate(async () => { checks++; return checked(answer()); }, () => clock);
  await gate.requireOn('dev02', ['docker']);
  clock = 59_999;
  await gate.requireOn('dev02', ['docker']);
  expect(checks).toBe(1);
  clock = 60_000;
  await gate.requireOn('dev02', ['docker']);
  expect(checks).toBe(2);
});

it('asks again after a check that failed', async () => {
  let checks = 0;
  const gate = serverGate(async () => { checks++; if (checks === 1) throw new Error('dev02 did not answer'); return checked(answer()); }, () => 0);
  await expect(gate.requireOn('dev02', ['docker'])).rejects.toThrow('dev02 did not answer');
  await gate.requireOn('dev02', ['docker']);
  expect(checks).toBe(2);
});
