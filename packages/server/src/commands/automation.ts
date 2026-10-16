/**
 * `ahpd automation`: one automation as VS Code's `.automation.md` file.
 *
 * The file is VS Code's blueprint (see `../blueprint.ts`), so an automation
 * made here opens in VS Code and one shared from VS Code runs here. Served, the
 * store is the daemon's own and a plugin may have replaced it; at a terminal it
 * is the folder beside the configuration, the way `vault` reads its file.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { output } from '@cofold/commands';
import type { Command, CommandContext, Registry } from '@cofold/commands';
import { ownerOfPrincipal } from '@ahpd/sdk';
import type { AutomationStore, Owner, Principal } from '@ahpd/sdk';
import {
  automationToBlueprint,
  createAutomationBlueprintFileName,
  parseAutomationBlueprint,
  scheduleTrigger,
  serializeAutomationBlueprint,
} from '../blueprint.js';
import type { AutomationBlueprint } from '../blueprint.js';
import { automationStatePath, automationsDir } from '../config.js';
import { scheduledAutomations } from '../scheduled.js';
import { isRoot } from './authorize.js';
import { under } from './configure.js';
import { conflict, optionsFrom, serverFields, stop } from './options.js';
import type { ServedFacts } from './served.js';

/** What every automation's resource starts with. */
const PREFIX = 'ahp-automation:/';

/**
 * The store this run reads and writes, and what to do once it is done.
 *
 * Served, the daemon's own, which stays open. On a line it is the daemon's
 * folder, opened for this one command and closed after it.
 */
const storeOf = (served?: ServedFacts): { store: AutomationStore; done(): void } => {
  if (served !== undefined) {
    const store = served.automations?.();
    if (store === undefined) stop('This daemon has no automations yet.');
    return { store, done: () => {} };
  }
  const store = scheduledAutomations({ dir: automationsDir(), state: automationStatePath() });
  return { store, done: () => { store.close?.(); } };
};

/** The resource an id names: a bare id or the whole `ahp-automation:/` URI. */
const resourceOf = (id: string): string => (id.startsWith(PREFIX) ? id : `${PREFIX}${id}`);

/** What `automation export` answers. */
export interface ExportedAutomation {
  /** The automation's id in this host's store. */
  id: string;
  /** The file name VS Code gives it. */
  fileName: string;
  /** The file's text. */
  text: string;
}

/** What `automation import` answers. */
export interface ImportedAutomation {
  /** The new automation's id in this host's store. */
  id: string;
  /** Its whole `ahp-automation:/` URI. */
  resource: string;
}

/**
 * Who an import over HTTP belongs to, as the protocol's create names it: the
 * person who sent it, or the host itself for the deployment's token. A host
 * with no users directory, and a terminal, name nobody.
 */
const ownerOf = (context: Pick<CommandContext, 'request'>, served?: ServedFacts): Owner | undefined => {
  if (served?.users === undefined) return undefined;
  const actor = context.request?.actor as Principal | undefined;
  if (actor === undefined) return undefined;
  return isRoot(actor) ? `root:${hostname()}` : ownerOfPrincipal(actor);
};

/**
 * The folder an import runs in, refused unless this host serves it.
 *
 * Served, the folders are the daemon's own and the folder must be absolute,
 * because a request has no current folder. At a terminal they are the ones the
 * configuration names, and the folder is read against the current one.
 */
const folderOf = (context: Pick<CommandContext, 'optional' | 'input'>, served?: ServedFacts): string => {
  const named = context.optional<string>('folder');
  if (named === undefined || named.trim() === '') stop('automation import needs --folder: the file names no folder to run in.');
  if (served !== undefined && !isAbsolute(named)) stop(`${named} is not an absolute path.`);
  const folder = resolve(named);
  const input = context.input as Readonly<Record<string, unknown>>;
  const paths = served === undefined ? optionsFrom({ configFile: input['configFile'] }).paths : served.options.paths;
  if (!paths.some((one) => under(folder, one))) stop(`${folder} is not a folder this host serves. Add it with ahpd paths add.`);
  if (!existsSync(folder) || !statSync(folder).isDirectory()) stop(`No folder at ${folder}.`);
  return folder;
};

