import { posix } from '../../../tools/posix.ts';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { fileResources } from '../../sdk/src/resources/resources.js';
import { loadPlugins } from '../../server/src/plugins.js';
import { closeAll, keeping } from './support/closing.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { Usage, UsageEntry, UsageTotal } from '../../sdk/src/types/usage.js';
import { addressFrom, domainsFrom, labelsFrom, libvirtRuntime, metadataOf, userDataOf, VM_HOST } from '../src/libvirt.js';
import type { LibvirtOptions } from '../src/libvirt.js';
import { keygenWith } from '../src/keys.js';
import type { MachineSpec } from '../src/runtime.js';

/*
 * Virtual machines on a libvirt box, made through a scripted `virsh` and
 * `virt-install` and reached through the scripted `ssh`.
 *
 * The VM a test reaches is this host: the ssh fixture runs every remote
 * string here, so the runtime's boot, wait and removal are what is checked,
 * and the code seeded into a VM is checked by hand on a real box.
 */

const VIRSH = fileURLToPath(new URL('./fixtures/virsh.mjs', import.meta.url));
const SSH = fileURLToPath(new URL('./fixtures/ssh.mjs', import.meta.url));
const KEYGEN = fileURLToPath(new URL('./fixtures/ssh-keygen.mjs', import.meta.url));
const TEMPLATE = 'ahpd-template.qcow2';
const LABEL = 'ahpd.computer=1';

/** A temporary directory removed after the test that made it. */
let loose: string | undefined;
afterEach(async () => {
  await closeAll();
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});

const dir = (): string => (loose ??= mkdtempSync(join(tmpdir(), 'ahpd-libvirt-')));
const statePath = (): string => join(dir(), 'virsh.json');
const virshLog = (): string => join(dir(), 'virsh.jsonl');
const sshLog = (): string => join(dir(), 'ssh.jsonl');

interface Domain { state: string; volume: string; userData?: string; metaData?: string; metadata?: string; vcpus?: string; memory?: string }
interface Box { volumes: string[]; domains: Record<string, Domain> }

const box = (): Box => JSON.parse(readFileSync(statePath(), 'utf8')) as Box;
const calls = (file: string): string[][] => (existsSync(file)
  ? readFileSync(file, 'utf8').split('\n').filter((line) => line !== '').map((line) => JSON.parse(line) as string[])
  : []);

/**
 * A `cloud-init` the VM answers with, which is this host's: the scripted
 * `ssh` runs `cloud-init status --wait` here, where there is none.
 */
