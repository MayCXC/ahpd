/**
 * `x-ahpd-agents`: the agents made from the kinds a host serves.
 *
 * One row for each stored record, keyed by the agent's id, holding the record
 * as it is kept and a `state`: `ready`, `invalid` when its config no longer
 * fits the kind's schema or its kind refused to open it, or `unavailable` when
 * no plugin registers its kind any more. The kinds themselves are listed on
 * `x-ahpd-agent-kinds`.
 *
 * Where a kind's schema marks a field `writeOnly`, or names an `env` variable
 * in `keyVariables`, the value is a secret. A put moves it to the vault under
 * `agent/<id>/<field>` in the owner's scope and keeps a
 * `{ "$secret": "<name>" }` in the record instead, so a listing, a snapshot, an
 * answer and the log never carry it. A field sent empty keeps the secret the
 * record already had, because a client is never given one to send back. A host
 * record's field may hold `{ "fromEnv": "<NAME>" }` instead, which the host
 * reads from its own environment when it opens the record; a team's or a
 * person's record that names one is refused.
 *
 * Three commands serve an agent. `x-ahpd/agents/put` takes
 * `{ id, kind, owner, name, description?, icon?, model?, config }`, checks
 * `config` against the kind's schema, writes the record, calls the kind's
 * `open` with each secret read back, and folds the new agent list into the
 * running host. `x-ahpd/agents/remove` takes `{ id }`, ends the sessions that
 * run on it, takes its secrets out of the vault and takes the record out. Both
 * answer the row a client now holds. `x-ahpd/agents/check` takes `{ id }`,
 * builds the backend again, asks its probe and answers the row with its health.
 *
 * An edit keeps the agent and its sessions: the view `open` was handed is
 * updated in place, so a running session reads the new record at its next
 * turn. A record's id is unique across every owner, and it is also the agent's
 * `provider`: a kind that opens a backend under another id is refused rather
 * than served under a name no row has, and a put never takes an id the daemon
 * or a plugin already serves. A record of a kind no plugin registers stays on
 * disk and is served as `unavailable`: a disabled plugin keeps its agents. The
 * commands run one at a time, so two puts of one id cannot both find it free.
 */

import { INVALID_PARAMS, INTERNAL_ERROR, RpcError } from '../rpc.js';
import {
  AGENT_SECRETS,
  asOwner,
  checkedConfig,
  forgetAll as forgetRecordSecrets,
  heldAgainst,
  moveSecrets as moveRecordSecrets,
  onTeam,
  ownerAllows,
  refuseOwner,
  resolved as resolvedRecord,
  writeOnly,
  DENIED,
} from '../channels/owners.js';
import { isRecordSlug } from '../resources/records.js';
import { recordsChannel, type RecordsChannel } from '../resources/recordschannel.js';
import { bag, isRecord, reason } from '../utils/values.js';
import type { Icon } from '@microsoft/agent-host-protocol';
import type { Agent } from '../types/agent.js';
import type { AgentHealth, AgentOwner, AgentState, ServedAgentKind } from '../types/agents.js';
import type { PluginMethod } from '../types/plugin.js';
import type { RecordCollection, StoredRecord } from '../types/records.js';
import type { Grant, Principal } from '../types/users.js';
import type { Vault } from '../types/vault.js';

/** The channel's scheme, and the domain its three commands are named under. */
const SCHEME = 'x-ahpd-agents';
const DOMAIN = 'x-ahpd/agents';
const PUT = `${DOMAIN}/put`;
const REMOVE = `${DOMAIN}/remove`;
const CHECK = `${DOMAIN}/check`;

/** How long a probe may take before its agent is called `unreachable`. */
const CHECK_LIMIT_MS = 10_000;

