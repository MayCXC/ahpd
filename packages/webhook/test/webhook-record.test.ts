import { describe, expect, it } from 'vitest';
import { checkEndpoint } from '../src/record.js';

/*
 * The endpoint a `webhook` connector's config describes.
 *
 * A person fills the form in from a client, so every field is checked when the
 * connector is opened: a config that fails the check opens no endpoint, and
 * the sentence says what is wrong with it.
 */

describe('an endpoint', () => {
  it('takes a bot target with a secret, and answers at once when the record names no reply', () => {
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook' })).toEqual({
      id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'none',
    });
  });

  it('takes an automation target with a secret, and stores no reply', () => {
    expect(checkEndpoint({ id: 'deploys', automation: 'ahpd-automation:/deploys', secret: 'host:deploys' })).toEqual({
      id: 'deploys', automation: 'ahpd-automation:/deploys', secret: 'host:deploys',
    });
  });

  it('refuses both targets, and takes neither: a connector with neither fires the trigger', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', automation: 'ahpd-automation:/x', secret: 's' })).toThrow('both');
    expect(checkEndpoint({ id: 'ci', secret: 's' })).toEqual({ id: 'ci', secret: 's' });
  });

  it('refuses a bot field on a connector with no bot', () => {
    for (const field of ['reply', 'callbackPrefix', 'syncTimeoutSeconds']) {
      expect(() => checkEndpoint({ id: 'ci', secret: 's', [field]: field === 'reply' ? 'none' : 1 })).toThrow(field);
    }
  });

  it('refuses a bot target that is not a bot URI', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'motion', secret: 's' })).toThrow('bot://');
  });

  it('refuses an automation target that is not a non-empty id', () => {
    for (const automation of [true, '', '  ', 3]) {
      expect(() => checkEndpoint({ id: 'ci', automation, secret: 's' })).toThrow('automation');
    }
  });

  it('refuses an endpoint with no secret', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion' })).toThrow('secret');
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: '  ' })).toThrow('secret');
  });

  it('gives the none reply when a bot record names none', () => {
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's' }).reply).toBe('none');
  });

  it('takes the three reply values and refuses any other', () => {
    for (const reply of ['callback', 'sync', 'none']) {
      const callbackPrefix = reply === 'callback' ? { callbackPrefix: 'https://ci.example.com/hooks/' } : {};
      expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', reply, ...callbackPrefix }).reply).toBe(reply);
    }
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', reply: 'later' })).toThrow('reply');
  });

  it('refuses the callback reply with no callbackPrefix', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', reply: 'callback' })).toThrow('callbackPrefix');
  });

  it('refuses a record that is not an object', () => {
    expect(() => checkEndpoint('ci')).toThrow();
    expect(() => checkEndpoint(null)).toThrow();
  });

  it('takes a callbackPrefix that is an http or https URL whose path ends in /', () => {
    const endpoint = checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', callbackPrefix: 'https://ci.example.com/hooks/' });
    expect(endpoint.callbackPrefix).toBe('https://ci.example.com/hooks/');
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', callbackPrefix: 'http://ci.example.com/' }).callbackPrefix)
      .toBe('http://ci.example.com/');
  });

  it('refuses a callbackPrefix that is not an http or https URL', () => {
    for (const callbackPrefix of ['ftp://ci.example.com/', 'file:///tmp/', 'ci.example.com/', 42]) {
      expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', callbackPrefix })).toThrow('callbackPrefix');
    }
  });

  it('refuses a callbackPrefix whose path does not end in /', () => {
    expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', callbackPrefix: 'https://ci.example.com/hooks' }))
      .toThrow('callbackPrefix');
  });

  it('takes a positive syncTimeoutSeconds, and refuses 0, a negative number and a string', () => {
    expect(checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', syncTimeoutSeconds: 5 }).syncTimeoutSeconds).toBe(5);
    for (const syncTimeoutSeconds of [0, -3, '5']) {
      expect(() => checkEndpoint({ id: 'ci', bot: 'bot://motion', secret: 's', syncTimeoutSeconds })).toThrow('syncTimeoutSeconds');
    }
  });

  it('takes a match of dotted paths, each to a string or a list of strings', () => {
    const match = { 'headers.x-github-event': 'push', 'body.ref': ['main', 'release'] };
    expect(checkEndpoint({ id: 'ci', secret: 's', match }).match).toEqual(match);
  });

  it('refuses a match that is not an object, with an empty path or a value that is not strings', () => {
    expect(() => checkEndpoint({ id: 'ci', secret: 's', match: 'push' })).toThrow('match');
    expect(() => checkEndpoint({ id: 'ci', secret: 's', match: [] })).toThrow('match');
    expect(() => checkEndpoint({ id: 'ci', secret: 's', match: { '  ': 'push' } })).toThrow('match path');
    expect(() => checkEndpoint({ id: 'ci', secret: 's', match: { 'body.ref': 3 } })).toThrow('body.ref');
    expect(() => checkEndpoint({ id: 'ci', secret: 's', match: { 'body.ref': ['main', 3] } })).toThrow('body.ref');
  });
});
