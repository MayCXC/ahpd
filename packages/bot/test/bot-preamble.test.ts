import { expect, it } from 'vitest';
import { botPreamble } from '../src/preamble.js';
import { DEFAULT_TEMPLATE, firstTurn } from '../src/template.js';
import type { OpenedChat } from '@ahpd/sdk';
import type { BotRecord } from '../src/record.js';
import type { BotStore } from '../src/store.js';

type ChatSummary = OpenedChat['chats'][number];

/*
 * The text a new chat of a bot's session opens with: its template, filled again.
 *
 * The store and the templates are stubs, so what is checked is the bot found
 * for a session, the template read for it, and the chats `{{chats}}` lists.
 */

const SESSION = 'claude:/motion-session';

const bot = (over: Partial<BotRecord> = {}): BotRecord => ({
  id: 'motion',
  name: 'Motion',
  labels: [],
  body: 'robot',
  color: 'red',
  workspace: '/bots/motion',
  owner: 'user:soft',
  createdAt: '2026-10-14T00:00:00.000Z',
  updatedAt: '2026-10-14T00:00:00.000Z',
  session: SESSION,
  instructions: 'Be calm.',
  ...over,
});

/** A store over these bots, as far as the preamble reads one. */
const store = (bots: BotRecord[]): BotStore => ({
  all: () => bots,
  ready: async () => {},
} as unknown as BotStore);

/** A chat summary with this title, changed at this minute. */
const summary = (title: string, minute: number): ChatSummary => ({
  resource: `ahp-chat:/${title.replaceAll(' ', '-')}`,
  title,
  status: 1,
  modifiedAt: `2026-10-14T10:${String(minute).padStart(2, '0')}:00.000Z`,
} as ChatSummary);

const opened = (over: Partial<OpenedChat> = {}): OpenedChat => ({ session: SESSION, chat: 'ahp-chat:/new', chats: [], ...over });

/** A preamble over one bot, with a mutable template set and the problems it reported. */
function made(record: BotRecord = bot(), lastChats = 10) {
  const kept: Record<string, string> = { short: '{{name}}: {{instructions}}' };
  const problems: string[] = [];
  const preamble = botPreamble(
    store([record]),
    { text: async (name) => kept[name], lastChats },
    (line) => { problems.push(line); },
  );
  return { preamble, kept, problems };
}

it('gives a new chat in a bot\'s session the filled default template', async () => {
  const { preamble, problems } = made();
  expect(await preamble(opened())).toBe(firstTurn(bot(), DEFAULT_TEMPLATE, []));
  expect(problems).toEqual([]);
});

it('finds the bot by the session id, whatever scheme the session is named by', async () => {
  const { preamble } = made();
  expect(await preamble(opened({ session: 'ahp-session:/motion-session' }))).toContain('You are Motion.');
});

it('gives nothing to a chat in a session that is not a bot\'s', async () => {
  const { preamble } = made();
  expect(await preamble(opened({ session: 'claude:/other' }))).toBeUndefined();
});

it('lists the session\'s other chats newest first', async () => {
  const { preamble } = made();
  const text = await preamble(opened({ chats: [summary('Fix the parser', 1), summary('Read the logs', 3), summary('Plan the week', 2)] }));
  expect(text).toContain('## Your last chats\n\n- Read the logs\n- Plan the week\n- Fix the parser');
});

it('lists only as many chats as lastChats says', async () => {
  const { preamble } = made(bot(), 2);
  const text = await preamble(opened({ chats: [summary('Fix the parser', 1), summary('Read the logs', 3), summary('Plan the week', 2)] }));
  expect(text?.endsWith('- Read the logs\n- Plan the week')).toBe(true);
});

it('gives the bot\'s named template', async () => {
  const { preamble } = made(bot({ template: 'short' }));
  expect(await preamble(opened())).toBe('Motion: Be calm.');
});

it('gives the default template and reports a problem when the named template is gone', async () => {
  const { preamble, kept, problems } = made(bot({ template: 'short' }));
  delete kept['short'];
  expect(await preamble(opened())).toBe(firstTurn(bot(), DEFAULT_TEMPLATE, []));
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('motion');
  expect(problems[0]).toContain('short');
});

it('reads the template again for each chat, so an edit reaches the next one', async () => {
  const { preamble, kept } = made(bot({ template: 'short' }));
  expect(await preamble(opened())).toBe('Motion: Be calm.');
  kept['short'] = '{{name}} again';
  expect(await preamble(opened({ chat: 'ahp-chat:/next' }))).toBe('Motion again');
});
