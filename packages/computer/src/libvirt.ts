/**
 * Virtual machines, made by libvirt on a box this host reaches over `ssh`.
 *
 * A profile with `runtime: "libvirt"` names its box as `server`, and each of
 * its machines is a linked clone of a template disk on that box: `virsh`
 * makes the overlay, `virt-install` boots it with cloud-init, and the VM is
 * then reached as an ssh machine, with this host's own key, through the box.
 * Every `virsh` call runs here against `qemu+ssh://<box>/system`, so the box
 * needs libvirt and nothing of ahpd's.
 *
 * What a container keeps as labels, a VM keeps in its own `<metadata>`, under
 * a namespace of ahpd's: the same keys, so every reader of a machine's record
 * reads a VM the way it reads a container. The record `inspect` answers has
 * Docker's shape for the same reason.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { hostPathOf, machinePathOf } from '@ahpd/sdk';
import type { BroughtBack } from '@ahpd/sdk';
import { codeRouteOf } from './clone.js';
import { MACHINE_GIT, seedOf } from './gitdir.js';
import { forgetHost, machineKey, runKeygen } from './keys.js';
import type { Keygen, MachineKey } from './keys.js';
import { bringBack, bundledInto, checkedOut, fetchedInto, followOfCopy, keepUncommitted } from './machinegit.js';
import type { FarSeed, MachineGit } from './machinegit.js';
import {
  bytesOf,
  claimedBy,
  disposableOf,
  hostOf,
  MACHINE_AGENTS,
  MACHINE_ALONE,
  MACHINE_DISPOSABLE,
  MACHINE_HOST,
  MACHINE_OWNER,
  MACHINE_PROFILE,
  MACHINE_PROJECT,
  MACHINE_SESSION,
  MACHINE_TEAM,
  preparedFor,
  sessionOf,
} from './runtime.js';
import type { ComputerRuntime, ExecResult, Machine, MachineSpec, RuntimeCapabilities } from './runtime.js';
import { sshReach } from './ssh.js';
import type { SshMachine, SshProgram, SshReach } from './ssh.js';

/** What `capabilities` reports for this runtime. */
const CAPABILITIES: RuntimeCapabilities = {
  runtime: 'libvirt',
  actions: ['create', 'destroy', 'exec', 'start', 'stop', 'restart', 'suspend', 'resume'],
  resources: ['status', 'capabilities', 'stats', 'state'],
};

/**
 * The namespace a VM's record is kept under in its `<metadata>`.
 *
 * libvirt keeps one element per namespace and never reads it: the URI only
 * has to be one no other program writes under.
 */
export const METADATA_NS = 'https://github.com/softov/ahpd/computer';

/** The prefix the element is written with. */
const METADATA_KEY = 'ahpd';

/** Where a VM's tree is, which is the session's repository at its own path. */
const MACHINE_TREE = 'ahpd.tree';

/** Where a VM's commands start: the session's folder, inside that tree. */
const MACHINE_WORKDIR = 'ahpd.workdir';

/** What a VM was made from, which is its template's volume. */
const MACHINE_IMAGE = 'ahpd.image';

/** When a VM was made, since libvirt keeps no such moment. */
const MACHINE_CREATED = 'ahpd.created';

/** The login a VM is made with, when the option names none. */
const DEFAULT_USER = 'ahpd';

/** The overlay's size, when the option names none. */
const DEFAULT_DISK = '20G';

/** A VM's cores and MiB of memory, when its spec says neither. */
const DEFAULT_CPUS = 2;
const DEFAULT_MEMORY_MIB = 2048;

/**
 * How a VM starts its nested host: where the template puts ahpd, since a
 * VM's login `PATH` may not hold it.
 */
export const VM_HOST = ['/opt/ahpd/ahpd/bin/ahpd'];

/** How long one `virsh` call is given, and one `virt-install`. */
const VIRSH_MS = 60_000;
const INSTALL_MS = 5 * 60_000;

/** How long a new VM is given for an address, then for ssh, and how often each is asked. */
const BOOT_MS = 3 * 60_000;
const READY_MS = 3 * 60_000;
const EVERY_MS = 2_000;
/** How long a guest is given to shut down before it is cut off. */
const SHUTDOWN_MS = 60_000;

/** A name `virsh`, a disk file and a shell all take as it is. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** The box one profile's VMs are made on. */
export interface LibvirtProfile {
  /** The box's name in `ssh.machines`. */
  server: string;
  /** The box, as the ssh option wrote it. */
  box: SshMachine;
  /** How a VM from this profile starts its nested host, when not `VM_HOST`. */
  host?: string[];
}

