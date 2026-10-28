/**
 * `ahpd doctor`: say what is wrong on this machine, and how to fix it.
 *
 * The checks are `doctor.ts`'s, in its order, and this file only prints them.
 * A `fail` writes the report and then fails the command: `@cofold/terminal`
 * takes the exit code from the process run and writes only the failure for a
 * handler that throws, so a report that must reach stdout is written here
 * rather than returned. The report is still the useful part, and a caller that
 * reads only the exit code learns the same thing from the failure line.
 *
 * There is no HTTP surface. A served request is answered by the daemon itself,
 * so it cannot check that the daemon answers.
 */

import { output } from '@cofold/commands';
import type { Command, Registry } from '@cofold/commands';
import { checks } from '../doctor.js';
import type { Check } from '../doctor.js';
import { conflict } from './options.js';

/** One check as the two lines a person reads. */
const checkLines = (check: Check): string[] => [
  `${check.result} ${check.name}: ${check.line}`,
  ...(check.fix === undefined ? [] : [`  fix: ${check.fix}`]),
];

/** The count of each result, after the lines it counts. */
const countLine = (said: readonly Check[]): string => {
  const count = (result: Check['result']): number => said.filter((check) => check.result === result).length;
  return `${String(count('ok'))} ok, ${String(count('warn'))} warn, ${String(count('fail'))} fail\n`;
};

/** How the failure line reads: one check, or several. */
const failedLine = (failed: number): string => (failed === 1 ? '1 check failed.' : `${String(failed)} checks failed.`);

export const declareDoctor = (registry: Registry<object>): Command => registry.action({
  id: 'daemon.doctor',
  summary: 'Say what is wrong, and how to fix it',
  description: 'Runs every check on this machine and prints one line for each, then the count of each result. Exits 1 when a check fails. The JSON is the output for a support ticket, and holds no token.',
  surfaces: { cli: { pattern: ['doctor'] } },
  // Every check reads this machine; none of them changes the daemon or a file.
  effect: 'read',
  scopes: ['config:read'],
  run: async (context) => {
    const said = await checks();
    const text = `${said.flatMap(checkLines).join('\n')}\n${countLine(said)}`;
    const failed = said.filter((check) => check.result === 'fail').length;
    // A report with no failure is the whole answer, and the output contract
    // renders it for the surface.
    if (failed === 0) return output(said, text);
    // The report comes first, in the mode the run chose, and the failure after
    // it is what gives the command its exit code.
    context.write(context.globals['json'] === true ? `${JSON.stringify(said, null, 2)}\n` : text);
    conflict(failedLine(failed));
  },
});