/** The file's text read as a blueprint, refused with VS Code's sentence. */
const blueprintOf = (text: string, file?: string): AutomationBlueprint => {
  try {
    return parseAutomationBlueprint(text);
  }
  catch (error) {
    const said = error instanceof Error ? error.message : String(error);
    return stop(file === undefined ? said : `${file}: ${said}`);
  }
};

export const declareAutomation = (registry: Registry<object>, served?: ServedFacts): Command[] => {
  const exported = registry.action({
    id: 'automation.export',
    summary: 'Write an automation as a VS Code automation file',
    description: 'Prints the file, or writes it with --out. Refused for an automation the file cannot hold, saying what.',
    surfaces: { cli: { pattern: ['automation', 'export', ':id'] }, http: { method: 'GET', path: '/automation/export/{id}' } },
    effect: 'read',
    resource: { kind: 'automation', key: 'id' },
    input: {
      id: { type: 'string', description: 'The automation\'s id.' },
      ...(served === undefined
        ? { out: { type: 'string', description: 'Write the file here instead of printing it.', cli: { value: 'PATH' } } }
        : {}),
    },
    scopes: ['automation:list'],
    run: async (context) => {
      const id = context.value<string>('id');
      const resource = resourceOf(id);
      const { store, done } = storeOf(served);
      let text: string;
      let fileName: string;
      try {
        const automation = store.get(resource);
        if (automation === undefined) conflict(`No automation called ${id}.`);
        let blueprint;
        try {
          blueprint = automationToBlueprint(automation);
        }
        catch (error) {
          conflict(error instanceof Error ? error.message : String(error));
        }
        text = serializeAutomationBlueprint(blueprint);
        fileName = createAutomationBlueprintFileName(blueprint.name);
      }
      finally {
        done();
      }
      const data: ExportedAutomation = { id: resource.slice(PREFIX.length), fileName, text };
      const out = served === undefined ? context.optional<string>('out') : undefined;
      if (out === undefined) return output(data, text);
      const file = resolve(out);
      writeFileSync(file, text);
      return output(data, `Wrote ${file}.\n`);
    },
  });

  const imported = registry.action({
    id: 'automation.import',
    summary: 'Make an automation from a VS Code automation file',
    description: 'The automation is new and switched off, and runs in --folder. At a terminal the file is a path; over /api it is the body\'s "text".',
    surfaces: {
      cli: { pattern: served === undefined ? ['automation', 'import', ':file'] : ['automation', 'import'] },
      http: { method: 'POST', path: '/automation/import' },
    },
    effect: 'add',
    resource: { kind: 'automation' },
    input: {
      ...(served === undefined
        ? {
            configFile: serverFields.configFile,
            file: { type: 'string', description: 'The .automation.md file.' },
          }
        : { text: { type: 'string', description: 'The text of the .automation.md file.' } }),
      folder: { type: 'string', description: 'The folder it runs in, one this host serves.', cli: { value: 'PATH' } },
    },
    scopes: ['automation:create'],
    run: async (context) => {
      let text: string;
      let file: string | undefined;
      if (served === undefined) {
        file = resolve(context.value<string>('file'));
        if (!existsSync(file) || !statSync(file).isFile()) stop(`No file at ${file}.`);
        text = readFileSync(file, 'utf8');
      }
      else {
        text = context.required<string>('text');
      }
      const blueprint = blueprintOf(text, file);
      const folder = folderOf(context, served);
      const id = randomUUID();
      const resource = `${PREFIX}${id}`;
      const definition = {
        title: blueprint.name,
        message: { text: blueprint.prompt, origin: { kind: 'automation' } },
        session: { workingDirectories: [pathToFileURL(folder).href] },
        enabled: false,
        triggers: scheduleTrigger(blueprint.schedule),
      };
      const { store, done } = storeOf(served);
      try {
        store.create(resource, definition, ownerOf(context, served));
      }
      catch (error) {
        conflict(error instanceof Error ? error.message : String(error));
      }
      finally {
        done();
      }
      const data: ImportedAutomation = { id, resource };
      return output(data, `Imported ${blueprint.name} as ${id}. It is switched off.\n`);
    },
  });

  return [exported, imported];
};
