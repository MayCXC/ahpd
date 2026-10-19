import type { CommandSplit, Plugin } from '@ahpd/sdk';

/**
 * A plugin that reads command lines itself.
 *
 * The reader answers every line as one command that writes nowhere, so a case
 * can tell it from the sdk's splitter and from a configuration's module. It
 * sets the port without `'replace'`, which is what a configuration that also
 * names a module must refuse.
 */

export const name = 'reader';

const split = (line: string): CommandSplit => ({ subCommands: [line], writeDests: [], unanalyzable: false });

export const apply: Plugin['apply'] = (host) => {
  host.registerCommandParser(split);
};
