import { describe, expect, it } from 'vitest';
import { INVALID_PARAMS, RpcError } from '../src/rpc.js';
import { ownerFilter } from '../src/utils/values.js';

/*
 * The filter a listing narrows itself to.
 *
 * One query spelling, `owner=me`, and one reading of it: the caller's own
 * records. The corners are the ones a listing cannot afford to get wrong - no
 * filter at all, a caller with no reader, and a value nobody meant.
 */

describe('ownerFilter', () => {
  it('reads the query and answers the caller\'s own owner', () => {
    expect(ownerFilter('owner=me', { id: 'ana' })).toBe('user:ana');
    expect(ownerFilter('?owner=me', { id: 'ana' })).toBe('user:ana');
    expect(ownerFilter('?page=2&owner=me', { id: 'ana' })).toBe('user:ana');
  });

  it('answers a plugin principal by its plugin, as every owner is', () => {
    expect(ownerFilter('owner=me', { id: 'plugin:bot', plugin: 'bot' })).toBe('plugin:bot');
  });

  it('answers no filter when the query names no owner', () => {
    expect(ownerFilter('')).toBeUndefined();
    expect(ownerFilter('?page=2')).toBeUndefined();
  });

  it('answers a value no record carries when there is no reader to ask', () => {
    const asked = ownerFilter('owner=me');
    expect(asked).toBeNull();
    expect(asked).not.toBe(undefined);
  });

  it('refuses any other value as a wrong param', () => {
    for (const query of ['owner=you', 'owner=', 'owner=user:ana']) {
      let refused: unknown;
      try {
        ownerFilter(query, { id: 'ana' });
      } catch (error) {
        refused = error;
      }
      expect(refused).toBeInstanceOf(RpcError);
      expect((refused as RpcError).code).toBe(INVALID_PARAMS);
    }
  });
});
