/*
 * The record a host inside a machine is handed.
 *
 * A record agent's session in a machine is served by a host started there with
 * the plugin of the record's engine, and the record in `AHPD_AGENT_RECORD`. The
 * cases run that host over stdio: it serves the record under its id, writes
 * nothing of it to disk, and refuses a record of an engine it did not load.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

const ROOT = 'ahp-root://';
const REPO = join(import.meta.dirname, '../../..');
const MAIN = 'packages/server/src/main.ts';
const KEY = 'handed-record-key';

type Bag = Record<string, any>;

let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'ahpd-agent-handed-')); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

/** A stdio host with the engine fixture, handed `record`, closed once it answers `initialize`. */
const host = (record: Bag): Promise<{ frames: Bag[]; said: string }> => {
  mkdirSync(join(home, 'ahpd'), { recursive: true });
  const config = join(home, 'config.json');
  writeFileSync(config, JSON.stringify({ plugins: ['./packages/server/test/fixtures/plugin-engine'] }));
  const child = spawn(process.execPath, [MAIN, '--stdio', '--config-file', config, '--no-update-check'], {
    cwd: REPO,
    env: {
      ...process.env,
      XDG_CONFIG_HOME: home,
      XDG_DATA_HOME: join(home, 'data'),
      XDG_STATE_HOME: join(home, 'state'),
      CI: '1',
      NODE_OPTIONS: '--conditions development --import ./scripts/dev.mjs',
      AHPD_AGENT_RECORD: JSON.stringify(record),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const frames: Bag[] = [];
  let held = '';
  let said = '';
  child.stderr.on('data', (chunk: Buffer) => { said += String(chunk); });
  child.stdout.on('data', (chunk: Buffer) => {
    held += String(chunk);
    let at = held.indexOf('\n');
    while (at !== -1) {
      const line = held.slice(0, at).trim();
      held = held.slice(at + 1);
      if (line.startsWith('{')) frames.push(JSON.parse(line) as Bag);
      at = held.indexOf('\n');
    }
    if (frames.some((frame) => frame.id === 1)) setTimeout(() => { child.stdin.end(); }, 200);
  });
  child.stdin.write(`${JSON.stringify({ id: 1, method: 'initialize', params: { clientId: 'probe', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] } })}\n`);
  return new Promise((done) => {
    const give = setTimeout(() => { child.stdin.end(); }, 15000);
    child.on('exit', () => { clearTimeout(give); done({ frames, said }); });
  });
};

/** The ids of the agents the root snapshot lists. */
const listed = (frames: Bag[]): string[] => {
  const snapshots = (frames.find((frame) => frame.id === 1)?.result?.snapshots ?? []) as Bag[];
  const root = snapshots.find((one) => one.resource === ROOT)?.state as Bag | undefined;
  return ((root?.agents ?? []) as Bag[]).map((one) => String(one.provider));
};

/** Every file under `dir`, read as text. */
const written = (dir: string): string[] => readdirSync(dir, { recursive: true })
  .map((one) => join(dir, String(one)))
  .filter((one) => statSync(one).isFile())
  .map((one) => readFileSync(one, 'utf8'));

it('serves the handed record under its id, and writes none of it to disk', async () => {
  const { frames } = await host({ id: 'handed', engine: 'echoed', owner: 'host', name: 'Handed', config: { apiKey: KEY } });
  expect(listed(frames)).toContain('handed');
  expect(written(home).filter((one) => one.includes(KEY) || one.includes('"handed"'))).toEqual([]);
}, 60000);

it('refuses a record of an engine no loaded plugin registers, naming the engine', async () => {
  const { frames, said } = await host({ id: 'stray', engine: 'nowhere', name: 'Stray', config: {} });
  expect(listed(frames)).not.toContain('stray');
  expect(said).toContain('AHPD_AGENT_RECORD holds stray, of the nowhere engine, which no plugin this host loaded registers');
}, 60000);
