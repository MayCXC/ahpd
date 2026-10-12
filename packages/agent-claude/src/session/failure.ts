import { bag, str } from './common.js';

/**
 * The failures the SDK files under a CLI that never started.
 *
 * The SDK classifies the errors it raises around the process and hangs the
 * name on the error as `errorClass`: a path with nothing at it, a binary that
 * is there and would not launch, and a spawn that failed for some other
 * reason. What the three have in common is that the CLI never wrote anything,
 * so the SDK's own message is about this host rather than about the session -
 * a bundled path, a libc, a syscall - and none of that is something a person
 * reading a chat can act on.
 */
const NOT_STARTED = new Set(['executable_not_found', 'executable_launch_failed', 'spawn_failed']);

/** What a person is told when the CLI never started. */
const COULD_NOT_START = 'Claude Code process could not start';

/**
 * The one line a person reads for an error from the SDK.
 *
 * `errorClass` and `code` are hung on the error by name rather than declared
 * by the SDK's types, so both are read off the bag. A failure to start is
 * answered with the short message, and the errno stays in it because that is
 * the part a person can look up; every other error keeps its own message,
 * which is the SDK's words for a CLI that ran and then failed and this
 * session's own words for everything the session refuses itself.
 */
export const failureOf = (error: unknown): string => {
  const held = bag(error);
  const said = error instanceof Error ? error.message : String(error);
  if (!NOT_STARTED.has(str(held.errorClass) ?? '')) return said;
  const code = str(held.code);
  return code === undefined ? COULD_NOT_START : `${COULD_NOT_START} (${code})`;
};
