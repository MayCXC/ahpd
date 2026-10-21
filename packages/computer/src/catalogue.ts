import { isRecord, recordsChannel } from '@ahpd/sdk';
import type { RecordsChannel } from '@ahpd/sdk';
import { claimedOf } from './runtime.js';
import type { ComputerRuntime } from './runtime.js';

/**
 * The `x-ahpd-computers://` channel: every machine with its state, kept current.
 *
 * A subscribe answers `{ records }`, each entry `{ id, record }` where the
 * record is `{ state, status }`: `state` is what `computer://<id>/state` reads,
 * and `status` is what `computer://<id>/status` reads. `added`, `changed` and
 * `removed` follow it, as every records channel sends them. A subscription to
 * `x-ahpd-computers://?owner=me` is the caller's own machines.
 *
 * The runtime is the record of truth and has no event stream, so the channel
 * hears only what `refresh` is called for: the changes this plugin makes.
 */

/** The channel's scheme. */
export const COMPUTERS_SCHEME = 'x-ahpd-computers';

/**
 * The channel over this runtime, which reading needs `computer:read` for.
 *
 * `onProblem` hears a refresh that could not read the runtime.
 */
export const computerCatalogue = (
  runtime: Pick<ComputerRuntime, 'list' | 'inspect' | 'state'>,
  onProblem?: (line: string) => void,
): RecordsChannel =>
  recordsChannel(COMPUTERS_SCHEME, {
    ids: async () => (await runtime.list()).map((one) => one.id),
    find: async (id) => {
      const status = await runtime.inspect(id);
      if (status === undefined) return undefined;
      /*
       * The state is the runtime's own answer rather than a word read out of
       * the record beside it: a client round-trips this one, and a runtime
       * whose machine carries no Docker record answers it too.
       */
      return { state: await runtime.state(id) ?? 'stopped', status };
    },
  }, {
    grant: 'computer:read',
    /*
     * Whose a machine is, read off the record the channel already holds.
     *
     * The status is the machine's own `inspect`, which is where its owner label
     * lives, so a subscription asking for `?owner=me` narrows to the caller's
     * machines without asking the runtime a second time.
     */
    ownerOf: (_id, record) => (isRecord(record.status) ? claimedOf(record.status).owner : undefined),
    describe: () => ({ title: 'Computers', description: 'Every machine this host serves, with its state.' }),
    ...(onProblem === undefined ? {} : { onProblem }),
  });
