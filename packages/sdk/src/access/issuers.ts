/**
 * The authorization servers this host accepts a credential from.
 *
 * `fileUsers` compares a hash this host minted, which a client that can only
 * acquire tokens through an OAuth provider cannot use: there is no provider to
 * resolve for a secret this host invented. So a deployment names an issuer, the
 * host advertises it, and the host asks it who a token belongs to.
 *
 * Two are here. GitHub is the one a stock client can already resolve, and an
 * OpenID Connect issuer named by URL is the one an operator with an identity
 * provider actually has.
 *
 * GitHub issues opaque tokens, so its endpoint is the only thing that can say
 * who one belongs to. An OpenID Connect issuer that publishes a key set can be
 * asked nothing: the token is checked here, against its own signature. Which of
 * the two a host does is `issuerVerify`, and `auto` is both.
 */

import type { webcrypto } from 'node:crypto';
import type { Issuer, IssuerAnswer } from '../types/users.js';

/**
 * How this module reaches the network.
 *
 * Narrower than the global `fetch` on purpose: an issuer needs one GET that
 * answers JSON, and a test made to satisfy the whole of `Response` for a
 * boolean is a test nobody writes.
 */
export interface Fetcher {
  (url: string, init?: { headers?: Record<string, string> }): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
  }>;
}