/** What this runtime was configured with. */
export interface LibvirtOptions {
  /** How `ssh` is run, to a VM and to its box. */
  ssh: SshProgram;
  /** The `virsh` program, with the arguments it starts with. */
  virsh?: string[];
  /** The `virt-install` program, with the arguments it starts with. */
  virtInstall?: string[];
  /** Environment for both programs, merged over this process's own. */
  env?: Record<string, string>;
  /** The connection URI for every box, in place of the one built from its destination. */
  uri?: string;
  /** The storage pool the template is in and every overlay is made in. */
  pool: string;
  /** The libvirt network a VM is attached to. */
  network: string;
  /** The template's volume in the pool, which every VM backs onto. */
  template?: string;
  /** The login a VM is made with. `ahpd` when absent. */
  user?: string;
  /** The size of a VM's overlay, as `vol-create-as` reads one. `20G` when absent. */
  disk?: string;
  /** The profiles that make VMs, by key. */
  profiles: Record<string, LibvirtProfile>;
  /** The label every machine this provider made carries, as `key=value`. */
  label: string;
  /** The daemon's configuration folder, where the key pair is kept. */
  configDir: string;
  /** The daemon's own id, which a VM is recorded under and listed by. */
  hostId?: string;
  keygen?: Keygen;
  log?: (line: string) => void;
  /** The bounds on a VM's boot and shutdown, in milliseconds, for a test. */
  waits?: { boot?: number; ready?: number; every?: number; shutdown?: number };
}

/** What one program printed, and how it ended. */
interface Ran {
  code: number;
  stdout: string;
  stderr: string;
}

const lastLine = (said: string): string =>
  said.split('\n').map((one) => one.trim()).filter((one) => one !== '').at(-1) ?? '';

const pause = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms); });

/** One run of a program, bounded, with its output collected as text. */
const ranWith = (command: string, args: string[], env: Record<string, string> | undefined, timeout: number): Promise<Ran> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...(env ?? {}) },
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, timeout);
    (timer as { unref?: () => void }).unref?.();
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr?.on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, stdout, stderr }); });
  });

/** Text as it may stand in an XML attribute or element. */
const escaped = (said: string): string => said
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const unescaped = (said: string): string => said
  .replaceAll('&quot;', '"')
  .replaceAll('&gt;', '>')
  .replaceAll('&lt;', '<')
  .replaceAll('&amp;', '&');

/** A VM's labels as the element its `<metadata>` holds. */
export const metadataOf = (labels: Record<string, string>): string =>
  `<labels>${Object.entries(labels).map(([key, value]) => `<label key="${escaped(key)}">${escaped(value)}</label>`).join('')}</labels>`;

/** The labels in what `virsh metadata` printed, or nothing when it printed none. */
export const labelsFrom = (said: string): Record<string, string> | undefined => {
  if (!said.includes('<labels')) return undefined;
  const held: Record<string, string> = {};
  for (const found of said.matchAll(/<label key="([^"]*)"\s*(?:\/>|>([^<]*)<\/label>)/g)) {
    held[unescaped(found[1] ?? '')] = unescaped(found[2] ?? '');
  }
  return held;
};

/** The rows of `virsh list --all`: each domain's name and its state in libvirt's words. */
export const domainsFrom = (said: string): { name: string; state: string }[] => {
  const lines = said.split('\n');
  const rule = lines.findIndex((line) => /^-{3,}/.test(line.trim()));
  return lines.slice(rule + 1).flatMap((line) => {
    const words = line.trim().split(/\s+/);
    const [, name, ...state] = words;
    return name === undefined || name === '' ? [] : [{ name, state: state.join(' ') }];
  });
};

/** The first IPv4 address `virsh domifaddr` printed, without its prefix length. */
export const addressFrom = (said: string): string | undefined =>
  /\bipv4\s+(\d{1,3}(?:\.\d{1,3}){3})\//.exec(said)?.[1];

/** A box's destination with its port, as `ssh -J` and a libvirt URI write it. */
const hostPortOf = (box: SshMachine): string => (box.port === undefined ? box.destination : `${box.destination}:${box.port}`);

/**
 * The connection URI for one box.
 *
 * `no_tty=1` so a box that wants a password fails instead of waiting for one,
 * which is what `BatchMode` does for this host's own `ssh`.
 */
export const uriOf = (box: SshMachine): string => `qemu+ssh://${hostPortOf(box)}/system?no_tty=1`;

