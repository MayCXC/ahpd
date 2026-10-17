import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS_TEMPLATE_FOLDER, agentsTemplatePath, DEFAULT_AGENTS_TEMPLATE } from './template.js';

/**
 * What a bot's folder holds, and the default template that makes it.
 *
 * `AGENTS.md` is the bot's rules: every harness here reads it itself, and the
 * bot rewrites it when it needs to, which is why this writes one only where
 * there is none. The text comes from the bot's template, already filled with
 * its words - the shipped template is the maker, so a bot with no
 * `instructions` gets a file too, one that tells it to ask what it is for.
 *
 * `CLAUDE.md` is one line, `@AGENTS.md`, because Claude reads that file and not
 * `AGENTS.md`: the import is what makes the two names one document. It is
 * written whether or not there is an `AGENTS.md` yet.
 *
 * Nothing is written over. A file a person, or the bot itself, put there is the
 * one that stays: this runs before every start of a back session, and a bot
 * that wrote its own rules would otherwise lose them on the next message. The
 * same holds for the default template file: it is written by the plugin at
 * load where it is absent, and a person's edit is what stays.
 */

/** The file a bot's rules are in. */
export const AGENTS_FILE = 'AGENTS.md';

/** The file Claude reads, which names `AGENTS.md`. */
export const CLAUDE_FILE = 'CLAUDE.md';

/** Write `text` where `path` is absent, and leave a file that is there alone. */
const written = (path: string, text: string): void => {
  try {
    // `wx` is the check and the write as one step, so two wakes racing for the
    // same folder cannot both find the file absent and both write it.
    writeFileSync(path, text, { flag: 'wx' });
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
};

/**
 * Write the default `AGENTS.md` template under the configuration folder, where
 * it is not there.
 *
 * Called by the plugin at load, so a person has a file to edit before any bot
 * is woken, and so a bot made on a daemon that has one gets the person's text
 * rather than the one ahpd ships.
 */
export function prepareAgentsTemplate(configDir: string): void {
  mkdirSync(join(configDir, AGENTS_TEMPLATE_FOLDER), { recursive: true });
  written(agentsTemplatePath(configDir), DEFAULT_AGENTS_TEMPLATE);
}

/**
 * Make the folder, and give it the two files where they are not there.
 *
 * `agents` is the bot's `AGENTS.md`, already made from its template and filled
 * with its words: once the file exists it is the bot's, and this never asks
 * what the record says again.
 */
export function prepareFolder(folder: string, agents: string): void {
  mkdirSync(folder, { recursive: true });
  written(join(folder, CLAUDE_FILE), '@AGENTS.md\n');
  written(join(folder, AGENTS_FILE), agents.endsWith('\n') ? agents : `${agents}\n`);
}
