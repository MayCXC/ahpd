import { fillWords } from '@ahpd/sdk';
import type { BotRecord } from './record.js';

/**
 * The text a bot's first turn is made from.
 *
 * A template is a record in the `templates` collection, whose body is the text
 * and whose frontmatter holds its `title`. A bot names one with `template`, and
 * a bot that names none gets `DEFAULT_TEMPLATE`.
 */

/** The template a bot gets when it names none. */
export const DEFAULT_TEMPLATE = `You are {{name}}. {{description}}

{{instructions}}

## Your last chats

{{chats}}`;

/** The words a template may name. */
export const TEMPLATE_WORDS = ['name', 'description', 'instructions', 'chats'] as const;

/** How many chats `{{chats}}` lists when the plugin option does not say. */
export const LAST_CHATS = 10;

/** One chat of a bot's session, as `{{chats}}` lists it. */
export interface TemplateChat {
  /** What the chat is called. */
  title: string;
  /** When it last changed, in milliseconds, which orders the list. */
  modifiedAt: number;
}

/** The `{{chats}}` lines: `- <title>` per chat, newest first, at most `last` of them, or `None.` */
export const chatLines = (chats: readonly TemplateChat[], last: number = LAST_CHATS): string => {
  const newest = [...chats].sort((one, other) => other.modifiedAt - one.modifiedAt).slice(0, Math.max(0, last));
  return newest.length === 0 ? 'None.' : newest.map((chat) => `- ${chat.title}`).join('\n');
};

/** What reads a template, and how many chats `{{chats}}` lists. */
export interface BotTemplates {
  /** The text of the template with this name, or nothing when there is none. */
  text(name: string): Promise<string | undefined>;
  /** How many chats `{{chats}}` lists. */
  lastChats: number;
}

/** The text of a bot's template: the default when it names none, and nothing when the one it names is missing. */
export const templateOf = async (bot: { template?: string | undefined }, templates: BotTemplates): Promise<string | undefined> =>
  bot.template === undefined ? DEFAULT_TEMPLATE : await templates.text(bot.template);

/** A bot's template, filled with its four words. */
export function firstTurn(bot: BotRecord, template: string, chats: readonly TemplateChat[], last: number = LAST_CHATS): string {
  const words: Record<(typeof TEMPLATE_WORDS)[number], string> = {
    name: bot.name,
    description: bot.description ?? '',
    instructions: bot.instructions ?? '',
    chats: chatLines(chats, last),
  };
  return fillWords(template, words);
}