/** How a agents channel reads its store, and what it asks the host to take. */
export interface AgentsChannelOptions {
  /** The `agents` collection: one JSON record for each agent. */
  collection: RecordCollection;
  /**
   * The kinds the plugins registered, read at each call.
   *
   * Read through a function because the kinds are known only after the load,
   * and a channel built before it would hold none.
   */
  kinds(): Record<string, ServedAgentKind>;
  /** The vault a secret is written to, and read back from when a kind opens. */
  vault(): Vault | undefined;
  /**
   * Check one value against a kind's schema, throwing the first finding.
   *
   * Taken as an option rather than imported: the sdk takes no third-party
   * runtime, and the schema checker the daemon uses belongs to the server.
   */
  check(value: unknown, schema: Record<string, unknown>, label: string): void;
  /**
   * Fold these agents into the running host, and answer the ids it now serves.
   *
   * Called with every record's agent after a put or a remove, and by `openAll`
   * at a start. A refusal throws, and the host keeps the list it had.
   */
  refold(agents: Agent[]): Promise<ReadonlySet<string>>;
  /** End every session running on one agent, before its record is removed. */
  endSessionsOf(id: string): Promise<void>;
  /**
   * What already serves an agent id this store does not hold, if anything.
   *
   * Answers the daemon, or the plugin that brought the agent, so a put can
   * refuse an id before writing a record the fold would then drop. Read only
   * for a record the store does not already hold.
   */
  holderOf?(id: string): string | undefined;
  /** Where a record that could not be opened is said. */
  onProblem?(message: string): void;
}

/** The live values one opened record is read through. */
interface OpenView {
  id: string;
  kind: string;
  owner: AgentOwner;
  name: string;
  description: string | undefined;
  icon: Icon | undefined;
  model: string | undefined;
  config: Record<string, unknown>;
}

/** One open agent: what built it, and the view a running session reads. */
interface Opened {
  /**
   * The kind object that built it, kept rather than its name: a plugin reload
   * brings a new object for the same name, and a record left on the old one
   * would keep a backend the unloaded module built.
   */
  kind: ServedAgentKind;
  /** The values `open` was handed, updated in place on an edit. */
  view: OpenView;
  /** The backend, which a session holds and reads at its next turn. */
  agent: Agent;
}

/** An agents channel, the commands beside it, and the agents it has open. */
export interface AgentsChannel {
  /** What `servedRecords` takes. */
  channel: RecordsChannel;
  /** `x-ahpd/agents/put`, `remove` and `check`, by name. */
  methods: Record<string, PluginMethod>;
  /**
   * Every stored record as an agent, without taking a fold.
   *
   * The records not open are opened, and the ones open have their views
   * refreshed from disk; the same backend object is answered for a record that
   * is already open, because a session holds it. A record whose kind is not
   * loaded, or whose secrets could not be read, is left out and said.
   */
  agents(): Promise<Agent[]>;
  /** Open every stored record, fold the list into the host, and refresh the channel. */
  openAll(): Promise<void>;
  /** Send every reader what the agents are now. */
  refresh(): Promise<void>;
}

