import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fillWords } from '@ahpd/sdk';
import type { BotRecord } from './record.js';

/**
 * The text a bot is made from.
 *
 * Two texts, both a package of words a bot fills: the first turn a chat opens
 * with, which `templateOf` and `firstTurn` make, and the `AGENTS.md` the bot
 * works by, which `agentsTextOf` makes. A template is a record in the
 * `templates` collection, whose body is the text and whose frontmatter holds
 * its `title`. A bot names one with `template`; a bot that names none gets the
 * default text of whichever of the two it is reading.
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

/*
 * The other text: the `AGENTS.md` a bot's folder holds.
 *
 * Unlike the first turn, this one is the bot maker. Its words are only `name`,
 * `description` and `instructions` - there are no chats, because the file is
 * the bot's rules rather than the opening of one conversation - and the text
 * ahpd ships tells the bot to ask what it is for and then rewrite the file.
 * The default lives in a file a person edits, at
 * `<configDir>/templates/bots/AGENTS.md`, so it can be changed for every bot a
 * daemon makes without changing what each bot already has: the filled result
 * is copied into the bot's folder, not read from the template later.
 */

/**
 * The text ahpd ships as the default `AGENTS.md` template.
 *
 * This is what is written to the default file at load, and what is used when
 * that file cannot be read. A bot's first wake copies the filled text into its
 * own folder, so an update to this text does not reach a bot that exists.
 */
export const DEFAULT_AGENTS_TEMPLATE = `# {{name}}

{{description}}

{{instructions}}

## How you work

This file is your rules. You are a bot on ahpd, and this folder is yours.

If the text above does not say what you are for, ask the person who talks to you. Ask what work you do, for whom, and what you must never do. Then rewrite this file with their answers, in place of this section.

When your owner asks you to change how you work, rewrite this file again.
`;

/** The folder, under the daemon's configuration folder, that the default `AGENTS.md` template ships in. */
export const AGENTS_TEMPLATE_FOLDER = join('templates', 'bots');

/** The name of the default `AGENTS.md` template file. */
export const AGENTS_TEMPLATE_FILE = 'AGENTS.md';

/** Where the default `AGENTS.md` template sits, under the daemon's configuration folder. */
export const agentsTemplatePath = (configDir: string): string => join(configDir, AGENTS_TEMPLATE_FOLDER, AGENTS_TEMPLATE_FILE);

/**
 * The text of the default `AGENTS.md` template.
 *
 * The file a person may edit, or the text ahpd ships where the file cannot be
 * read - a daemon whose configuration folder was never given the file still
 * makes bots with rules. Read when it is asked for rather than kept, so an
 * edit is what the next bot gets.
 */
export function defaultAgentsTemplate(configDir: string): string {
  try {
    return readFileSync(agentsTemplatePath(configDir), 'utf8');
  }
  catch {
    return DEFAULT_AGENTS_TEMPLATE;
  }
}

/** A bot's `AGENTS.md` from one template, with its three words filled. */
export function agentsFilled(bot: BotRecord, template: string): string {
  return fillWords(template, {
    name: bot.name,
    description: bot.description ?? '',
    instructions: bot.instructions ?? '',
  });
}

/**
 * The `AGENTS.md` one bot gets on a first wake.
 *
 * The `templates` record the bot names, or the default file when it names none
 * or what it names has gone; and the text ahpd ships where that file cannot be
 * read. Filled, so the folder holds the bot's own words rather than the words a
 * template stands them in for.
 */
export const agentsTextOf = async (
  bot: BotRecord,
  templates: Pick<BotTemplates, 'text'>,
  configDir: string,
): Promise<string> => {
  const named = bot.template === undefined ? undefined : await templates.text(bot.template);
  return agentsFilled(bot, named ?? defaultAgentsTemplate(configDir));
};
