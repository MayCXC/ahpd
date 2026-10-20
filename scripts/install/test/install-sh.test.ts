/*
 * install.sh, run the way a person gets it.
 *
 * Every case makes a home folder of its own and puts stub `node`, `npm`, `bun`
 * and `ahpd` commands on the PATH. The stubs write what they were called with
 * to a log, so a case can read which command the script chose: an install is a
 * line in that log, not a real package download. The script is sourced with
 * AHPD_INSTALL_NO_RUN=1 and its `main` is called with the flags, so the flags
 * and every step are the same ones a person runs.
 */
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { posix } from '../../../tools/posix';

const script = fileURLToPath(new URL('../install.sh', import.meta.url));
const MARKER = '# added by the ahpd install script';

interface Box {
  root: string;
  home: string;
  bin: string;
  prefix: string;
  log: string;
  env: Record<string, string>;
}

interface Result {
  code: number | null;
  stdout: string;
  stderr: string;
}

function stub(box: Box, name: string, body: string): void {
  const path = join(box.bin, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  chmodSync(path, 0o755);
}

function writeNode(box: Box, version: string): void {
  stub(box, 'node', `printf 'node %s\\n' "$*" >> "$AHPD_TEST_LOG"\nprintf 'v${version}\\n'`);
}

function writeNpm(box: Box): void {
  stub(
    box,
    'npm',
    [
      `printf 'npm %s\\n' "$*" >> "$AHPD_TEST_LOG"`,
      'case "$*" in',
      '  --version) printf \'%s\\n\' "$STUB_NPM_VERSION" ;;',
      '  "prefix -g") printf \'%s\\n\' "$STUB_NPM_PREFIX" ;;',
      '  "config get prefix") printf \'%s\\n\' "$STUB_NPM_PREFIX" ;;',
      '  *) exit 0 ;;',
      'esac',
    ].join('\n'),
  );
}

function writeBun(box: Box): void {
  stub(
    box,
    'bun',
    [
      `printf 'bun %s\\n' "$*" >> "$AHPD_TEST_LOG"`,
      'case "$*" in',
      '  --version) printf \'1.3.0\\n\' ;;',
      '  *) exit 0 ;;',
      'esac',
    ].join('\n'),
  );
}

/*
 * `status --json` exits 0 only while the stub daemon runs, which is what the
 * uninstall reads to decide whether to stop it; a running daemon's record also
 * carries `service`, which is what it reads to decide whether to remove one.
 */
function writeAhpd(box: Box): void {
  stub(
    box,
    'ahpd',
    [
      `printf 'ahpd %s\\n' "$*" >> "$AHPD_TEST_LOG"`,
      'case "$*" in',
      '  "status --json")',
      '    if [ "${STUB_AHPD_RUNNING:-0}" = 1 ]; then',
      '      printf \'{"pid":1,"url":"ws://127.0.0.1:1","paths":[],"service":"systemd"}\\n\'',
      '      exit 0',
      '    fi',
      '    printf \'{"running":false}\\n\'',
      '    exit 1',
      '    ;;',
      '  *) exit 0 ;;',
      'esac',
    ].join('\n'),
  );
}

function makeBox(options: { node?: string; ahpd?: boolean } = {}): Box {
  const root = mkdtempSync(join(tmpdir(), 'ahpd-install-'));
  const home = join(root, 'home');
  const bin = join(root, 'bin');
  const prefix = join(root, 'prefix');
  mkdirSync(home, { recursive: true });
  mkdirSync(bin, { recursive: true });
  mkdirSync(join(prefix, 'bin'), { recursive: true });
  const log = join(root, 'calls.log');
  writeFileSync(log, '');

  const box: Box = {
    root,
    home,
    bin,
    prefix,
    log,
    env: {
      HOME: home,
      USERPROFILE: home,
      SHELL: '/bin/bash',
      PATH: `${bin}:/usr/bin:/bin`,
      AHPD_TEST_LOG: log,
      NVM_DIR: join(home, '.nvm'),
      XDG_CONFIG_HOME: '',
      AHPD_INSTALL_NO_RUN: '1',
      AHPD_VERSION: '',
      AHPD_PACKAGE: '',
      AHPD_RUNTIME: '',
      AHPD_NO_ONBOARD: '',
      AHPD_DRY_RUN: '',
      AHPD_VERBOSE: '',
      AHPD_HELP: '',
      AHPD_UNINSTALL: '',
      AHPD_PURGE: '',
      STUB_NODE_VERSION: options.node ?? '22.1.0',
      STUB_NPM_VERSION: '11.16.0',
      STUB_NPM_PREFIX: prefix,
      STUB_AHPD_RUNNING: '0',
    },
  };

  writeNode(box, options.node ?? '22.1.0');
  writeNpm(box);
  writeBun(box);
  if (options.ahpd === true) {
    writeAhpd(box);
  }
  return box;
}

function run(box: Box, args: string[], extra: Record<string, string> = {}): Promise<Result> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', 'source "$1"; shift; main "$@"', 'ahpd-install', script, ...args], {
      env: { ...process.env, ...box.env, ...extra },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function calls(box: Box): string[] {
  return readFileSync(box.log, 'utf8')
    .split('\n')
    .filter((line) => line !== '');
}

function rcFile(box: Box): string {
  return join(box.home, '.bashrc');
}

function rcLines(box: Box): string[] {
  if (!existsSync(rcFile(box))) {
    return [];
  }
  return readFileSync(rcFile(box), 'utf8').split('\n');
}

function exportsIn(box: Box): string[] {
  return rcLines(box).filter((line) => line.startsWith('export PATH='));
}

function configDir(box: Box): string {
  return join(box.home, '.config', 'ahpd');
}

describe.skipIf(!posix)('install.sh', () => {
  it('installs the package into the writable npm prefix and adds the PATH line once', async () => {
    const box = makeBox();
    const result = await run(box, ['--no-onboard']);

    expect(result.code).toBe(0);
    expect(calls(box)).toContain('npm install -g --no-fund --no-audit --allow-scripts=node-pty @ahpd/server');
    expect(exportsIn(box)).toEqual([`export PATH="${box.prefix}/bin:$PATH"`]);
    expect(rcLines(box).filter((line) => line === MARKER)).toHaveLength(1);
    expect(result.stdout).toContain('Next: ahpd service install');
  });

  it('reads the package, version and flags from the AHPD_* variables', async () => {
    const box = makeBox();
    const result = await run(box, [], {
      AHPD_VERSION: '0.12.0',
      AHPD_NO_ONBOARD: '1',
    });

    expect(result.code).toBe(0);
    expect(calls(box)).toContain('npm install -g --no-fund --no-audit --allow-scripts=node-pty @ahpd/server@0.12.0');
  });

  it('upgrades an existing install without a second PATH line', async () => {
    const box = makeBox();
    await run(box, ['--no-onboard']);
    writeAhpd(box);

    const result = await run(box, ['--no-onboard']);

    expect(result.code).toBe(0);
    expect(calls(box)).toContain('ahpd plugin update all');
    expect(result.stdout).toContain('ahpd restart');
    expect(exportsIn(box)).toHaveLength(1);
    expect(rcLines(box).filter((line) => line === MARKER)).toHaveLength(1);
  });

  it('exits 2 for an unknown flag and an unknown runtime', async () => {
    const unknownFlag = await run(makeBox(), ['--nope']);
    expect(unknownFlag.code).toBe(2);

    const unknownRuntime = await run(makeBox(), ['--runtime', 'deno']);
    expect(unknownRuntime.code).toBe(2);
  });

  it('stops without a terminal when Node is older than 22.1 and prints the nvm command', async () => {
    const box = makeBox({ node: '20.19.0' });
    const result = await run(box, ['--no-onboard']);

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('nvm install 22');
    expect(calls(box)).not.toContain('npm install -g --no-fund --no-audit --allow-scripts=node-pty @ahpd/server');
  });

  it('moves to ~/.npm-global when the global prefix is not writable', async () => {
    const box = makeBox();
    const readonly = join(box.root, 'readonly');
    mkdirSync(readonly);
    chmodSync(readonly, 0o555);

    const result = await run(box, ['--no-onboard'], { STUB_NPM_PREFIX: readonly });

    expect(result.code).toBe(0);
    expect(calls(box)).toContain(`npm config set prefix ${box.home}/.npm-global`);
    expect(exportsIn(box)).toEqual([`export PATH="${box.home}/.npm-global/bin:$PATH"`]);
  });

  it('passes --allow-scripts only from npm 11.16', async () => {
    const old = makeBox();
    await run(old, ['--no-onboard'], { STUB_NPM_VERSION: '11.15.0' });
    const oldInstall = calls(old).find((line) => line.startsWith('npm install '));
    expect(oldInstall).not.toContain('--allow-scripts');

    const fresh = makeBox();
    await run(fresh, ['--no-onboard'], { STUB_NPM_VERSION: '11.16.0' });
    const freshInstall = calls(fresh).find((line) => line.startsWith('npm install '));
    expect(freshInstall).toContain('--allow-scripts=node-pty');
  });

  it('changes no file under --dry-run', async () => {
    const box = makeBox();
    const result = await run(box, ['--dry-run', '--no-onboard']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('would run:');
    expect(existsSync(rcFile(box))).toBe(false);
    expect(calls(box).some((line) => line.includes(' install '))).toBe(false);
  });

  it('installs with bun and puts the Bun bin folder on the PATH', async () => {
    const box = makeBox();
    const bunHome = join(box.root, 'bun');
    mkdirSync(join(bunHome, 'bin'), { recursive: true });

    const result = await run(box, ['--runtime', 'bun', '--no-onboard'], { BUN_INSTALL: bunHome });

    expect(result.code).toBe(0);
    expect(calls(box)).toContain('bun add -g @ahpd/server');
    expect(exportsIn(box)).toEqual([`export PATH="${bunHome}/bin:$PATH"`]);
  });
});

describe.skipIf(!posix)('install.sh --uninstall', () => {
  it('removes the PATH line it wrote and leaves the npm prefix and npmrc alone', async () => {
    const box = makeBox();
    writeFileSync(rcFile(box), '# my own line\nexport FOO=bar\n');
    writeFileSync(join(box.home, '.npmrc'), 'prefix=/somewhere\n');
    await run(box, ['--no-onboard']);
    writeAhpd(box);

    const result = await run(box, ['--uninstall']);

    expect(result.code).toBe(0);
    expect(calls(box)).toContain('npm uninstall -g @ahpd/server');
    expect(exportsIn(box)).toEqual([]);
    expect(rcLines(box)).not.toContain(MARKER);
    expect(rcLines(box)).toContain('# my own line');
    expect(rcLines(box)).toContain('export FOO=bar');
    expect(readFileSync(join(box.home, '.npmrc'), 'utf8')).toBe('prefix=/somewhere\n');
  });

  it('keeps a linked rc file a link, with its mode, when it removes the PATH line', async () => {
    const box = makeBox();
    const target = join(box.home, 'dotfiles-bashrc');
    writeFileSync(target, '# my own line\n');
    chmodSync(target, 0o600);
    symlinkSync(target, rcFile(box));
    await run(box, ['--no-onboard']);
    writeAhpd(box);

    const result = await run(box, ['--uninstall']);

    expect(result.code).toBe(0);
    expect(lstatSync(rcFile(box)).isSymbolicLink()).toBe(true);
    expect(statSync(target).mode & 0o777).toBe(0o600);
    expect(readFileSync(target, 'utf8')).not.toContain(MARKER);
    expect(readFileSync(target, 'utf8')).toContain('# my own line');
  });

  it('removes the service, then stops the daemon, then the package', async () => {
    const box = makeBox({ ahpd: true });
    const service = join(configDir(box), '..', 'systemd', 'user', 'ahpd.service');
    mkdirSync(join(configDir(box), '..', 'systemd', 'user'), { recursive: true });
    writeFileSync(service, '[Unit]\n');
    const result = await run(box, ['--uninstall'], { STUB_AHPD_RUNNING: '1' });

    expect(result.code).toBe(0);
    const lines = calls(box);
    const removed = lines.indexOf('ahpd service uninstall');
    const stopped = lines.indexOf('ahpd stop');
    const uninstalled = lines.indexOf('npm uninstall -g @ahpd/server');
    expect(removed).toBeGreaterThanOrEqual(0);
    expect(stopped).toBeGreaterThan(removed);
    expect(uninstalled).toBeGreaterThan(stopped);
  });

  it('keeps the configuration without --purge and removes it with --purge', async () => {
    const kept = makeBox({ ahpd: true });
    mkdirSync(configDir(kept), { recursive: true });
    writeFileSync(join(configDir(kept), 'config.json'), '{}\n');
    const keptRun = await run(kept, ['--uninstall']);
    expect(keptRun.code).toBe(0);
    expect(existsSync(join(configDir(kept), 'config.json'))).toBe(true);

    const purged = makeBox({ ahpd: true });
    mkdirSync(configDir(purged), { recursive: true });
    writeFileSync(join(configDir(purged), 'config.json'), '{}\n');
    const purgedRun = await run(purged, ['--uninstall', '--purge']);
    expect(purgedRun.code).toBe(0);
    expect(existsSync(configDir(purged))).toBe(false);
  });

  it('exits 2 for --purge without --uninstall', async () => {
    const result = await run(makeBox(), ['--purge']);
    expect(result.code).toBe(2);
  });

  it('removes nothing under --dry-run', async () => {
    const box = makeBox({ ahpd: true });
    writeFileSync(rcFile(box), `${MARKER}\nexport PATH="/x:$PATH"\n`);
    mkdirSync(configDir(box), { recursive: true });
    writeFileSync(join(configDir(box), 'config.json'), '{}\n');

    const result = await run(box, ['--uninstall', '--purge', '--dry-run']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('would remove');
    expect(readFileSync(rcFile(box), 'utf8')).toContain(MARKER);
    expect(existsSync(join(configDir(box), 'config.json'))).toBe(true);
    expect(calls(box)).not.toContain('npm uninstall -g @ahpd/server');
  });
});
