/*
 * The decisions that outlive one session, and the keys they are kept under.
 *
 * A toggle carries a decision per scope, and this is where the two the session
 * does not own are held. Two things are worth a test: the key, which is what
 * makes a decision reach the same customization after a restart, and the rules
 * that keep the store holding decisions - a decision equal to what it inherits
 * is not one, and the store does not grow without bound.
 */

import { expect, it } from 'vitest';
import { enablementKeyOf, memoryEnablement } from '../src/enablement.js';

/** One plugin's URI, which is what a decision about it is keyed by. */
const PLUGIN = 'file:///copies/holder/a-plugin';

it('keys a plugin, a server of one, and a server with no plugin behind it', () => {
  expect(enablementKeyOf({ type: 'plugin', uri: PLUGIN })).toBe(PLUGIN);
  // A server of a plugin is the plugin's key with the server named after it, so
  // the same name under another plugin is another decision.
  expect(enablementKeyOf({ type: 'mcpServer', uri: `${PLUGIN}/.mcp.json`, name: 'one' }, PLUGIN))
    .toBe(`${PLUGIN}#mcp=one`);
  expect(enablementKeyOf({ type: 'mcpServer', uri: `${PLUGIN}/.mcp.json`, name: 'one' }, 'file:///copies/holder/another'))
    .toBe(`file:///copies/holder/another#mcp=one`);
  // One the host or a backend reported: no plugin to hang it under, so it is
  // keyed by its name alone.
  expect(enablementKeyOf({ type: 'mcpServer', id: 'mcp:gmail', uri: 'gmail', name: 'gmail' }))
    .toBe('mcpServers#gmail');
  // VS Code's host keeps decisions for plugins and MCP servers only, and these
  // are the rest of what a session reports.
  expect(enablementKeyOf({ type: 'skill', id: 'x', name: 'a-skill' })).toBeUndefined();
  expect(enablementKeyOf({ type: 'plugin' })).toBeUndefined();
  expect(enablementKeyOf({})).toBeUndefined();
});

it('says nothing where nothing was decided, and follows the wider decision', () => {
  const store = memoryEnablement();
  const key = enablementKeyOf({ type: 'plugin', uri: PLUGIN }) ?? '';
  // A customization nobody switched off is on, which is what an absent
  // decision stands for.
  expect(store.global(key)).toBeUndefined();
  expect(store.folder('/work', key)).toBeUndefined();

  store.setGlobal(key, false);
  expect(store.global(key)).toBe(false);
  // The folder says nothing, so it follows the decision for every session.
  expect(store.folder('/work', key)).toBeUndefined();

  store.setFolder('/work', key, true);
  expect(store.folder('/work', key)).toBe(true);
  expect(store.folder('/elsewhere', key)).toBeUndefined();
});

it('does not keep a decision that says what it would inherit', () => {
  const store = memoryEnablement();
  const key = enablementKeyOf({ type: 'plugin', uri: PLUGIN }) ?? '';

  // On is what every session already is, so a decision saying so is no
  // decision at all.
  store.setGlobal(key, true);
  expect(store.global(key)).toBeUndefined();

  // A folder that agrees with every session says nothing either.
  store.setFolder('/work', key, true);
  expect(store.folder('/work', key)).toBeUndefined();

  store.setGlobal(key, false);
  store.setFolder('/work', key, true);
  expect(store.folder('/work', key)).toBe(true);
  // Every session is on again, so the folder now says what it inherits.
  store.setGlobal(key, undefined);
  expect(store.folder('/work', key)).toBeUndefined();

  // And a decision is cleared by asking for nothing.
  store.setGlobal(key, undefined);
  expect(store.global(key)).toBeUndefined();
  store.setFolder('/work', key, false);
  expect(store.folder('/work', key)).toBe(false);
  store.setFolder('/work', key, undefined);
  expect(store.folder('/work', key)).toBeUndefined();
});

it('drops the decision set longest ago when it holds more than 512', () => {
  const store = memoryEnablement();
  for (let index = 0; index < 512; index += 1) store.setGlobal(`k${String(index)}`, false);
  expect(store.global('k0')).toBe(false);
  expect(store.global('k511')).toBe(false);

  store.setGlobal('k512', false);
  expect(store.global('k0')).toBeUndefined();
  expect(store.global('k1')).toBe(false);
  expect(store.global('k512')).toBe(false);
});

it('drops the oldest decision, not the first one written down', () => {
  const store = memoryEnablement();
  for (let index = 0; index < 512; index += 1) store.setGlobal(`k${String(index)}`, false);
  // A decision somebody makes again is the newest one they made.
  store.setGlobal('k0', false);
  store.setGlobal('k512', false);
  expect(store.global('k0')).toBe(false);
  expect(store.global('k1')).toBeUndefined();
});
