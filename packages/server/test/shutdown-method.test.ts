/*
 * What a `shutdown` request reaches in the daemon.
 *
 * The method belongs to the host, which answers and then calls what it was
 * given; what the daemon gives it is what is here - the way down once the
 * lifecycle exists, and the signal a shutdown sent itself before that. Nothing
 * in this file signals a process: the signal is a spy and the way down is
 * driven with a fake exit, so no case can stop the process running the suite
 * or reach a real daemon to take down.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { lifecycle } from '../src/commands/restart.js';
import { daemonShutdown } from '../src/commands/run.js';
import type { Lifecycle } from '../src/commands/restart.js';

afterEach(() => { vi.restoreAllMocks(); });

/** A lifecycle whose way down and exit are recorded, in the order they ran. */
const driving = (): { way: Lifecycle; ran: string[] } => {
  const ran: string[] = [];
  const way = lifecycle({
    // The daemon's own way down raises `stopping` first; this stands in for it.
    down: async () => { ran.push('stopping'); },
    start: async () => { throw new Error('no successor is started here'); },
    stop: () => { ran.push('stop'); },
    forget: () => { ran.push('forget'); },
    log: (line) => { ran.push(`log ${line}`); },
    exit: (code) => { ran.push(`exit ${String(code)}`); },
    later: (step) => { step(); },
  });
  return { way, ran };
};

/** Let the way down settle: the exit is a `then` on it rather than a step in it. */
const settled = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

describe('the shutdown a request is given', () => {
  it('runs the way down, which raises stopping, and exits only after it', async () => {
    const { way, ran } = driving();
    daemonShutdown(() => way.shutdown)();
    // Answered by the way down before it settles, so a request cannot exit
    // ahead of the stopping handlers a plugin is still running in.
    expect(ran).toEqual(['stopping']);
    await settled();
    expect(ran).toEqual(['stopping', 'exit 0']);
  });

  it('sends no signal to this daemon\'s own process', async () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    const { way, ran } = driving();
    daemonShutdown(() => way.shutdown)();
    await settled();
    expect(kill).not.toHaveBeenCalled();
    expect(ran).toEqual(['stopping', 'exit 0']);
  });

  it('keeps the signal while there is no way down yet', () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    // The window between the host being built with a shutdown and the
    // lifecycle being made, which the bound socket lets a request land in.
    daemonShutdown(() => undefined)();
    expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
  });
});
