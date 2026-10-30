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
 * A VM keeps its labels in its own `<metadata>`, under a namespace of ahpd's.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputerRuntime } from './runtime.js';
import type { SshMachine } from './ssh.js';
import { DEFAULT_CPUS, DEFAULT_MEMORY_MIB, hostPortOf, lastLine, vmRuntime } from './vm.js';
import type { VmMaker, VmOptions, VmProfile, VmRow } from './vm.js';

export { VM_HOST } from './vm.js';

/**
 * The namespace a VM's record is kept under in its `<metadata>`.
 *
 * libvirt keeps one element per namespace and never reads it: the URI only
 * has to be one no other program writes under.
 */
export const METADATA_NS = 'https://github.com/softov/ahpd/computer';

/** The prefix the element is written with. */
const METADATA_KEY = 'ahpd';

/** The overlay's size, when the option names none. */
const DEFAULT_DISK = '20G';

/** How long one `virsh` call is given, and one `virt-install`. */
const VIRSH_MS = 60_000;
const INSTALL_MS = 5 * 60_000;

/** The box one profile's VMs are made on. */
export interface LibvirtProfile extends VmProfile {
  /** The box's name in `ssh.machines`. */
  server: string;
  /** The box, as the ssh option wrote it. */
  box: SshMachine;
}

/** What this runtime was configured with. */
export interface LibvirtOptions extends VmOptions {
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
  /** A template's volume in the pool, which every VM backs onto in place of one built here. */
  template?: string;
  /** The cloud image's volume in the pool, which a template is built from. */
  image?: string;
  /** The size of a VM's overlay, as `vol-create-as` reads one. `20G` when absent. */
  disk?: string;
  /** The profiles that make VMs, by key. */
  profiles: Record<string, LibvirtProfile>;
}

/** What one program printed, and how it ended. */
interface Ran {
  code: number;
  stdout: string;
  stderr: string;
}

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

/** The names in `virsh vol-list <pool>`, which is a header, a rule and one row per volume. */
export const volumesFrom = (said: string): string[] => said.split('\n').slice(2)
  .map((line) => line.trim().split(/\s+/)[0] ?? '')
  .filter((name) => name !== '');

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

/**
 * The connection URI for one box.
 *
 * `no_tty=1` so a box that wants a password fails instead of waiting for one,
 * which is what `BatchMode` does for this host's own `ssh`.
 */
export const uriOf = (box: SshMachine): string => `qemu+ssh://${hostPortOf(box)}/system?no_tty=1`;

/**
 * The user-data a VM boots with: the login, with this host's public key.
 *
 * JSON is YAML, so every value here is a JSON string and nothing in a key can
 * be read as more YAML. No secret is ever in it: the box keeps the file in the
 * VM's seed disk, where its own operator can read it.
 */
export const userDataOf = (user: string, key: string, packages?: string[]): string => `#cloud-config\n${JSON.stringify({
  users: [{
    name: user,
    shell: '/bin/bash',
    sudo: 'ALL=(ALL) NOPASSWD:ALL',
    ssh_authorized_keys: [key.trim()],
  }],
  ...(packages === undefined ? {} : { packages }),
}, null, 2)}\n`;

/** A domain's state in libvirt's words, as a computer's `state` reads it. */
const stateOf = (said: string): VmRow['state'] => {
  if (said === 'paused') return 'suspended';
  return said === 'running' ? 'running' : 'stopped';
};

/**
 * Virtual machines, on libvirt boxes.
 *
 * One runtime serves every box a libvirt profile names.
 */
