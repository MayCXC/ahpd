/**
 * The parts of an `AGENTS.md` that its owner owns, and how to read and change
 * them without touching the rest of the file.
 *
 * The file is the bot's: it may rewrite any part of it, in any shape, and the
 * parser takes what it finds rather than refusing a file. Two parts belong to
 * the owner and are all this module knows: the frontmatter keys `version`,
 * `name` and `description`, and the text under the `## Instructions` heading,
 * which runs to the next `##` heading or the end of the file. A part the file
 * does not have reads as empty.
 *
 * The writer changes those parts in place and keeps every other byte, because
 * everything else in the file is the bot's own writing - comments, other
 * frontmatter keys, other sections. The frontmatter is edited by line rather
 * than re-stringified whole for the same reason: a key a person or the bot put
 * there is not this module's to reformat.
 */

/** The layout version `writeAgents` writes when neither the parts nor the file names one. */
export const AGENTS_VERSION = 1;

/**
 * The YAML the plugin host hands the plugin, which the host reads its own
 * files with.
 *
 * Taken as a value rather than imported, so the package runs with no YAML
 * dependency of its own: the daemon gives the plugin its own subset, and a
 * test gives it the parser the other plugin tests use.
 */
export interface Yaml {
  /** A YAML text as data, with the subset the host reads its own files with. */
  parseYaml(text: string): unknown;
  /** A value as YAML text that `parseYaml` reads back as the same value. */
  stringifyYaml(value: unknown): string;
}

/** The heading whose section is the owner's, and from where the section's text begins. */
const INSTRUCTIONS = /^##[ \t]+Instructions[ \t]*(?:\r?\n|$)/m;

/** A level-2 heading, which is where the Instructions section ends. */
const HEADING = /^##(?:[ \t]|$)/m;

/** A top-level frontmatter key: an unindented name, its colon and nothing of its value. */
const KEY = /^([A-Za-z0-9_.-]+)[ \t]*:/gm;

/** The frontmatter keys the owner owns, in the order the writer adds the ones a file lacks. */
const OWNED = ['version', 'name', 'description'] as const;

/** What an `AGENTS.md` says in the parts its owner owns. */
export interface AgentsParts {
  /** The layout version the frontmatter names, or `undefined` when it names none. */
  version: number | undefined;
  /** The bot's name, or empty. */
  name: string;
  /** One line about the bot, or empty. */
  description: string;
  /** The text under `## Instructions`, without the blank lines at each end, or empty. */
  instructions: string;
}

/** A file as the parts the writer changes and the parts it leaves alone. */
interface Split {
  /** The opening `---` line, or empty when the file has no frontmatter. */
  head: string;
  /** The YAML between the two fences, or empty. */
  front: string;
  /** The closing `---` line, or empty when the file has no frontmatter. */
  close: string;
  /** Everything after the closing fence, or the whole text when there is none. */
  body: string;
  /** Whether the file has a frontmatter to edit. */
  has: boolean;
}

/**
 * The file as its frontmatter and its body.
 *
 * A frontmatter is a `---` line first and a `---` line on a line of its own
 * somewhere below. A file that opens with anything else, or opens with `---`
 * and never closes it, has no frontmatter: it is all body, and the writer puts
 * one on top of it.
 */
function split(text: string): Split {
  const opened = /^---[ \t]*\r?\n/.exec(text);
  if (opened === null) return { head: '', front: '', close: '', body: text, has: false };
  const rest = text.slice(opened[0].length);
  const closed = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (closed === null) return { head: '', front: '', close: '', body: text, has: false };
  return {
    head: opened[0],
    front: rest.slice(0, closed.index),
    close: closed[0],
    body: rest.slice(closed.index + closed[0].length),
    has: true,
  };
}

/**
 * The frontmatter as a mapping, or nothing.
 *
 * The parser the plugin host gives the plugin, which is the one the record
 * collections read their frontmatter with, so a file means here what it means
 * there. A frontmatter that is not a mapping, or that the parser rejects, is
 * no frontmatter rather than a refusal: the file belongs to the bot, and a
 * broken one is still read for what it does say.
 */
function fields(yaml: Yaml, front: string): Record<string, unknown> | undefined {
  try {
    const parsed = yaml.parseYaml(front);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  }
  catch {
    return undefined;
  }
}

