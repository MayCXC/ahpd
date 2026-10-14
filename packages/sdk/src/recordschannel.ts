/**
 * A list of records as an `x-` channel, and the commands that change one.
 *
 * Users, teams, projects, roles and policies are each a channel beside their
 * resource scheme. A subscribe
 * answers `{ records }`, each entry `{ id, record }` with the record the
 * scheme's `resourceRead` answers for that id. Three actions follow it:
 *
 * - `<scheme>/added` `{ id, record }` - a record this client did not have, and may read now.
 * - `<scheme>/changed` `{ id, record }` - a record this client has, whose JSON differs from the last one sent.
 * - `<scheme>/removed` `{ id }` - a record this client has, gone from the store or no longer readable.
 *
 * The store stays the record of truth. The channel keeps the last record it
 * sent for each id and the ids it sent to each reader, a client id and the
 * person on it, and `refresh` reads the store and sends each reader what it
 * gained, changed and lost, with `to` and `visible`.
 */

import { INVALID_PARAMS, RpcError } from './rpc.js';
import { putRecord, recordsProvider, removeRecord, type Records, type RecordsProvider } from './records.js';
import type { ChannelHandle, ChannelSubscriber, PluginChannel, PluginMethod, PublishOptions, ServedChannel, ServedMethod } from './types/plugin.js';
import type { Grant, Principal } from './types/users.js';
import { ownerOfPrincipal } from './values.js';

/** What a records channel reads: every id, and one record by id. */
export interface RecordsSource {
  /** Every record's id, in the order a snapshot lists them. */
  ids(): Promise<string[]>;
  /** One record as it stands, or nothing when the store holds none. */
  find(id: string): Promise<Record<string, unknown> | undefined>;
}

/** How a records channel decides who reads what. */
export interface RecordsChannelOptions {
  /** What a reader needs to read every record. */
  grant: Grant;
  /** Whether a reader without `grant` may read this one record all the same. */
  mayRead?(id: string, reader: Principal): boolean;
  /** What a client shows for the channel. */
  describe?(): { title: string; description?: string };
  /** Where a refresh that could not read the store is said. */
  onProblem?(message: string): void;
}

/** One record as the channel sends it. */
export interface RecordEntry {
  id: string;
  record: Record<string, unknown>;
}

/** A records channel, and the steps its server wires to the host. */
export interface RecordsChannel {
  /** The channel's scheme, such as `x-ahpd-teams`. */
  scheme: string;
  /** What `registerChannel` takes. */
  channel: PluginChannel;
  /** The handle every send goes through. */
  bind(handle: ChannelHandle): void;
  /** Read the store, and send each client what it gained, changed and lost. */
  refresh(): Promise<void>;
}

