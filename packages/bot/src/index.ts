export { botCatalogue, CATALOGUE, CATALOGUE_SCHEME } from './catalogue.js';
export type { BotCatalogue, Catalogue } from './catalogue.js';
export { apply, defaults, name, optionsSchema, title } from './plugin.js';
export { botProvider } from './provider.js';
export type { BotOptions, BotProvider, BotSessions } from './provider.js';
export {
  ALREADY_EXISTS, BOT_BODIES, BOT_COLORS, checkRecord, CONFLICT, INVALID_PARAMS, isBotColor, isSlug, NOT_FOUND,
} from './record.js';
export type { BotBody, BotColor, BotDraft, BotRecord } from './record.js';
export { chatLines, DEFAULT_TEMPLATE, firstTurn, LAST_CHATS, TEMPLATE_WORDS, templateOf } from './template.js';
export type { BotTemplates, TemplateChat } from './template.js';
export { botStore } from './store.js';
export type { BotStore } from './store.js';
