/**
 * `x-ahpd-agent-kinds`: the kinds of agent the plugins of a host register.
 *
 * One row for each kind, keyed by the kind's name, holding what a client needs
 * to offer it and to draw the form a person makes a record with: its title, its
 * description, its schema, and the plugin that registered it. The icons, the
 * templates, the host-only fields and the key variables are sent when the kind
 * has them. Nothing here is an agent; the records made from a kind are on
 * `x-ahpd-agents`.
 *
 * The channel is read-only, and reading it takes `agent:list`: a client that
 * may not see an agent is not shown the forms either. The kinds exist only
 * after the plugins load, so the host reads them through a function and one is
 * listed as soon as it is registered, before any record exists.
 */

import { recordsChannel, type RecordsChannel } from '../resources/recordschannel.js';
import type { ServedAgentKind } from '../types/agents.js';
import type { Grant } from '../types/users.js';

/** The channel's scheme. */
const SCHEME = 'x-ahpd-agent-kinds';

/** What an agent kinds channel is built from. */
export interface AgentKindsChannelOptions {
  /**
   * The kinds the plugins registered, read at each call.
   *
   * The channel is built before the plugins load, so the fold's kinds are
   * read through a function rather than handed in.
   */
  kinds(): Record<string, ServedAgentKind>;
  /** Where a kind that could not be listed is said. */
  onProblem?(message: string): void;
}

/** An agent kinds channel, and the way to send its readers a change. */
export interface AgentKindsChannel {
  /** What `servedRecords` takes. */
  channel: RecordsChannel;
  /** Send every reader what the kinds are now. */
  refresh(): Promise<void>;
}

/**
 * One kind as a client is shown it: everything but the `open` that builds a
 * backend, which is a function and does not serialize.
 *
 * The templates are sent whole, so the name, the description, the icon, the
 * model and the config a record starts from each reach a client. A list a kind
 * does not have carries no key rather than an empty one a client would have to
 * test.
 */
const rowOf = (kind: ServedAgentKind): Record<string, unknown> => ({
  name: kind.name,
  title: kind.title,
  description: kind.description,
  schema: kind.schema,
  plugin: kind.by,
  ...(kind.icons === undefined || kind.icons.length === 0 ? {} : { icons: kind.icons }),
  ...(kind.templates === undefined || kind.templates.length === 0 ? {} : { templates: kind.templates }),
  ...(kind.hostOnly === undefined || kind.hostOnly.length === 0 ? {} : { hostOnly: kind.hostOnly }),
  ...(kind.keyVariables === undefined || kind.keyVariables.length === 0 ? {} : { keyVariables: kind.keyVariables }),
});

export const agentKindsChannel = (options: AgentKindsChannelOptions): AgentKindsChannel => {
  const source = {
    ids: async (): Promise<string[]> => Object.keys(options.kinds()).sort(),
    find: async (id: string): Promise<Record<string, unknown> | undefined> => {
      const kind = options.kinds()[id];
      return kind === undefined ? undefined : rowOf(kind);
    },
  };

  const channel = recordsChannel(SCHEME, source, {
    grant: 'agent:list' as Grant,
    describe: () => ({ title: 'Agent kinds', description: 'The agent kinds this host serves.' }),
    ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
  });

  return { channel, refresh: channel.refresh };
};