export function recordsChannel(scheme: string, source: RecordsSource, options: RecordsChannelOptions): RecordsChannel {
  const uri = `${scheme}://`;
  /** The ids sent to each reader, by `readerKey`. */
  const sent = new Map<string, Set<string>>();
  /** The JSON of the last record sent for each id. */
  const last = new Map<string, string>();
  let handle: ChannelHandle | undefined;
  /** The last read of the store queued, which the next one waits for. */
  let tail: Promise<void> = Promise.resolve();
  /** The refresh queued and not yet started, which a further call shares. */
  let pending: Promise<void> | undefined;

  /**
   * Whether this reader sees this record.
   *
   * No reader is a host with no users directory, or the root connection, and
   * both see every record.
   */
  const readable = (id: string, reader: Principal | undefined): boolean =>
    reader === undefined || reader.can(options.grant) || options.mayRead?.(id, reader) === true;

  /** Every record the store holds now, in the order it lists them. */
  const every = async (): Promise<RecordEntry[]> => {
    const entries: RecordEntry[] = [];
    for (const id of await source.ids()) {
      const record = await source.find(id);
      if (record !== undefined) entries.push({ id, record });
    }
    return entries;
  };

  /** Run one read of the store after every one queued before it. */
  const exclusive = <T>(work: () => Promise<T>): Promise<T> => {
    const done = tail.then(work);
    tail = done.then(() => undefined, () => undefined);
    return done;
  };

  /**
   * Send one action to one reader on one client.
   *
   * `to` names the client, and `visible` names the reader: two people on one
   * client id each hold their own state, and an action is seen only by a
   * connection that is that person now and may still read the record.
   */
  const send = (client: string, reader: Principal | undefined, action: { type: string; id: string } & Record<string, unknown>): void => {
    const key = readerKey(client, reader);
    const removal = action.type === `${scheme}/removed`;
    const audience: PublishOptions = {
      to: client,
      visible: (principal, seen) => readerKey(seen, principal) === key && (removal || readable(action.id, principal)),
    };
    handle?.publish(uri, action, audience);
  };

  /** Update `last` from `now`, and send each subscriber but `skip` what it gained, changed and lost. */
  const apply = (subscribers: ChannelSubscriber[], now: RecordEntry[], skip?: string): void => {
    const changed = new Set<string>();
    const held = new Set<string>();
    for (const { id, record } of now) {
      held.add(id);
      const text = JSON.stringify(record);
      const was = last.get(id);
      if (was !== undefined && was !== text) changed.add(id);
      last.set(id, text);
    }
    for (const id of [...last.keys()]) if (!held.has(id)) last.delete(id);
    for (const { client, reader } of subscribers) {
      const key = readerKey(client, reader);
      if (key === skip) continue;
      const mine = new Set(now.filter((one) => readable(one.id, reader)).map((one) => one.id));
      const set = sent.get(key);
      sent.set(key, mine);
      // A reader with no set has nothing to diff against, and starts from here.
      if (set === undefined) continue;
      for (const { id, record } of now) {
        if (!mine.has(id)) continue;
        if (!set.has(id)) send(client, reader, { type: `${scheme}/added`, id, record });
        else if (changed.has(id)) send(client, reader, { type: `${scheme}/changed`, id, record });
      }
      for (const id of set) {
        if (!mine.has(id)) send(client, reader, { type: `${scheme}/removed`, id });
      }
    }
  };

  const step = async (): Promise<void> => {
    const subscribers: ChannelSubscriber[] = handle?.subscribers(uri) ?? [];
    /*
     * Nobody holds a record, so nothing is read: the next snapshot seeds what
     * the refresh after it compares with.
     */
    if (subscribers.length === 0) {
      last.clear();
      return;
    }
    apply(subscribers, await every());
  };

  const problem = (error: unknown): void => {
    options.onProblem?.(`${scheme}: the list could not be read: ${error instanceof Error ? error.message : String(error)}`);
  };

  return {
    scheme,
    channel: {
      grant: options.grant,
      ...(options.describe === undefined ? {} : { describe: options.describe }),
      authorize: async (asked, reader) => {
        if (asked !== uri || options.mayRead === undefined) return false;
        return (await source.ids()).some((id) => options.mayRead?.(id, reader) === true);
      },
      snapshot: async (asked, reader, client) => {
        if (asked !== uri) throw new RpcError(-32001, `No channel at ${asked}; the list is ${uri}`);
        const key = readerKey(client, reader);
        /*
         * The snapshot is a refresh's read: every other reader is sent what
         * this read changed, so `last` and each reader's ids agree with it.
         */
        return exclusive(async () => {
          const now = await every();
          apply(handle?.subscribers(uri) ?? [], now, key);
          const records = now.filter((one) => readable(one.id, reader));
          sent.set(key, new Set(records.map((one) => one.id)));
          return { records };
        });
      },
      left: (client) => {
        for (const key of [...sent.keys()]) if (clientOfKey(key) === client) sent.delete(key);
      },
    },
    bind: (given) => { handle = given; },
    /*
     * A call made while a refresh waits shares it, so at most one runs and one
     * waits; the one waiting reads the store after every call it answers.
     */
    refresh: () => {
      if (pending !== undefined) return pending;
      const queued = exclusive(async () => {
        pending = undefined;
        await step();
      }).catch(problem);
      pending = queued;
      return queued;
    },
  };
}

/**
 * Whose state one reader's ids are: the client id, and the person the
 * connection is now.
 *
 * Several people may share a client id, and each holds their own state.
 */
const readerKey = (client: string, reader: Principal | undefined): string =>
  JSON.stringify([client, reader === undefined ? '' : ownerOfPrincipal(reader)]);

/** The client id a `readerKey` was made from. */
const clientOfKey = (key: string): string => (JSON.parse(key) as [string, string])[0];

