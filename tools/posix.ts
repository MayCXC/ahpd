/*
 * Whether this run has the pieces a POSIX-only test needs.
 *
 * A case that starts a shell outside a terminal, sends a signal, or reads a
 * file mode or a symbolic link has nothing to run against on Windows. Skipping
 * it is `it.skipIf(!posix)`, and each use names its reason in the comment
 * beside it, so the skips are found from the comments that explain them.
 */
export const posix = process.platform !== 'win32';
