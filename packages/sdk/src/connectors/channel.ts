/**
 * `x-ahpd-connectors`: the connectors made from the adapters a host serves.
 *
 * One row for each stored connector, keyed by the connector's id, holding the
 * record as it is kept and a `state`: `open`, `invalid` when its config no
 * longer fits the adapter's schema or its adapter refused to open it, or
 * `unavailable` when no plugin registers its adapter any more. The adapters
 * themselves are listed on `x-ahpd-adapters`.
 *
 * Where an adapter's schema marks a field `writeOnly`, the value is a secret. A
 * put moves it to the vault under `connector/<id>/<field>` in the owner's
 * scope and keeps a `{ "$secret": "<name>" }` in the record instead, so a
 * listing, a snapshot, an answer and the log never carry it. A field sent
 * empty keeps the secret the record already had, because a client is never
 * given one to send back.
 *
 * Two commands change a connector. `x-ahpd/connectors/put` takes
 * `{ id, adapter, owner, title?, config }`, checks `config` against the
 * adapter's schema, closes the connector with that id, writes the record, and
 * calls the adapter's `open` with each secret read back.
 * `x-ahpd/connectors/remove` takes `{ id }`, closes it, takes its secrets out
 * of the vault and takes the record out. Both answer the row a client now
 * holds.
 *
 * `connector:list` reads the caller's own connectors, their teams' and the
 * host's; `connector:all` reads every connector. A caller with neither reads
 * no connector, its own included. A connector of an adapter no plugin
 * registers stays on disk and is served as `unavailable`: a disabled plugin
 * keeps its connectors.
 */

import { INVALID_PARAMS, INTERNAL_ERROR, RpcError } from '../rpc.js';
import { sameOwnerOrHost } from '../automations/automations.js';
import { scopeOf, secretRef } from '../access/vault.js';
import { isRecordSlug } from '../resources/records.js';
import { recordsChannel, type RecordsChannel } from '../resources/recordschannel.js';
import { membership } from '../usage/scopes.js';
import { bag, isRecord, reason } from '../utils/values.js';
import type { Connector, ConnectorOwner, ConnectorRef, ServedAdapter } from '../types/connectors.js';
import type { PluginMethod } from '../types/plugin.js';
import type { RecordCollection, StoredRecord } from '../types/records.js';
import type { Grant, Principal } from '../types/users.js';
import type { Owner } from '../types/usage.js';
import type { Vault } from '../types/vault.js';

/** The channel's scheme, and the domain its two commands are named under. */
const SCHEME = 'x-ahpd-connectors';
const DOMAIN = 'x-ahpd/connectors';
const PUT = `${DOMAIN}/put`;
const REMOVE = `${DOMAIN}/remove`;

/** What a client is shown in place of a secret, which is also what the schema is held against. */
const HELD = '<set>';

/** The gate's code for a grant a caller does not hold. */
const DENIED = -32009;

/** The three states a connector row can be in. */
export type ConnectorState = 'open' | 'invalid' | 'unavailable';

/** How a connectors channel reads its store, and who it writes a secret for. */
export interface ConnectorsChannelOptions {
  /** The `connectors` collection: one JSON record for each connector. */
  collection: RecordCollection;
  /**
   * The adapters the plugins registered, read at each call.
   *
   * Read through a function because the adapters are known only after the
   * load, and a channel built before it would hold none.
   */
  adapters(): Record<string, ServedAdapter>;
  /** The vault a secret is written to, and read back from when an adapter opens. */
  vault(): Vault | undefined;
  /**
   * Check one value against an adapter's schema, throwing the first finding.
   *
   * Taken as an option rather than imported: the sdk takes no third-party
   * runtime, and the schema checker the daemon uses belongs to the server.
   */
  check(value: unknown, schema: Record<string, unknown>, label: string): void;
  /**
   * One automation a schema field may name, by id, read at each put.
   *
   * A field marked `x-ahpd-automation: true` names one of these, and a put is
   * refused when it names none or one the connector's owner may not read.
   * Absent on a host with no automations store, which checks no reference.
   */
  automations?(id: string): { owner?: Owner | undefined } | undefined;
  /** Where a connector that could not be opened is said. */
  onProblem?(message: string): void;
}