/** A string param that names one record, or a refusal saying what the command needs. */
const idParam = (command: string, scheme: string, params: Record<string, unknown>): string => {
  const id = params.id;
  /*
   * An id a URI could not name is refused, so a record made by command is one
   * `<scheme>://<id>` reads back.
   */
  if (typeof id !== 'string' || id === '' || /[/?]/.test(id)) {
    throw new RpcError(INVALID_PARAMS, `${command} needs id, the ${scheme}'s id, with no / or ?`);
  }
  return id;
};

/**
 * The `put` and `remove` commands of one records scheme, by name.
 *
 * `x-ahpd/<domain>/put` takes `{ id, record, createOnly? }` and needs
 * `<scheme>:put`; `x-ahpd/<domain>/remove` takes `{ id }` and needs
 * `<scheme>:delete`. Both go through the rules a resource write and delete go
 * through, and answer `{}` as they do. `refresh` is called after each.
 */
export const recordsMethods = (domain: string, scheme: string, records: Records, refresh: () => Promise<void>): Record<string, PluginMethod> => {
  const put = `x-ahpd/${domain}/put`;
  const remove = `x-ahpd/${domain}/remove`;
  return {
    [put]: {
      grant: `${scheme}:put` as Grant,
      describe: () => ({ title: `Put a ${scheme}`, description: `Makes or edits one ${scheme}.` }),
      handle: async (params) => {
        const id = idParam(put, scheme, params);
        const record = params.record;
        if (typeof record !== 'object' || record === null || Array.isArray(record)) {
          throw new RpcError(INVALID_PARAMS, `A ${scheme} is made from a JSON object, and that body is not one`);
        }
        const createOnly = params.createOnly;
        if (createOnly !== undefined && typeof createOnly !== 'boolean') {
          throw new RpcError(INVALID_PARAMS, `${put} takes createOnly as true or false`);
        }
        await putRecord(scheme, records, id, record as Record<string, unknown>, createOnly === true);
        await refresh();
        return {};
      },
    },
    [remove]: {
      grant: `${scheme}:delete` as Grant,
      describe: () => ({ title: `Remove a ${scheme}`, description: `Takes one ${scheme} out.` }),
      handle: async (params) => {
        const id = idParam(remove, scheme, params);
        await removeRecord(scheme, records, id);
        await refresh();
        return {};
      },
    },
  };
};

/** Records channels and commands, as a daemon hands them to `HostOptions`. */
export interface ServedRecords {
  channels: Record<string, ServedChannel>;
  methods: Record<string, ServedMethod>;
}

/**
 * Channels and commands the daemon serves itself, as `HostOptions` takes them.
 *
 * Each channel is bound to a handle that sends through the entry the host
 * sets `publish` and `subscribers` on, as a plugin's handle does.
 */
export const servedRecords = (by: string, channels: RecordsChannel[], methods: Record<string, PluginMethod>): ServedRecords => {
  const served: Record<string, ServedChannel> = {};
  for (const one of channels) {
    const entry: ServedChannel = { by, scheme: one.scheme, channel: one.channel };
    one.bind({
      publish: (uri, action, options = {}) => { entry.publish?.(uri, action, options); },
      subscribers: (uri) => entry.subscribers?.(uri) ?? [],
    });
    served[one.scheme] = entry;
  }
  return {
    channels: served,
    methods: Object.fromEntries(Object.entries(methods).map(([name, method]) => [name, { by, name, method }])),
  };
};

/** One records domain: its scheme, its channel, and its commands. */
export interface RecordsDomain {
  /** The resource provider, which refreshes the channel after each write and remove. */
  provider: RecordsProvider;
  channel: RecordsChannel;
  methods: Record<string, PluginMethod>;
}

/**
 * One records scheme as a provider, a channel and two commands over one store.
 *
 * The channel is `x-ahpd-<domain>`, it needs `<scheme>:read`, and every write
 * through the provider or a command refreshes it.
 */
export const recordsDomain = (
  domain: string,
  scheme: string,
  records: Records,
  options: { mayRead?: RecordsChannelOptions['mayRead']; onProblem?: RecordsChannelOptions['onProblem'] } = {},
): RecordsDomain => {
  const channel = recordsChannel(`x-ahpd-${domain}`, records, {
    grant: `${scheme}:read` as Grant,
    describe: () => ({ title: records.title, description: records.description }),
    ...(options.mayRead === undefined ? {} : { mayRead: options.mayRead }),
    ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
  });
  return {
    provider: recordsProvider(scheme, records, () => { void channel.refresh(); }),
    channel,
    methods: recordsMethods(domain, scheme, records, channel.refresh),
  };
};
