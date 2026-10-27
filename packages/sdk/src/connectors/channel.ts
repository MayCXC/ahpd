/**
 * `x-ahpd-connectors`: the connectors made from the adapters a host serves.
 *
 * One row for each stored connector, keyed by the connector's id, holding the
 * record as it is kept and a `state`: `ready`, `invalid` when its config no
 * longer fits the adapter's schema or its adapter refused to open it, or
 * `unavailable` when no plugin registers its adapter any more. The adapters
 * themselves are listed on `x-ahpd-adapters`.
 *
 * A row also carries a `health`, when the host knows one: the last check the
 * adapter gave, the last call the connector made or answered, and the last
 * call that failed. Health is in memory only, so a restart clears it and the
 * checks at start fill the first part again.
 *
 * Where an adapter's schema marks a field `writeOnly`, the value is a secret. A
 * put moves it to the vault under `connector/<id>/<field>` in the owner's
 * scope and keeps a `{ "$secret": "<name>" }` in the record instead, so a
 * listing, a snapshot, an answer and the log never carry it. A field sent
 * empty keeps the secret the record already had, because a client is never
 * given one to send back. A host connector's field may hold
 * `{ "fromEnv": "<NAME>" }` instead, which the host reads from its own
 * environment when it opens the connector; a team's or a person's connector
 * that names one is refused.
 *
 * Three commands serve a connector. `x-ahpd/connectors/put` takes
 * `{ id, adapter, owner, title?, config }`, checks `config` against the
 * adapter's schema, closes the connector with that id, writes the record, calls
 * the adapter's `open` with each secret read back, and waits for its `check`.
 * `x-ahpd/connectors/remove` takes `{ id }`, closes it, takes its secrets out
 * of the vault and takes the record out. Both answer the row a client now
 * holds. `x-ahpd/connectors/check` takes `{ id }`, runs the adapter's `check`
 * again and answers the row, so a person who fixed the service side sees the
 * connector work without saving it again.
 *
 * `connector:list` reads the caller's own connectors, their teams' and the
 * host's; `connector:all` reads every connector. A caller with neither reads
 * no connector, its own included. A connector of an adapter no plugin
 * registers stays on disk and is served as `unavailable`: a disabled plugin
 * keeps its connectors.
 */

import { INVALID_PARAMS, INTERNAL_ERROR, RpcError } from '../rpc.js';
import { sameOwnerOrHost } from '../automations/automations.js';
import { fromEnvRef, secretRef } from '../access/vault.js';
import {
  CONNECTOR_SECRETS,
  DENIED,
  HELD,
  asOwner,
  forgetAll as forgetRecordSecrets,
  heldAgainst as heldSecrets,
  moveSecrets as moveRecordSecrets,
  onTeam,
  ownerAllows,
  refuseOwner,
  resolved as resolvedRecord,
  writeOnly,
} from '../channels/owners.js';
import { isRecordSlug } from '../resources/records.js';
import { recordsChannel, type RecordsChannel } from '../resources/recordschannel.js';
import { bag, isRecord, reason } from '../utils/values.js';
import type { CallOutcome, CheckResult, Connector, ConnectorHealth, ConnectorOwner, ConnectorRef, ProviderConnector, ServedAdapter } from '../types/connectors.js';
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
const CHECK = `${DOMAIN}/check`;

/** How long a check may take before its connector is called `unreachable`. */
const CHECK_LIMIT_MS = 10_000;

/** The most of an error message a health entry keeps. */
const HEALTH_MESSAGE_LIMIT = 500;

/** The least time between two refreshes that a call outcome sends. */
const NOTE_REFRESH_MS = 1000;

/** The three states a connector row can be in. */
export type ConnectorState = 'ready' | 'invalid' | 'unavailable';

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

/** One open connector: what `open` was handed, and what stops it. */
interface Opened {
  /** The connector as it was opened, secrets read back from the vault. */
  connector: Connector;
  /** What stops it, or nothing where the adapter answered nothing to stop. */
  stop?: () => void | Promise<void>;
}

