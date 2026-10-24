/**
 * The adapters a plugin offers, and the connectors made from them.
 *
 * An adapter is what a plugin registers: one name, the form a person fills in
 * to make a connector of it, and the capabilities a connector of that adapter
 * carries. A connector is one person's or team's instance of an adapter, kept
 * as a JSON record, and the adapter's `open` is where the plugin starts
 * answering for it.
 *
 * A capability is declared and shown. A `receive` capability is where a
 * connector answers, and an `action` runs through the adapter's `run`, which
 * the host calls with the connector - the identity, the configuration and the
 * secrets - and the input of one call.
 */

import type { Icon } from '@microsoft/agent-host-protocol';

/**
 * What a capability is, as a client files it.
 *
 * `receive` is a connector that answers calls, `command` is a `/` command it
 * adds, `action` is something a client offers to run, and `ui` is reserved for
 * a component tree a later plan adds. A type this version does not know is
 * kept and shown by its title rather than refused.
 */
export type CapabilityType = 'receive' | 'command' | 'action' | 'ui' | (string & {});

/** One thing a connector of an adapter does. */
export interface Capability {
  /** What kind of capability this is. */
  type: CapabilityType;
  /** The name a client and the plugin refer to it by. */
  name: string;
  /** What a client prints for it. */
  title: string;
  /** One line on what it does. */
  description: string;
  /**
   * The form a client draws for a `command` or an `action`.
   *
   * A JSON Schema object, the same subset a client already draws a session
   * setting from.
   */
  input?: Record<string, unknown>;
  /**
   * Where a `receive` capability's connectors receive, on a `receive` only.
   *
   * A path relative to the daemon's HTTP root, with `{id}` standing for the
   * connector's id, such as `/plugins/webhook/{id}`. A client puts the root
   * before it to build a connector's URL.
   */
  path?: string;
}

/**
 * Whose connector it is.
 *
 * `host` is the daemon's own, shared by everyone it serves. `team:<team>` is a
 * team's and `user:<id>` is a person's, and each is kept under that owner's
 * scope in the vault.
 */
export type ConnectorOwner = 'host' | `team:${string}` | `user:${string}`;

/**
 * One stored connector as a save that may name it reads it.
 *
 * Id, adapter and owner and nothing else, because that is the whole of what a
 * reference is checked against: a schema field naming a connector has to find
 * one of the adapter it asks for, and one whose owner the automation may read.
 * A record written by hand may name no owner, and such a connector is not one
 * a save may link to.
 */
export interface ConnectorRef {
  /** The connector's id: the slug its record is kept under. */
  id: string;
  /** The adapter it is one of. */
  adapter: string;
  /** Whose it is; absent on a record that names no scope. */
  owner?: ConnectorOwner | undefined;
}

/** One connector, as an adapter's `open` is handed it. */
export interface Connector {
  /** The connector's id: a slug, and the name its record is kept under. */
  id: string;
  /** The name of the adapter it is one of. */
  adapter: string;
  /** Whose connector it is. */
  owner: ConnectorOwner;
  /** What a client prints for it; absent, its id stands for it. */
  title?: string;
  /** The values a person filled in, each secret read back from the vault. */
  config: Record<string, unknown>;
}

/**
 * One adapter a plugin offers.
 *
 * The name is the adapter's identity and is a slug, because it is also the
 * `adapter` a stored connector carries. The schema is what a client draws the
 * form from, so it is the protocol between the plugin and a person: an adapter
 * that changes it leaves a connector that no longer matches, and the plan that
 * adds connectors does not migrate one.
 */
export interface Adapter {
  /** The adapter's name: a slug, and the name every connector of it carries. */
  name: string;
  /** What a client prints for the adapter. */
  title: string;
  /** One sentence on what a connector of this adapter is. */
  description: string;
  /** The JSON Schema a client draws the form from. */
  schema: Record<string, unknown>;
  /** What a connector of this adapter does, as a client lists it. */
  capabilities: Capability[];
  /**
   * What a client draws beside the adapter's title.
   *
   * An `src` that is a path is relative to the package of the plugin that
   * registered the adapter, and the host reads the file and sends it as a
   * `data:` URI, at most 32 KB. An `https:` URL or a `data:` URI is sent as it
   * is.
   */
  icons?: Icon[];
  /**
   * Start answering for one connector.
   *
   * Called when a connector is made and when the daemon starts with one
   * stored. The answer is the function that stops it, or nothing when there is
   * nothing to stop.
   */
  open(connector: Connector): void | (() => void | Promise<void>);
  /**
   * Run one of the adapter's `action` capabilities for one connector.
   *
   * The host hands it the connector as `open` was handed it, with each secret
   * read back from the vault, and the input of the call. It answers the
   * action's result, which the host passes on. An adapter with no `run` offers
   * no action tool, and an adapter with `run` and no `action` capability runs
   * nothing either.
   */
  run?(connector: Connector, action: string, input: Record<string, unknown>): Promise<unknown>;
}

/** One adapter as the fold keeps it, with the plugin that registered it. */
export interface ServedAdapter extends Adapter {
  /** The plugin that registered it. */
  by: string;
}
