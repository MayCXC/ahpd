/*
 * What a key and a call say about themselves: one map, one set of bounds.
 *
 * The mint writes a key's meta and the proxy header writes a call's, and both
 * go through `checkMeta`, so a case here is one both doors refuse. `parseMeta`
 * is the text form the header and the flag share.
 */

import { expect, it } from 'vitest';
import { checkMeta, parseMeta } from '../src/access/meta.js';
import { RpcError } from '../src/rpc.js';

/** The sentence a refusal carries, which is what a client and the log read. */
const refusal = (run: () => unknown): string => {
  try { run(); }
  catch (error) {
    expect(error).toBeInstanceOf(RpcError);
    expect((error as RpcError).code).toBe(-32602);
    return (error as Error).message;
  }
  throw new Error('nothing was refused');
};

it('accepts a name and a value at their limits, and refuses one past each', () => {
  const longestName = 'a'.repeat(64);
  const longestValue = 'x'.repeat(256);
  expect(checkMeta({ [longestName]: longestValue })).toEqual({ [longestName]: longestValue });

  expect(refusal(() => checkMeta({ ['a'.repeat(65)]: 'x' }))).toContain('is 1 to 64 characters');
  expect(refusal(() => checkMeta({ a: 'x'.repeat(257) }))).toContain('is 256 characters at most');
  // An empty value is a name with nothing after it, which is a value of zero.
  expect(checkMeta({ a: '' })).toEqual({ a: '' });
});

it('accepts 32 entries and refuses the thirty-third', () => {
  const entries = Object.fromEntries(Array.from({ length: 32 }, (_one, at) => [`k${String(at)}`, 'v']));
  expect(Object.keys(checkMeta(entries))).toHaveLength(32);
  expect(refusal(() => checkMeta({ ...entries, k32: 'v' }))).toBe('A meta names 32 entries at most, and that body names 33');
});

it('accepts a name of letters, digits, _, . and -, and refuses any other', () => {
  expect(checkMeta({ 'a_B-c.9': 'v' })).toEqual({ 'a_B-c.9': 'v' });
  for (const name of ['', 'a b', 'a,b', 'é', 'a/b']) {
    expect(refusal(() => checkMeta({ [name]: 'v' })), name).toContain('is 1 to 64 characters of A to Z');
  }
});

it('refuses a value that is not a string, holds a comma, or holds a line break', () => {
  expect(refusal(() => checkMeta({ a: 1 }))).toBe('A meta\'s a is a string, and that body has 1');
  expect(refusal(() => checkMeta({ a: 'x,y' }))).toBe('A meta\'s a holds no comma and no line break');
  expect(refusal(() => checkMeta({ a: 'x\ny' }))).toBe('A meta\'s a holds no comma and no line break');
  expect(refusal(() => checkMeta({ a: 'x\ry' }))).toBe('A meta\'s a holds no comma and no line break');
});

it('refuses a body that is not a map', () => {
  for (const body of [undefined, null, [], 'a=1', 3]) {
    expect(refusal(() => checkMeta(body))).toContain('A meta is a map of names to values');
  }
});

it('reads k=v,k=v, trimming spaces, and refuses a part with no = or a name written twice', () => {
  expect(parseMeta('a=1, b=2')).toEqual({ a: '1', b: '2' });
  expect(parseMeta(' env = prod , client = pi ')).toEqual({ env: 'prod', client: 'pi' });
  expect(parseMeta('a=')).toEqual({ a: '' });
  // Nothing named is no meta at all, which is what a client sending no header means.
  expect(parseMeta('  ')).toEqual({});

  expect(refusal(() => parseMeta('a'))).toBe('a is not a meta entry; write one as name=value');
  expect(refusal(() => parseMeta('=1'))).toContain('is 1 to 64 characters of A to Z');
  expect(refusal(() => parseMeta('a=1,a=2'))).toBe('a is named twice in one meta');
  // A comma inside one value reads as the start of the next entry, which has
  // no `=`, so the value is refused rather than split.
  expect(refusal(() => parseMeta('a=x,y'))).toBe('y is not a meta entry; write one as name=value');
});

it('refuses what checkMeta refuses, so both doors agree', () => {
  expect(refusal(() => parseMeta('a=x' + 'y'.repeat(256)))).toContain('is 256 characters at most');
  expect(refusal(() => parseMeta('a=1,a=2'))).toContain('named twice');
  const many = Array.from({ length: 33 }, (_one, at) => `k${String(at)}=v`).join(',');
  expect(refusal(() => parseMeta(many))).toBe('A meta names 32 entries at most, and that body names 33');
});
