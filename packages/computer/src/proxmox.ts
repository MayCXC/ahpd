/**
 * Virtual machines, made by Proxmox VE through its API.
 *
 * A profile with `runtime: "proxmox"` makes each of its machines on the
 * option's node, as a linked clone of a template VM there: the clone is given
 * cloud-init's login with this host's key, the `ahpd` tag and its labels as
 * JSON in its notes, and is reached as an ssh machine at the address its guest
 * agent reports. A profile that names a `server` reaches its VMs through that
 * box, for a node whose VM network this host has no route to.
 *
 * Every call is one `request` on `node:https`, which takes the `ca` a node's
 * own certificate needs. The API token's secret is read when a call needs it
 * and is never written into a log line or an error.
 */

import { request as httpsRequest } from 'node:https';
import type { ComputerRuntime, MachineSpec } from './runtime.js';
import type { SshReach } from './ssh.js';
import { hostPortOf, lastLine, pause, vmRuntime } from './vm.js';
import type { VmMaker, VmOptions, VmProfile, VmRow } from './vm.js';

/** The tag every VM this provider made carries, which a listing filters by. */
export const PROXMOX_TAG = 'ahpd';

/** How long one API call is given, and one task it starts. */
const REQUEST_MS = 60_000;
const TASK_MS = 5 * 60_000;

/** A Proxmox VM's name is a DNS name, which has no `_`. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

/** What this runtime was configured with. */
export interface ProxmoxOptions extends VmOptions {
  /** The API's address, `https://<node>:8006`. */
  url: string;
  /** The API token's id, `<user>@<realm>!<name>`. */
  tokenId: string;
  /** The API token's secret, read when a call needs it. */
  secret: () => Promise<string>;
  /** The node every VM is made on. */
  node: string;
  /** The storage a template's helper is copied onto. */
  storage: string;
  /** The bridge a VM's network card is on. */
  bridge: string;
  /** The template VM every VM is a linked clone of, by name, in place of one built here. */
  template?: string;
  /** The cloud-init template VM a template is built from, by name. */
  image?: string;
  /** The certificate the node's own is checked against, as PEM. */
  ca?: string;
}

/** One row of `GET /cluster/resources?type=vm`. */
interface Resource {
  vmid: number;
  name?: string;
  node: string;
  status?: string;
  template?: number;
  tags?: string;
}

/** One answer of `GET .../status/current`. */
interface Current {
  status?: string;
  qmpstatus?: string;
}

/** A VM's status in Proxmox's words, as a computer's `state` reads it. */
const stateOf = (current: Current): VmRow['state'] => {
  if (current.status !== 'running') return 'stopped';
  return current.qmpstatus === 'paused' ? 'suspended' : 'running';
};

