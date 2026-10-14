/**
 * The daemon's record store: each record one Markdown file a person can edit.
 *
 * A collection is the folder `<configDir>/<name>/`, and a record is `<id>.md`
 * in it - the fields as YAML frontmatter and the collection's body field as
 * the Markdown body.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, watch as watchPath, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseYaml, stringifyYaml } from '@cofold/yaml';
import { isRecord, isRecordSlug, readJson, reason, RECORD_SLUG } from '@ahpd/sdk';
import type { CollectionOptions, RecordChange, RecordCollection, RecordStore, StoredRecord } from '@ahpd/sdk';

/** How the daemon's record store is built. */
export interface FileRecordsOptions {
  /** Somewhere to say that a file could not be read or converted. */
  onProblem?(message: string): void;
}

/** The line that opens and closes the frontmatter. */
const FENCE = '---';

/**
 * The folders in the config directory that the daemon writes itself, which no collection may take.
 *
 * `bots` is not one of them: that folder is the bot plugin's, and the plugin
 * opens it through this store.
 */
export const RESERVED_COLLECTIONS: ReadonlySet<string> = new Set(['agentPlugins', 'automations', 'node_modules', 'sessions', 'usage']);

/** How long a file's watch events are gathered before the file is read, in milliseconds. */
const WINDOW = 50;

/**
 * One record as the text of its file.
 *
 * The fields other than `body` as YAML between two `---` lines, then the body
 * field's text. The body is ended with a newline that `readRecordFile` takes
 * off again, so the file ends as an editor saves it and the text reads back
 * the same. A record with no body field, or a collection with none, has an
 * empty body.
 */
export function recordFile(record: StoredRecord, body?: string): string {
  const fields: Record<string, unknown> = { ...record };
  let text = '';
  if (body !== undefined) {
    const held = fields[body];
    delete fields[body];
    if (held !== undefined && typeof held !== 'string') throw new Error(`the field ${body} is the body, so it is text`);
    text = held ?? '';
  }
  return `${FENCE}\n${stringifyYaml(fields)}${FENCE}\n${text === '' ? '' : `${text}\n`}`;
}

/**
 * One record from the text of its file.
 *
 * The frontmatter is parsed as YAML and must be a mapping; the text below it
 * is the `body` field. A collection with no body field ignores that text.
 * Throws with what is wrong, for the caller to report.
 */
export function readRecordFile(text: string, body?: string): StoredRecord {
  const opened = /^---\r?\n/.exec(text);
  if (opened === null) throw new Error('it does not open with a --- line');
  const rest = text.slice(opened[0].length);
  const closed = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (closed === null) throw new Error('its frontmatter has no closing --- line');
  const fields = parseYaml(rest.slice(0, closed.index));
  if (!isRecord(fields)) throw new Error('its frontmatter is not a mapping of fields');
  const record = { ...fields } as StoredRecord;
  if (body !== undefined) {
    const below = rest.slice(closed.index + closed[0].length);
    record[body] = below.endsWith('\r\n') ? below.slice(0, -2) : below.endsWith('\n') ? below.slice(0, -1) : below;
  }
  return record;
}

/** One file, written whole at mode `0600`: a temporary beside it, then renamed over it. */
const written = (file: string, text: string): void => {
  const temporary = `${file}.${String(process.pid)}.tmp`;
  // Removed first, because `mode` applies only when a file is created.
  rmSync(temporary, { force: true });
  writeFileSync(temporary, text, { mode: 0o600 });
  renameSync(temporary, file);
};

/** The text of a file, or nothing when it is not there. */
const textOf = (file: string): string | undefined => {
  try {
    return readFileSync(file, 'utf8');
  }
  catch {
    return undefined;
  }
};

/** The ids of the files in a folder that end in `suffix`, where the rest is a slug. */
const idsIn = (folder: string, suffix: string): string[] => readdirSync(folder, { withFileTypes: true })
  .filter((one) => one.isFile() && one.name.endsWith(suffix))
  .map((one) => one.name.slice(0, -suffix.length))
  .filter((id) => isRecordSlug(id));

/** A copy of a record, so a caller that changes what it holds changes nothing kept here. */
const copied = (record: StoredRecord): StoredRecord => structuredClone(record);

/**
 * The record store a daemon gives its plugins: Markdown files under `dir`.
 *
 * A collection reads its folder when it is first opened and keeps what it read;
 * a watch on the folder keeps that current when a person edits, adds or
 * removes a file. A file that cannot be read is reported and the collection
 * keeps the record it had. The watch does not hold the process open.
 */
