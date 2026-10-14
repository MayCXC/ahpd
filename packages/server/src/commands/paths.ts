/**
 * `ahpd paths`: the folders this host serves.
 *
 * A folder named here is one this host's agents read, edit and run in, so it is
 * the one setting a client sets on a host it has just reached, and it is set
 * with one command and no question. At the terminal the verbs edit the file
 * `--config-file` names; served they edit the daemon's own file, through the
 * same code, because the daemon's file is the file a restart reads.
 */

import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { output } from '@cofold/commands';
import type { Command, Registry } from '@cofold/commands';
import { configPath, loadConfig } from '../config.js';
import { running } from '../daemon.js';
import { oneAtATime, readEntry, writeEntry } from '../install.js';
import { under } from './configure.js';
import { serverFields, stop } from './options.js';
import type { ServedFacts } from './served.js';

/**
 * What a change at the terminal says: a daemon read the file as it started, so
 * a restart is what applies the change to it. A served change is that daemon's
 * own file and that daemon's own list, so it says nothing of the sort.
 */
const restartLine = (verb: 'add' | 'remove', folder: string): string =>
  `Restart the daemon to apply the change: ahpd restart. To reach it now: ahpd --remote <url> paths ${verb} ${folder}`;

/** The folders a configuration entry names, and nothing for one holding anything else. */
const pathsIn = (held: { paths?: unknown }): string[] => (Array.isArray(held.paths)
  ? held.paths.filter((one): one is string => typeof one === 'string')
  : []);

export const declarePaths = (registry: Registry<object>, served?: ServedFacts): Command[] => {
  const list = registry.action({
    id: 'paths.list',
    summary: 'The folders this host serves',
    description: 'At the terminal, every folder the configuration names, from every file it is read in. Served, the folders the daemon serves now. A daemon that names none serves the folder it is started in.',
    surfaces: { cli: { pattern: ['paths', 'list'] }, http: { method: 'GET', path: '/paths/list' } },
    // No key: this is the list of folders, and each of the other two verbs here
    // takes one of them.
    effect: 'read',
    resource: { kind: 'folder' },
    // Served, the folders are the daemon's own, so no field could name another.
    ...(served === undefined ? { input: { configFile: serverFields.configFile } } : {}),
    scopes: ['config:read'],
    run: (context) => {
      // Served, the answer is the list the daemon serves now.
      const folders = served === undefined
        ? pathsIn(loadConfig(context.optional<string>('configFile')).values)
        : [...served.options.paths];
      return output(folders, folders.length === 0 ? 'paths: none named\n' : `${folders.join('\n')}\n`);
    },
  });

  /** The file a command edits: the daemon's own when served, whatever the request names. */
  const fileOf = (named: string | undefined): string => (served === undefined ? named : served.configFile) ?? configPath();

  /**
   * Whether a change is said to need a restart: at the terminal, when a record
   * says one is up. Served, the daemon serving is the one whose file was just
   * written and whose list was just changed, so it has nothing to apply.
   */
  const restarting = (): boolean => served === undefined && running() !== undefined;

  const write = (sub: 'add' | 'remove') => registry.action({
    id: `paths.${sub}`,
    summary: sub === 'add' ? 'Serve a folder' : 'Stop serving a folder',
    description: sub === 'add'
      ? 'The folder is added to "paths" in the configuration, so a daemon started from it serves the folder and everything under it. A folder that is already served, or that is under one that is, is left as it is.'
      : 'The folder is taken out of "paths" in the configuration, and every other key in the file is kept. The last folder cannot be removed, because a daemon that names none serves the folder it is started in.',
    surfaces: { cli: { pattern: ['paths', sub, ':folder'] }, http: { method: 'POST', path: `/paths/${sub}` } },
    // An add names a folder this creates; a remove acts on the one it names.
    effect: sub === 'add' ? 'add' : 'remove',
    resource: { kind: 'folder', ...(sub === 'add' ? {} : { key: 'folder' }) },
    input: {
      // Served, the file is the daemon's own, so no field could name another.
      ...(served === undefined ? { configFile: serverFields.configFile } : {}),
      folder: { type: 'string', description: 'The folder, by path.' },
    },
    required: ['folder'],
    scopes: ['config:write'],
    // Which folders this host's agents read, edit and run in is a grant over
    // what every one of them can reach, so over HTTP it is the deployment's own
    // token and never a person.
    meta: { deploymentTokenOnly: 'add or remove a served folder' },
    run: (context) => oneAtATime(async () => {
      const folder = resolve(context.value<string>('folder'));
      const file = fileOf(context.optional<string>('configFile'));
      // With a payload asked for, a line is a diagnostic and goes to stderr,
      // because stdout is the answer.
      const payload = context.globals['json'] === true || context.globals['quiet'] === true;
      const say = (line: string): void => {
        if (payload) context.error(line);
        else context.write(`${line}\n`);
      };
      /*
       * The file's own entries, read and written back whole: `paths` is what
       * this changes, and every other key in the file is the person's.
       */
      const held = readEntry(file);
      const paths = pathsIn(held);
      const said = sub === 'add' ? `Added ${folder} to "paths" in ${file}.` : `Removed ${folder} from "paths" in ${file}.`;

      if (sub === 'add') {
        if (!existsSync(folder)) stop(`No folder at ${folder}.`);
        if (!statSync(folder).isDirectory()) stop(`${folder} is not a folder.`);
        const same = paths.find((one) => resolve(one) === folder);
        if (same !== undefined) {
          say(`${same} is already served.`);
          return output({ paths }, '');
        }
        const above = paths.find((one) => under(folder, one));
        if (above !== undefined) {
          say(`${folder} is under ${above}, which is served.`);
          return output({ paths }, '');
        }
        held['paths'] = [...paths, folder];
      }
      else {
        const at = paths.findIndex((one) => resolve(one) === folder);
        if (at === -1) stop(`${folder} is not in "paths" in ${file}.`);
        if (paths.length === 1) {
          stop(`The last folder in "paths" cannot be removed, because a daemon with no "paths" serves the folder it is started in.`);
        }
        held['paths'] = paths.filter((_one, index) => index !== at);
      }

      writeEntry(file, held);
      /*
       * Served, this daemon is the one serving now, and the folders it serves
       * are the array it was started with: the change is made in it, so `ahpd
       * status` shows the folder without a restart. The default folder, which
       * is the first of them, and the copy each plugin loaded are what the next
       * start moves.
       */
      const live = served?.options.paths;
      if (live !== undefined) {
        const at = live.findIndex((one) => resolve(one) === folder);
        if (sub === 'remove') {
          if (at !== -1) live.splice(at, 1);
        }
        else if (at === -1) live.push(folder);
      }
      say(said);
      const restart = restarting();
      if (restart) say(restartLine(sub, folder));
      return output({ paths: pathsIn(held), ...(restart ? { restart: true } : {}) }, '');
    }),
  });

  return [list, write('add'), write('remove')];
};
