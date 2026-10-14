import { describe, expect, it } from 'vitest';
import { checkEndpoint } from '../src/record.js';

/*
 * The endpoint record, as the `webhooks` collection holds one.
 *
 * A person writes the file by hand, so every field is checked when the record
 * is read: a record that fails the check is no endpoint, and the sentence says
 * what is wrong with it.
 */

describe('an endpoint', () => {
  it('takes a bot target with a secret', () => {
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook' })).toEqual({
      id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'callback',
    });
  });

  it('takes an automation target with a secret', () => {
    expect(checkEndpoint({ id: 'deploys', automation: true, secret: 'host:deploys' })).toEqual({
      id: 'deploys', automation: true, secret: 'host:deploys', reply: 'callback',
    });
  });

  it('refuses both targets, and refuses neither', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', automation: true, secret: 's' })).toThrow('both');
    expect(() => checkEndpoint({ id: 'ci', secret: 's' })).toThrow('bot or automation');
  });

  it('refuses a bot target that is not a bot URI', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'motion', secret: 's' })).toThrow('bot://');
  });

  it('refuses an automation target that is not true', () => {
    expect(() => checkEndpoint({ id: 'ci', automation: 'yes', secret: 's' })).toThrow('automation');
  });

  it('refuses an endpoint with no secret', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion' })).toThrow('secret');
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: '  ' })).toThrow('secret');
  });

  it('gives the callback reply when the record names none', () => {
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's' }).reply).toBe('callback');
  });

  it('takes the three reply values and refuses any other', () => {
    for (const reply of ['callback', 'sync', 'none']) {
      expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', reply }).reply).toBe(reply);
    }
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', reply: 'later' })).toThrow('reply');
  });

  it('refuses a record that is not an object', () => {
    expect(() => checkEndpoint('ci')).toThrow();
    expect(() => checkEndpoint(null)).toThrow();
  });
});
