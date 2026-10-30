/**
 * The `policy:` scheme.
 *
 * One URI is one row and the scheme's root is a directory of them, exactly as
 * `people.ts` serves `user:`, `team:`, `project:` and `role:`. A client edits policies the way it edits
 * people: it reads the manifest, draws a form, writes a body and reads it back.
 *
 * This is another door onto the `Policies` port, not a second set of rules. A
 * body the port would refuse is refused here with the same sentence, because
 * `checkPolicy` is what the port itself calls.
 *
 * Whether a row binds is not this scheme's business: a host is told to check
 * through `policiesCheck`, and `decide` does the checking.
 */

import { limitsOf, type LimitFigure } from '../usage/charge.js';
import { zoneOf } from '../usage/periods.js';
import { checkPolicy, EFFECTS, KINDS, LIMIT_POOLS, MATCHES, MEASURES, PERIODS } from './policies.js';
import { absentResource, asFile, EPOCH, line, lines, recordsProvider, splitResource, type Records, type RecordsProvider } from '../resources/records.js';
import { recordsDomain, type RecordsChannel } from '../resources/recordschannel.js';
import type { MinuteMeter } from '../usage/minute.js';
import type { PluginMethod } from '../types/plugin.js';
import type { Policies, PolicyKind, PolicyScope } from '../types/policies.js';
import type { Metadata, Read } from '../types/resources.js';
import type { Usage } from '../types/usage.js';

/** The scheme, which is also its grant subject. */
const SCHEMES = ['policy'] as const;

/** The leaf under a row that answers its limits. */
const LIMITS = 'limits';

/**
 * What a provider needs to answer `policy://<id>/limits`.
 *
 * The usage store is where a limit's used figure comes from, and the zone is
 * the one its days are cut in. Without a store the leaf is not served, because
 * nothing can say what a limit has used.
 */
export interface PolicySchemeOptions {
  /** The store the work is charged to. Absent, `policy://<id>/limits` is not served. */
  usage?: Usage;
  /** The zone the periods are cut in, as `usage.timezone` names it. */
  timezone?: string;
  /**
   * What each key used in this minute, which a `minute` limit answers.
   *
   * The store keeps no total finer than a day, so the leaf needs the daemon's
   * meter to answer the same figure the walk checks against. Absent, a `minute`
   * limit reads zero.
   */
  meter?: MinuteMeter;
  /** Where a zone that cannot be read is said. */
  onProblem?(message: string): void;
}

/** One row's limits, as `policy://<id>/limits` and `usage://limits` answer them. */
export interface PolicyLimits {
  /** The row's id. */
  id: string;
  /** What the row is about. */
  kind: PolicyKind;
  /** Who the row is about. */
  scope: PolicyScope;
  /** Each limit, with what is used and when it resets. */
  limits: LimitFigure[];
}

/**
 * What this provider implements.
 *
 * The provider itself is `records.ts`'s, over the store: these are this
 * scheme's `Records`, and what a client sees of them is the shared one's rules.
 */
export type PolicyProvider = RecordsProvider;

/** The values a field may take, as the schema keyword that says so. */
const enums = (values: readonly string[]): Record<string, unknown> => ({ enum: [...values] });

/**
 * One manifest field that is a line of text out of a table, which is what a
 * form draws a picker from rather than a box to type into.
 *
 * The values are `checkPolicy`'s own, so what a form offers is what the check
 * takes: the description carries no list of them, because a list in prose is
 * the copy that goes stale the day a host adds one.
 */
const choice = (title: string, description: string, values: readonly string[]): Record<string, unknown> =>
  ({ type: 'string', title, description, ...enums(values) });

/**
 * A field a body may also send as `null`, which `checkPolicy` reads as absent:
 * a put removes the field that way, so the schema a form validates with takes
 * it as well as the value a row keeps.
 */
const nullable = (field: Record<string, unknown>): Record<string, unknown> =>
  ({ ...field, type: [field.type, 'null'] });