/** A connectors channel, the commands beside it, and the connectors it has open. */
export interface ConnectorsChannel {
  /** What `servedRecords` takes. */
  channel: RecordsChannel;
  /** `x-ahpd/connectors/put` and `remove`, by name. */
  methods: Record<string, PluginMethod>;
  /** Send every reader what the connectors are now. */
  refresh(): Promise<void>;
  /**
   * Every stored connector as a save that may name one reads it, as of the
   * last read of the collection.
   *
   * Id, adapter and owner, synchronously - what an automation's save is checked
   * against, which cannot wait for a collection that answers later. Filled by
   * every listing and by this channel's own puts and removes.
   */
  refs(): readonly ConnectorRef[];
  /** Open every stored connector of a registered adapter, as a start does. */
  openAll(): Promise<void>;
}

export function connectorsChannel(options: ConnectorsChannelOptions): ConnectorsChannel {
  /** The owner of each stored connector, as the last read of the collection found it. */
  const owners = new Map<string, ConnectorOwner | undefined>();
  /** The same connectors as a reference is checked against: id, adapter and owner. */
  const known = new Map<string, ConnectorRef>();
  /** What stops each open connector, by id; an id in the map was opened. */
  const open = new Map<string, (() => void | Promise<void>) | undefined>();

  const problem = (message: string): void => { options.onProblem?.(`${SCHEME}: ${message}`); };

  /** The config a stored record holds, as an object. */
  const configOf = (record: StoredRecord): Record<string, unknown> => bag(record.config);

  /** A value as a connector's owner, or nothing when it names no scope. */
  const asOwner = (value: unknown): ConnectorOwner | undefined =>
    (typeof value === 'string' && /^(?:host|team:[^/]+|user:[^/]+)$/u.test(value) ? value as ConnectorOwner : undefined);

  /** The name a moved secret is kept under, in the owner's scope. */
  const secretNameOf = (owner: ConnectorOwner, id: string, field: string): string => {
    const rest = `connector/${id}/${field}`;
    if (owner === 'host') return `host:${rest}`;
    return `${owner}/${rest}`;
  };

  /** Whether this reader is on this team, by the same rule a team secret is written by. */
  const onTeam = (reader: Principal, team: string): boolean =>
    (reader.memberships ?? []).some((one) => membership(one)?.team === team);

  /**
   * Whether this reader may make or remove a connector of this owner.
   *
   * Every owner takes `connector:put` to be made and `connector:remove` to be
   * removed. A `host` connector then takes `connector:host` as well. A
   * `team:<team>` connector takes a membership of that team. A `user:<id>`
   * connector is that person's own, and takes the caller to be that person. No
   * reader is the root connection or a host with no users directory, and both
   * are the daemon itself. A caller holding `config:write` is not let into a
   * host's, a team's or a person's connector by it, which is why this is asked
   * again in `handle` and not only by the gate.
   */
  const ownerAllows = (owner: ConnectorOwner | undefined, reader: Principal | undefined, verb: 'put' | 'remove'): boolean => {
    if (reader === undefined) return true;
    if (owner === undefined) return false;
    if (!reader.can(`connector:${verb}` as Grant)) return false;
    if (owner === 'host') return reader.can('connector:host' as Grant);
    if (owner.startsWith('user:')) return reader.plugin === undefined && reader.id === owner.slice('user:'.length);
    return onTeam(reader, owner.slice('team:'.length));
  };

  /** Refuse one caller the owner's rule keeps out. */
  const refuseOwner = (doing: string, owner: ConnectorOwner, reader: Principal | undefined, verb: 'put' | 'remove'): void => {
    if (ownerAllows(owner, reader, verb)) return;
    throw new RpcError(DENIED, `${owner} is not ${reader?.id ?? 'this connection'}'s to ${doing}`);
  };

  /** The fields an adapter's schema marks `writeOnly`: the values that are secrets. */
  const writeOnly = (schema: Record<string, unknown>): string[] => {
    const properties = bag(schema['properties']);
    return Object.entries(properties)
      .filter(([, one]) => isRecord(one) && one['writeOnly'] === true)
      .map(([field]) => field);
  };

  /**
   * A config with each moved secret stood in for by what a client is shown.
   *
   * A schema says a secret field is a string, and the record holds a reference
   * object instead. The reference is checked as `HELD`, so the rules a person
   * filled the value in under are asked of the record and a value nobody may
   * read is never read to ask them.
   */
  const heldAgainst = (config: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...config };
    for (const [field, value] of Object.entries(out)) {
      if (secretRef(value) !== undefined) out[field] = HELD;
    }
    return out;
  };

  /** Whether a stored config is still one the adapter's schema describes. */
  const fits = (config: Record<string, unknown>, schema: Record<string, unknown>): boolean => {
    try {
      options.check(heldAgainst(config), schema, 'config');
      return true;
    } catch {
      return false;
    }
  };

  /** The state a stored connector is in now. */
  const stateOf = (record: StoredRecord): ConnectorState => {
    const adapter = options.adapters()[String(record.adapter)];
    if (adapter === undefined) return 'unavailable';
    if (!fits(configOf(record), adapter.schema)) return 'invalid';
    return open.has(record.id) ? 'open' : 'invalid';
  };

  /** One stored connector as a client is shown it: its record, and the state it is in. */
  const connectorRow = (record: StoredRecord): Record<string, unknown> => ({ ...record, state: stateOf(record) });

  /** The connector records the store holds, and the owner each names. */
  const stored = async (): Promise<StoredRecord[]> => {
    const records = await options.collection.list();
    owners.clear();
    known.clear();
    for (const one of records) {
      owners.set(one.id, asOwner(one.owner));
      known.set(one.id, { id: one.id, adapter: String(one.adapter), owner: asOwner(one.owner) });
    }
    return records;
  };

  /** The fields an adapter's schema marks `x-ahpd-automation`: the ones that name an automation. */
  const automationFields = (schema: Record<string, unknown>): string[] =>
    Object.entries(bag(schema['properties']))
      .filter(([, one]) => isRecord(one) && one['x-ahpd-automation'] === true)
      .map(([field]) => field);

  /**
   * Refuse a config naming an automation this connector's owner may not read.
   *
   * Read off the adapter's schema rather than the config, so a field the
   * adapter marks and the client left out is no reference at all - the schema's
   * own rules say whether it was required.
   */
  const checkAutomationLinks = (adapter: ServedAdapter, config: Record<string, unknown>, owner: ConnectorOwner): void => {
    const lookup = options.automations;
    if (lookup === undefined) return;
    for (const field of automationFields(adapter.schema)) {
      const named = config[field];
      if (named === undefined || named === '') continue;
      if (typeof named !== 'string') {
        throw new RpcError(INVALID_PARAMS, `A connector's ${field} names an automation, so it is sent as its id`);
      }
      const found = lookup(named);
      if (found === undefined) {
        throw new RpcError(INVALID_PARAMS, `${field} names ${named}, and this host holds no such automation`);
      }
      if (!sameOwnerOrHost(owner, found.owner)) {
        throw new RpcError(INVALID_PARAMS, `${field} names ${named}, which belongs to ${found.owner ?? 'the host'}, so ${owner} may not start it`);
      }
    }
  };

  const source = {
    ids: async (): Promise<string[]> => (await stored()).map((one) => one.id).sort(),
    find: async (id: string): Promise<Record<string, unknown> | undefined> => {
      const record = await options.collection.get(id);
      owners.set(id, record === undefined ? undefined : asOwner(record.owner));
      return record === undefined ? undefined : connectorRow(record);
    },
  };

  /**
   * Whether this reader sees this row without the channel's `connector:all`.
   *
   * `connector:all` reads every connector. `connector:list` reads the ones the
   * caller owns, the ones their teams own and the host's. A reader holding
   * neither sees nothing, its own connector included.
   */
  const mayRead = (id: string, reader: Principal): boolean => {
    if (reader.can('connector:all' as Grant)) return true;
    if (!reader.can('connector:list' as Grant)) return false;
    const owner = owners.get(id);
    if (owner === undefined) return false;
    if (owner === 'host') return true;
    if (owner.startsWith('user:')) return reader.plugin === undefined && reader.id === owner.slice('user:'.length);
    return onTeam(reader, owner.slice('team:'.length));
  };

  const channel = recordsChannel(SCHEME, source, {
    /*
     * `connector:all` is the channel's own gate, because it is the grant that
     * reads every row. A holder of `connector:list` is let in by `authorize`
     * and then sees the rows `mayRead` allows.
     */
    grant: 'connector:all' as Grant,
    mayRead,
    /*
     * A host connector belongs to everyone and to nobody, so the filter leaves
     * it out and `?owner=me` is the caller's own connectors.
     */
    ownerOf: (id, record) => {
      const owner = asOwner(record.owner);
      return owner === undefined || owner === 'host' ? undefined : owner;
    },
    describe: () => ({
      title: 'Connectors',
      description: 'The connectors made from the adapters this host serves.',
    }),
    onProblem: problem,
  });

  /** The config an adapter is opened with: each reference read back from the vault. */
  const resolved = async (config: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const out: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(config)) {
      const name = secretRef(value);
      if (name === undefined) { out[field] = value; continue; }
      const held = await options.vault()?.get(name);
      if (held === undefined) throw new Error(`the vault holds no ${name}`);
      out[field] = held;
    }
    return out;
  };

  /** Stop one open connector, if it is open. A close that fails is said and not thrown. */
  const close = async (id: string): Promise<void> => {
    const stop = open.get(id);
    open.delete(id);
    if (stop === undefined) return;
    try {
      await stop();
    } catch (error) {
      problem(`${id} could not be closed: ${reason(error)}`);
    }
  };

  /** Open one stored connector through its adapter, and keep what stops it. */
  const openOne = async (adapter: ServedAdapter, record: StoredRecord, owner: ConnectorOwner): Promise<void> => {
    const config = configOf(record);
    options.check(heldAgainst(config), adapter.schema, `connector ${record.id}`);
    const connector: Connector = {
      id: record.id,
      adapter: adapter.name,
      owner,
      ...(typeof record.title === 'string' ? { title: record.title } : {}),
      config: await resolved(config),
    };
    await close(record.id);
    const stop = adapter.open(connector);
    open.set(record.id, stop === undefined ? undefined : stop);
  };

  /**
   * The config a put keeps: each secret moved, and a reference kept in its place.
   *
   * `held` is what the record held before, and it is read only when the owner
   * is the same: a connector that changed hands takes none of its old secrets
   * with it. A field sent empty keeps the secret it already had, because a
   * client is never given one to send back; a field left out drops its secret,
   * which is what a record written whole does.
   */
  const moveSecrets = async (
    adapter: ServedAdapter,
    config: Record<string, unknown>,
    held: Record<string, unknown>,
    owner: ConnectorOwner,
    id: string,
    vault: Vault | undefined,
  ): Promise<Record<string, unknown>> => {
    const out: Record<string, unknown> = { ...config };
    for (const field of writeOnly(adapter.schema)) {
      const value = config[field];
      const was = secretRef(held[field]);
      const mine = was !== undefined && was === secretNameOf(owner, id, field);
      if (value === undefined) {
        delete out[field];
        if (mine) await forget(vault, was, id);
        continue;
      }
      if (secretRef(value) !== undefined) {
        throw new RpcError(INVALID_PARAMS, `A connector's ${field} is a secret: send its value, not a reference to it`);
      }
      if (value === '') {
        if (!mine) { delete out[field]; continue; }
        out[field] = { $secret: was };
        continue;
      }
      if (typeof value !== 'string') {
        throw new RpcError(INVALID_PARAMS, `A connector's ${field} is a secret, so it is sent as a string`);
      }
      const name = secretNameOf(owner, id, field);
      try {
        scopeOf(name);
      } catch (error) {
        throw new RpcError(INVALID_PARAMS, reason(error));
      }
      if (vault === undefined) throw new RpcError(INTERNAL_ERROR, 'This host has no vault, so a secret cannot be kept');
      await vault.set(name, value);
      out[field] = { $secret: name };
    }
    return out;
  };

  /** Take one secret out of the vault, saying so and going on when the store refuses. */
  const forget = async (vault: Vault | undefined, name: string, id: string): Promise<void> => {
    if (vault === undefined) return;
    try {
      await vault.delete(name);
    } catch (error) {
      problem(`${id}'s secret ${name} could not be taken out: ${reason(error)}`);
    }
  };

  /** Take every secret a removed record names out, and only the ones this connector put there. */
  const forgetAll = async (record: StoredRecord, owner: ConnectorOwner | undefined, id: string): Promise<void> => {
    const config = configOf(record);
    for (const field of Object.keys(config)) {
      const name = secretRef(config[field]);
      if (name === undefined) continue;
      if (owner !== undefined && name !== secretNameOf(owner, id, field)) continue;
      await forget(options.vault(), name, id);
    }
  };

  /** A string param that names one connector, or a refusal saying what the command needs. */
  const idParam = (command: string, params: Record<string, unknown>): string => {
    const id = params.id;
    if (typeof id !== 'string' || !isRecordSlug(id)) {
      throw new RpcError(INVALID_PARAMS, `${command} needs id, the connector's id, a slug such as ci-deploys`);
    }
    return id;
  };

  const put: PluginMethod = {
    grant: 'connector:put' as Grant,
    describe: () => ({ title: 'Make a connector', description: 'Makes or changes one connector, and opens it.' }),
    authorize: async (params, reader) => ownerAllows(asOwner(params.owner), reader, 'put'),
    handle: async (params, reader) => {
      const id = idParam(PUT, params);
      const adapterName = params.adapter;
      if (typeof adapterName !== 'string' || adapterName === '') {
        throw new RpcError(INVALID_PARAMS, `${PUT} needs adapter, the name of an adapter`);
      }
      const adapter = options.adapters()[adapterName];
      if (adapter === undefined) {
        throw new RpcError(INVALID_PARAMS, `${adapterName} is not an adapter this host serves`);
      }
      const owner = asOwner(params.owner);
      if (owner === undefined) {
        throw new RpcError(INVALID_PARAMS, `${PUT} needs owner, one of host, team:<team> or user:<id>`);
      }
      refuseOwner('make', owner, reader, 'put');
      const config = params.config ?? {};
      if (!isRecord(config)) {
        throw new RpcError(INVALID_PARAMS, "A connector's config is a JSON object, and that is not one");
      }
      const title = params.title;
      if (title !== undefined && typeof title !== 'string') {
        throw new RpcError(INVALID_PARAMS, `${PUT} takes title as a string`);
      }
      const before = await options.collection.get(id);
      const was = before === undefined ? undefined : asOwner(before.owner);
      /*
       * An id that is taken is its owner's: a put that names another owner
       * takes it from them, which is a remove for the owner it leaves. A
       * record naming no scope was written by hand, and takes
       * `connector:remove`, as its remove does.
       */
      const moving = before !== undefined && was !== owner;
      if (moving && was !== undefined) refuseOwner('take', was, reader, 'remove');
      if (moving && was === undefined && reader !== undefined && !reader.can('connector:remove' as Grant)) {
        throw new RpcError(DENIED, `${id} is not ${reader.id}'s to take`);
      }
      // Nothing of an old owner's is kept, so nothing of it is read either.
      const kept = before !== undefined && was === owner ? configOf(before) : {};
      /*
       * What the client sent, with a secret it kept stood in for by `HELD`: the
       * rules are asked of what a person filled in, and an empty field that
       * keeps a secret is not refused for being empty.
       */
      const checked: Record<string, unknown> = { ...config };
      for (const field of writeOnly(adapter.schema)) {
        if (checked[field] === '' && secretRef(kept[field]) !== undefined) checked[field] = HELD;
      }
      try {
        options.check(checked, adapter.schema, `connector ${id}`);
      } catch (error) {
        throw new RpcError(INVALID_PARAMS, reason(error));
      }
      checkAutomationLinks(adapter, config, owner);
      const moved = await moveSecrets(adapter, config, kept, owner, id, options.vault());
      const record: StoredRecord = {
        id,
        adapter: adapterName,
        owner,
        ...(title === undefined ? {} : { title }),
        config: moved,
      };
      await close(id);
      await options.collection.put(record);
      owners.set(id, owner);
      known.set(id, { id, adapter: adapterName, owner });
      // The secrets kept under the owner it left are no record's any more.
      if (moving && was !== undefined) await forgetAll(before, was, id);
      try {
        await openOne(adapter, record, owner);
      } catch (error) {
        await channel.refresh();
        throw new RpcError(INTERNAL_ERROR, `${id} is stored, but ${adapterName} could not open it: ${reason(error)}`);
      }
      await channel.refresh();
      return connectorRow(record);
    },
  };

  const remove: PluginMethod = {
    grant: 'connector:remove' as Grant,
    describe: () => ({ title: 'Remove a connector', description: 'Closes one connector and takes it out.' }),
    authorize: async (params, reader) => {
      const id = params.id;
      if (typeof id !== 'string') return false;
      const before = await options.collection.get(id);
      return before !== undefined && ownerAllows(asOwner(before.owner), reader, 'remove');
    },
    handle: async (params, reader) => {
      const id = idParam(REMOVE, params);
      const before = await options.collection.get(id);
      if (before === undefined) throw new RpcError(INVALID_PARAMS, `${SCHEME} holds no ${id}`);
      const owner = asOwner(before.owner);
      /*
       * A record naming no scope is one written by hand, and only a caller the
       * gate let through with `connector:remove` reaches it; a record that
       * names one is the owner's, and the gate's grant does not widen that.
       */
      if (owner !== undefined) refuseOwner('remove', owner, reader, 'remove');
      await close(id);
      await forgetAll(before, owner, id);
      await options.collection.remove(id);
      owners.delete(id);
      known.delete(id);
      await channel.refresh();
      return {};
    },
  };

  const methods: Record<string, PluginMethod> = { [PUT]: put, [REMOVE]: remove };

  return {
    channel,
    methods,
    refresh: () => channel.refresh(),
    refs: () => [...known.values()],
    /*
     * Every stored connector of a registered adapter, in id order, so two
     * connectors that answer on one URL open the same way on every start.
     */
    openAll: async () => {
      const adapters = options.adapters();
      for (const record of [...(await stored())].sort((one, two) => one.id.localeCompare(two.id))) {
        const owner = owners.get(record.id);
        const adapter = adapters[String(record.adapter)];
        if (owner === undefined) {
          problem(`${record.id} names no owner, so it is not opened`);
          continue;
        }
        // An adapter nobody registers keeps its connectors on disk, served as `unavailable`.
        if (adapter === undefined) continue;
        try {
          await openOne(adapter, record, owner);
        } catch (error) {
          problem(`${record.id} could not be opened: ${reason(error)}`);
        }
      }
      await channel.refresh();
    },
  };
}
