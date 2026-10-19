/**
 * A module with no default export.
 *
 * Named by `commandParser`, it is a file the daemon imports and then finds no
 * reader in, so the start is refused.
 */

export const split = (line: string): string => line;
