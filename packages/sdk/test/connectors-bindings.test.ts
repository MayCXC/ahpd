import { describe, expect, it } from 'vitest';
import { BINDINGS_KEY, bindingTarget, bindingsOf } from '../src/connectors/bindings.js';

/*
 * A session's bindings: the alias a model says, and the connector it names.
 *
 * Read live, so a value that is not a binding is skipped rather than refused -
 * the good aliases still stand.
 */
describe('bindingsOf', () => {
  it('reads an alias map as rows, in the order it was declared', () => {
    expect(bindingsOf({
      connectors: {
        work: 'connectors://resend/account-123',
        personal: 'connectors://resend/account-456',
      },
    })).toEqual([
      { alias: 'work', adapter: 'resend', id: 'account-123' },
      { alias: 'personal', adapter: 'resend', id: 'account-456' },
    ]);
  });

  it('skips a value that is not a connector URI, and an alias that is not a slug', () => {
    expect(bindingsOf({
      connectors: {
        work: 'connectors://resend/account-123',
        Work: 'connectors://resend/account-123',
        'no slug': 'connectors://resend/account-123',
        mail: 'https://example.com',
        two: 'connectors://resend/a/b',
        one: 'connectors://resend',
        empty: '',
        number: 7,
      },
    })).toEqual([{ alias: 'work', adapter: 'resend', id: 'account-123' }]);
  });

  it('answers nothing for a config with no map, or a map of another shape', () => {
    expect(bindingsOf({})).toEqual([]);
    expect(bindingsOf({ [BINDINGS_KEY]: 'connectors://resend/account-123' })).toEqual([]);
    expect(bindingsOf({ [BINDINGS_KEY]: ['connectors://resend/account-123'] })).toEqual([]);
    expect(bindingsOf(undefined)).toEqual([]);
  });

  it('reads one value through bindingTarget, and refuses either half that is not a slug', () => {
    expect(bindingTarget('connectors://resend/account-123')).toEqual({ adapter: 'resend', id: 'account-123' });
    expect(bindingTarget('connectors://Resend/account-123')).toBeUndefined();
    expect(bindingTarget('connectors://resend/Account-123')).toBeUndefined();
    expect(bindingTarget('connectors://resend/')).toBeUndefined();
    expect(bindingTarget(undefined)).toBeUndefined();
  });
});
