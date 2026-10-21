/**
 * The kinds of connector a plugin offers, and the connectors made from them.
 *
 * A connector kind is what a plugin registers: one name, the form a person
 * fills in to make a connector of it, and the capabilities a connector of that
 * kind carries. A connector is one person's or team's instance of a kind, kept
 * as a JSON record, and the kind's `open` is where the plugin starts answering
 * for it.
 *
 * A capability is declared and shown; nothing here runs one. Running an action
 * as a tool is a later plan.
 */

/**
 * What a capability is, as a client files it.
 *
 * `receive` is a connector that answers calls, `command` is a `/` command it
 * adds, `action` is something a client offers to run, and `ui` is reserved for
 * a component tree a later plan adds. A type this version does not know is
 * kept and shown by its title rather than refused.
 */
export type CapabilityType = 'receive' | 'command' | 'action' | 'ui' | (string & {});

/** One thing a connector of a kind does. */
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
}

/**
 * Whose connector it is.
 *
 * `host` is the daemon's own, shared by everyone it serves. `team:<team>` is a
 * team's and `user:<id>` is a person's, and each is kept under that owner's
 * scope in the vault.
 */
export type ConnectorOwner = 'host' | `team:${string}` | `user:${string}`;

/** One connector, as a kind's `open` is handed it. */
export interface Connector {
  /** The connector's id: a slug, and the name its record is kept under. */
  id: string;
  /** The name of the kind it is one of. */
  kind: string;
  /** Whose connector it is. */
  owner: ConnectorOwner;
  /** What a client prints for it; absent, its id stands for it. */
  title?: string;
  /** The values a person filled in, each secret read back from the vault. */
  config: Record<string, unknown>;
}

/**
 * One kind of connector a plugin offers.
 *
 * The name is the kind's identity and is a slug, because it is also the
 * `kind` a stored connector carries. The schema is what a client draws the
 * form from, so it is the protocol between the plugin and a person: a kind
 * that changes it leaves a connector that no longer matches, and the plan that
 * adds connectors does not migrate one.
 */
export interface ConnectorKind {
  /** The kind's name: a slug, and the name every connector of it carries. */
  name: string;
  /** What a client prints for the kind. */
  title: string;
  /** One sentence on what a connector of this kind is. */
  description: string;
  /** The JSON Schema a client draws the form from. */
  schema: Record<string, unknown>;
  /** What a connector of this kind does, as a client lists it. */
  capabilities: Capability[];
  /**
   * Start answering for one connector.
   *
   * Called when a connector is made and when the daemon starts with one
   * stored. The answer is the function that stops it, or nothing when there is
   * nothing to stop.
   */
  open(connector: Connector): void | (() => void | Promise<void>);
}

/** One connector kind as the fold keeps it, with the plugin that registered it. */
export interface ServedConnectorKind extends ConnectorKind {
  /** The plugin that registered it. */
  by: string;
}
