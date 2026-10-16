/**
 * `ahpd automation`: one automation as VS Code's `.automation.md` file.
 *
 * The file is VS Code's blueprint (see `../blueprint.ts`), so an automation
 * made here opens in VS Code and one shared from VS Code runs here. Served, the
 * store is the daemon's own and a plugin may have replaced it; at a terminal it
 * is the folder beside the configuration, the way `vault` reads its file.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { output } from '@cofold/commands';
import type { Command, Registry } from '@cofold/commands';
import type { AutomationStore } from '@ahpd/sdk';
import { automationToBlueprint, createAutomationBlueprintFileName, serializeAutomationBlueprint } from '../blueprint.js';
import { automationStatePath, automationsDir } from '../config.js';
import { scheduledAutomations } from '../scheduled.js';
import { conflict, stop } from './options.js';
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

  return [exported];
};