/**
 * The user-data a VM boots with: the login, with this host's public key, and
 * the tree's folder made that login's.
 *
 * JSON is YAML, so every value here is a JSON string and nothing in a path or
 * a key can be read as more YAML. No secret is ever in it: the box keeps the
 * file in the VM's seed disk, where its own operator can read it.
 */
export const userDataOf = (user: string, key: string, tree: string | undefined): string => `#cloud-config\n${JSON.stringify({
  users: [{
    name: user,
    shell: '/bin/bash',
    sudo: 'ALL=(ALL) NOPASSWD:ALL',
    ssh_authorized_keys: [key.trim()],
  }],
  ...(tree === undefined ? {} : { runcmd: [['install', '-d', '-o', user, '-g', user, tree]] }),
}, null, 2)}\n`;

/** A spec's cores, as `--vcpus` takes a whole number. */
const cpusOf = (said: string | undefined): number => {
  const held = said === undefined ? Number.NaN : Number(said);
  return Number.isFinite(held) && held > 0 ? Math.ceil(held) : DEFAULT_CPUS;
};

/** A spec's memory in MiB, from Docker's spelling of it. */
const memoryOf = (said: string | undefined): number => {
  // Docker's `4g` is binary, as `docker run --memory` reads it.
  const bytes = said === undefined ? undefined : bytesOf(/^[0-9.]+[kmgt]$/i.test(said) ? `${said}ib` : said);
  return bytes === undefined || bytes <= 0 ? DEFAULT_MEMORY_MIB : Math.max(256, Math.round(bytes / 1024 ** 2));
};

/**
 * Virtual machines, on libvirt boxes.
 *
 * One runtime serves every box a libvirt profile names. Which box holds a VM
 * is kept here once a listing or a make has said it; a VM this process has not
 * seen yet is found by listing every box.
 */