export const libvirtRuntime = (options: LibvirtOptions): ComputerRuntime => {
  const [virsh = 'virsh', ...virshArgs] = options.virsh ?? [];
  const [virtInstall = 'virt-install', ...virtInstallArgs] = options.virtInstall ?? [];

  /** Each box a profile names, by its name in `ssh.machines`. */
  const boxes = new Map(Object.values(options.profiles).map((one) => [one.server, one.box]));

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
    return held.code === 0 ? labelsFrom(held.stdout) : undefined;
  };

  /**
   * Boot one VM on a volume already in the pool, with cloud-init. A
   * `virt-install` that fails removes the volume, so nothing is left.
   */
  const installed = async (server: string, name: string, volume: string, userData: string, cpus: number, memory: number): Promise<void> => {
    const seedDir = mkdtempSync(join(tmpdir(), 'ahpd-cloud-init-'));
    try {
      const userFile = join(seedDir, 'user-data');
      const metaFile = join(seedDir, 'meta-data');
      writeFileSync(userFile, userData, { mode: 0o600 });
      writeFileSync(metaFile, `instance-id: ${name}\nlocal-hostname: ${name}\n`, { mode: 0o600 });
      const ran = await ranWith(virtInstall, [
        ...virtInstallArgs,
        '--connect', uriFor(server),
        '--name', name,
        '--import',
        '--disk', `vol=${options.pool}/${volume},bus=virtio`,
        '--network', `network=${options.network},model=virtio`,
        '--vcpus', String(cpus),
        '--memory', String(memory),
        '--osinfo', 'detect=on,require=off',
        '--cloud-init', `user-data=${userFile},meta-data=${metaFile}`,
        '--graphics', 'none',
        '--noautoconsole',
      ], options.env, INSTALL_MS);
      if (ran.code !== 0) {
        await virshOn(server, ['vol-delete', volume, '--pool', options.pool]);
        throw new Error(`virt-install on ${server} exited ${String(ran.code)}: ${lastLine(ran.stderr) || lastLine(ran.stdout)}`);
      }
    }
    finally {
      rmSync(seedDir, { recursive: true, force: true });
    }
  };

  /** An overlay in the pool, backed onto `backing`. */
  const overlay = (server: string, volume: string, backing: string): Promise<string> => mustOn(server, [
    'vol-create-as', options.pool, volume, options.disk ?? DEFAULT_DISK,
    '--format', 'qcow2', '--backing-vol', backing, '--backing-vol-format', 'qcow2',
  ]);

  /**
   * One VM and its overlay gone. `--remove-all-storage` removes the volumes
   * the domain names, and the template is never one of them: the overlay
   * names it as its backing file.
   */
  const destroy = async (server: string, name: string): Promise<void> => {
    // A VM that is not running has nothing to destroy, which is not a failure.
    await virshOn(server, ['destroy', name]);
    await mustOn(server, ['undefine', name, '--remove-all-storage', '--nvram']);
  };

  const maker: VmMaker = {
    kind: 'libvirt',
    servers: [...boxes.keys()],

    listOn: async (server) => {
      const domains = domainsFrom(await mustOn(server, ['list', '--all']));
      return Promise.all(domains.map(async (one): Promise<VmRow> => {
        const labels = await labelsOn(server, one.name);
        return { name: one.name, status: one.state, state: stateOf(one.state), ...(labels === undefined ? {} : { labels }) };
      }));
    },

    lookOn: async (server, name) => {
      const labels = await labelsOn(server, name);
      const held = await virshOn(server, ['domstate', name]);
      if (held.code !== 0) return undefined;
      const status = held.stdout.trim();
      return { name, status, state: stateOf(status), ...(labels === undefined ? {} : { labels }) };
    },

    addressOn: async (server, name) => {
      const said = await virshOn(server, ['domifaddr', name]);
      const address = said.code === 0 ? addressFrom(said.stdout) : undefined;
      return { ...(address === undefined ? {} : { address }), said: said.code === 0 ? 'no address yet' : lastLine(said.stderr) };
    },

    jumpOf: (server) => {
      const box = boxes.get(server);
      return box === undefined ? undefined : hostPortOf(box);
    },

    // An overlay on the template, a VM booted on it, then its labels; a VM whose labels are not written is removed.
    make: async (server, made) => {
      const volume = `${made.name}.qcow2`;
      await overlay(server, volume, made.template);
      await installed(server, made.name, volume, userDataOf(made.user, made.key), made.cpus, made.memory);
      try {
        await mustOn(server, ['metadata', made.name, METADATA_NS, '--key', METADATA_KEY, '--set', metadataOf(made.labels), '--live', '--config']);
      }
      catch (error) {
        await destroy(server, made.name).catch(() => undefined);
        throw error;
      }
    },

    start: async (server, name) => { await mustOn(server, ['start', name]); },
    shutdown: async (server, name) => { await mustOn(server, ['shutdown', name]); },
    cut: async (server, name) => { await mustOn(server, ['destroy', name]); },
    reboot: async (server, name) => { await mustOn(server, ['reboot', name]); },
    suspend: async (server, name) => { await mustOn(server, ['suspend', name]); },
    resume: async (server, name) => { await mustOn(server, ['resume', name]); },
    destroy,

    templates: async (server) => volumesFrom(await mustOn(server, ['vol-list', options.pool])),

    helper: async (server, name, helper) => {
      await overlay(server, name, helper.image);
      await installed(server, name, name, userDataOf(helper.user, helper.key, helper.packages), DEFAULT_CPUS, DEFAULT_MEMORY_MIB);
    },

    // The domain goes and its disk stays: `undefine` without `--remove-all-storage`.
    keep: async (server, name) => { await mustOn(server, ['undefine', name, '--nvram']); },

    drop: async (server, name) => {
      await virshOn(server, ['destroy', name]);
      await virshOn(server, ['undefine', name, '--remove-all-storage', '--nvram']);
      await virshOn(server, ['vol-delete', name, '--pool', options.pool]);
    },
  };

  return vmRuntime(maker, options);
};
