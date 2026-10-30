#!/usr/bin/env node
/**
 * A scripted `virsh` and `virt-install`, for the computer: plugin's tests.
 *
 * The first argument says which program it is: `virsh` or `virt-install`.
 * Both answer from one JSON file named by `VIRSH_FAKE_STATE`, which holds the
 * box's volumes and its domains, and append every call to the file
 * `VIRSH_FAKE_LOG` names. A domain is made running by `virt-install`, keeps
 * the user-data it was booted with, and is given an address by `domifaddr`
 * after `VIRSH_FAKE_ADDRESS_AFTER` asks: none when that is `never`.
 *
 * `VIRSH_FAKE_FAIL` names one verb that fails, as `virt-install`, `metadata`
 * or any other. `VIRSH_FAKE_SHUTDOWN=ignore` is a guest that never hears a
 * `shutdown`. Nothing here boots anything: the runtime is what is under
 * test, and the VM it reaches is this host through the scripted `ssh`.
 */

import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

const [as, ...args] = process.argv.slice(2);
const state = process.env.VIRSH_FAKE_STATE;
if (state === undefined) {
  process.stderr.write('VIRSH_FAKE_STATE is not set\n');
  process.exit(2);
}
// A listing asks every domain's metadata at once, so calls are appended, never rewritten.
if (process.env.VIRSH_FAKE_LOG) appendFileSync(process.env.VIRSH_FAKE_LOG, `${JSON.stringify([as, ...args])}\n`);

const held = existsSync(state) ? JSON.parse(readFileSync(state, 'utf8')) : { volumes: [], domains: {} };
/** Written beside the state and renamed over it, so a reader never sees half a file. */
const keep = () => {
  const scratch = `${state}.${process.pid}.tmp`;
  writeFileSync(scratch, JSON.stringify(held));
  renameSync(scratch, state);
};
const fail = (said, code = 1) => {
  process.stderr.write(`error: ${said}\n`);
  process.exit(code);
};
const after = (flag) => {
  const at = args.indexOf(flag);
  return at === -1 ? undefined : args[at + 1];
};
const domainOf = (name) => held.domains[name] ?? fail(`failed to get domain '${name}'`);

if (as === 'virt-install') {
  if (process.env.VIRSH_FAKE_FAIL === 'virt-install') fail('Unable to connect to libvirt');
  const name = after('--name');
  const disk = /^vol=([^/]+)\/([^,]+)/.exec(after('--disk') ?? '');
  if (name === undefined || disk === null) fail('--name and --disk vol= are needed');
  if (!held.volumes.includes(disk[2])) fail(`Storage volume not found: ${disk[2]}`);
  if (held.domains[name] !== undefined) fail(`domain '${name}' already exists`);
  const seed = Object.fromEntries((after('--cloud-init') ?? '').split(',').map((one) => one.split('=')));
  held.domains[name] = {
    state: 'running',
    volume: disk[2],
    userData: seed['user-data'] === undefined ? undefined : readFileSync(seed['user-data'], 'utf8'),
    metaData: seed['meta-data'] === undefined ? undefined : readFileSync(seed['meta-data'], 'utf8'),
    asks: 0,
    vcpus: after('--vcpus'),
    memory: after('--memory'),
  };
  keep();
  process.exit(0);
}

// `-c <uri>` comes first, then the verb.
const verb = args[0] === '-c' ? args[2] : args[0];
const rest = args[0] === '-c' ? args.slice(3) : args.slice(1);
if (process.env.VIRSH_FAKE_FAIL === verb) fail(`${verb} failed`);

switch (verb) {
  case 'list': {
    const rows = Object.entries(held.domains).map(([name, one], at) =>
      ` ${one.state === 'running' ? String(at + 1) : '-'}    ${name}    ${one.state}`);
    process.stdout.write([' Id   Name   State', '-'.repeat(30), ...rows, ''].join('\n'));
    break;
  }
  case 'metadata': {
    const one = domainOf(rest[0]);
    const set = after('--set');
    if (set !== undefined) {
      one.metadata = set;
      keep();
    }
    else if (one.metadata === undefined) fail('metadata not found: Requested metadata element is not present');
    else process.stdout.write(`${one.metadata}\n`);
    break;
  }
  case 'domstate':
    process.stdout.write(`${domainOf(rest[0]).state}\n\n`);
    break;
  case 'domifaddr': {
    const one = domainOf(rest[0]);
    one.asks += 1;
    keep();
    const wanted = process.env.VIRSH_FAKE_ADDRESS_AFTER ?? '0';
    process.stdout.write(' Name       MAC address          Protocol     Address\n');
    process.stdout.write('-'.repeat(64));
    process.stdout.write('\n');
    if (one.state === 'running' && wanted !== 'never' && one.asks > Number(wanted)) {
      process.stdout.write(` vnet0      52:54:00:12:34:56    ipv4         ${process.env.VIRSH_FAKE_ADDRESS ?? '192.168.122.10'}/24\n`);
    }
    break;
  }
  case 'start':
  case 'reboot':
    domainOf(rest[0]).state = 'running';
    keep();
    break;
  case 'shutdown': {
    const one = domainOf(rest[0]);
    if (one.state !== 'running') fail('Requested operation is not valid: domain is not running');
    if (process.env.VIRSH_FAKE_SHUTDOWN !== 'ignore') one.state = 'shut off';
    keep();
    break;
  }
  case 'suspend': {
    const one = domainOf(rest[0]);
    if (one.state !== 'running') fail('Requested operation is not valid: domain is not running');
    one.state = 'paused';
    keep();
    break;
  }
  case 'resume': {
    const one = domainOf(rest[0]);
    if (one.state !== 'paused') fail('Requested operation is not valid: domain is not paused');
    one.state = 'running';
    keep();
    break;
  }
  case 'destroy': {
    const one = domainOf(rest[0]);
    if (one.state === 'shut off') fail('Requested operation is not valid: domain is not running');
    one.state = 'shut off';
    keep();
    break;
  }
  case 'undefine': {
    const one = domainOf(rest[0]);
    if (rest.includes('--remove-all-storage')) held.volumes = held.volumes.filter((volume) => volume !== one.volume);
    delete held.domains[rest[0]];
    keep();
    break;
  }
  case 'vol-create-as': {
    const [, volume] = rest;
    const backing = after('--backing-vol');
    if (backing !== undefined && !held.volumes.includes(backing)) fail(`Storage volume not found: no storage vol with matching name '${backing}'`);
    if (held.volumes.includes(volume)) fail(`storage volume name '${volume}' already in use`);
    held.volumes.push(volume);
    keep();
    break;
  }
  case 'vol-delete':
    held.volumes = held.volumes.filter((volume) => volume !== rest[0]);
    keep();
    break;
  default:
    fail(`unknown command: '${verb}'`);
}
