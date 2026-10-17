import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { DEFAULT_TEMPLATE, firstTurn } from '../src/template.js';
import type { BotRecord } from '../src/record.js';
import type { TemplateChat } from '../src/template.js';

/*
 * A bot's template, filled with its four words.
 */

const bot = (over: Partial<BotRecord> = {}): BotRecord => ({
  id: 'motion',
  name: 'Motion',
  labels: [],
  body: 'robot',
  color: 'red',
  session: 'work',
  workspace: '/bots/motion',
  owner: 'user:soft',
  createdAt: '2026-10-14T00:00:00.000Z',
  updatedAt: '2026-10-14T00:00:00.000Z',
  ...over,
});

/** `count` chats, `chat 1` the oldest. */
const chats = (count: number): TemplateChat[] =>
  Array.from({ length: count }, (_, index) => ({ title: `chat ${String(index + 1)}`, modifiedAt: index + 1 }));

it('fills the default template with the four words', () => {
  const text = firstTurn(bot({ description: 'A careful reviewer.', instructions: 'Be calm.' }), DEFAULT_TEMPLATE, [{ title: 'Fix the parser', modifiedAt: 1 }]);
  expect(text).toBe('You are Motion. A careful reviewer.\n\nBe calm.\n\n## Your last chats\n\n- Fix the parser');
});

it('fills the body of a template record that has a title', async () => {
  const templates = await memoryRecords().collection('templates', { body: 'text' });
  await templates.put({ id: 'short', title: 'Short', text: '{{name}}: {{instructions}}' });
  const record = await templates.get('short');
  expect(firstTurn(bot({ instructions: 'Be calm.' }), String(record?.['text']), [])).toBe('Motion: Be calm.');
});

it('fills a bot with no description or instructions as nothing in their place', () => {
  expect(firstTurn(bot(), DEFAULT_TEMPLATE, [])).toBe('You are Motion. \n\n\n\n## Your last chats\n\nNone.');
});

it('fills None. when the bot has no chats', () => {
  expect(firstTurn(bot(), '{{chats}}', [])).toBe('None.');
});

it('lists chats newest first, with their titles', () => {
  expect(firstTurn(bot(), '{{chats}}', chats(3))).toBe('- chat 3\n- chat 2\n- chat 1');
});

it('lists 10 chats when lastChats is not set', () => {
  expect(firstTurn(bot(), '{{chats}}', chats(12)).split('\n')).toHaveLength(10);
});

it('lists no more chats than lastChats', () => {
  expect(firstTurn(bot(), '{{chats}}', chats(12), 2)).toBe('- chat 12\n- chat 11');
});

it('leaves a word it does not know as written', () => {
  expect(firstTurn(bot(), '{{name}} {{unknown}}', [])).toBe('Motion {{unknown}}');
});