const cloudInit = (code = 0): string => {
  const bin = join(dir(), 'bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'cloud-init'), `#!/bin/sh\necho "status: done"\nexit ${String(code)}\n`);
  chmodSync(join(bin, 'cloud-init'), 0o755);
  return bin;
};

/** A runtime over the fixtures, with a box that holds the template and the domains given. */
const runtime = (more: Omit<Partial<LibvirtOptions>, 'template'> & { template?: string | undefined } = {}, env: Record<string, string> = {}, domains: Record<string, Domain> = {}) => {
  const { template, ...rest } = { template: TEMPLATE, ...more };
  writeFileSync(statePath(), JSON.stringify({ volumes: [TEMPLATE, ...Object.values(domains).map((one) => one.volume)], domains }));
  const bin = cloudInit(env.CLOUD_INIT === undefined ? 0 : Number(env.CLOUD_INIT));
  return libvirtRuntime({
    ssh: { command: process.execPath, args: [SSH], env: { SSH_FAKE_LOG: sshLog(), PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` } },
    virsh: [process.execPath, VIRSH, 'virsh'],
    virtInstall: [process.execPath, VIRSH, 'virt-install'],
    env: { VIRSH_FAKE_STATE: statePath(), VIRSH_FAKE_LOG: virshLog(), ...env },
    pool: 'default',
    network: 'default',
    ...(template === undefined ? {} : { template }),
    profiles: { vm: { server: 'kvm1', box: { destination: 'ops@kvm1', port: '2222' } } },
    label: LABEL,
    configDir: join(dir(), 'config'),
    keygen: keygenWith(process.execPath, [KEYGEN]),
    hostId: 'host-a',
    waits: { boot: 2_000, ready: 2_000, every: 10, shutdown: 200 },
    ...rest,
  });
};

const spec = (more: Partial<MachineSpec> = {}): MachineSpec => ({ name: 'vm-1', label: LABEL, profile: 'vm', ...more });

it('reads what virsh prints: a listing, an address and a record', () => {
  expect(domainsFrom(' Id   Name    State\n------------------\n 1    vm-1    running\n -    vm-2    shut off\n\n'))
    .toEqual([{ name: 'vm-1', state: 'running' }, { name: 'vm-2', state: 'shut off' }]);
  expect(addressFrom(' vnet0  52:54:00:aa:bb:cc  ipv4  192.168.122.7/24\n')).toBe('192.168.122.7');
  expect(addressFrom(' Name  MAC address  Protocol  Address\n-----\n')).toBeUndefined();
  const labels = { 'ahpd.owner': 'user:a&b', 'ahpd.project': '<x> "y"' };
  expect(labelsFrom(metadataOf(labels))).toEqual(labels);
  expect(labelsFrom('error: metadata not found')).toBeUndefined();
});

it('gives the VM only its login and this host\'s key, as JSON a YAML reader takes', () => {
  const said = userDataOf('ahpd', 'ssh-ed25519 AAAA key\n', '/work/repo');
  expect(said.startsWith('#cloud-config\n')).toBe(true);
  const read = JSON.parse(said.slice('#cloud-config\n'.length)) as { users: { name: string; ssh_authorized_keys: string[] }[]; runcmd: string[][] };
  expect(read.users[0]).toMatchObject({ name: 'ahpd', ssh_authorized_keys: ['ssh-ed25519 AAAA key'] });
  expect(read.runcmd).toEqual([['install', '-d', '-o', 'ahpd', '-g', 'ahpd', '/work/repo']]);
});

it.skipIf(!posix)('makes a VM on the template, records it in its metadata, and lists it with its owner', async () => {
  const vms = runtime();
  const made = await vms.run(spec({ agents: ['echo'], session: 's1', owner: 'user:ana', team: 'backend', cpus: '1.5', memory: '4g' }));
  expect(made).toMatchObject({ id: 'vm-1', image: TEMPLATE, status: 'running' });

  const created = calls(virshLog()).find((one) => one.includes('vol-create-as'));
  expect(created).toEqual(expect.arrayContaining(['vm-1.qcow2', '--backing-vol', TEMPLATE, '--format', 'qcow2']));
  expect(created).toEqual(expect.arrayContaining(['-c', 'qemu+ssh://ops@kvm1:2222/system?no_tty=1']));
  const domain = box().domains['vm-1'] as Domain;
  expect(domain).toMatchObject({ state: 'running', volume: 'vm-1.qcow2', vcpus: '2', memory: '4096' });
  expect(domain.userData).toContain('AAAAC3NzaC1lZDI1NTE5AAAAIFixture');
  expect(domain.metaData).toContain('instance-id: vm-1');

  expect(await vms.list()).toEqual([expect.objectContaining({
    id: 'vm-1', image: TEMPLATE, status: 'running', agents: ['echo'], session: 's1', host: 'host-a', owner: 'user:ana', team: 'backend',
  })]);
  const record = await vms.inspect('vm-1') as { Config: { Labels: Record<string, string> }; State: { Running: boolean } };
  expect(record.Config.Labels).toMatchObject({ 'ahpd.computer': '1', 'ahpd.profile': 'vm', 'ahpd.host': 'host-a' });
  expect(record.State.Running).toBe(true);
  expect(await vms.state('vm-1')).toBe('running');
  expect(await vms.owner('vm-1')).toEqual({ owner: 'user:ana', team: 'backend' });

  // Reached as its own login, with this host's key, through the box.
  const reached = calls(sshLog()).at(-1) as string[];
  expect(reached).toEqual(expect.arrayContaining(['-J', 'ops@kvm1:2222', 'ahpd@192.168.122.10']));
  expect(reached).toEqual(expect.arrayContaining(['-i', join(dir(), 'config', 'computer-ssh', 'id_ed25519')]));
});

it.skipIf(!posix)('starts a nested host from where the template puts ahpd', async () => {
  const vms = runtime();
  await vms.run(spec());
  expect(await vms.hostCommand?.('vm-1')).toEqual(VM_HOST);
  const how = await vms.how?.('vm-1', { command: '/opt/ahpd/ahpd/bin/ahpd', args: ['--stdio'] });
  expect(how?.command).toBe(process.execPath);
  expect(how?.args).toEqual(expect.arrayContaining(['-J', 'ops@kvm1:2222', 'ahpd@192.168.122.10']));
  expect(how?.args.at(-1)).toContain('/opt/ahpd/ahpd/bin/ahpd');
  expect(how?.args.at(-1)).toContain('--stdio');
});

it.skipIf(!posix)('waits for an address and removes the VM and its disk when none comes', async () => {
  const vms = runtime({ waits: { boot: 150, ready: 150, every: 10 } }, { VIRSH_FAKE_ADDRESS_AFTER: 'never' });
  await expect(vms.run(spec())).rejects.toThrow(/vm-1 had no address within 150ms/);
  expect(box()).toEqual({ volumes: [TEMPLATE], domains: {} });
});

it.skipIf(!posix)('takes an address that comes after a few asks', async () => {
  const vms = runtime({}, { VIRSH_FAKE_ADDRESS_AFTER: '3' });
  await vms.run(spec());
  expect(calls(virshLog()).filter((one) => one.includes('domifaddr')).length).toBeGreaterThanOrEqual(4);
});

it.skipIf(!posix)('removes a VM whose cloud-init failed', async () => {
  const vms = runtime({}, { CLOUD_INIT: '1' });
  await expect(vms.run(spec())).rejects.toThrow(/vm-1 did not finish cloud-init: status: done/);
  expect(box().domains).toEqual({});
});

it.skipIf(!posix)('takes a cloud-init that finished with a warning', async () => {
  const vms = runtime({}, { CLOUD_INIT: '2' });
  await vms.run(spec());
  expect(box().domains['vm-1']?.state).toBe('running');
});

it.skipIf(!posix)('removes the overlay when virt-install fails, and the VM when its metadata is not written', async () => {
  await expect(runtime({}, { VIRSH_FAKE_FAIL: 'virt-install' }).run(spec())).rejects.toThrow(/virt-install on kvm1 exited 1: error: Unable to connect/);
  expect(box()).toEqual({ volumes: [TEMPLATE], domains: {} });
  await expect(runtime({}, { VIRSH_FAKE_FAIL: 'metadata' }).run(spec())).rejects.toThrow(/virsh metadata on kvm1/);
  expect(box()).toEqual({ volumes: [TEMPLATE], domains: {} });
});

it.skipIf(!posix)('refuses what a VM cannot be given, and says what to do instead', async () => {
  const vms = runtime();
  await expect(vms.run(spec({ statesAsked: [{ need: 'claude-home', provider: 'claude', target: '/home/ahpd/.claude' }] })))
    .rejects.toThrow(/claude keeps its state claude-home in a volume.*state: "host"/);
  await expect(vms.run(spec({ mounts: ['/home/me/data:/data'] }))).rejects.toThrow(/the mount \/home\/me\/data:\/data is a path on this host/);
  await expect(vms.run(spec({ env: { TOKEN: 'x' } }))).rejects.toThrow(/the variables TOKEN are not set in one yet/);
  await expect(vms.run(spec({ folder: '/work/repo' }))).rejects.toThrow(/\/work\/repo is not a repository it may be given/);
  await expect(vms.run(spec({ name: 'vm 1' }))).rejects.toThrow(/not a name a VM can have/);
  await expect(runtime({ template: undefined }).run(spec())).rejects.toThrow(/names no template/);
  // Nothing was made for any of them.
  expect(calls(virshLog()).filter((one) => one.includes('vol-create-as'))).toEqual([]);
});

it.skipIf(!posix)('lists only its own VMs, and only this host\'s', async () => {
  const theirs = metadataOf({ 'ahpd.computer': '1', 'ahpd.host': 'host-b' });
  const ours = metadataOf({ 'ahpd.computer': '1', 'ahpd.host': 'host-a', 'ahpd.image': TEMPLATE, 'ahpd.created': '2026-10-30T00:00:00.000Z' });
  const vms = runtime({}, {}, {
    'vm-a': { state: 'shut off', volume: 'vm-a.qcow2', metadata: ours },
    'vm-b': { state: 'running', volume: 'vm-b.qcow2', metadata: theirs },
    'pc-02': { state: 'running', volume: 'pc-02.qcow2' },
  });
  expect(await vms.list()).toEqual([expect.objectContaining({ id: 'vm-a', status: 'shut off', created: '2026-10-30T00:00:00.000Z' })]);
  expect(await vms.state('vm-a')).toBe('stopped');
  expect(await vms.inspect('pc-02')).toBeUndefined();
  await expect(vms.remove('pc-02')).rejects.toThrow(/there is no libvirt machine called pc-02/);
  expect(box().domains['pc-02']).toBeDefined();
});

it.skipIf(!posix)('stops, starts and removes a VM, with its disk and its known host', async () => {
  const vms = runtime();
  await vms.run(spec());
  const known = join(dir(), 'config', 'computer-ssh', 'known_hosts');
  writeFileSync(known, '192.168.122.10 ssh-ed25519 AAAAold\n10.0.0.9 ssh-ed25519 AAAAother\n');
  await vms.stop('vm-1');
  expect(await vms.state('vm-1')).toBe('stopped');
  await vms.start('vm-1');
  expect(await vms.state('vm-1')).toBe('running');
  await vms.remove('vm-1');
  expect(box()).toEqual({ volumes: [TEMPLATE], domains: {} });
  expect(readFileSync(known, 'utf8')).toBe('10.0.0.9 ssh-ed25519 AAAAother\n');
  expect(await vms.list()).toEqual([]);
});

it.skipIf(!posix)('cuts off a VM that does not shut down within the bound', async () => {
  const lines: string[] = [];
  const vms = runtime({ log: (line) => { lines.push(line); } }, { VIRSH_FAKE_SHUTDOWN: 'ignore' });
  await vms.run(spec());
  await vms.stop('vm-1');
  expect(await vms.state('vm-1')).toBe('stopped');
  expect(calls(virshLog()).map((one) => one[3]).filter((verb) => verb === 'shutdown' || verb === 'destroy')).toEqual(['shutdown', 'destroy']);
  expect(lines).toContainEqual('vm-1 did not shut down within 0 s, so it is cut off');
  // One already off is left as it is.
  await vms.stop('vm-1');
});

it.skipIf(!posix)('suspends and resumes a VM, and restarts a suspended one', async () => {
  const vms = runtime();
  await vms.run(spec());
  expect(vms.suspends?.('vm-1')).toBe(true);
  expect(vms.capabilities().actions).toEqual(expect.arrayContaining(['suspend', 'resume']));
  await vms.suspend?.('vm-1');
  expect(await vms.state('vm-1')).toBe('suspended');
  await expect(vms.suspend?.('vm-1')).rejects.toThrow(/vm-1 is paused, so it cannot be suspended/);
  await vms.resume?.('vm-1');
  expect(await vms.state('vm-1')).toBe('running');
  await expect(vms.resume?.('vm-1')).rejects.toThrow(/vm-1 is running, so there is nothing to resume/);
  await vms.suspend?.('vm-1');
  await vms.restart('vm-1');
  expect(await vms.state('vm-1')).toBe('running');
  // A held VM cannot hear a shutdown, so it is cut off.
  await vms.suspend?.('vm-1');
  await vms.stop('vm-1');
  expect(await vms.state('vm-1')).toBe('stopped');
});

it.skipIf(!posix)('refuses a file put into a VM, which is not done yet', async () => {
  const vms = runtime();
  await vms.run(spec());
  await expect(vms.putIn?.('vm-1', [{ source: '/tmp/a', target: '/tmp/a' }] as never)).rejects.toThrow(/a file is not written onto it yet/);
});

/** What dev02 answers to the server check: a box with KVM and libvirt, and `kvm` overridden. */
const checkFile = (kvm = 'yes'): string => {
  const file = join(dir(), 'check.txt');
  writeFileSync(file, [
    'os_id=debian', 'os_like=', 'os_name=Debian GNU/Linux 13 (trixie)', 'arch=x86_64', 'cpus=6',
    'memory_kb=11718656', 'home_free_kb=52428800', 'varlib_free_kb=20971520',
    `kvm=${kvm}`, 'kvm_access=yes', 'libvirt=11.3.0', 'libvirt_access=yes', 'user=softov',
  ].join('\n'));
  return file;
};

/** The plugin, loaded with one box and the profiles given, over the fixtures. */
const load = async (profiles: Record<string, unknown>, kvm = 'yes', usage?: Usage) => {
  writeFileSync(statePath(), JSON.stringify({ volumes: [TEMPLATE], domains: {} }));
  const lines: string[] = [];
  const base: HostOptions = {
    path: '/tmp/computer-libvirt',
    hostName: 'box.local',
    agents: [],
    resources: fileResources(),
    ...(usage === undefined ? {} : { usage }),
  };
  const result = await loadPlugins(
    [{
      name: './packages/computer/src/index.ts',
      options: {
        command: process.execPath,
        args: [fileURLToPath(new URL('./fixtures/docker.mjs', import.meta.url))],
        env: {
          DOCKER_FAKE_STATE: join(dir(), 'docker.json'),
          SSH_FAKE_LOG: sshLog(),
          SSH_FAKE_CHECK: checkFile(kvm),
          VIRSH_FAKE_STATE: statePath(),
          VIRSH_FAKE_LOG: virshLog(),
          PATH: `${cloudInit()}${delimiter}${process.env.PATH ?? ''}`,
        },
        ssh: { command: process.execPath, args: [SSH], machines: { dev02: { destination: 'dev02' } } },
        libvirt: { template: TEMPLATE, virsh: [process.execPath, VIRSH, 'virsh'], virtInstall: [process.execPath, VIRSH, 'virt-install'] },
        profiles,
      },
    }],
    { base, configDir: join(dir(), 'state'), cwd: join(import.meta.dirname, '../../..'), log: (line) => { lines.push(line); }, hostId: 'host-a' },
  );
  keeping(result.options);
  const provider = result.options.resourceProviders?.computer as {
    write(uri: string, content: { data: string; encoding: string }, owner?: string): Promise<void>;
    read(uri: string): Promise<{ data: string }>;
    list(uri: string): Promise<{ name: string }[]>;
  };
  return { lines, provider };
};

const body = (said: unknown) => ({ data: JSON.stringify(said), encoding: 'utf-8' });

it.skipIf(!posix)('makes a profile\'s machine as a VM on its server, and lists it under libvirt', async () => {
  const { provider } = await load({ vm: { server: 'dev02', runtime: 'libvirt' } });
  await provider.write('computer://box', body({ profile: 'vm' }), 'user:ana');
  expect(Object.keys(box().domains)).toEqual(['box']);
  expect(calls(virshLog()).find((one) => one.includes('vol-create-as'))).toEqual(expect.arrayContaining(['-c', 'qemu+ssh://dev02/system?no_tty=1']));
  expect((await provider.list('computer://')).map((one) => one.name)).toContain('libvirt.box');
});

it.skipIf(!posix)('refuses a VM on a server with no KVM, with the line that says so', async () => {
  const { provider } = await load({ vm: { server: 'dev02', runtime: 'libvirt' } }, 'no');
  await expect(provider.write('computer://box', body({ profile: 'vm' }), 'user:ana')).rejects.toThrow(/dev02 cannot run this profile's machines: it lacks kvm/u);
  expect(box().domains).toEqual({});
});

it.skipIf(!posix)('leaves out a profile that makes VMs and names no server', async () => {
  const { lines } = await load({ vm: { runtime: 'libvirt' } });
  expect(lines).toContainEqual(expect.stringContaining('profiles.vm makes VMs and names no server to make them on, so the profile is left out'));
});

/** The up-time store in memory, so a test can read the stretches the plugin wrote. */
const meter = (): Usage & { entries: UsageEntry[] } => {
  const entries: UsageEntry[] = [];
  return {
    entries,
    record: async (entry: UsageEntry) => { entries.push(entry); },
    total: async (): Promise<UsageTotal> => ({}),
    pools: async () => [],
    records: async () => [],
    groups: async () => [],
  };
};

const text = (said: string) => ({ data: said, encoding: 'utf-8' });

it.skipIf(!posix)('suspends and resumes a VM through its state, with a stretch closed at each hold', async () => {
  const usage = meter();
  const { provider } = await load({ vm: { server: 'dev02', runtime: 'libvirt' } }, 'yes', usage);
  await provider.write('computer://box', body({ profile: 'vm' }), 'user:ana');

  await provider.write('computer://libvirt.box/state', text('suspended'));
  expect(box().domains.box?.state).toBe('paused');
  expect((await provider.read('computer://libvirt.box/state')).data).toBe('suspended\n');
  expect(usage.entries).toHaveLength(1);

  await provider.write('computer://libvirt.box/state', text('running'));
  expect(box().domains.box?.state).toBe('running');
  await provider.write('computer://libvirt.box/state', text('stopped'));
  expect(usage.entries.map((one) => [one.computer, one.owner])).toEqual([['libvirt.box', 'user:ana'], ['libvirt.box', 'user:ana']]);
});

it.skipIf(!posix)('refuses suspended for a machine whose runtime cannot hold it', async () => {
  const { provider } = await load({ vm: { server: 'dev02', runtime: 'libvirt' } });
  await provider.write('computer://dock', body({ image: 'node:22' }), 'user:ana');
  await expect(provider.write('computer://dock/state', text('suspended'))).rejects.toThrow(/dock cannot be suspended: its runtime cannot hold a machine/);
  await expect(provider.write('computer://dock/state', text('paused'))).rejects.toThrow(/A computer's state is one of running, stopped, restarted, and that body says paused/);
});