/** The text of the Instructions section, without the blank lines at each end. */
function instructionsOf(body: string): string {
  const region = sectionOf(body);
  if (region === undefined) return '';
  return body.slice(region.start, region.end)
    .replace(/^(?:[ \t]*\r?\n)+/, '')
    .replace(/(?:\r?\n[ \t]*)+$/, '');
}

/** Where the Instructions section's text starts and ends in the body, or `undefined` when there is no section. */
function sectionOf(body: string): { start: number; end: number } | undefined {
  const heading = INSTRUCTIONS.exec(body);
  if (heading === null) return undefined;
  const start = heading.index + heading[0].length;
  const next = HEADING.exec(body.slice(start));
  return { start, end: next === null ? body.length : start + next.index };
}

/** A part the file does not have as an empty value. */
const said = (fields: Record<string, unknown> | undefined, key: string): string => {
  const value = fields?.[key];
  return typeof value === 'string' ? value : '';
};

/** A layout version, where the frontmatter names an integer one. */
const versionOf = (fields: Record<string, unknown> | undefined): number | undefined => {
  const value = fields?.['version'];
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
};

/**
 * The parts an `AGENTS.md` says its owner owns.
 *
 * A file with no frontmatter, or with one that names none of the keys, reads
 * its version as `undefined` and its name and description as empty. A file
 * with no Instructions section reads its instructions as empty - what a bot
 * leaves of a section it removed, and what an edit in the UI writes again.
 */
export function readAgents(yaml: Yaml, text: string): AgentsParts {
  const { front, body } = split(text);
  const parsed = fields(yaml, front);
  return {
    version: versionOf(parsed),
    name: said(parsed, 'name'),
    description: said(parsed, 'description'),
    instructions: instructionsOf(body),
  };
}

/** One frontmatter entry, quoted or written as a block exactly as the parser reads it back. */
const entry = (yaml: Yaml, key: string, value: unknown): string => yaml.stringifyYaml({ [key]: value });

/**
 * The frontmatter with the owner's keys set and every other byte as it was.
 *
 * A key that is there has its own line, and any continuation lines a block or
 * folded scalar took, replaced by the new entry. Keys the frontmatter lacks are
 * added at the top, so a file a person wrote by hand keeps its shape below
 * them. A key a bot wrote twice is written twice with the new value, which is
 * still the value the parser reads last.
 */
function setFields(yaml: Yaml, front: string, values: Record<string, unknown>): string {
  const matches = [...front.matchAll(KEY)];
  const spans = matches.map((match, at) => ({
    key: match[1] ?? '',
    start: match.index ?? 0,
    end: at + 1 < matches.length ? (matches[at + 1]?.index ?? front.length) : front.length,
  }));
  const seen = new Set(spans.map((span) => span.key));
  let out = front;
  for (let at = spans.length - 1; at >= 0; at -= 1) {
    const span = spans[at];
    if (span === undefined || !(OWNED as readonly string[]).includes(span.key)) continue;
    out = out.slice(0, span.start) + entry(yaml, span.key, values[span.key]) + out.slice(span.end);
  }
  return OWNED.filter((key) => !seen.has(key)).map((key) => entry(yaml, key, values[key])).join('') + out;
}

/** A line ending before text that does not already begin one. */
const gap = (body: string, eol: string): string =>
  body === '' || body.startsWith('\n') || body.startsWith('\r\n') ? '' : eol;

/**
 * The file with the owner's parts changed and every other byte kept.
 *
 * The version is the parts' own, or the one the frontmatter already names, or
 * `AGENTS_VERSION` - a write that says nothing about a layout does not move a
 * file from the layout it is in. A missing Instructions section is added after
 * the frontmatter, and a missing frontmatter is added on top, so a file the
 * bot wrote before this layout reads with its old text below the new section.
 */
export function writeAgents(yaml: Yaml, text: string, parts: AgentsParts): string {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const { head, front, close, body, has } = split(text);
  const version = parts.version ?? versionOf(fields(yaml, front)) ?? AGENTS_VERSION;
  const values: Record<string, unknown> = {
    version,
    name: parts.name,
    description: parts.description,
  };
  const edited = setFields(yaml, front, values);

  const region = sectionOf(body);
  const kept = region === undefined
    ? `${eol}## Instructions${eol}${eol}${parts.instructions}${eol}${gap(body, eol)}${body}`
    : body.slice(0, region.start) + eol + parts.instructions + eol + (region.end < body.length ? eol : '') + body.slice(region.end);

  return has
    ? head + edited + close + kept
    : `---${eol}${edited}---${eol}${kept}`;
}
