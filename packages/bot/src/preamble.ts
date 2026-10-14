import { idOf } from '@ahpd/sdk';
import { DEFAULT_TEMPLATE, firstTurn, templateOf } from './template.js';
import type { ChatPreamble } from '@ahpd/sdk';
import type { BotStore } from './store.js';
import type { BotTemplates, TemplateChat } from './template.js';

/**
 * The chat preamble of the bot plugin: a new chat of a bot's session opens with
 * the bot's template, filled again.
 *
 * The bot is found by its session's id, because the host and a bot record may
 * name one session under two schemes. The template is read on every chat, so an
 * edit to it reaches the next one. A template that no longer exists gives the
 * default one, and a problem that names the bot and the template.
 */
export function botPreamble(store: BotStore, templates: BotTemplates, problem: (line: string) => void): ChatPreamble {
  return async (opened) => {
    await store.ready();
    const session = idOf(opened.session);
    const bot = store.all().find((one) => one.session !== undefined && idOf(one.session) === session);
    if (bot === undefined) return undefined;
    let template = await templateOf(bot, templates);
    if (template === undefined) {
      problem(`bot ${bot.id}: the template ${String(bot.template)} does not exist, so the new chat got the default one`);
      template = DEFAULT_TEMPLATE;
    }
    const chats: TemplateChat[] = opened.chats.map((chat) => {
      const at = Date.parse(chat.modifiedAt);
      return { title: chat.title, modifiedAt: Number.isNaN(at) ? 0 : at };
    });
    return firstTurn(bot, template, chats, templates.lastChats);
  };
}