/** A connectors channel, the commands beside it, and the connectors it has open. */
export interface ConnectorsChannel {
  /** What `servedRecords` takes. */
  channel: RecordsChannel;
  /** `x-ahpd/connectors/put` and `remove`, by name. */
  methods: Record<string, PluginMethod>;
  /**
   * Run one action on one open connector for one reader.
   *
   * The connector has to be open, its adapter has to declare an `action` of
   * that name and have a `run`, and the reader has to pass `mayRead` - the
   * same answer a listing gives, asked again at each call so a remove or a
   * lost grant takes hold at once. A reader of nothing is the daemon itself,
   * as it is for a read. `files` is the calling session's attachments folder,
   * when its store keeps one, which the adapter's `run` gets as `call.files`.
   * The answer is the adapter's own, passed on unchanged.
   */
  run(id: string, reader: Principal | undefined, action: string, input: Record<string, unknown>, files?: string): Promise<unknown>;
  /**
   * Record the outcome of one call for one connector, as `run` and a host part
   * do.
   *
   * It sets `lastCall`, and `lastFailure` too when the call failed. An error
   * is cut to 500 characters. The rows that carry it go out at most once a
   * second.
   */
  note(id: string, outcome: { ok: boolean; status?: number; error?: string }): void;
  /**
   * Every open connector whose adapter serves models, and how to call it.
   *
   * The answer is what the model proxy routes over: each open connector of an
   * adapter with a `provider`, with its id, adapter, owner and the
   * `ModelProvider` the adapter answers from the resolved config. A provider
   * that throws leaves its connector out, and the problem is said once.
   * An adapter with a `models` adds a `models()` bound to that open connector,
   * so its list is read from the resolved config and the key stays here.
   * Nothing sends this answer: it is for the host, and a key can be in it.
   */
  providers(): ProviderConnector[];
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
  const open = new Map<string, Opened>();
  /** What the host knows of each open connector's health, by id, in memory only. */
  const healths = new Map<string, ConnectorHealth>();
  /** The provider problems already said, so a route on every call says each one once. */
  const providerProblems = new Set<string>();

  const problem = (message: string): void => { options.onProblem?.(`${SCHEME}: ${message}`); };

  /** The config a stored record holds, as an object. */
  const configOf = (record: StoredRecord): Record<string, unknown> => bag(record.config);

