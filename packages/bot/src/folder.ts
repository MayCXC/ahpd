import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * What a bot's folder holds, written before a back session starts.
 *
 * `AGENTS.md` is the bot's rules: every harness here reads it itself, and the
 * bot rewrites it when it needs to, which is why this writes one only where
 * there is none. A bot whose record carries `instructions` gets those as its
 * first `AGENTS.md`; a bot made without any waits for the maker (task 11) and
 * gets none.
 *
 * `CLAUDE.md` is one line, `@AGENTS.md`, because Claude reads that file and not
 * `AGENTS.md`: the import is what makes the two names one document. It is
 * written whether or not there is an `AGENTS.md` yet, so the maker's later file
 * is already read without anything written here again.
 *
 * Nothing is written over. A file a person, or the bot itself, put there is the
 * one that stays: this runs before every start of a back session, and a bot
 * that wrote its own rules would otherwise lose them on the next message.
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
 * Make the folder, and give it the two files where they are not there.
 *
 * `instructions` is the record's seed and not its rules: once an `AGENTS.md`
 * exists it is the bot's, and this never asks what the record says again.
 */
export function prepareFolder(folder: string, instructions: string | undefined): void {
  mkdirSync(folder, { recursive: true });
  written(join(folder, CLAUDE_FILE), '@AGENTS.md\n');
  const seed = instructions?.trim();
  if (seed !== undefined && seed !== '') written(join(folder, AGENTS_FILE), `${seed}\n`);
}