/** A GET that answers an object, or nothing for anything that is not one. */
const get = async (fetcher: Fetcher, url: string, token?: string): Promise<Record<string, unknown> | undefined> => {
  try {
    const answer = await fetcher(url, {
      headers: {
        accept: 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
    });
    if (!answer.ok) return undefined;
    const held: unknown = await answer.json();
    return typeof held === 'object' && held !== null ? held as Record<string, unknown> : undefined;
  }
  catch {
    // Unreachable is nobody rather than a thrown error: a host that cannot ask
    // does not know, and `-32007` is what not knowing means on the wire.
    return undefined;
  }
};

/** One non-empty string field, or nothing. */
const field = (held: Record<string, unknown> | undefined, name: string): string | undefined => {
  const value = held?.[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
};

/**
 * The whole answer, when it named a subject in the field this issuer uses.
 *
 * The claims travel with it, because a record that reads its roles out of one
 * would otherwise need a second request for the same sign-in.
 */
const answer = (held: Record<string, unknown> | undefined, name: string): IssuerAnswer | undefined => {
  const subject = field(held, name);
  return held === undefined || subject === undefined ? undefined : { subject, claims: held };
};

/** What `githubIssuer` may be told, for a test or a GitHub-compatible host. */
export interface GitHubIssuerOptions {
  /** How to reach it. Defaults to the global `fetch`. */
  fetch?: Fetcher;
  /** The issuer identifier. Default `https://github.com/login/oauth`. */
  id?: string;
  /** Where its user endpoint is. Default `https://api.github.com/user`. */
  endpoint?: string;
  /** The scopes to ask for. Default `['read:user']`. */
  scopes?: readonly string[];
}

/**
 * GitHub, which is the issuer a stock client can already resolve.
 *
 * Its OAuth has no discovery document and no `sub`, so the endpoint and the
 * field are fixed and the subject is the login.
 */
export const githubIssuer = (options: GitHubIssuerOptions = {}): Issuer => {
  const fetcher = options.fetch ?? fetch as Fetcher;
  const endpoint = options.endpoint ?? 'https://api.github.com/user';
  return {
    id: options.id ?? 'https://github.com/login/oauth',
    scopes: options.scopes ?? ['read:user'],
    who: async (token) => answer(await get(fetcher, endpoint, token), 'login'),
  };
};

/** What `oidcIssuer` may be told. */
export interface OidcIssuerOptions {
  /** The issuer identifier, which is also where its metadata is discovered. */
  issuer: string;
  /** How to reach it. Defaults to the global `fetch`. */
  fetch?: Fetcher;
  /** The scopes to ask for. Default `['openid']`. */
  scopes?: readonly string[];
  /** A userinfo endpoint already known, so a test needs no discovery. */
  userinfo?: string;
}

/** Whether a URL names this machine. */
const loopbackUrl = (value: string): boolean =>
  /^https?:\/\/(?:127\.0\.0\.1|\[::1\]|localhost)(?::\d+)?(?:[/?#]|$)/i.test(value);

/**
 * Whether this host may send a person's credential to a URL.
 *
 * https anywhere, and plain http only on loopback. A self-hosted issuer is
 * common and on loopback nothing leaves the machine; a remote one over http
 * would put a bearer token in clear.
 */
export const isIssuerUrl = (value: string): boolean => {
  if (/^https:\/\/[^\s#]+$/.test(value)) return true;
  return /^http:\/\/[^\s#]+$/.test(value) && loopbackUrl(value);
};

/**
 * The signature algorithms this host will check, with what WebCrypto needs to
 * import a key for each and to verify with it.
 *
 * Everything else is refused, and `none` and `HS*` deliberately: `none` is a
 * token with no signature at all, and an `HS*` token is signed with a secret
 * the verifier would have to hold, which a published key set never is.
 */
const ALGORITHMS = {
  RS256: { key: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, check: { name: 'RSASSA-PKCS1-v1_5' } },
  PS256: { key: { name: 'RSA-PSS', hash: 'SHA-256' }, check: { name: 'RSA-PSS', saltLength: 32 } },
  ES256: { key: { name: 'ECDSA', namedCurve: 'P-256' }, check: { name: 'ECDSA', hash: 'SHA-256' } },
  EdDSA: { key: { name: 'Ed25519' }, check: { name: 'Ed25519' } },
} as const;

/** How far this host's clock may disagree with an issuer's, in milliseconds. */
const SKEW = 60_000;

/**
 * How long a key set that does not hold a token's `kid` is left alone.
 *
 * A `kid` nobody published may be a key rotated in since the set was read, so
 * the set is read again; a flood of tokens naming keys that do not exist must
 * not become a flood of fetches, so not more often than this.
 */
const REFETCH_MS = 60_000;

/** A token as its three parts, before any of it is believed. */
interface Token {
  /** The header, which names the algorithm and the key. */
  readonly header: Record<string, unknown>;
  /** The claims, unread until the signature over them has been checked. */
  readonly claims: Record<string, unknown>;
  /** What the signature covers, exactly as it was sent. */
  readonly signed: string;
  /** The signature, as the bytes it is. */
  readonly signature: Uint8Array;
}

/** One base64url part as the object it holds, or nothing when it holds none. */
const part = (value: string | undefined): Record<string, unknown> | undefined => {
  if (value === undefined || value === '') return undefined;
  try {
    const held: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    return typeof held === 'object' && held !== null && !Array.isArray(held)
      ? held as Record<string, unknown>
      : undefined;
  }
  catch {
    // A part that is neither base64url nor JSON is a token that is not one.
    return undefined;
  }
};

/** A token split into its parts, or nothing when it is not three of them. */
const split = (token: string): Token | undefined => {
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  const header = part(parts[0]);
  const claims = part(parts[1]);
  if (header === undefined || claims === undefined) return undefined;
  const signature = Buffer.from(parts[2] ?? '', 'base64url');
  // An empty signature is `alg: none` under another name.
  if (signature.length === 0) return undefined;
  return { header, claims, signed: `${parts[0]}.${parts[1]}`, signature };
};

/**
 * The issuer a token names, read without trusting any of it.
 *
 * `iss` is what decides which key set the signature is checked against, so it
 * is read before anything is verified and matched against the issuers this host
 * knows rather than believed.
 */
export const jwtIssuer = (token: string): string | undefined => {
  const held = split(token);
  return held === undefined ? undefined : field(held.claims, 'iss');
};

/** What a token must say to be one an issuer signed for an audience. */
interface Wanted {
  /** The identifier the token's `iss` must be. */
  readonly issuer: string;
  /** The identifier its `aud` must hold. */
  readonly audience: string;
}

/**
 * Whether two issuer identifiers are the same one.
 *
 * A trailing slash is not a different issuer: a deployment configures
 * `https://idp.example.com` and the metadata it serves says
 * `https://idp.example.com/`, or the other way round.
 */
export const sameIssuer = (one: string, other: string): boolean =>
  one.replace(/\/+$/, '') === other.replace(/\/+$/, '');

/** One claim as a number of seconds, or nothing when it is absent or not one. */
const seconds = (claims: Record<string, unknown>, name: string): number | undefined => {
  const value = claims[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

/** Whether the `aud` claim names an audience, alone or among several. */
const meantFor = (aud: unknown, audience: string): boolean =>
  aud === audience || (Array.isArray(aud) && aud.includes(audience));

/**
 * A key as a key set publishes one.
 *
 * A JWK with the `kid` a token's header names it by, which the WebCrypto type
 * does not carry: it describes what `importKey` reads, and the name a key is
 * looked up under is not part of a key.
 */
interface Jwk extends webcrypto.JsonWebKey {
  /** The name a token's header names this key by. */
  readonly kid?: string;
}

/** Whether one entry of a key set is a key at all. */
const isJwk = (value: unknown): value is Jwk =>
  typeof value === 'object' && value !== null && typeof (value as { kty?: unknown }).kty === 'string';

/**
 * Who a token belongs to, checked against a key set here.
 *
 * Every failure answers the same nothing rather than a reason: the algorithm,
 * the `typ`, the key, the signature, `iss`, `exp`, `nbf` and `aud` are refused
 * alike, so a token this host answers about cannot be told what to work on.
 */
const checked = async (
  token: string,
  keyFor: (kid: string | undefined) => Promise<Jwk | undefined>,
  wanted: Wanted,
): Promise<IssuerAnswer | undefined> => {
  const held = split(token);
  if (held === undefined) return undefined;
  const alg = field(held.header, 'alg');
  const rule = alg === undefined ? undefined : ALGORITHMS[alg as keyof typeof ALGORITHMS];
  if (rule === undefined) return undefined;
  /*
   * An access token is typed `at+jwt` by RFC 9068; `JWT` is what a provider
   * that does not distinguish one from an ID token sends. The `aud` check below
   * is what keeps an ID token from signing in either way, so the two are taken
   * alike and a header that names no type at all is taken as one of them.
   */
  const typ = field(held.header, 'typ')?.toLowerCase();
  if (typ !== undefined && typ !== 'at+jwt' && typ !== 'jwt') return undefined;
  const key = await keyFor(field(held.header, 'kid'));
  if (key === undefined) return undefined;
  try {
    const imported = await crypto.subtle.importKey('jwk', key, rule.key, false, ['verify']);
    // The signature covers the first two parts exactly as they arrived, which
    // is their ASCII and not a re-encoding of what they decode to.
    const good = await crypto.subtle.verify(rule.check, imported, held.signature, Buffer.from(held.signed, 'utf8'));
    if (!good) return undefined;
  }
  catch {
    // A key this runtime will not import, or a curve it does not have, is a
    // token nobody here can check.
    return undefined;
  }
  const iss = field(held.claims, 'iss');
  if (iss === undefined || !sameIssuer(iss, wanted.issuer)) return undefined;
  const now = Date.now();
  const exp = seconds(held.claims, 'exp');
  // A token with no end is refused too: an access token carries one, and a
  // sign-in checked here has nothing else to end it by.
  if (exp === undefined || now > exp * 1000 + SKEW) return undefined;
  const nbf = seconds(held.claims, 'nbf');
  if (nbf !== undefined && now + SKEW < nbf * 1000) return undefined;
  if (!meantFor(held.claims['aud'], wanted.audience)) return undefined;
  const subject = field(held.claims, 'sub');
  if (subject === undefined) return undefined;
  return {
    subject,
    claims: held.claims,
    expiresAt: exp * 1000,
  };
};

/**
 * An OpenID Connect issuer, named by URL.
 *
 * Its metadata is discovered once from the well-known path, and an endpoint it
 * names is used only when this host may send a token to it: https, or plain
 * http on loopback. Discovery that fails is tried again on the next sign-in
 * rather than cached as a failure.
 *
 * A token that is a JWT is checked here instead, against the key set at
 * `jwks_uri`, so the one request a sign-in needs is the key set itself, and
 * none at all once it has been read.
 */
export const oidcIssuer = (options: OidcIssuerOptions): Issuer => {
  const fetcher = options.fetch ?? fetch as Fetcher;
  let metadata: Record<string, unknown> | undefined;
  const discovery = async (): Promise<Record<string, unknown> | undefined> => {
    if (metadata !== undefined) return metadata;
    const at = `${options.issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
    const held = await get(fetcher, at);
    // A read that answered nothing is not kept, so an issuer that was briefly
    // unreachable is discovered again rather than remembered as one with no
    // metadata.
    if (held !== undefined) metadata = held;
    return metadata;
  };
  /** One endpoint the metadata names, when this host may send a token to it. */
  const named = async (name: string): Promise<string | undefined> => {
    const value = field(await discovery(), name);
    return value !== undefined && isIssuerUrl(value) ? value : undefined;
  };
  let known: string | undefined;
  const userinfo = async (): Promise<string | undefined> => {
    if (options.userinfo !== undefined) return options.userinfo;
    if (known !== undefined) return known;
    known = await named('userinfo_endpoint');
    return known;
  };
  /*
   * The keys the issuer publishes, and when they were read.
   *
   * Kept rather than read per token, so a sign-in still works while the issuer
   * is down: the signature is checked here, and the only question that needs
   * the issuer is one about a `kid` this host has never seen.
   */
  let keys: { readonly list: readonly Jwk[]; readonly at: number } | undefined;
  const published = async (): Promise<readonly Jwk[]> => {
    const at = await named('jwks_uri');
    const held = at === undefined ? undefined : await get(fetcher, at);
    const list = Array.isArray(held?.['keys']) ? held['keys'].filter(isJwk) : [];
    // The time is kept whether or not keys came back, so an issuer that is down
    // and one that publishes nothing are each asked once a minute rather than
    // once a token.
    keys = { list, at: Date.now() };
    return list;
  };
  /** The key a token names, reading the set again for a `kid` nobody published. */
  const keyFor = async (kid: string | undefined): Promise<Jwk | undefined> => {
    const find = (list: readonly Jwk[]): Jwk | undefined =>
      // A token that names no `kid` is placed only against a set of one key,
      // which is what a provider publishing a single key publishes.
      kid === undefined ? (list.length === 1 ? list[0] : undefined) : list.find((one) => one.kid === kid);
    if (keys === undefined) return find(await published());
    const held = find(keys.list);
    if (held !== undefined) return held;
    // A token that names no `kid` is read for again too: the set it was
    // placed against may be one an issuer that was down never sent.
    if (Date.now() - keys.at < REFETCH_MS) return undefined;
    return find(await published());
  };
  return {
    id: options.issuer,
    scopes: options.scopes ?? ['openid'],
    who: async (token) => {
      const endpoint = await userinfo();
      return endpoint === undefined ? undefined : answer(await get(fetcher, endpoint, token), 'sub');
    },
    verify: async (token, audience) => checked(token, keyFor, {
      // The identifier the metadata says it is, which is the one it issues
      // tokens under; the name this host configured is the fallback for
      // metadata that names none.
      issuer: field(await discovery(), 'issuer') ?? options.issuer,
      audience,
    }),
  };
};

/**
 * The kind of authorization server a name is.
 *
 * `github` is the preset a stock client can resolve with no work at all, and a
 * URL this host may reach is an OpenID Connect issuer whose metadata is
 * discovered. Anything else answers nothing, so a configuration refuses the
 * start and a record is reported rather than silently never verifying. The
 * rule is here so the daemon's `issuer` key and a record's own `issuer` field
 * cannot disagree about what a name means.
 */
export type IssuerKind = { kind: 'github' } | { kind: 'oidc'; issuer: string };

/** What a name turned out to be, or nothing when this host may not reach it. */
export const issuerKind = (value: string): IssuerKind | undefined => {
  if (value === 'github') return { kind: 'github' };
  return isIssuerUrl(value) ? { kind: 'oidc', issuer: value } : undefined;
};

/**
 * An authorization server, named the way a configuration or a record names one.
 *
 * A test that wants no network passes its own resolver through
 * `FileUserOptions.issuerFor` instead of using this.
 */
export const issuerFrom = (value: string, fetcher?: Fetcher): Issuer | undefined => {
  const kind = issuerKind(value);
  if (kind === undefined) return undefined;
  const reach = fetcher === undefined ? {} : { fetch: fetcher };
  return kind.kind === 'github' ? githubIssuer(reach) : oidcIssuer({ issuer: kind.issuer, ...reach });
};