  /**
   * A config with each moved secret stood in for by what a client is shown.
   *
   * A schema says a secret field is a string, and the record holds a reference
   * object instead. The reference is checked as `HELD`, so the rules a person
   * filled the value in under are asked of the record and a value nobody may
   * read is never read to ask them.
   */
  const heldAgainst = (config: Record<string, unknown>): Record<string, unknown> => heldSecrets(config, CONNECTOR_SECRETS);

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
    return open.has(record.id) ? 'ready' : 'invalid';
  };

  /**
   * One stored connector as a client is shown it: its record, its state, and
   * its health where the host knows any.
   */
  const connectorRow = (record: StoredRecord): Record<string, unknown> => {
    const health = healths.get(record.id);
    return { ...record, state: stateOf(record), ...(health === undefined ? {} : { health }) };
  };

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
   * Whether this reader sees this row, asked of every reader.
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
     * `connector:list` is the channel's own gate, because a person who may
     * make their own connector holds it. Every reader's rows go through
     * `mayRead`, the gate holder included, so `connector:list` reads its own,
     * its teams' and the host's and no one else's. `connector:all` reads every
     * row and is let in by `authorize` without `connector:list`.
     */
    grant: 'connector:list' as Grant,
    mayRead,
    mayReadEveryReader: true,
    alsoGrant: 'connector:all' as Grant,
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

  /** One check, or `unreachable` when it takes more than the limit to answer. */
  const within = async (check: Promise<CheckResult>): Promise<CheckResult> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<CheckResult>((done) => {
      timer = setTimeout(() => { done({ result: 'unreachable' }); }, CHECK_LIMIT_MS);
      timer.unref?.();
    });
    try {
      return await Promise.race([check, late]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };

  /**
   * Ask one open connector's adapter whether it works, and keep the answer.
   *
   * A connector that is not open, or whose adapter has no check, is asked
   * nothing and answers `undefined`. A check that throws is `failed` with its
   * message, and one that has not answered in ten seconds is `unreachable`.
   */
  const checkOne = async (id: string): Promise<CheckResult | undefined> => {
    const entry = open.get(id);
    if (entry === undefined) return undefined;
    const adapter = options.adapters()[entry.connector.adapter];
    if (adapter === undefined || typeof adapter.check !== 'function') return undefined;
    const check = adapter.check.bind(adapter);
    let result: CheckResult;
    try {
      result = await within(check(entry.connector));
    } catch (error) {
      const message = reason(error);
      result = { result: 'failed', ...(message === '' ? {} : { message }) };
    }
    const health = healths.get(id) ?? {};
    health.check = { ...result, at: new Date().toISOString() };
    healths.set(id, health);
    return result;
  };

  /** A refresh queued from `note`, and when the last one went out. */
  let notedAt = 0;
  let noting: ReturnType<typeof setTimeout> | undefined;

  /** Send the rows `note` changed, at most once a second. */
  const scheduleNoteRefresh = (): void => {
    if (noting !== undefined) return;
    const wait = Math.max(0, notedAt + NOTE_REFRESH_MS - Date.now());
    noting = setTimeout(() => {
      noting = undefined;
      notedAt = Date.now();
      void channel.refresh().catch(() => {});
    }, wait);
    noting.unref?.();
  };

  /**
   * Keep one call's outcome, and queue the rows that carry it.
   *
   * `run` records each action with it, and a host part records each call it
   * makes for a connector. The last call is kept, and the last one that failed
   * is kept beside it. The time is the host's, and an error is cut to 500
   * characters so a row stays small.
   */
  const note = (id: string, outcome: { ok: boolean; status?: number; error?: string }): void => {
    const health = healths.get(id) ?? {};
    const error = outcome.error === undefined ? undefined : outcome.error.slice(0, HEALTH_MESSAGE_LIMIT);
    const call: CallOutcome = {
      at: new Date().toISOString(),
      ok: outcome.ok,
      ...(outcome.status === undefined ? {} : { status: outcome.status }),
      ...(error === undefined ? {} : { error }),
    };
    health.lastCall = call;
    if (!outcome.ok) health.lastFailure = call;
    healths.set(id, health);
    scheduleNoteRefresh();
  };

  /** Stop one open connector, if it is open. A close that fails is said and not thrown. */
  const close = async (id: string): Promise<void> => {
    const entry = open.get(id);
    open.delete(id);
    healths.delete(id);
    const stop = entry?.stop;
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
      config: await resolvedRecord(config, owner, options.vault(), CONNECTOR_SECRETS),
    };
    await close(record.id);
    const stop = adapter.open(connector);
    open.set(record.id, { connector, ...(stop === undefined ? {} : { stop }) });
  };

  /**
   * Run one action on one open connector, after the live checks.
   *
   * The order is the one a revoke or a remove changes: the connector has to be
   * open, the adapter has to declare the action and be able to run it, and the
   * reader has to pass `mayRead`. A message names the reason and never a
   * secret, because the adapter's answer and its config are the only things
   * that hold one. `note` keeps the outcome of each call, and a call that
   * throws is kept and thrown on.
   */
  const run = async (
    id: string,
    reader: Principal | undefined,
    action: string,
    input: Record<string, unknown>,
    files?: string,
  ): Promise<unknown> => {
    const entry = open.get(id);
    if (entry === undefined) throw new Error(`${id} is not an open connector`);
    const adapter = options.adapters()[entry.connector.adapter];
    if (adapter === undefined) throw new Error(`${entry.connector.adapter} is not an adapter this host serves`);
    if (typeof adapter.run !== 'function') throw new Error(`${adapter.name} runs no action`);
    if (!adapter.capabilities.some((one) => one.type === 'action' && one.name === action)) {
      throw new Error(`${adapter.name} has no action named ${action}`);
    }
    if (reader !== undefined && !mayRead(id, reader)) {
      throw new Error(`${id} is not ${reader.id}'s to use`);
    }
    try {
      // A call with no folder is handed no `call`, so an adapter that reads
      // `call.files` sees the same absence a host with no store gives.
      const answer = await adapter.run(entry.connector, action, input, files === undefined ? undefined : { files });
      note(id, { ok: true });
      return answer;
    } catch (error) {
      note(id, { ok: false, error: reason(error) });
      throw error;
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
    authorize: async (params, reader) => ownerAllows('connector', asOwner(params.owner), reader, 'put'),
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
      refuseOwner('connector', 'make', owner, reader, 'put');
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
      if (moving && was !== undefined) refuseOwner('connector', 'take', was, reader, 'remove');
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
        if (fromEnvRef(checked[field]) !== undefined) checked[field] = HELD;
      }
      try {
        options.check(checked, adapter.schema, `connector ${id}`);
      } catch (error) {
        throw new RpcError(INVALID_PARAMS, reason(error));
      }
      checkAutomationLinks(adapter, config, owner);
      const moved = await moveRecordSecrets({
        rules: CONNECTOR_SECRETS,
        fields: writeOnly(adapter.schema),
        config,
        held: kept,
        owner,
        id,
        vault: options.vault(),
        problem,
      });
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
      if (moving && was !== undefined) {
        await forgetRecordSecrets(configOf(before), was, id, CONNECTOR_SECRETS, options.vault(), problem);
      }
      try {
        await openOne(adapter, record, owner);
        // A put is where a person learns the key is wrong, so it waits for the check.
        await checkOne(id);
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
      return before !== undefined && ownerAllows('connector', asOwner(before.owner), reader, 'remove');
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
      if (owner !== undefined) refuseOwner('connector', 'remove', owner, reader, 'remove');
      await close(id);
      await forgetRecordSecrets(configOf(before), owner, id, CONNECTOR_SECRETS, options.vault(), problem);
      await options.collection.remove(id);
      owners.delete(id);
      known.delete(id);
      await channel.refresh();
      return {};
    },
  };

  /*
   * The check command takes what a put takes: who may change a connector may
   * test it. The owner's rule is asked here, as a put asks it, because a grant
   * that reads the channel says nothing about another person's connector.
   */
  const check: PluginMethod = {
    grant: 'connector:put' as Grant,
    describe: () => ({ title: 'Check a connector', description: 'Runs one open connector\'s own check, and answers the row.' }),
    authorize: async (params, reader) => {
      const id = params.id;
      if (typeof id !== 'string') return false;
      const before = await options.collection.get(id);
      return before !== undefined && ownerAllows('connector', asOwner(before.owner), reader, 'put');
    },
    handle: async (params, reader) => {
      const id = idParam(CHECK, params);
      const before = await options.collection.get(id);
      if (before === undefined) throw new RpcError(INVALID_PARAMS, `${SCHEME} holds no ${id}`);
      const owner = asOwner(before.owner);
      if (owner !== undefined) refuseOwner('connector', 'check', owner, reader, 'put');
      const entry = open.get(id);
      if (entry === undefined) throw new RpcError(INVALID_PARAMS, `${id} is not an open connector`);
      const adapter = options.adapters()[entry.connector.adapter];
      if (adapter === undefined || typeof adapter.check !== 'function') {
        throw new RpcError(INVALID_PARAMS, `${entry.connector.adapter} has no check`);
      }
      await checkOne(id);
      await channel.refresh();
      return connectorRow(before);
    },
  };

  const methods: Record<string, PluginMethod> = { [PUT]: put, [REMOVE]: remove, [CHECK]: check };

  return {
    channel,
    methods,
    run,
    note,
    providers: () => {
      const adapters = options.adapters();
      const listed: ProviderConnector[] = [];
      for (const [id, entry] of open) {
        const adapter = adapters[entry.connector.adapter];
        if (adapter === undefined || typeof adapter.provider !== 'function') continue;
        try {
          /*
           * The list is read here, bound to this open connector, so the caller
           * gets the models and never the resolved config or the key.
           */
          const read = adapter.models;
          listed.push({
            id,
            adapter: adapter.name,
            owner: entry.connector.owner,
            provider: adapter.provider(entry.connector),
            ...(typeof read === 'function' ? { models: () => read(entry.connector) } : {}),
          });
        } catch (error) {
          const line = `${id} serves no model: ${reason(error)}`;
          if (providerProblems.has(line)) continue;
          providerProblems.add(line);
          problem(line);
        }
      }
      return listed.sort((one, two) => one.id.localeCompare(two.id));
    },
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
          continue;
        }
        // A start does not wait for a check: a slow service must not hold it.
        void checkOne(record.id).then(() => channel.refresh()).catch(() => {});
      }
      await channel.refresh();
    },
  };
}