export const libvirtRuntime = (options: LibvirtOptions): ComputerRuntime => {
  const [virsh = 'virsh', ...virshArgs] = options.virsh ?? [];
  const [virtInstall = 'virt-install', ...virtInstallArgs] = options.virtInstall ?? [];
  const user = options.user ?? DEFAULT_USER;
  const keygen = options.keygen ?? runKeygen;
  const [labelKey = '', labelValue = ''] = options.label.split('=');
  const boot = options.waits?.boot ?? BOOT_MS;
  const ready = options.waits?.ready ?? READY_MS;
  const every = options.waits?.every ?? EVERY_MS;
  const shutdown = options.waits?.shutdown ?? SHUTDOWN_MS;

  /** Each box a profile names, by its name in `ssh.machines`. */
  const boxes = new Map(Object.values(options.profiles).map((one) => [one.server, one.box]));
  /** Which box each VM is on, as a listing or a make said it. */
  const where = new Map<string, string>();
  /** Each running VM's address, from its last `domifaddr`. */
  const addresses = new Map<string, string>();

  const uriFor = (server: string): string => {
    const box = boxes.get(server);
    if (box === undefined) throw new Error(`${server} is not a box a libvirt profile names`);
    return options.uri ?? uriOf(box);
  };

  /** One `virsh` call on one box. */
  const virshOn = (server: string, args: string[], timeout = VIRSH_MS): Promise<Ran> =>
    ranWith(virsh, [...virshArgs, '-c', uriFor(server), ...args], options.env, timeout);

  /** The same, thrown with its last line when it fails. */
  const mustOn = async (server: string, args: string[], timeout = VIRSH_MS): Promise<string> => {
    const held = await virshOn(server, args, timeout);
    if (held.code !== 0) {
      throw new Error(`virsh ${args[0] ?? ''} on ${server} exited ${String(held.code)}: ${lastLine(held.stderr) || lastLine(held.stdout)}`);
    }
    return held.stdout;
  };

  /** One VM's labels, or nothing when it carries none of ours. */
  const labelsOn = async (server: string, name: string): Promise<Record<string, string> | undefined> => {
    const held = await virshOn(server, ['metadata', name, METADATA_NS]);
    if (held.code !== 0) return undefined;
    const labels = labelsFrom(held.stdout);
    if (labels === undefined || labels[labelKey] !== labelValue) return undefined;
    return labels;
  };

  /** Whether a VM is this daemon's to list, as a box's Docker filters by the same label. */
  const listedHere = (labels: Record<string, string>): boolean =>
    options.hostId === undefined || labels[MACHINE_HOST] === options.hostId;

  /** The VMs on one box that carry this provider's label, with their state. */
  const listOn = async (server: string): Promise<{ name: string; state: string; labels: Record<string, string> }[]> => {
    const domains = domainsFrom(await mustOn(server, ['list', '--all']));
    const found = await Promise.all(domains.map(async (one) => {
      const labels = await labelsOn(server, one.name);
      return labels === undefined || !listedHere(labels) ? [] : [{ ...one, labels }];
    }));
    for (const one of found.flat()) where.set(one.name, server);
    return found.flat();
  };

  /** The box one VM is on, from what was kept or from a listing of every box. */
  const serverOf = async (name: string): Promise<string | undefined> => {
    const held = where.get(name);
    if (held !== undefined) return held;
    for (const server of boxes.keys()) {
      const found = await listOn(server).catch(() => []);
      if (found.some((one) => one.name === name)) return server;
    }
    return undefined;
  };

  /** A record in Docker's shape, which every reader of a machine's record reads. */
  const recordFrom = (name: string, state: string, labels: Record<string, string>): Record<string, unknown> => ({
    Id: name,
    Name: name,
    Config: {
      Labels: labels,
      Image: labels[MACHINE_IMAGE] ?? '',
      ...(labels[MACHINE_WORKDIR] === undefined ? {} : { WorkingDir: labels[MACHINE_WORKDIR] }),
    },
    State: { Running: state === 'running', Status: state },
  });

  /** One VM's record and the box it is on, or nothing when it is not there. */
  const look = async (name: string): Promise<{ server: string; labels: Record<string, string>; state: string } | undefined> => {
    const server = await serverOf(name);
    if (server === undefined) return undefined;
    const labels = await labelsOn(server, name);
    if (labels === undefined) {
      where.delete(name);
      return undefined;
    }
    const state = (await mustOn(server, ['domstate', name])).trim();
    return { server, labels, state };
  };

  const lookOrFail = async (name: string): Promise<{ server: string; labels: Record<string, string>; state: string }> => {
    const found = await look(name);
    if (found === undefined) throw new Error(`there is no libvirt machine called ${name}`);
    return found;
  };

  /** The address one VM answers on, from what was kept or from `domifaddr`. */
  const addressOf = async (server: string, name: string): Promise<string | undefined> => {
    const held = addresses.get(name);
    if (held !== undefined) return held;
    const said = await virshOn(server, ['domifaddr', name]);
    const address = said.code === 0 ? addressFrom(said.stdout) : undefined;
    if (address !== undefined) addresses.set(name, address);
    return address;
  };

  /** The profile a VM was made from, as its labels say. */
  const profileFrom = (labels: Record<string, string>): LibvirtProfile | undefined => {
    const key = labels[MACHINE_PROFILE] ?? labels[MACHINE_DISPOSABLE];
    return key === undefined ? undefined : options.profiles[key];
  };

  /**
   * One VM as an ssh destination: its own login at its address, with this
   * host's key, through the box it is on.
   */
  const reachTo = (key: MachineKey, server: string, address: string, labels: Record<string, string>, workdir?: string): SshReach => {
    const box = boxes.get(server) as SshMachine;
    return sshReach(options.ssh, {
      destination: `${user}@${address}`,
      identity: key.private,
      knownHosts: key.knownHosts,
      jump: hostPortOf(box),
      host: profileFrom(labels)?.host ?? VM_HOST,
      ...(workdir === undefined ? {} : { workdir }),
    });
  };

  /** A running VM's reach, or a sentence saying why there is none. */
  const reachOf = async (name: string, workdir?: string): Promise<{ reach: SshReach; found: { server: string; labels: Record<string, string>; state: string } }> => {
    const found = await lookOrFail(name);
    if (found.state !== 'running') throw new Error(`${name} is ${found.state}, so it cannot be reached`);
    const address = await addressOf(found.server, name);
    if (address === undefined) throw new Error(`${name} has no address yet`);
    const key = await machineKey(options.configDir, keygen);
    return { reach: reachTo(key, found.server, address, found.labels, workdir), found };
  };

  /**
   * Destroy one VM and its overlay, and forget its address.
   *
   * `--remove-all-storage` removes the volumes the domain names, and the
   * template is never one of them: the overlay names it as its backing file.
   */
  const destroyed = async (server: string, name: string): Promise<void> => {
    const address = addresses.get(name) ?? await addressOf(server, name).catch(() => undefined);
    // A VM that is not running has nothing to destroy, which is not a failure.
    await virshOn(server, ['destroy', name]);
    await mustOn(server, ['undefine', name, '--remove-all-storage', '--nvram']);
    where.delete(name);
    addresses.delete(name);
    if (address !== undefined) await forgetHost(options.configDir, address, keygen);
  };

  /** Ask `ask` every `every` milliseconds until it answers, or until `within` has passed. */
  const waited = async <T>(within: number, ask: () => Promise<{ value?: T; said: string }>): Promise<{ value?: T; said: string }> => {
    const until = Date.now() + within;
    let last: { value?: T; said: string } = { said: '' };
    for (;;) {
      last = await ask();
      if (last.value !== undefined || Date.now() >= until) return last;
      await pause(every);
    }
  };

  /** The machine's git, through the VM's own `ssh`. */
  const gitOf = (name: string, reach: SshReach, tree: string): MachineGit => ({
    id: name,
    tree,
    copy: true,
    remote: true,
    git: (args) => reach.ran(['git', '-C', tree, ...args]),
    pour: (args, path) => reach.pour(['git', '-C', tree, ...args], path),
    ...(options.log === undefined ? {} : { log: options.log }),
  });

  /**
   * The session's code, in the VM: its own git directory in the tree, seeded
   * by a bundle sent from this host or by a fetch of the branch from origin,
   * as the profile's `code` says.
   */
  const seeded = async (spec: MachineSpec, reach: SshReach, root: string): Promise<void> => {
    const at = posix.join(root, '.git');
    const must = async (command: string[]): Promise<string> => {
      const held = await reach.ran(command);
      if (held.code !== 0) {
        throw new Error(`${command.slice(0, 2).join(' ')} in ${spec.name} exited ${String(held.code)}: ${lastLine(held.stderr) || lastLine(held.stdout)}`);
      }
      return held.stdout;
    };
    const far: FarSeed = {
      name: spec.name,
      must,
      ran: (command) => reach.ran(command),
      // ssh has no copy of its own, so the file goes on the command's stdin.
      put: (file, path) => sent(reach, file, path, spec.name),
      drop: async (path) => { await reach.ran(['rm', '-f', path]); },
    };
    // `root` is the tree's path in the VM, and `seedOf` reads the host's tree at the same path.
    const seed = seedOf(hostPathOf(root));
    await must(['git', 'init', '--bare', '-q', at]);
    await must(['git', `--git-dir=${at}`, 'config', 'core.bare', 'false']);
    const commit = codeRouteOf(spec) === 'clone'
      ? await fetchedInto(far, root, at, seed.branch)
      : await bundledInto(far, root, at);
    await checkedOut(must, [`--git-dir=${at}`, `--work-tree=${root}`], seed, commit, true);
  };

  /** Why a spec cannot be made as a VM, or nothing when it can. */
  const refusalOf = (spec: MachineSpec): string | undefined => {
    if (!NAME.test(spec.name)) return `${spec.name} is not a name a VM can have: letters, digits, - and _ only`;
    if (spec.devcontainer !== undefined) return `${spec.name} is not made from a devcontainer.json as a VM: the Dev Container CLI reads the folder on this host`;
    const mounted = [...spec.mounts ?? [], ...(spec.partFallbacks ?? []).map((one) => one.mount)];
    if (mounted.length > 0) return `${spec.name} is a VM on another box, and the mount ${mounted[0] as string} is a path on this host`;
    if ((spec.copies ?? []).length > 0) return `${spec.name} is a VM on another box, and a file of this host's is not copied into one yet`;
    const asked = [...spec.statesAsked ?? [], ...spec.states ?? []];
    const first = asked[0];
    if (first !== undefined) {
      return `${spec.name} is a VM, and ${first.provider} keeps its state ${first.need} in a volume, which a VM has none of; use state: "host" or a Docker profile`;
    }
    const variables = Object.keys(spec.env ?? {});
    if (variables.length > 0) return `${spec.name} is a VM, and the variables ${variables.join(', ')} are not set in one yet`;
    if (spec.folder !== undefined && spec.gitDir === undefined) {
      return `${spec.name} is made on another box, and ${spec.repository ?? spec.folder} is not a repository it may be given, so its code cannot be sent there`;
    }
    if (options.template === undefined) return `${spec.name} is not made: the libvirt option names no template`;
    return undefined;
  };

  return {
    kind: 'libvirt',

    // A VM is another host: every backend of a session in one runs nested.
    remote: true,

    // A command into a VM is one string its login shell runs, variables and all.
    envInCommand: true,

    list: async () => {
      const found = await Promise.all([...boxes.keys()].map(async (server) => {
        const rows = await listOn(server);
        return rows.map(({ name, state, labels }): Machine => {
          const record = recordFrom(name, state, labels);
          const disposable = disposableOf(record);
          const session = sessionOf(record);
          const host = hostOf(record);
          return {
            id: name,
            image: labels[MACHINE_IMAGE] ?? '',
            status: state,
            created: labels[MACHINE_CREATED] ?? '',
            agents: preparedFor(record),
            ...(disposable === undefined ? {} : { disposable }),
            ...(session === undefined ? {} : { session }),
            ...(host === undefined ? {} : { host }),
            ...claimedBy(labels),
          };
        });
      }));
      return found.flat();
    },

    inspect: async (name) => {
      const found = await look(name);
      return found === undefined ? undefined : recordFrom(name, found.state, found.labels);
    },

    state: async (name) => {
      const found = await look(name);
      if (found === undefined) return undefined;
      if (found.state === 'paused') return 'suspended';
      return found.state === 'running' ? 'running' : 'stopped';
    },

    agents: async (name) => {
      const found = await look(name);
      return found === undefined ? undefined : preparedFor(recordFrom(name, found.state, found.labels));
    },

    /*
     * A VM's parts are what its template carries, and no label names them
     * until the template is built from the versions file.
     */
    parts: async () => undefined,

    owner: async (name) => {
      const found = await look(name);
      return found === undefined ? undefined : claimedBy(found.labels);
    },

    /*
     * A command in the VM, in the caller's folder where the VM's tree holds it
     * and in the VM's own folder otherwise.
     */
    how: async (name, asked) => {
      const found = await look(name);
      if (found === undefined) return undefined;
      const tree = found.labels[MACHINE_TREE];
      const cwd = asked.cwd === undefined ? undefined : machinePathOf(asked.cwd);
      const inTree = cwd !== undefined && tree !== undefined && (cwd === tree || cwd.startsWith(`${tree}/`));
      const { reach } = await reachOf(name, inTree ? cwd : found.labels[MACHINE_WORKDIR]);
      return reach.how(asked);
    },

    hostCommand: async (name) => {
      const found = await look(name);
      return found === undefined ? undefined : profileFrom(found.labels)?.host ?? VM_HOST;
    },

    /*
     * Make one: an overlay on the template, a VM booted from it with
     * cloud-init, the labels in its metadata, then a wait for its address and
     * its ssh. A VM that does not come up in time is removed with its disk,
     * and the last thing the wait heard is the sentence thrown.
     */
    run: async (spec) => {
      const refusal = refusalOf(spec);
      if (refusal !== undefined) throw new Error(refusal);
      const key = spec.disposable?.profile ?? spec.profile;
      const profile = key === undefined ? undefined : options.profiles[key];
      if (key === undefined || profile === undefined) throw new Error(`${spec.name} names no libvirt profile, so there is no box to make it on`);
      const server = profile.server;
      const template = options.template as string;
      const tree = spec.folder === undefined ? undefined : machinePathOf(spec.repository ?? spec.folder);
      const workdir = spec.folder === undefined ? undefined : machinePathOf(spec.folder);
      const labels: Record<string, string> = {
        [labelKey]: labelValue,
        [MACHINE_PROFILE]: key,
        [MACHINE_IMAGE]: template,
        [MACHINE_CREATED]: new Date().toISOString(),
        ...(spec.agents === undefined || spec.agents.length === 0 ? {} : { [MACHINE_AGENTS]: spec.agents.join(',') }),
        ...(spec.disposable === undefined ? {} : { [MACHINE_DISPOSABLE]: spec.disposable.profile }),
        ...(spec.disposable?.alone === true ? { [MACHINE_ALONE]: 'true' } : {}),
        ...(spec.session === undefined || spec.session === '' ? {} : { [MACHINE_SESSION]: spec.session }),
        ...((spec.host ?? options.hostId) === undefined ? {} : { [MACHINE_HOST]: (spec.host ?? options.hostId) as string }),
        ...(spec.owner === undefined ? {} : { [MACHINE_OWNER]: spec.owner }),
        ...(spec.team === undefined ? {} : { [MACHINE_TEAM]: spec.team }),
        ...(spec.project === undefined ? {} : { [MACHINE_PROJECT]: spec.project }),
        ...(tree === undefined ? {} : { [MACHINE_TREE]: tree, [MACHINE_GIT]: 'fetch' }),
        ...(workdir === undefined ? {} : { [MACHINE_WORKDIR]: workdir }),
      };
      const machineKeyHeld = await machineKey(options.configDir, keygen);
      const volume = `${spec.name}.qcow2`;
      await mustOn(server, [
        'vol-create-as', options.pool, volume, options.disk ?? DEFAULT_DISK,
        '--format', 'qcow2', '--backing-vol', template, '--backing-vol-format', 'qcow2',
      ]);
      const seedDir = mkdtempSync(join(tmpdir(), 'ahpd-cloud-init-'));
      try {
        const userData = join(seedDir, 'user-data');
        const metaData = join(seedDir, 'meta-data');
        writeFileSync(userData, userDataOf(user, readFileSync(machineKeyHeld.public, 'utf8'), tree), { mode: 0o600 });
        writeFileSync(metaData, `instance-id: ${spec.name}\nlocal-hostname: ${spec.name}\n`, { mode: 0o600 });
        const installed = await ranWith(virtInstall, [
          ...virtInstallArgs,
          '--connect', uriFor(server),
          '--name', spec.name,
          '--import',
          '--disk', `vol=${options.pool}/${volume},bus=virtio`,
          '--network', `network=${options.network},model=virtio`,
          '--vcpus', String(cpusOf(spec.cpus)),
          '--memory', String(memoryOf(spec.memory)),
          '--osinfo', 'detect=on,require=off',
          '--cloud-init', `user-data=${userData},meta-data=${metaData}`,
          '--graphics', 'none',
          '--noautoconsole',
        ], options.env, INSTALL_MS);
        if (installed.code !== 0) {
          await virshOn(server, ['vol-delete', volume, '--pool', options.pool]);
          throw new Error(`virt-install on ${server} exited ${String(installed.code)}: ${lastLine(installed.stderr) || lastLine(installed.stdout)}`);
        }
      }
      finally {
        rmSync(seedDir, { recursive: true, force: true });
      }
      where.set(spec.name, server);
      try {
        await mustOn(server, ['metadata', spec.name, METADATA_NS, '--key', METADATA_KEY, '--set', metadataOf(labels), '--live', '--config']);
        const addressed = await waited(boot, async () => {
          const said = await virshOn(server, ['domifaddr', spec.name]);
          const value = said.code === 0 ? addressFrom(said.stdout) : undefined;
          return { ...(value === undefined ? {} : { value }), said: said.code === 0 ? 'no address yet' : lastLine(said.stderr) };
        });
        if (addressed.value === undefined) throw new Error(`${spec.name} had no address within ${String(boot)}ms: ${addressed.said}`);
        addresses.set(spec.name, addressed.value);
        const reach = reachTo(machineKeyHeld, server, addressed.value, labels);
        const reached = await waited(ready, async () => {
          const said = await reach.reached();
          return { ...(said.up ? { value: true } : {}), said: said.said };
        });
        if (reached.value === undefined) throw new Error(`${spec.name} did not answer ssh within ${String(ready)}ms: ${reached.said}`);
        // cloud-init exits 2 for a boot that finished with a warning, which is a booted VM.
        const settled = await reach.ran(['cloud-init', 'status', '--wait']);
        if (settled.code !== 0 && settled.code !== 2) {
          throw new Error(`${spec.name} did not finish cloud-init: ${lastLine(settled.stdout) || lastLine(settled.stderr)}`);
        }
        if (tree !== undefined) await seeded(spec, reach, tree);
      }
      catch (error) {
        await destroyed(server, spec.name).catch((gone: unknown) => {
          options.log?.(`${spec.name} was not removed after it failed: ${gone instanceof Error ? gone.message : String(gone)}`);
        });
        throw error;
      }
      return { id: spec.name, image: template, status: 'running', created: labels[MACHINE_CREATED] as string };
    },

    /*
     * Stop one: the guest is asked to shut down, and is cut off when it has
     * not within the bound. A held VM cannot hear the ask, so it is cut off at
     * once, and one already off is left as it is.
     */
    stop: async (name) => {
      const found = await lookOrFail(name);
      addresses.delete(name);
      if (found.state === 'shut off') return;
      if (found.state === 'running') {
        await mustOn(found.server, ['shutdown', name]);
        const off = await waited(shutdown, async () => {
          const now = (await mustOn(found.server, ['domstate', name])).trim();
          return { ...(now === 'shut off' ? { value: true } : {}), said: now };
        });
        if (off.value !== undefined) return;
        options.log?.(`${name} did not shut down within ${Math.round(shutdown / 1000)} s, so it is cut off`);
      }
      await mustOn(found.server, ['destroy', name]);
    },

    start: async (name) => {
      const found = await lookOrFail(name);
      addresses.delete(name);
      await mustOn(found.server, ['start', name]);
    },

    restart: async (name) => {
      const found = await lookOrFail(name);
      addresses.delete(name);
      if (found.state === 'paused') await mustOn(found.server, ['resume', name]);
      await mustOn(found.server, [found.state === 'shut off' ? 'start' : 'reboot', name]);
    },

    suspend: async (name) => {
      const found = await lookOrFail(name);
      if (found.state !== 'running') throw new Error(`${name} is ${found.state}, so it cannot be suspended`);
      await mustOn(found.server, ['suspend', name]);
    },

    resume: async (name) => {
      const found = await lookOrFail(name);
      if (found.state !== 'paused') throw new Error(`${name} is ${found.state}, so there is nothing to resume`);
      await mustOn(found.server, ['resume', name]);
    },

    suspends: () => true,

    /*
     * Remove one, after what it committed and what it never committed are
     * brought back: the VM's disk is the last place either exists. A VM whose
     * work cannot be read out is kept.
     */
    remove: async (name) => {
      const found = await lookOrFail(name);
      const tree = found.labels[MACHINE_TREE];
      if (tree !== undefined && found.labels[MACHINE_GIT] === 'fetch') {
        try {
          if (found.state !== 'running') {
            await mustOn(found.server, ['start', name]);
            const up = await waited(ready, async () => {
              const address = await addressOf(found.server, name);
              if (address === undefined) return { said: 'no address yet' };
              const key = await machineKey(options.configDir, keygen);
              const said = await reachTo(key, found.server, address, found.labels).reached();
              return { ...(said.up ? { value: true } : {}), said: said.said };
            });
            if (up.value === undefined) throw new Error(`it did not come back up: ${up.said}`);
          }
          const { reach } = await reachOf(name);
          await bringBack(gitOf(name, reach, tree));
          await keepUncommitted(gitOf(name, reach, tree));
        }
        catch (error) {
          const said = error instanceof Error ? error.message : String(error);
          throw new Error(`Could not remove ${name}, so it is still here: ${said}`);
        }
      }
      await destroyed(found.server, name);
    },

    exec: async (name, command, env): Promise<ExecResult> => (await reachOf(name)).reach.exec(command, env),

    /*
     * A session's attachments are files at a path of this host's, and copying
     * one onto a VM is not done yet.
     */
    putIn: async (name, paths) => {
      await lookOrFail(name);
      throw new Error(`${name} is a VM on another box, and ${paths.length === 1 ? 'a file is' : 'files are'} not written onto it yet`);
    },
    takeOut: async (name, paths) => {
      await lookOrFail(name);
      throw new Error(`${name} is a VM on another box, and ${paths.length === 1 ? 'a file is' : 'files are'} not removed from it yet`);
    },

    bringBack: async (name): Promise<BroughtBack | undefined> => {
      const found = await look(name);
      if (found === undefined) return undefined;
      const tree = found.labels[MACHINE_TREE];
      if (tree === undefined || found.labels[MACHINE_GIT] !== 'fetch') return { moved: false };
      const { reach } = await reachOf(name);
      return await bringBack(gitOf(name, reach, tree));
    },

    follow: async (name) => {
      const found = await look(name);
      const tree = found?.labels[MACHINE_TREE];
      if (found === undefined || tree === undefined || found.labels[MACHINE_GIT] !== 'fetch') return;
      const { reach } = await reachOf(name);
      await followOfCopy(gitOf(name, reach, tree));
    },

    stats: async (name) => {
      const found = await look(name);
      if (found === undefined || found.state !== 'running') return undefined;
      return (await reachOf(name)).reach.stats();
    },

    capabilities: () => CAPABILITIES,

    /*
     * A VM is made from its template, and an image is Docker's: a part is
     * built on a runtime that makes containers.
     */
    hasImage: async () => false,
    buildImage: async () => { throw new Error('an image is not built on a libvirt box'); },
  };
};

/** A file of this host's, written at `path` in a VM through its `ssh` stdin. */
const sent = async (reach: SshReach, file: string, path: string, name: string): Promise<void> => {
  const held = await reach.ran(['sh', '-c', 'cat > "$1"', 'sh', path], readFileSync(file));
  if (held.code !== 0) throw new Error(`a file was not written into ${name}: ${lastLine(held.stderr) || `ssh exited ${String(held.code)}`}`);
};
