import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { AGENTS_FILE, CLAUDE_FILE, prepareFolder } from '../src/folder.js';

/*
 * The two files a bot's folder holds.
 *
 * `AGENTS.md` is the bot's rules and `CLAUDE.md` is the one line that makes
 * Claude read them. Both are written before a back session starts, and neither
 * is ever written over: a bot that writes its own rules, or a person who wrote
 * some, is the one the next message is answered by.
 */

/** A folder of its own for one case, which does not exist yet. */
const folder = (): string => join(mkdtempSync(join(tmpdir(), 'ahpd-bot-folder-')), 'bot');

/** A file in the folder as it is on disk. */
const read = (dir: string, name: string): string => readFileSync(join(dir, name), 'utf8');

it('gives an empty folder CLAUDE.md and an AGENTS.md from the record', () => {
  const dir = folder();

  prepareFolder(dir, 'You are Backer. Answer in one line.');

  // The import is the whole of CLAUDE.md: Claude reads that file, and the line
  // is what puts AGENTS.md in front of it.
  expect(read(dir, CLAUDE_FILE)).toBe('@AGENTS.md\n');
  // The record's instructions are the seed, which is what a bot made with a
  // description starts from.
  expect(read(dir, AGENTS_FILE)).toBe('You are Backer. Answer in one line.\n');
});

it('leaves a file somebody wrote alone', () => {
  const dir = folder();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, AGENTS_FILE), '# Our rules\n\nAsk before pushing.\n');
  writeFileSync(join(dir, CLAUDE_FILE), '@AGENTS.md\n\nAnd read the README.\n');

  prepareFolder(dir, 'You are Backer.');

  // The folder is the bot's own document once anything is there, and a later
  // wake is not the place to decide otherwise.
  expect(read(dir, AGENTS_FILE)).toBe('# Our rules\n\nAsk before pushing.\n');
  expect(read(dir, CLAUDE_FILE)).toBe('@AGENTS.md\n\nAnd read the README.\n');
});

it('writes CLAUDE.md and no AGENTS.md for a bot with no instructions', () => {
  const dir = folder();

  prepareFolder(dir, undefined);

  // The maker (task 11) writes the rules on the owner's first wake, so until
  // then there are none - but the import is there waiting for the file.
  expect(read(dir, CLAUDE_FILE)).toBe('@AGENTS.md\n');
  expect(existsSync(join(dir, AGENTS_FILE))).toBe(false);
});
