/*
 * `ahpd service install` and `ahpd service uninstall`, at the command line.
 *
 * The machine a case runs on has no systemd user session, so the manager is the
 * stand-in under `fixtures/systemctl-fake`: it says what it was asked, and what
 * it does is what the case names - here, starting the daemon the unit would have
 * started.
 */
import { posix } from '../../../tools/posix.ts';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { alive, BACKEND, cli, config, fakeSystemctl, gone, home, MAIN, put, recordOf, REPO, spawned, systemctlAsked } from './cli.js';

/** What an install asks the manager, in order, one argument per line of the log. */
const INSTALL_CALLS = ['--user', 'daemon-reload', '--user', 'enable', '--now', 'ahpd'];
/** And what an uninstall asks it. */
const UNINSTALL_CALLS = ['--user', 'disable', '--now', 'ahpd'];
/** Where the unit goes, under the configuration home a case is given. */
const unitPath = (): string => join(home, 'systemd', 'user', 'ahpd.service');

/**
 * What the stand-in manager does when it is asked: run the `ExecStart` line of
 * the unit, which is what a real manager runs, plus the flags a case cannot put
 * in the file and the variable a supervised daemon reads.
 *
 * The line is read out of the file rather than written out again here, so the
 * unit is the thing being tested: a flag this CLI does not take would be a
 * daemon that never comes up, and the install would wait for it and refuse.
 *
 * Its streams go to nothing, because the stand-in is run with a pipe this case
 * holds open: a daemon that inherited it would keep that pipe open past the exit
 * of the `systemctl` that started it, and the call would never be seen to end.
 */
const started = (): string =>
  `AHPD_SERVICE=systemd $(sed -n 's/^ExecStart=//p' '${unitPath()}') --port 0 --plugin ${BACKEND} --sessions memory --automations memory --no-update-check >/dev/null 2>&1 &`;

// A service is a systemd unit or a launchd agent, and Windows has neither:
// `ahpd service install` refuses there, which `service.test.ts` asks directly.
describe.skipIf(!posix)('service install', () => {
  it('writes the unit, enables it, and prints where the daemon it started is', async () => {
    const did = await cli(['service', 'install', '--config-file', config], { env: fakeSystemctl(started()) });
    expect({ code: did.code, stderr: did.stderr }).toEqual({ code: 0, stderr: '' });
    // The daemon the manager started writes its own record, which is what the
    // install waited on: this command spawns nothing and has no log to read.
    const record = recordOf();
    spawned.push(record.pid);
    expect(did.stdout).toBe([
      `ahpd on ${record.url} (pid ${String(record.pid)}), started ${record.startedAt}, under systemd`,
      `sessions in ${record.paths.join(', ')}`,
      `automations ${String(record.automations)}`,
      'no token: loopback only',
      '',
    ].join('\n'));
    expect(record.service).toBe('systemd');

    // What the unit says: this machine's node, this ahpd, this configuration,
    // and the manager the daemon records itself under.
    const unit = readFileSync(unitPath(), 'utf8');
    expect(unit).toContain(`ExecStart=${process.execPath} ${join(REPO, MAIN)} --config-file ${config}`);
    expect(unit).toContain('Environment=AHPD_SERVICE=systemd');
    expect(unit).toContain('Environment=PATH=');
    expect(unit).toContain('Restart=on-failure');
    expect(unit).toContain(`WorkingDirectory=${homedir()}`);
    // And what the manager was asked, in order.
    expect(systemctlAsked()).toEqual(INSTALL_CALLS);
  }, 60000);

  it('names a relative configuration file in full', async () => {
    // The cli runs in REPO, and the unit starts the daemon in the home folder.
    const did = await cli(['service', 'install', '--config-file', relative(REPO, config)], { env: fakeSystemctl(started()) });
    expect({ code: did.code, stderr: did.stderr }).toEqual({ code: 0, stderr: '' });
    spawned.push(recordOf().pid);
    expect(readFileSync(unitPath(), 'utf8')).toContain(`--config-file ${config}\n`);
  }, 60000);

  it('says where the token comes from, and never the token', async () => {
    put({ connectionToken: 'abc' });
    const did = await cli(['service', 'install', '--config-file', config], { env: fakeSystemctl(started()) });
    expect(did.code).toBe(0);
    const record = recordOf();
    spawned.push(record.pid);
    expect(did.stdout).toContain(`ahpd on ${record.url} (pid ${String(record.pid)})`);
    expect(did.stdout).toContain('token: from --connection-token');
    expect(did.stdout).not.toContain('abc');
    expect(did.stdout).not.toContain('tkn=');
  }, 60000);

  it('refuses while a daemon from ahpd start runs, and writes nothing', async () => {
    const began = await cli([
      'start', '--config-file', config, '--port', '0', '--plugin', BACKEND,
      '--sessions', 'memory', '--automations', 'memory', '--no-update-check',
    ]);
    expect(began.code).toBe(0);
    const record = recordOf();
    spawned.push(record.pid);

    const did = await cli(['service', 'install', '--config-file', config], { env: fakeSystemctl(started()) });
    expect(did.code).toBe(1);
    expect(did.stderr).toBe(`ahpd: A daemon from ahpd start is running: ${record.url} (pid ${String(record.pid)}). Stop it with ahpd stop, then install the service.\n`);
    // Nothing was written and the manager was not asked: the refusal is the
    // first thing the command does.
    expect(existsSync(unitPath())).toBe(false);
    expect(existsSync(join(home, 'systemctl.log'))).toBe(false);
    // And the daemon a terminal started is still the one serving.
    expect(recordOf().pid).toBe(record.pid);
  }, 60000);
});

// The same: a service to take out exists only under systemd or launchd.
describe.skipIf(!posix)('service uninstall', () => {
  it('takes the service out, stops the daemon it held, and leaves no file', async () => {
    const installed = await cli(['service', 'install', '--config-file', config], { env: fakeSystemctl(started()) });
    expect(installed.code).toBe(0);
    const record = recordOf();
    spawned.push(record.pid);
    expect(systemctlAsked()).toEqual(INSTALL_CALLS);

    // What `systemctl --user disable --now` does that matters here is the
    // signal the real one sends the daemon the unit holds. `--yes` is what a
    // removal run without a terminal is asked for before it does anything.
    const took = await cli(['service', 'uninstall', '--yes'], { env: fakeSystemctl(`kill -TERM ${String(record.pid)}`) });
    expect({ code: took.code, stderr: took.stderr }).toEqual({ code: 0, stderr: '' });
    expect(took.stdout).toBe(`Stopped ${record.url} (pid ${String(record.pid)}).\nTook the service out: ${unitPath()}.\n`);
    expect(systemctlAsked()).toEqual([...INSTALL_CALLS, ...UNINSTALL_CALLS]);
    expect(existsSync(unitPath())).toBe(false);
    await gone(record.pid);
    expect(alive(record.pid)).toBe(false);
    expect(existsSync(join(home, 'ahpd', 'daemon.json'))).toBe(false);
  }, 90000);

  it('says there is no service to take out', async () => {
    const took = await cli(['service', 'uninstall', '--yes'], { env: fakeSystemctl() });
    expect(took.code).toBe(1);
    expect(took.stderr).toBe('ahpd: No service is installed.\n');
    expect(existsSync(join(home, 'systemctl.log'))).toBe(false);
  });
});
