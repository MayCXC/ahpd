#!/usr/bin/env node
/**
 * A scripted `ssh-keygen`, for the computer: plugin's tests.
 *
 * `-f <file>` with `-t` writes a fixed pair at `<file>` and `<file>.pub`.
 * `-R <host> -f <file>` drops the lines of `<file>` whose first field names
 * `<host>`, as the real one does for an unhashed file. Every call is appended
 * to the file `SSH_KEYGEN_FAKE_LOG` names, when it is set.
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
if (process.env.SSH_KEYGEN_FAKE_LOG) appendFileSync(process.env.SSH_KEYGEN_FAKE_LOG, `${JSON.stringify(args)}\n`);

const after = (flag) => {
  const at = args.indexOf(flag);
  return at === -1 ? undefined : args[at + 1];
};

const file = after('-f');
if (file === undefined) {
  process.stderr.write('ssh-keygen: no -f\n');
  process.exit(1);
}

const removed = after('-R');
if (removed !== undefined) {
  const kept = readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line !== '' && !line.split(' ')[0].split(',').includes(removed));
  writeFileSync(file, kept.map((line) => `${line}\n`).join(''));
  process.exit(0);
}

writeFileSync(file, '-----BEGIN OPENSSH PRIVATE KEY-----\nfixture\n-----END OPENSSH PRIVATE KEY-----\n', { mode: 0o600 });
writeFileSync(`${file}.pub`, 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFixture ahpd-computer\n');
