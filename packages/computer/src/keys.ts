/**
 * The key pair this host reaches the machines it makes with.
 *
 * A virtual machine this host makes is given the public half by cloud-init and
 * reached over `ssh` with the private half. One pair serves every such machine,
 * kept in the daemon's configuration folder beside a known-hosts file of its
 * own: a machine's host key is new every time one is made, and it is accepted
 * into that file rather than the person's.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** The folder, in the daemon's configuration folder, that holds the pair. */
export const KEY_DIR = 'computer-ssh';

/** The private half's file name; the public half is the same with `.pub`. */
const KEY_FILE = 'id_ed25519';

/** The known-hosts file of the machines this host makes. */
const KNOWN_HOSTS = 'known_hosts';

/** One run of `ssh-keygen` with these arguments, which fails with its last line. */
export type Keygen = (args: string[]) => Promise<void>;

/** The paths of the pair and of the known-hosts file beside it. */
export interface MachineKey {
  private: string;
  public: string;
  knownHosts: string;
}

/** A `Keygen` that runs `command` with `before` ahead of the arguments. */
export const keygenWith = (command: string, before: string[] = []): Keygen => (args) => new Promise((resolve, reject) => {
  const child = spawn(command, [...before, ...args], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '';
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk: string) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`ssh-keygen ${args[0] ?? ''} exited ${code ?? 'on a signal'}: ${stderr.trim().split('\n').at(-1) ?? ''}`));
  });
});

/** The real `ssh-keygen`. */
export const runKeygen: Keygen = keygenWith('ssh-keygen');

/** The paths under one configuration folder. */
const pathsOf = (configDir: string): MachineKey => {
  const dir = join(configDir, KEY_DIR);
  return { private: join(dir, KEY_FILE), public: join(dir, `${KEY_FILE}.pub`), knownHosts: join(dir, KNOWN_HOSTS) };
};

/**
 * The pair being made, by configuration folder.
 *
 * `ssh-keygen` asks before it writes over a file, and with no terminal that
 * question is a failure: two machines made at once share the one run.
 */
const making = new Map<string, Promise<MachineKey>>();

/** The pair under `configDir`, made with `keygen` the first time it is asked for. */
export const machineKey = (configDir: string, keygen: Keygen = runKeygen): Promise<MachineKey> => {
  const paths = pathsOf(configDir);
  if (existsSync(paths.private) && existsSync(paths.public)) return Promise.resolve(paths);
  const held = making.get(configDir);
  if (held !== undefined) return held;
  const made = (async () => {
    mkdirSync(join(configDir, KEY_DIR), { recursive: true, mode: 0o700 });
    await keygen(['-q', '-t', 'ed25519', '-N', '', '-C', 'ahpd-computer', '-f', paths.private]);
    return paths;
  })().finally(() => making.delete(configDir));
  making.set(configDir, made);
  return made;
};

/**
 * Removes `address` from the known-hosts file, so the next machine given that address is reached.
 *
 * DHCP gives a removed machine's address to the next one, whose host key is
 * new, and `accept-new` refuses a key that changed. A file that does not exist
 * yet holds no address.
 */
export const forgetHost = async (configDir: string, address: string, keygen: Keygen = runKeygen): Promise<void> => {
  const { knownHosts } = pathsOf(configDir);
  if (!existsSync(knownHosts)) return;
  await keygen(['-R', address, '-f', knownHosts]);
};