export function fileRecords(dir: string, options: FileRecordsOptions = {}): RecordStore {
  const said = (message: string): void => { options.onProblem?.(message); };
  const opened = new Map<string, RecordCollection>();

  const open = (name: string, wanted: CollectionOptions): RecordCollection => {
    const folder = join(dir, name);
    const body = wanted.body;
    const fileOf = (id: string): string => join(folder, `${id}.md`);
    mkdirSync(folder, { recursive: true, mode: 0o700 });

    /** Every record this collection holds, by id. */
    const held = new Map<string, StoredRecord>();
    /** The text each file held when this store last wrote or read it, so an event for that text is not a change. */
    const known = new Map<string, string>();
    const watchers = new Set<(change: RecordChange) => void>();
    const told = (change: RecordChange): void => {
      for (const watcher of [...watchers]) watcher(change);
    };

    /** The record in one file's text, or nothing when it is reported instead. */
    const recordIn = (id: string, text: string): StoredRecord | undefined => {
      const file = fileOf(id);
      let record: StoredRecord;
      try {
        record = readRecordFile(text, body);
      }
      catch (error) {
        said(`records ${name}: ${file} cannot be read: ${reason(error)}`);
        return undefined;
      }
      if (record.id !== id) {
        said(`records ${name}: ${file} names the id ${String(record.id)}, and the file name is the id`);
        return undefined;
      }
      return record;
    };

    /*
     * Each `<id>.json` with no `<id>.md` beside it, as a Markdown file, once.
     *
     * Renamed to `<id>.json.migrated` once its Markdown file is written, which
     * is what says it has been read. A file that cannot be read is left as it
     * is and reported.
     */
    for (const id of idsIn(folder, '.json')) {
      const file = fileOf(id);
      if (existsSync(file)) continue;
      const source = join(folder, `${id}.json`);
      const read = readJson(source);
      if (!read.ok) {
        said(`records ${name}: ${source} cannot be converted: ${read.kind === 'missing' ? 'it is gone' : reason(read.error)}`);
        continue;
      }
      if (!isRecord(read.value) || read.value['id'] !== id) {
        said(`records ${name}: ${source} cannot be converted: it is not a record whose id is ${id}`);
        continue;
      }
      try {
        written(file, recordFile(read.value as StoredRecord, body));
        renameSync(source, `${source}.migrated`);
      }
      catch (error) {
        said(`records ${name}: ${source} cannot be converted: ${reason(error)}`);
      }
    }

    for (const id of idsIn(folder, '.md')) {
      const text = textOf(fileOf(id));
      if (text === undefined) continue;
      known.set(id, text);
      const record = recordIn(id, text);
      if (record !== undefined) held.set(id, record);
    }

    /*
     * One file read again after its events settle.
     *
     * Text this store already knows is no change, which is how its own `put`
     * reaches a watcher once. A file that is gone is `deleted`, where this
     * collection held its record.
     */
    const reread = (id: string): void => {
      const text = textOf(fileOf(id));
      if (text === undefined) {
        known.delete(id);
        if (held.delete(id)) told({ id, type: 'deleted' });
        return;
      }
      if (known.get(id) === text) return;
      known.set(id, text);
      const record = recordIn(id, text);
      if (record === undefined) return;
      const type = held.has(id) ? 'updated' : 'added';
      held.set(id, record);
      told({ id, type });
    };

    const pending = new Map<string, ReturnType<typeof setTimeout>>();
    try {
      const watcher = watchPath(folder, (_event, changed) => {
        // A temporary file, another name, or no name at all is not a record.
        if (changed === null || changed === undefined) return;
        const named = String(changed);
        if (!named.endsWith('.md')) return;
        const id = named.slice(0, -'.md'.length);
        if (!isRecordSlug(id)) return;
        clearTimeout(pending.get(id));
        const timer = setTimeout(() => {
          pending.delete(id);
          reread(id);
        }, WINDOW);
        timer.unref();
        pending.set(id, timer);
      });
      watcher.on('error', (error) => { said(`records ${name}: ${folder} is no longer watched: ${reason(error)}`); });
      watcher.unref();
    }
    catch (error) {
      said(`records ${name}: ${folder} cannot be watched, so an edit there is read at the next start: ${reason(error)}`);
    }

    return {
      get: async (id) => {
        const record = held.get(id);
        return record === undefined ? undefined : copied(record);
      },
      list: async () => [...held.values()].map(copied),
      find: async (match) => [...held.values()]
        .filter((record) => Object.entries(match).every(([field, value]) => record[field] === value))
        .map(copied),
      put: async (record) => {
        if (!isRecord(record)) throw new Error(`records ${name}: a record is a JSON object`);
        if (typeof record.id !== 'string' || !isRecordSlug(record.id)) {
          throw new Error(`records ${name}: ${String(record.id)} is not a record id: ${RECORD_SLUG}`);
        }
        const text = recordFile(record, body);
        const kept = readRecordFile(text, body);
        mkdirSync(folder, { recursive: true, mode: 0o700 });
        written(fileOf(record.id), text);
        known.set(record.id, text);
        const type = held.has(record.id) ? 'updated' : 'added';
        held.set(record.id, kept);
        told({ id: record.id, type });
      },
      remove: async (id) => {
        if (typeof id !== 'string' || !isRecordSlug(id)) throw new Error(`records ${name}: ${String(id)} is not a record id: ${RECORD_SLUG}`);
        rmSync(fileOf(id), { force: true });
        const had = held.delete(id);
        known.delete(id);
        if (had) told({ id, type: 'deleted' });
        return had;
      },
      watch: (onChange) => {
        const watcher = (change: RecordChange): void => { onChange(change); };
        watchers.add(watcher);
        return () => { watchers.delete(watcher); };
      },
    };
  };

  return {
    collection: async (name, wanted = {}) => {
      if (typeof name !== 'string' || !isRecordSlug(name)) throw new Error(`${String(name)} is not a collection name: ${RECORD_SLUG}`);
      if (RESERVED_COLLECTIONS.has(name)) throw new Error(`${name} is not a collection name: the daemon keeps its own files in that folder`);
      let one = opened.get(name);
      if (one === undefined) {
        one = open(name, wanted);
        opened.set(name, one);
      }
      return one;
    },
  };
}
