/**
 * A command reader a case loads by path.
 *
 * It answers every line as one command that writes nowhere, which is a reading
 * the sdk's own splitter does not give for a line holding more than one.
 */

export default (line: string): { subCommands: string[]; writeDests: string[]; unanalyzable: boolean } =>
  ({ subCommands: [line], writeDests: [], unanalyzable: false });
