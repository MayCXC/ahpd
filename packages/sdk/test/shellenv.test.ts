import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { isShellName, shellEnvOf, type ShellEnv } from '../src/machines/shellenv.js';
import { shellTerminals } from '../src/machines/terminals.js';

/*
 * The environment an operator gives the shells a host starts.
 *
 * `shellEnv` is the daemon's own map, over the environment the daemon itself
 * runs with and under whatever a caller asks a single terminal for. The last
 * half is driven through the real store, because the order the layers are
 * applied in is the whole of what it promises and only a process can show it.
 */

describe('shellEnvOf', () => {
  it('replaces a variable the base already had, and adds one it did not', () => {
    expect(shellEnvOf({ KEEP: 'daemon', CHANGE: 'daemon' }, { CHANGE: 'operator', ADDED: 'operator' }))
      .toEqual({ KEEP: 'daemon', CHANGE: 'operator', ADDED: 'operator' });
  });

  it('removes a variable set to null, which is the other thing a map says', () => {
    expect(shellEnvOf({ GONE: 'daemon', KEPT: 'daemon' }, { GONE: null })).toEqual({ KEPT: 'daemon' });
  });

  it('leaves the base it was given alone', () => {
    const base = { CHANGE: 'daemon', GONE: 'daemon' };
    shellEnvOf(base, { CHANGE: 'operator', GONE: null });
    expect(base).toEqual({ CHANGE: 'daemon', GONE: 'daemon' });
  });
});

describe('isShellName', () => {
  it('takes a name a shell can export, and refuses one it cannot', () => {
    expect(['HOME', '_private', 'A1'].map(isShellName)).toEqual([true, true, true]);
    expect(['', '2FA', 'a-b', 'a b', 'a.b'].map(isShellName)).toEqual([false, false, false, false, false]);
  });
});

/** One variable as a shell sees it, or `null` when the name is not in its environment. */
const printed = async (asked: { shellEnv?: ShellEnv; env?: Record<string, string | undefined> }): Promise<string> => {
  const terminal = shellTerminals({ ...(asked.shellEnv === undefined ? {} : { shellEnv: asked.shellEnv }) }).create({
    uri: 'ahp-terminal:/shellenv',
    // A folder that is there on every system: a missing one fails the spawn.
    cwd: tmpdir(),
    claim: { kind: 'client', clientId: 'probe' },
    command: process.execPath,
    args: ['-e', 'process.stdout.write(JSON.stringify(process.env[process.argv[1]] ?? null))', 'AHP_TEST_ENV'],
    ...(asked.env === undefined ? {} : { env: asked.env }),
    emit: () => {},
  });
  await terminal.waitForExit();
  // The protocol's own recipe for turning typed parts back into a stream.
  return terminal.state().content.map((part) => (part.type === 'command' ? part.output : part.value)).join('');
};

describe('a terminal the operator gave an environment', () => {
  it('starts the shell with the operator\'s variable', async () => {
    expect(await printed({ shellEnv: { AHP_TEST_ENV: 'from-the-operator' } })).toBe('"from-the-operator"');
  });

  it('removes a variable the daemon had, when the map says null', async () => {
    // Set by the test process itself, so the variable is one the shell starts
    // with whether or not anything configured it.
    process.env.AHP_TEST_ENV = 'from-the-daemon';
    try {
      expect(await printed({ shellEnv: { AHP_TEST_ENV: null } })).toBe('null');
    }
    finally { delete process.env.AHP_TEST_ENV; }
  });

  it('lets the caller\'s environment win over the operator\'s map', async () => {
    expect(await printed({ shellEnv: { AHP_TEST_ENV: 'from-the-operator' }, env: { AHP_TEST_ENV: 'from-the-caller' } }))
      .toBe('"from-the-caller"');
  });

  it('removes a variable a caller spelled with undefined', async () => {
    expect(await printed({ shellEnv: { AHP_TEST_ENV: 'from-the-operator' }, env: { AHP_TEST_ENV: undefined } }))
      .toBe('null');
  });
});
