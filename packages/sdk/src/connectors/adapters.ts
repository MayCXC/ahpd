/**
 * `x-ahpd-adapters`: the adapters the plugins of a host register.
 *
 * One row for each adapter, keyed by the adapter's name, holding what a client
 * needs to list it and to draw the form a person makes a connector with: its
 * title, its description, its schema, its capabilities, and the plugin that
 * registered it. Nothing here is an instance of anything; the connectors made
 * from an adapter are on `x-ahpd-connectors`.
 *
 * The channel is read-only, and reading it takes `connector:list`: a client
 * that may not see a connector is not shown the forms either. The adapters
 * exist only after the plugins load, so the host reads them through a function
 * and one is listed as soon as it is registered, before any connector exists.
 */

import { recordsChannel, type RecordsChannel } from '../resources/recordschannel.js';
import type { ServedAdapter } from '../types/connectors.js';
import type { Grant } from '../types/users.js';

/** The channel's scheme. */
const SCHEME = 'x-ahpd-adapters';

/** What an adapters channel is built from. */
export interface AdaptersChannelOptions {
  /**
   * The adapters the plugins registered, read at each call.
   *
   * The channel is built before the plugins load, so the fold's adapters are
   * read through a function rather than handed in.
   */
  adapters(): Record<string, ServedAdapter>;
  /** Where an adapter that could not be listed is said. */
  onProblem?(message: string): void;
}

/** An adapters channel, and the way to send its readers a change. */
export interface AdaptersChannel {
  /** What `servedRecords` takes. */
  channel: RecordsChannel;
  /** Send every reader what the adapters are now. */
  refresh(): Promise<void>;
}

/**
 * One adapter as a client is shown it: everything but the way it is opened.
 *
 * The capabilities are sent whole, so a receive capability's `path` reaches a
 * client beside its type, name, title and description, and a capability with
 * no path carries no key.
 */
const rowOf = (adapter: ServedAdapter): Record<string, unknown> => ({
  name: adapter.name,
  title: adapter.title,
  description: adapter.description,
  schema: adapter.schema,
  capabilities: adapter.capabilities,
  plugin: adapter.by,
  // An icon is decoration, so an adapter with none carries no key rather than
  // an empty list a client would have to test.
  ...(adapter.icons === undefined || adapter.icons.length === 0 ? {} : { icons: adapter.icons }),
});

export const adaptersChannel = (options: AdaptersChannelOptions): AdaptersChannel => {
  const source = {
    ids: async (): Promise<string[]> => Object.keys(options.adapters()).sort(),
    find: async (id: string): Promise<Record<string, unknown> | undefined> => {
      const adapter = options.adapters()[id];
      return adapter === undefined ? undefined : rowOf(adapter);
    },
  };

  const channel = recordsChannel(SCHEME, source, {
    grant: 'connector:list' as Grant,
    describe: () => ({ title: 'Adapters', description: 'The adapters this host serves.' }),
    ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
  });

  return { channel, refresh: channel.refresh };
};