export function agentsChannel(options: AgentsChannelOptions): AgentsChannel {
  /** The owner of each stored agent, as the last read of the collection found it. */
  const owners = new Map<string, AgentOwner | undefined>();
  /** The open agents, by id. An id in the map has a backend a session can hold. */
  const open = new Map<string, Opened>();
  /** What the host knows of each agent's health, by id, in memory only. */
  const healths = new Map<string, AgentHealth>();
  /**
   * The ids the host serves, as of the last fold.
   *
   * Absent until the first fold, so a channel that has not folded yet trusts
   * the kind and the schema rather than calling every record invalid.
   */
  let served: ReadonlySet<string> | undefined;

  const problem = (message: string): void => { options.onProblem?.(`${SCHEME}: ${message}`); };

  /** The config a stored record holds, as an object. */
  const configOf = (record: StoredRecord): Record<string, unknown> => bag(record.config);

  /** The kind a stored record names, when this host serves one. */
  const kindOf = (record: StoredRecord): ServedAgentKind | undefined => options.kinds()[String(record.kind)];

  /** The fields a kind keeps secret: its `writeOnly` fields and its `keyVariables`. */
  const secretFields = (kind: ServedAgentKind): string[] => {
    const fields = new Set(writeOnly(kind.schema));
    for (const variable of kind.keyVariables ?? []) fields.add(`env.${variable}`);
    return [...fields];
  };

  /** Whether a stored config is still one the kind's schema describes. */
  const fits = (config: Record<string, unknown>, schema: Record<string, unknown>): boolean => {
    try {
      options.check(heldAgainst(config, AGENT_SECRETS), schema, 'config');
      return true;
    } catch {
      return false;
    }
  };

  /** The state a stored record is in now. */
  const stateOf = (record: StoredRecord): AgentState => {
    const kind = kindOf(record);
    if (kind === undefined) return 'unavailable';
    if (!fits(configOf(record), kind.schema)) return 'invalid';
    if (served !== undefined && !served.has(record.id)) return 'invalid';
    return 'ready';
  };

  /** One stored record as a client is shown it: its record, its state, and its health where known. */
  const row = (record: StoredRecord): Record<string, unknown> => {
    const health = healths.get(record.id);
    return { ...record, state: stateOf(record), ...(health === undefined ? {} : { health }) };
  };

  /** The values a record is read through, before any secret is read back. */
  const blankView = (record: StoredRecord, owner: AgentOwner): OpenView => ({
    id: record.id,
    kind: String(record.kind),
    owner,
    name: typeof record.name === 'string' ? record.name : record.id,
    description: typeof record.description === 'string' ? record.description : undefined,
    icon: isRecord(record.icon) ? record.icon as unknown as Icon : undefined,
    model: typeof record.model === 'string' ? record.model : undefined,
    config: {},
  });

  /**
   * Put one record's values on one view.
   *
   * The view is the same object `open` was handed, so a running session reads
   * an edit at its next turn: `open` is not called again, and the backend a
   * session holds is not swapped.
   */
  const fill = (view: OpenView, record: StoredRecord, owner: AgentOwner, config: Record<string, unknown>): void => {
    view.id = record.id;
    view.kind = String(record.kind);
    view.owner = owner;
    view.name = typeof record.name === 'string' ? record.name : record.id;
    view.description = typeof record.description === 'string' ? record.description : undefined;
    view.icon = isRecord(record.icon) ? record.icon as unknown as Icon : undefined;
    view.model = typeof record.model === 'string' ? record.model : undefined;
    view.config = config;
  };

  /**
   * Build one record's backend, with each secret read back from the vault.
   *
   * The agent is named by its record: the fold and the served set key on
   * `provider`, while a client names a record by its id, so a backend under
   * another id is refused here rather than served under an id no row has.
   */
  const opened = async (record: StoredRecord, owner: AgentOwner, kind: ServedAgentKind): Promise<Opened> => {
    const config = await resolvedRecord(configOf(record), owner, options.vault(), AGENT_SECRETS);
    const view = blankView(record, owner);
    fill(view, record, owner, config);
    const agent = kind.open(view);
    if (agent.provider !== record.id) {
      throw new Error(`${kind.name} opened ${record.id} as ${agent.provider}, and an agent is served by the id of its record`);
    }
    return { kind, view, agent };
  };

  /** The agent records the store holds, and the owner each names. */
  const stored = async (): Promise<StoredRecord[]> => {
    const records = await options.collection.list();
    owners.clear();
    for (const one of records) owners.set(one.id, asOwner(one.owner));
    return records;
  };

  /**
   * Every stored record as an agent, opening what is not open and refreshing
   * the views of what is.
   *
   * A record already open keeps its backend object, which is what a running
   * session holds: only the view is updated, so an edit reaches the next turn.
   */
  const sync = async (): Promise<Agent[]> => {
    const before = new Map(open);
    const records = await stored();
    const kinds = options.kinds();
    const agents: Agent[] = [];
    const live = new Set<string>();
    for (const record of records) {
      const owner = asOwner(record.owner);
      if (owner === undefined) {
        problem(`${record.id} names no owner, so it is not served`);
        open.delete(record.id);
        continue;
      }
      const kind = kinds[String(record.kind)];
      // A kind nobody registers keeps its records on disk, served as `unavailable`.
      if (kind === undefined) {
        open.delete(record.id);
        continue;
      }
      const entry = open.get(record.id);
      // The kind object, not its name: a reload brings a new object, and the
      // backend the old module built would otherwise serve on.
      if (entry !== undefined && entry.kind === kind) {
        try {
          fill(entry.view, record, owner, await resolvedRecord(configOf(record), owner, options.vault(), AGENT_SECRETS));
        } catch (error) {
          /*
           * The vault was unreadable, which says nothing about the record: the
           * last good view and the backend a session holds are kept, and the
           * record stays served. Ending its sessions over a vault hiccup would
           * take a working agent away for a failure that may pass.
           */
          problem(`${record.id} could not be read, and its last good record is still served: ${reason(error)}`);
        }
        agents.push(entry.agent);
        live.add(record.id);
        continue;
      }
      try {
        const one = await opened(record, owner, kind);
        open.set(record.id, one);
        agents.push(one.agent);
        live.add(record.id);
      } catch (error) {
        problem(`${record.id} could not be opened: ${reason(error)}`);
        open.delete(record.id);
      }
    }
    for (const id of [...open.keys()]) if (!live.has(id)) open.delete(id);
    /*
     * An agent that is gone, or whose kind changed under it, ends its sessions
     * first: the host keeps a backend that still has one open, so a session on
     * an agent this list no longer holds would run on until the daemon stops.
     * An edit of the same kind keeps its agent, and its sessions.
     */
    for (const [id, was] of before) {
      if (open.get(id) === was) continue;
      try {
        await options.endSessionsOf(id);
      } catch (error) {
        problem(`${id}'s sessions could not be ended: ${reason(error)}`);
      }
    }
    return agents;
  };

  /** Take a record list as the host's agents, and keep the ids it serves. */
  const take = async (agents: Agent[]): Promise<void> => {
    served = await options.refold(agents);
  };

  const source = {
    ids: async (): Promise<string[]> => (await stored()).map((one) => one.id).sort(),
    find: async (id: string): Promise<Record<string, unknown> | undefined> => {
      const record = await options.collection.get(id);
      owners.set(id, record === undefined ? undefined : asOwner(record.owner));
      return record === undefined ? undefined : row(record);
    },
  };

  /**
   * Whether this reader sees this row.
   *
   * `agent:all` reads every row, whoever owns it. `agent:list` reads the ones
   * the caller owns, the ones their teams own and the host's. A reader with
   * neither sees nothing, its own agent included.
   */
  const mayRead = (id: string, reader: Principal): boolean => {
    if (reader.can('agent:all' as Grant)) return true;
    if (!reader.can('agent:list' as Grant)) return false;
    const owner = owners.get(id);
    if (owner === undefined) return false;
    if (owner === 'host') return true;
    if (owner.startsWith('user:')) return reader.plugin === undefined && reader.id === owner.slice('user:'.length);
    return onTeam(reader, owner.slice('team:'.length));
  };

  const channel = recordsChannel(SCHEME, source, {
    grant: 'agent:list' as Grant,
    alsoGrant: 'agent:all' as Grant,
    mayRead,
    mayReadEveryReader: true,
    /*
     * A host agent belongs to everyone and to nobody, so the filter leaves it
     * out and `?owner=me` is the caller's own agents.
     */
    ownerOf: (id, record) => {
      const owner = asOwner(record.owner);
      return owner === undefined || owner === 'host' ? undefined : owner;
    },
    describe: () => ({
      title: 'Agents',
      description: 'The agents this host serves, each a record of a kind.',
    }),
    onProblem: problem,
  });

  /** A string param that names one agent, or a refusal saying what the command needs. */
  const idParam = (command: string, params: Record<string, unknown>): string => {
    const id = params.id;
    if (typeof id !== 'string' || !isRecordSlug(id)) {
      throw new RpcError(INVALID_PARAMS, `${command} needs id, the agent's id, a slug such as build`);
    }
    return id;
  };

  /** The agent's name, which the channel owns rather than the kind's schema. */
  const nameParam = (params: Record<string, unknown>, command: string): string => {
    const name = params.name;
    if (typeof name !== 'string' || name.trim() === '') {
      throw new RpcError(INVALID_PARAMS, `${command} needs name, what a client prints for the agent`);
    }
    return name;
  };

  /** One optional string the channel owns, such as the description or the model. */
  const optionalString = (params: Record<string, unknown>, member: string, command: string): string | undefined => {
    const value = params[member];
    if (value !== undefined && typeof value !== 'string') {
      throw new RpcError(INVALID_PARAMS, `${command} takes ${member} as a string`);
    }
    return value as string | undefined;
  };

  /** One optional icon, which is an `Icon` with a source a client can read. */
  const iconParam = (params: Record<string, unknown>, command: string): Icon | undefined => {
    const value = params.icon;
    if (value === undefined) return undefined;
    if (!isRecord(value) || typeof value['src'] !== 'string' || value['src'] === '') {
      throw new RpcError(INVALID_PARAMS, `${command} takes icon as an object with a src, or nothing`);
    }
    return value as unknown as Icon;
  };

  /**
   * Refuse a team's or a person's record that sets a field only the host may.
   *
   * A `hostOnly` field is where a dangerous setting lives, such as a command a
   * backend runs, and the host's own record is the only one whose person is the
   * daemon's.
   */
  const refuseHostOnly = (config: Record<string, unknown>, owner: AgentOwner, kind: ServedAgentKind): void => {
    if (owner === 'host') return;
    for (const field of kind.hostOnly ?? []) {
      if (config[field] !== undefined) {
        throw new RpcError(INVALID_PARAMS, `${field} is a host-only field of ${kind.name}, so only a host agent may set it`);
      }
    }
  };

  /**
   * Refuse a team's or a person's record that sets an `env` variable the kind
   * does not name as a key.
   *
   * A free environment can run a program - `NODE_OPTIONS` is enough - so only
   * the variables a kind lists as key fields may be set by anyone but the host.
   * The key fields themselves are secrets, and the vault keeps their values.
   */
  const refuseEnv = (config: Record<string, unknown>, owner: AgentOwner, kind: ServedAgentKind): void => {
    const env = config.env;
    if (env === undefined) return;
    if (!isRecord(env)) {
      throw new RpcError(INVALID_PARAMS, `${PUT} takes env as an object of variables, or nothing`);
    }
    if (owner === 'host') return;
    const allowed = new Set(kind.keyVariables ?? []);
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) continue;
      if (!allowed.has(name)) {
        throw new RpcError(INVALID_PARAMS, `${name} is not a key variable of ${kind.name}, so only a host agent may set it`);
      }
    }
  };

  /**
   * The commands run one at a time, in the order they arrived.
   *
   * A put reads whether an id is free before it writes, so two of them run
   * together would both find it free and the second would take the first
   * owner's record. A remove, a check and `openAll` rewrite or read the same
   * open list, so they queue behind a put rather than beside it.
   */
  let queue: Promise<unknown> = Promise.resolve();
  const inTurn = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work);
    // The chain moves even when this turn failed, or one refusal would stop
    // every command after it.
    queue = next.then(() => undefined, () => undefined);
    return next;
  };

  const put: PluginMethod = {
    grant: 'agent:put' as Grant,
    describe: () => ({ title: 'Make an agent', description: 'Makes or changes one agent record, and serves it.' }),
    authorize: async (params, reader) => ownerAllows('agent', asOwner(params.owner), reader, 'put'),
    handle: (params, reader) => inTurn(() => putOne(params, reader)),
  };

  /**
   * Make or change one record, once its turn comes.
   *
   * A new record is opened before it is written: a kind that cannot make a
   * backend of it, or makes one under another id, leaves the store and the
   * vault as they were and the answer says why. An edit is left to `sync`,
   * which updates the view `open` was already handed and keeps the backend its
   * sessions hold.
   */
  const putOne = async (params: Record<string, unknown>, reader: Principal | undefined): Promise<unknown> => {
    const id = idParam(PUT, params);
    const kindName = params.kind;
    if (typeof kindName !== 'string' || kindName === '') {
      throw new RpcError(INVALID_PARAMS, `${PUT} needs kind, the name of an agent kind`);
    }
    const kind = options.kinds()[kindName];
    if (kind === undefined) {
      throw new RpcError(INVALID_PARAMS, `${kindName} is not an agent kind this host serves`);
    }
    const owner = asOwner(params.owner);
    if (owner === undefined) {
      throw new RpcError(INVALID_PARAMS, `${PUT} needs owner, one of host, team:<team> or user:<id>`);
    }
    refuseOwner('agent', 'make', owner, reader, 'put');
    const config = params.config ?? {};
    if (!isRecord(config)) {
      throw new RpcError(INVALID_PARAMS, "An agent's config is a JSON object, and that is not one");
    }
    const name = nameParam(params, PUT);
    const description = optionalString(params, 'description', PUT);
    const model = optionalString(params, 'model', PUT);
    const icon = iconParam(params, PUT);
    const before = await options.collection.get(id);
    const was = before === undefined ? undefined : asOwner(before.owner);
    /*
     * An id is unique across every agent, not only across the records: the
     * daemon's own backends and the plugins' keep theirs, and a record under
     * one of those ids would be folded away while its row stayed here. A new
     * record is refused before anything is written.
     */
    if (before === undefined) {
      const holder = options.holderOf?.(id);
      if (holder !== undefined) {
        throw new RpcError(DENIED, `${id} is served by ${holder}, and an agent id is unique`);
      }
    }
    /*
     * An id is unique across every owner, because a client names an agent by
     * it alone: a put never takes one another record holds, and a record
     * written by hand is no exception. Removing that owner's record is the
     * only way to use the id.
     */
    if (before !== undefined && was !== owner) {
      const held = was === undefined ? 'a record written by hand' : `${was}'s`;
      throw new RpcError(DENIED, `${id} is ${held}, and an agent id is unique`);
    }
    refuseHostOnly(config, owner, kind);
    refuseEnv(config, owner, kind);
    // Nothing of another owner's is kept; only the same record's own secrets are.
    const kept = before !== undefined && was === owner ? configOf(before) : {};
    const fields = secretFields(kind);
    try {
      options.check(checkedConfig(config, AGENT_SECRETS, fields, kept), kind.schema, `agent ${id}`);
    } catch (error) {
      throw new RpcError(INVALID_PARAMS, reason(error));
    }
    const moved = await moveRecordSecrets({
      rules: AGENT_SECRETS,
      fields,
      config,
      held: kept,
      owner,
      id,
      vault: options.vault(),
      problem,
    });
    const record: StoredRecord = {
      id,
      kind: kindName,
      owner,
      name,
      ...(description === undefined ? {} : { description }),
      ...(icon === undefined ? {} : { icon }),
      ...(model === undefined ? {} : { model }),
      config: moved,
    };
    let built: Opened | undefined;
    if (before === undefined) {
      try {
        built = await opened(record, owner, kind);
      } catch (error) {
        // The record was not written, so the secrets moved for it go back out:
        // a vault entry no record names would outlive the refusal.
        await forgetRecordSecrets(moved, owner, id, AGENT_SECRETS, options.vault(), problem);
        const why = reason(error);
        problem(`${id} was not stored: ${why}`);
        throw new RpcError(INTERNAL_ERROR, `${id} was not stored: ${why}`);
      }
    }
    await options.collection.put(record);
    owners.set(id, owner);
    if (built !== undefined) open.set(id, built);
    try {
      await take(await sync());
    } catch (error) {
      await channel.refresh();
      throw new RpcError(INTERNAL_ERROR, `${id} is stored, but the host did not take it: ${reason(error)}`);
    }
    await channel.refresh();
    return row(record);
  };

  const remove: PluginMethod = {
    grant: 'agent:remove' as Grant,
    describe: () => ({ title: 'Remove an agent', description: 'Ends the sessions on one agent and takes its record out.' }),
    authorize: async (params, reader) => {
      const id = params.id;
      if (typeof id !== 'string') return false;
      if (reader?.can('agent:all' as Grant) === true) return true;
      const before = await options.collection.get(id);
      return before !== undefined && ownerAllows('agent', asOwner(before.owner), reader, 'remove');
    },
    handle: (params, reader) => inTurn(async () => {
      const id = idParam(REMOVE, params);
      const before = await options.collection.get(id);
      if (before === undefined) throw new RpcError(INVALID_PARAMS, `${SCHEME} holds no ${id}`);
      const owner = asOwner(before.owner);
      /*
       * A record naming no scope is one written by hand, and only a caller the
       * gate let through with `agent:remove` reaches it; a record that names one
       * is the owner's, and the gate's grant does not widen that. `agent:all`
       * is the one grant that does: it reads and removes any agent, whoever
       * owns it, which is what an operator's role is given.
       */
      if (owner !== undefined && reader?.can('agent:all' as Grant) !== true) {
        refuseOwner('agent', 'remove', owner, reader, 'remove');
      }
      /*
       * The sessions go first: `host.replace` keeps a backend that still has a
       * session open, and a record removed beside a live session would come
       * back the moment the fold was taken.
       */
      await options.endSessionsOf(id);
      await forgetRecordSecrets(configOf(before), owner, id, AGENT_SECRETS, options.vault(), problem);
      await options.collection.remove(id);
      owners.delete(id);
      open.delete(id);
      healths.delete(id);
      try {
        await take(await sync());
      } catch (error) {
        await channel.refresh();
        throw new RpcError(INTERNAL_ERROR, `${id} is removed, but the host did not take the new list: ${reason(error)}`);
      }
      await channel.refresh();
      return {};
    }),
  };

  /** One probe, or `unreachable` when it takes more than the limit to answer. */
  const within = async (probe: Promise<unknown>): Promise<'ok' | 'unreachable'> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<'unreachable'>((done) => {
      timer = setTimeout(() => { done('unreachable'); }, CHECK_LIMIT_MS);
      timer.unref?.();
    });
    try {
      return await Promise.race([probe.then(() => 'ok' as const), late]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };

  /*
   * The check command takes what a put takes: who may change an agent may test
   * it. The owner's rule is asked here, as a put asks it, because a grant that
   * reads the channel says nothing about another person's agent.
   */
  const check: PluginMethod = {
    grant: 'agent:put' as Grant,
    describe: () => ({ title: 'Check an agent', description: "Builds one agent's backend and asks its probe, then answers the row." }),
    authorize: async (params, reader) => {
      const id = params.id;
      if (typeof id !== 'string') return false;
      const before = await options.collection.get(id);
      return before !== undefined && ownerAllows('agent', asOwner(before.owner), reader, 'put');
    },
    handle: (params, reader) => inTurn(async () => {
      const id = idParam(CHECK, params);
      const before = await options.collection.get(id);
      if (before === undefined) throw new RpcError(INVALID_PARAMS, `${SCHEME} holds no ${id}`);
      const owner = asOwner(before.owner);
      if (owner !== undefined) refuseOwner('agent', 'check', owner, reader, 'put');
      const kind = kindOf(before);
      if (kind === undefined) {
        throw new RpcError(INVALID_PARAMS, `${id} is a ${String(before.kind)}, and this host serves no such kind`);
      }
      if (owner === undefined) {
        throw new RpcError(INVALID_PARAMS, `${id} names no owner, so it cannot be opened`);
      }
      let health: AgentHealth;
      try {
        const one = await opened(before, owner, kind);
        const probe = one.agent.probe;
        const result = typeof probe === 'function' ? await within(probe.call(one.agent)) : 'ok';
        health = { result, at: new Date().toISOString() };
      } catch (error) {
        const message = reason(error);
        health = { result: 'failed', at: new Date().toISOString(), ...(message === '' ? {} : { message }) };
      }
      healths.set(id, health);
      await channel.refresh();
      return row(before);
    }),
  };

  const methods: Record<string, PluginMethod> = { [PUT]: put, [REMOVE]: remove, [CHECK]: check };

  return {
    channel,
    methods,
    agents: () => inTurn(() => sync()),
    openAll: () => inTurn(async () => {
      /*
       * A start does not wait for a record it cannot serve: the host serves
       * what opened, and the record stays on disk with the failure said.
       */
      try {
        await take(await sync());
      } catch (error) {
        problem(`the agent records could not be served: ${reason(error)}`);
      }
      await channel.refresh();
    }),
    refresh: () => channel.refresh(),
  };
}
