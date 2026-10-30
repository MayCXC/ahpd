/**
 * What a key and a call say about themselves, as a map of names to values.
 *
 * One check for both doors: `ahpd token mint --meta` writes a key's meta, and
 * `X-AHP-Meta` on a proxy call writes a call's. The bounds are the same, so a
 * value the mint accepts is one the header accepts, and a key's meta merged
 * under a call's is a map `checkMeta` has already seen.
 */

import { INVALID_PARAMS, RpcError } from '../rpc.js';

/** How long a name may be. */
const KEY_LIMIT = 64;

/** How long a value may be. */
const VALUE_LIMIT = 256;

/** How many entries one key, or one call, may name. */
export const META_LIMIT = 32;

/** The characters a name is written in: a letter, a digit, `_`, `.` or `-`. */
const NAME = /^[A-Za-z0-9_.-]+$/u;

/** What a value said, said back in a refusal that is worth reading. */
const said = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);

/**
 * One meta, checked against the bounds every meta has.
 *
 * The map is rebuilt, so what comes back holds only the names it checked and
 * never the body's own object. A name is 1 to 64 characters of `[A-Za-z0-9_.-]`,
 * a value is a string of at most 256 characters with no comma and no line
 * break, and one meta names at most 32 entries.
 */
export function checkMeta(body: unknown): Record<string, string> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new RpcError(INVALID_PARAMS, `A meta is a map of names to values, and that body has ${said(body)}`);
  }
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length > META_LIMIT) {
    throw new RpcError(INVALID_PARAMS,
      `A meta names ${String(META_LIMIT)} entries at most, and that body names ${String(entries.length)}`);
  }
  return Object.fromEntries(entries.map(([name, value]): [string, string] => {
    if (name.length > KEY_LIMIT || !NAME.test(name)) {
      throw new RpcError(INVALID_PARAMS,
        `A meta's name ${said(name)} is 1 to ${String(KEY_LIMIT)} characters of A to Z, a to z, 0 to 9, _, . and -`);
    }
    if (typeof value !== 'string') {
      throw new RpcError(INVALID_PARAMS, `A meta's ${name} is a string, and that body has ${said(value)}`);
    }
    if (value.length > VALUE_LIMIT) {
      throw new RpcError(INVALID_PARAMS,
        `A meta's ${name} is ${String(VALUE_LIMIT)} characters at most, and that one has ${String(value.length)}`);
    }
    if (/[,\r\n]/u.test(value)) {
      throw new RpcError(INVALID_PARAMS, `A meta's ${name} holds no comma and no line break`);
    }
    return [name, value];
  }));
}

/**
 * `k=v,k=v` read as the map it names.
 *
 * The form of the header and of one `--meta` flag: a comma between entries, the
 * first `=` inside one, and the spaces either side of a part dropped. A part
 * with no `=`, and a name written twice, are refused here; the bounds are
 * `checkMeta`'s, so both doors refuse the same things.
 */
export function parseMeta(text: string): Record<string, string> {
  const trimmed = text.trim();
  if (trimmed === '') return {};
  const held = new Map<string, string>();
  for (const part of trimmed.split(',')) {
    const entry = part.trim();
    const cut = entry.indexOf('=');
    if (cut === -1) {
      throw new RpcError(INVALID_PARAMS, `${entry} is not a meta entry; write one as name=value`);
    }
    const name = entry.slice(0, cut).trim();
    if (held.has(name)) throw new RpcError(INVALID_PARAMS, `${name} is named twice in one meta`);
    held.set(name, entry.slice(cut + 1).trim());
  }
  return checkMeta(Object.fromEntries(held));
}
