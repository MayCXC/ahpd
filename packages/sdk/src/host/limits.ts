import type { Bag } from '../types/common.js';

/*
 * The two limits on what this host holds for a client that is not reading.
 *
 * A client that reads slower than the host writes leaves every frame it has
 * not taken in its socket's queue, and nothing in the protocol bounds that
 * queue: a socket sends while it is open, and what it holds until the client
 * reads it is the socket's own business. The same is true of the replay
 * buffer, which counts envelopes and not their size - a thousand actions
 * carrying large tool outputs are a thousand envelopes, whatever they weigh.
 *
 * Both are root config keys with defaults, so a host nobody configured is
 * bounded the way a configured one is. They are read where they are used
 * rather than held, so a value pushed while the host runs is in force for the
 * next send and not at the next restart.
 */

/** What one client's queue may hold before this host stops writing to it, 16 MiB. */
export const CLIENT_QUEUE_BYTES = 16 * 1024 * 1024;

/** What the replay buffer may hold, 32 MiB. */
export const REPLAY_BYTES = 32 * 1024 * 1024;

/**
 * The least either key may be pushed to, 1 MiB.
 *
 * Below it is a host that closes a client under any burst at all and a replay
 * buffer that cannot hold a page of a busy session's turns, which is not a
 * limit anybody means. A value under it, and one that is not a safe integer,
 * reads as the key's default rather than as itself.
 */
export const MINIMUM_LIMIT_BYTES = 1024 * 1024;

/**
 * One of the two, as it stands now: the pushed value where it is usable, and
 * the default otherwise.
 *
 * The schema's `minimum` is not what holds a value off the wire - a client
 * pushes what it likes under a declared key and `actions.ts` keeps it - so the
 * check is here, at the reading, which is also the only place that knows
 * whether the value was ever pushed at all.
 */
const limitOf = (rootConfig: Bag, key: string, fallback: number): number => {
  const pushed = rootConfig[key];
  return typeof pushed === 'number' && Number.isSafeInteger(pushed) && pushed >= MINIMUM_LIMIT_BYTES ? pushed : fallback;
};

/** The most a client's queue may hold for it before this host closes the wire. */
export const clientQueueBytes = (rootConfig: Bag): number => limitOf(rootConfig, 'clientQueueBytes', CLIENT_QUEUE_BYTES);

/** The most the replay buffer may hold, counted in the bytes of its envelopes' text. */
export const replayBytes = (rootConfig: Bag): number => limitOf(rootConfig, 'replayBytes', REPLAY_BYTES);