/** Every measure there is, in the order the kinds name them. */
const ALL_MEASURES = [...new Set(KINDS.flatMap((kind) => MEASURES[kind]))];

/**
 * Which measures and which match types a kind takes, as one `allOf` entry per
 * kind.
 *
 * JSON Schema says "only for this kind" with `if`/`then`, so a validator such
 * as ajv reads it and a client that knows nothing beyond `properties` sees the
 * union and is no worse off than it was.
 */
const narrowed = KINDS.map((kind) => ({
  if: { properties: { kind: { const: kind } }, required: ['kind'] },
  then: {
    properties: {
      limits: { items: { properties: { measure: enums(MEASURES[kind]) } } },
      match: { propertyNames: enums(MATCHES[kind]) },
    },
  },
}));

const TITLE = 'Policies';
const ABOUT = 'Who may use which agent, model and computer, and how much.';

const manifest: Record<string, unknown> = {
  type: 'object',
  properties: {
    scope: line('Scope', 'Who the row is about: `all`, `user:<id>`, `team:<id>` or `project:<team>:<project>`.'),
    kind: choice('Kind', 'What it is about: a proxy call, a harness this host runs, or a machine.', KINDS),
    effect: choice('Effect', 'Any matching deny wins over any allow.', EFFECTS),
    match: {
      title: 'Match',
      description: 'What it applies to. Values of one type are alternatives and values of different types must all hold. A type left out allows any value of it.',
      type: 'object',
      properties: {
        model: nullable(lines('Models', '`<maker>/<name>`, where `*` stands for any run of characters within the value.')),
        proxy: nullable(lines('Proxies', 'Which provider the model may be called through. `model` rows only.')),
        agent: nullable(lines('Agents', 'The harness, as `claude`, `pi`, `cofold` or `acp:<server>`.')),
        computer: nullable(lines('Computers', 'The machine, as the `computers` port names it.')),
      },
    },
    limits: {
      title: 'Limits',
      description: 'How much may be used. Every limit must have room.',
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0, title: 'Amount', description: 'How much, in the measure. Never negative.' },
          measure: choice('Measure', 'What the limit is counted in, of the ones the kind takes.', ALL_MEASURES),
          period: choice('Period', 'The window the limit is counted over.', PERIODS),
          pool: choice('Pool', 'Whether the group shares this total or every member has their own.', LIMIT_POOLS),
        },
      },
    },
    pool: nullable({ type: 'string', title: 'Pool', description: 'A name several rows draw from one total under.' }),
    cap: nullable({ type: 'boolean', title: 'Cap', description: 'Count usage without charging it.' }),
    from: nullable(line('From', 'When the row starts, as an ISO 8601 instant or a `YYYY-MM-DD` day.')),
    until: nullable(line('Until', 'When the row ends, as an ISO 8601 instant or a `YYYY-MM-DD` day. A bare day includes all of it.')),
  },
  required: ['scope', 'kind', 'effect', 'match'],
  allOf: narrowed,
};

/**
 * The `policy:` records, over the store.
 *
 * `checkPolicy` is the port's own check, so a body the store would refuse is
 * refused here in the same words, and what a client reads back is the row the
 * store holds rather than the body it sent.
 */
const records = (store: Policies): Records => ({
  title: TITLE,
  description: ABOUT,
  manifest,
  ids: async () => (await store.list()).map((one) => one.id),
  find: async (id) => {
    const held = await store.get(id);
    return held === undefined ? undefined : { ...held } as Record<string, unknown>;
  },
  put: async (id, body, was) => {
    /*
     * A field the body does not name is the one the row already had, and the id
     * is the address rather than anything the body says.
     *
     * A client that read a row and drew a form from it sends back what it
     * changed, not the whole row, and a write that dropped what it left out
     * would make every edit a rewrite. An empty body is an empty object rather
     * than a refusal, so a client writing nothing to an id that is not there
     * means exactly that - and the port refuses it as the row it is not.
     */
    await store.put(checkPolicy({ ...(was ?? {}), ...body, id }));
  },
  // Nothing refuses a removal here: no membership and no record names a policy,
  // so an id nothing holds is the only way this fails.
  drop: async (id) => store.remove(id),
});