/** The labels a VM's notes hold, or nothing when its notes are not ours. */
export const labelsOfNotes = (notes: unknown): Record<string, string> | undefined => {
  if (typeof notes !== 'string') return undefined;
  try {
    const held: unknown = JSON.parse(notes);
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return undefined;
    return Object.fromEntries(Object.entries(held).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  }
  catch {
    return undefined;
  }
};

/** The first IPv4 address the guest agent reports that is not the loopback. */
export const agentAddressOf = (said: unknown): string | undefined => {
  const result = (said as { result?: unknown } | undefined)?.result;
  if (!Array.isArray(result)) return undefined;
  for (const card of result as { name?: string; 'ip-addresses'?: { 'ip-address-type'?: string; 'ip-address'?: string }[] }[]) {
    for (const one of card['ip-addresses'] ?? []) {
      const address = one['ip-address'];
      if (one['ip-address-type'] === 'ipv4' && address !== undefined && !address.startsWith('127.')) return address;
    }
  }
  return undefined;
};

/** A body as Proxmox reads one, a form; numbers and text alike. */
const formOf = (body: Record<string, string | number>): string =>
  new URLSearchParams(Object.entries(body).map(([key, value]): [string, string] => [key, String(value)])).toString();

/**
 * Virtual machines, on one Proxmox node.
 */
export const proxmoxRuntime = (options: ProxmoxOptions): ComputerRuntime => {
  const base = new URL(options.url);
  const node = options.node;
  const every = options.waits?.every ?? 2_000;

  /**
   * One API call, answered with its `data`.
   *
   * What a refusal says is the status and Proxmox's own reason, which never
   * holds the secret: the secret is only ever in the request's header.
   */
  const request = async (method: string, path: string, body?: Record<string, string | number>): Promise<unknown> => {
    const secret = await options.secret();
    const sent = body === undefined ? undefined : formOf(body);
    return new Promise((resolve, reject) => {
      const asked = httpsRequest({
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port === '' ? 8006 : Number(base.port),
        path: `/api2/json${path}`,
        method,
        headers: {
          authorization: `PVEAPIToken=${options.tokenId}=${secret}`,
          ...(sent === undefined ? {} : { 'content-type': 'application/x-www-form-urlencoded', 'content-length': Buffer.byteLength(sent) }),
        },
        ...(options.ca === undefined ? {} : { ca: options.ca }),
        timeout: REQUEST_MS,
      }, (response) => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { text += chunk; });
        response.on('end', () => {
          const code = response.statusCode ?? 0;
          if (code === 401) {
            reject(new Error(`Proxmox at ${base.host} refused the API token ${options.tokenId}: ${response.statusMessage ?? '401'}`));
            return;
          }
          let held: { data?: unknown; errors?: Record<string, string> } = {};
          try {
            held = text === '' ? {} : JSON.parse(text) as typeof held;
          }
          catch {
            // A body that is not JSON is said by the status line alone.
          }
          if (code >= 400) {
            const errors = held.errors === undefined ? '' : ` (${Object.entries(held.errors).map(([key, why]) => `${key}: ${lastLine(why)}`).join('; ')})`;
            reject(new Error(`Proxmox ${method} ${path} answered ${String(code)}: ${response.statusMessage ?? ''}${errors}`));
            return;
          }
          resolve(held.data);
        });
      });
      asked.on('timeout', () => { asked.destroy(new Error(`Proxmox ${method} ${path} did not answer within ${String(REQUEST_MS / 1000)} s`)); });
      asked.on('error', reject);
      asked.end(sent);
    });
  };

  /** Wait for a task one call started, and throw what it ended with when that is not `OK`. */
  const finished = async (upid: unknown, what: string): Promise<void> => {
    if (typeof upid !== 'string' || upid === '') return;
    const until = Date.now() + TASK_MS;
    for (;;) {
      const status = await request('GET', `/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`) as { status?: string; exitstatus?: string };
      if (status.status === 'stopped') {
        if (status.exitstatus !== 'OK') throw new Error(`${what} on ${node} ended with ${status.exitstatus ?? 'no status'}`);
        return;
      }
      if (Date.now() >= until) throw new Error(`${what} on ${node} did not end within ${String(TASK_MS / 1000)} s`);
      await pause(every);
    }
  };

  /** Every VM on the node, templates among them. */
  const resources = async (): Promise<Resource[]> =>
    ((await request('GET', '/cluster/resources?type=vm')) as Resource[] ?? []).filter((one) => one.node === node);

  /** The VM called `name`, or the template called it when `template` says so. */
  const vmidOf = async (name: string, template = false): Promise<number | undefined> =>
    (await resources()).find((one) => one.name === name && (one.template === 1) === template)?.vmid;

  const vmidOrFail = async (name: string, template = false): Promise<number> => {
    const vmid = await vmidOf(name, template);
    if (vmid === undefined) throw new Error(`there is no ${template ? 'template' : 'VM'} called ${name} on ${node}`);
    return vmid;
  };

  /** One VM's row: its notes for its labels, and its status. */
  const rowOf = async (name: string, vmid: number): Promise<VmRow> => {
    const [config, current] = await Promise.all([
      request('GET', `/nodes/${node}/qemu/${String(vmid)}/config`) as Promise<{ description?: string }>,
      request('GET', `/nodes/${node}/qemu/${String(vmid)}/status/current`) as Promise<Current>,
    ]);
    const labels = labelsOfNotes(config.description);
    return { name, status: current.qmpstatus ?? current.status ?? 'unknown', state: stateOf(current), ...(labels === undefined ? {} : { labels }) };
  };

  /** A VM's status verb, `start` or `suspend`, waited for. */
  const status = async (name: string, verb: string): Promise<void> => {
    const vmid = await vmidOrFail(name);
    await finished(await request('POST', `/nodes/${node}/qemu/${String(vmid)}/status/${verb}`), `${verb} ${name}`);
  };

  /**
   * A clone of the template `from`, given cloud-init's login, then started.
   * Two clones asked for at once may be given the same next id, so a clone
   * refused for an id already taken asks for the next one again.
   */
  const cloned = async (from: number, name: string, full: boolean, config: Record<string, string | number>): Promise<void> => {
    let vmid = 0;
    for (let tries = 0; ; tries += 1) {
      vmid = Number(await request('GET', '/cluster/nextid'));
      try {
        await finished(await request('POST', `/nodes/${node}/qemu/${String(from)}/clone`, {
          newid: vmid,
          name,
          full: full ? 1 : 0,
          ...(full ? { storage: options.storage } : {}),
        }), `clone ${name}`);
        break;
      }
      catch (error) {
        if (tries >= 2 || !/already exists/.test(error instanceof Error ? error.message : String(error))) throw error;
      }
    }
    try {
      await request('PUT', `/nodes/${node}/qemu/${String(vmid)}/config`, { agent: 1, 'ipconfig0': 'ip=dhcp', net0: `virtio,bridge=${options.bridge}`, ...config });
      await finished(await request('POST', `/nodes/${node}/qemu/${String(vmid)}/status/start`), `start ${name}`);
    }
    catch (error) {
      await destroy(name).catch(() => undefined);
      throw error;
    }
  };

  /** cloud-init's login: Proxmox reads `sshkeys` URL-encoded inside the form. */
  const loginOf = (user: string, key: string): Record<string, string> => ({
    ciuser: user,
    sshkeys: encodeURIComponent(key.trim()),
  });

  /** One VM stopped, then removed with every disk it holds; its template stays. */
  const destroy = async (name: string): Promise<void> => {
    const vmid = await vmidOf(name);
    if (vmid === undefined) return;
    const current = await request('GET', `/nodes/${node}/qemu/${String(vmid)}/status/current`) as Current;
    if (current.status !== 'stopped') await finished(await request('POST', `/nodes/${node}/qemu/${String(vmid)}/status/stop`), `stop ${name}`);
    await finished(await request('DELETE', `/nodes/${node}/qemu/${String(vmid)}?purge=1&destroy-unreferenced-disks=1`), `remove ${name}`);
  };

  const maker: VmMaker = {
    kind: 'proxmox',
    servers: [node],

    listOn: async () => {
      const tagged = (await resources()).filter((one) => one.template !== 1 && one.name !== undefined
        && (one.tags ?? '').split(/[;, ]/).includes(PROXMOX_TAG));
      return Promise.all(tagged.map((one) => rowOf(one.name as string, one.vmid)));
    },

    lookOn: async (_server, name) => {
      const vmid = await vmidOf(name);
      return vmid === undefined ? undefined : rowOf(name, vmid);
    },

    addressOn: async (_server, name) => {
      try {
        const vmid = await vmidOrFail(name);
        const address = agentAddressOf(await request('GET', `/nodes/${node}/qemu/${String(vmid)}/agent/network-get-interfaces`));
        return { ...(address === undefined ? {} : { address }), said: 'no address yet' };
      }
      catch (error) {
        return { said: error instanceof Error ? error.message : String(error) };
      }
    },

    jumpOf: (_server, profile?: VmProfile) => (profile?.box === undefined ? undefined : hostPortOf(profile.box)),

    make: async (_server, made) => {
      await cloned(await vmidOrFail(made.template, true), made.name, false, {
        ...loginOf(made.user, made.key),
        tags: PROXMOX_TAG,
        description: JSON.stringify(made.labels),
        cores: made.cpus,
        memory: made.memory,
      });
    },

    start: async (_server, name) => { await status(name, 'start'); },
    // The shutdown task waits for the guest; the runtime waits for the VM's state instead.
    shutdown: async (_server, name) => {
      const vmid = await vmidOrFail(name);
      await request('POST', `/nodes/${node}/qemu/${String(vmid)}/status/shutdown`);
    },
    cut: async (_server, name) => { await status(name, 'stop'); },
    reboot: async (_server, name) => { await status(name, 'reboot'); },
    suspend: async (_server, name) => { await status(name, 'suspend'); },
    resume: async (_server, name) => { await status(name, 'resume'); },
    destroy: async (_server, name) => { await destroy(name); },

    templates: async () => (await resources()).filter((one) => one.template === 1 && one.name !== undefined).map((one) => one.name as string),

    // A full copy, since the helper becomes a template of its own.
    helper: async (_server, name, helper) => {
      await cloned(await vmidOrFail(helper.image, true), name, true, loginOf(helper.user, helper.key));
    },

    // Proxmox's own cloud-init takes no package list, so the helper installs them over ssh.
    install: async (reach: SshReach, packages) => {
      for (const command of [
        ['sudo', 'apt-get', 'update', '-q'],
        ['sudo', 'env', 'DEBIAN_FRONTEND=noninteractive', 'apt-get', 'install', '-y', '-q', ...packages],
      ]) {
        const held = await reach.ran(command);
        if (held.code !== 0) throw new Error(`${command.slice(1, 4).join(' ')} exited ${String(held.code)}: ${lastLine(held.stderr) || lastLine(held.stdout)}`);
      }
    },

    keep: async (_server, name) => {
      const vmid = await vmidOrFail(name);
      await finished(await request('POST', `/nodes/${node}/qemu/${String(vmid)}/template`), `template ${name}`);
    },

    drop: async (_server, name) => { await destroy(name); },

    refusal: (spec: MachineSpec) => (NAME.test(spec.name) ? undefined : `${spec.name} is not a name a Proxmox VM can have: letters, digits and - only`),
  };

  return vmRuntime(maker, options);
};
