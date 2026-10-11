import { recordsChannel } from '@ahpd/sdk';
import type { RecordsChannel } from '@ahpd/sdk';
import { stateOf } from './provider.js';
import type { ComputerRuntime } from './runtime.js';

/**
 * The `x-ahpd-computers://` channel: every machine with its state, kept current.
 *
 * A subscribe answers `{ records }`, each entry `{ id, record }` where the
 * record is `{ state, status }`: `state` is what `computer://<id>/state` reads,
 * and `status` is what `computer://<id>/status` reads. `added`, `changed` and
 * `removed` follow it, as every records channel sends them - decision
 * `host-records-are-typed-channels-beside-their-resource-schemes`.
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
  runtime: Pick<ComputerRuntime, 'list' | 'inspect'>,
  onProblem?: (line: string) => void,
): RecordsChannel =>
  recordsChannel(COMPUTERS_SCHEME, {
    ids: async () => (await runtime.list()).map((one) => one.id),
    find: async (id) => {
      const status = await runtime.inspect(id);
      return status === undefined ? undefined : { state: stateOf(status), status };
    },
  }, {
    grant: 'computer:read',
    describe: () => ({ title: 'Computers', description: 'Every machine this host serves, with its state.' }),
    ...(onProblem === undefined ? {} : { onProblem }),
  });
