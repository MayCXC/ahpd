import type { CommandSplit, Plugin } from '@ahpd/sdk';

/**
 * A plugin that reads command lines itself, and says it means to.
 *
 * `'replace'` is how a plugin takes the port over from a module the
 * configuration named, which is the one case where both may be configured.
 */

export const name = 'reader-replace';

const split = (line: string): CommandSplit => ({ subCommands: [line], writeDests: [], unanalyzable: false });

export const apply: Plugin['apply'] = (host) => {
  host.registerCommandParser(split, 'replace');
};