/**
 * The provider with the `limits` leaf under a row.
 *
 * A row is a file whose bytes are its JSON, so a leaf under one is new here.
 * `policy://<id>/limits` answers the row's own limits, each with what the
 * period has used and when it resets, read by `limitsOf`. A `minute` limit
 * answers the meter's figure, which is the daemon's own, so the leaf and the
 * walk agree. The reader holds `policy:read`, which is what the scheme's gate
 * has already said, so an `each` limit answers every member rather than one
 * person.
 *
 * Every other leaf is the record provider's answer, which is the refusal it
 * always gave. A host with no usage store serves no leaf at all: a limit whose
 * used figure cannot be read is not a figure.
 */
const withLimits = (provider: RecordsProvider, store: Policies, options: PolicySchemeOptions): PolicyProvider => {
  const usage = options.usage;
  if (usage === undefined) return provider;
  const zone = zoneOf(options.timezone, (message) => { options.onProblem?.(message); });

  /** The JSON a read of the leaf answers, or the refusal a row that is not there gets. */
  const body = async (uri: string, id: string): Promise<string> => {
    const row = await store.get(id);
    if (row === undefined) throw absentResource('policy', uri);
    const answer: PolicyLimits = {
      id: row.id,
      kind: row.kind,
      scope: row.scope,
      limits: await limitsOf(row, usage, zone, new Date(), undefined, options.meter),
    };
    return JSON.stringify(answer, null, 2);
  };

  return {
    ...provider,

    resolve: async (uri, followSymlinks): Promise<Metadata> => {
      const at = splitResource(uri, 'policy');
      if (at.id !== '' && at.leaf === LIMITS) {
        return {
          uri,
          type: 'file',
          size: Buffer.byteLength(await body(uri, at.id), 'utf8'),
          mtime: EPOCH,
          ctime: EPOCH,
        } as Metadata;
      }
      return provider.resolve(uri, followSymlinks);
    },

    read: async (uri, wanted): Promise<Read> => {
      const at = splitResource(uri, 'policy');
      if (at.id !== '' && at.leaf === LIMITS) return asFile(await body(uri, at.id));
      return provider.read(uri, wanted);
    },
  };
};

/**
 * The `policy:` provider, over a store.
 *
 * One scheme, so this answers a `Record<string, PolicyProvider>` like
 * `peopleProviders` does and sits in the same `resourceProviders` map beside
 * them rather than in a second spread.
 */
export const policyProviders = (store: Policies, options: PolicySchemeOptions = {}): Record<string, PolicyProvider> =>
  Object.fromEntries(SCHEMES.map((what) => [what, withLimits(recordsProvider(what, records(store)), store, options)]));

/** The policy scheme as a provider, a channel and commands, over one store. */
export interface PolicyChannels {
  /** The `policy:` provider, by scheme, refreshing the channel after a write. */
  providers: Record<string, PolicyProvider>;
  /** `x-ahpd-policies`. */
  channels: RecordsChannel[];
  /** `x-ahpd/policies/put` and `x-ahpd/policies/remove`, by name. */
  methods: Record<string, PluginMethod>;
  /** Refresh the channel. */
  refresh(): Promise<void>;
}

/**
 * The policy scheme as a channel and commands beside its provider.
 *
 * The channel needs `policy:read`. The store has no watch, so a row edited by
 * hand in the file reaches the channel at the next change made through the
 * host. The provider also serves the `limits` leaf when it is given the usage
 * store, which is where a limit's used figure is kept.
 */
export const policyChannels = (store: Policies, options: PolicySchemeOptions = {}): PolicyChannels => {
  const one = recordsDomain('policies', 'policy', records(store), {
    ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
  });
  return {
    providers: { policy: withLimits(one.provider, store, options) },
    channels: [one.channel],
    methods: one.methods,
    refresh: one.channel.refresh,
  };
};
