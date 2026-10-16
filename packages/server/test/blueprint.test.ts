/*
 * VS Code's `.automation.md` file, read and written here, and `ahpd automation
 * export` on both surfaces.
 *
 * The format is VS Code's own, so what is pinned is that a file VS Code wrote
 * reads back to the same text, that each schedule the format holds is written
 * and read again unchanged, and that an automation the format cannot hold is
 * refused with a sentence naming what, rather than written as something it is
 * not.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseYaml } from '@cofold/yaml';
import { memoryAutomations } from '@ahpd/sdk';
import type { AutomationEntry, AutomationStore, Bag } from '@ahpd/sdk';
import {
  AutomationBlueprintParseError,
  automationToBlueprint,
  createAutomationBlueprintFileName,
  parseAutomationBlueprint,
  serializeAutomationBlueprint,
} from '../src/blueprint.js';
import { automationStatePath, automationsDir } from '../src/config.js';
import { optionsFrom } from '../src/commands/options.js';
import { cliRegistry } from '../src/commands/registry.js';
import { apiOrigins } from '../src/commands/run.js';
import { servedRegistry, type ServedFacts } from '../src/commands/served.js';
import { apiHandler } from '../src/http.js';
import { scheduledAutomations } from '../src/scheduled.js';

const FIXTURE = join(import.meta.dirname, 'fixtures', 'review-yesterday-s-commits.automation.md');
const ZONE = 'America/Campo_Grande';
const AUTHORITY = '127.0.0.1:9361';

/** One automation as the store holds it, with the triggers given. */
const entry = (triggers: Bag[], title = 'Review yesterday\'s commits', text = 'Review the commits.'): AutomationEntry => ({
  resource: 'ahp-automation:/0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10',
  definition: {
    title,
    message: { text, origin: { kind: 'automation' } },
    session: { provider: 'claude', workingDirectories: ['file:///home/softov/ahpd'] },
    enabled: true,
    triggers,
  },
  runs: [],
  operations: ['update', 'remove', 'run'],
  createdAt: '2026-10-15T00:00:00.000Z',
  modifiedAt: '2026-10-15T00:00:00.000Z',
});

/** One schedule trigger, as VS Code's agent host writes one. */
const schedule = (expression: string, timeZone: string | null = ZONE, misfirePolicy = 'runOnce'): Bag => ({
  id: 'schedule',
  kind: 'schedule',
  schedule: { expression, ...(timeZone === null ? {} : { timeZone }) },
  misfirePolicy,
});

/** The refusal an export makes, as its sentence. */
const refusal = (automation: AutomationEntry, zone = ZONE): string => {
  try {
    automationToBlueprint(automation, zone);
  }
  catch (error) {
    return (error as Error).message;
  }
  throw new Error('exported');
};

/** The frontmatter of a file, as YAML reads it. */
const header = (text: string): Bag => parseYaml(text.split('---\n')[1] ?? '') as Bag;

describe('the file VS Code wrote', () => {
  const text = readFileSync(FIXTURE, 'utf8');

  it('parses to its name, prompt and schedule', () => {
    const blueprint = parseAutomationBlueprint(text);
    expect(blueprint).toMatchObject({
      version: 1,
      id: 'review-yesterday-s-commits',
      name: 'Review yesterday\'s commits',
      schedule: { interval: 'daily', scheduleHour: 9, scheduleMinute: 0 },
    });
    expect(blueprint.prompt.startsWith('Review the commits made to this repository since yesterday morning.\n1. Fetch')).toBe(true);
    expect(blueprint.prompt.endsWith('say so in one line.')).toBe(true);
  });

  it('serializes back to the same text', () => {
    expect(serializeAutomationBlueprint(parseAutomationBlueprint(text))).toBe(text);
  });
});

describe('export', () => {
  const cases: [string, string, Bag][] = [
    ['daily', '30 9 * * *', { interval: 'daily', scheduleHour: 9, scheduleMinute: 30 }],
    ['weekdays', '0 8 * * 1-5', { interval: 'weekdays', scheduleHour: 8, scheduleMinute: 0 }],
    ['weekly', '15 17 * * 5', { interval: 'weekly', scheduleHour: 17, scheduleMinute: 15, scheduleDay: 5 }],
    ['hourly', '0 * * * *', { interval: 'hourly' }],
  ];
  for (const [name, expression, expected] of cases) {
    it(`writes a ${name} schedule that reads back the same`, () => {
      const blueprint = automationToBlueprint(entry([schedule(expression)]), ZONE);
      expect(blueprint.schedule).toMatchObject(expected);
      const text = serializeAutomationBlueprint(blueprint);
      expect(parseAutomationBlueprint(text)).toEqual(blueprint);
    });
  }

  it('writes a daily schedule as VS Code does', () => {
    const text = serializeAutomationBlueprint(automationToBlueprint(entry([schedule('0 9 * * *')]), ZONE));
    expect(text).toBe([
      '---',
      'version: 1',
      'id: "review-yesterday-s-commits"',
      'name: "Review yesterday\'s commits"',
      'schedule:',
      '  kind: cron',
      '  expression: "0 9 * * *"',
      '  timeZone: local',
      '---',
      '',
      'Review the commits.',
      '',
    ].join('\n'));
  });

  it('writes an automation with no schedule as manual', () => {
    const blueprint = automationToBlueprint(entry([]), ZONE);
    expect(blueprint.schedule.interval).toBe('manual');
    const text = serializeAutomationBlueprint(blueprint);
    expect(header(text)['schedule']).toEqual({ kind: 'manual' });
    expect(parseAutomationBlueprint(text)).toEqual(blueprint);
  });

  it('reads the weekday spellings a cron allows, and 7 as Sunday', () => {
    expect(automationToBlueprint(entry([schedule('0 8 * * MON-FRI')]), ZONE).schedule.interval).toBe('weekdays');
    expect(automationToBlueprint(entry([schedule('0 8 * * 1,2,3,4,5')]), ZONE).schedule.interval).toBe('weekdays');
    expect(automationToBlueprint(entry([schedule('0 8 * * 7')]), ZONE).schedule.scheduleDay).toBe(0);
  });

  it('writes no key but the five the format allows', () => {
    for (const triggers of [[], [schedule('0 * * * *')], [schedule('0 9 * * 1-5')]]) {
      const keys = Object.keys(header(serializeAutomationBlueprint(automationToBlueprint(entry(triggers), ZONE))));
      expect(keys.every((key) => ['version', 'id', 'name', 'description', 'schedule'].includes(key))).toBe(true);
    }
  });

  it('names the file after the automation, as VS Code does', () => {
    expect(createAutomationBlueprintFileName('Review yesterday\'s commits')).toBe('review-yesterday-s-commits.automation.md');
    expect(createAutomationBlueprintFileName('Café --- résumé')).toBe('cafe-resume.automation.md');
    expect(createAutomationBlueprintFileName('!!!')).toBe('automation.automation.md');
  });

  it('refuses a webhook or event trigger', () => {
    const event = { id: 't1', kind: 'event', type: 'webhook', title: 'On a call', events: [{ id: 'call' }], config: {} };
    expect(refusal(entry([event]))).toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 has an event trigger, and a VS Code automation file holds only a schedule.');
  });

  it('refuses two schedules', () => {
    expect(refusal(entry([schedule('0 9 * * *'), { ...schedule('0 17 * * *'), id: 'evening' }])))
      .toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 has more than one schedule, and a VS Code automation file holds one.');
  });

  it('refuses a cron the format does not allow', () => {
    expect(refusal(entry([schedule('*/5 * * * *')])))
      .toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 runs on "*/5 * * * *", and a VS Code automation file holds only hourly, daily, weekday and weekly schedules.');
    expect(refusal(entry([schedule('0 9 1 * *')]))).toContain('runs on "0 9 1 * *"');
    expect(refusal(entry([schedule('0 9 * * 1,3')]))).toContain('runs on "0 9 * * 1,3"');
  });

  it('refuses an hourly schedule off the hour', () => {
    expect(refusal(entry([schedule('30 * * * *')])))
      .toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 runs at minute 30 of each hour, and a VS Code automation file runs hourly on the hour.');
  });

  it('refuses a zone other than this host\'s', () => {
    expect(refusal(entry([schedule('0 9 * * *', 'Europe/Lisbon')])))
      .toBe(`0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 runs in Europe/Lisbon, and a VS Code automation file holds only this host's zone, ${ZONE}.`);
    expect(refusal(entry([schedule('0 * * * *', null)]))).toContain('runs in UTC');
    expect(automationToBlueprint(entry([schedule('0 9 * * *', null)]), 'UTC').schedule.interval).toBe('daily');
  });

  it('refuses a schedule that skips a missed run', () => {
    expect(refusal(entry([schedule('0 9 * * *', ZONE, 'skip')])))
      .toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 skips a missed run, and a VS Code automation file always catches one up.');
  });

  it('refuses an automation with no message', () => {
    expect(refusal(entry([], 'Empty', '  '))).toBe('0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10 has no message, and a VS Code automation file needs one.');
  });
});

describe('parse', () => {
  const file = (lines: string[], body = 'Do it.'): string => ['---', ...lines, '---', '', body, ''].join('\n');
  const code = (text: string): string | undefined => {
    try {
      parseAutomationBlueprint(text);
    }
    catch (error) {
      return error instanceof AutomationBlueprintParseError ? `${error.code}: ${error.message}` : String(error);
    }
    return undefined;
  };
  const base = ['version: 1', 'id: "a"', 'name: "A"'];

  it('refuses what VS Code refuses, with its sentence', () => {
    expect(code('no frontmatter')).toBe('invalidFrontmatter: The file must start with valid YAML frontmatter.');
    expect(code(file([...base, 'schedule:', '  kind: manual', 'owner: "me"']))).toBe('unknownProperty: The property \'owner\' is not supported.');
    expect(code(file([...base, 'schedule:', '  kind: hourly', '  minute: 5']))).toBe('unknownProperty: The property \'schedule.minute\' is not supported.');
    expect(code(file(['version: 2', 'id: "a"', 'name: "A"', 'schedule:', '  kind: manual']))).toBe('unsupportedVersion: Automation blueprint version 2 is not supported.');
    expect(code(file(['version: 1', 'id: "A--b"', 'name: "A"', 'schedule:', '  kind: manual']))).toBe('invalidId: The blueprint id \'A--b\' is invalid.');
    expect(code(file(['version: 1', 'id: "a"', 'schedule:', '  kind: manual']))).toBe('invalidField: The property \'name\' is missing or invalid.');
    expect(code(file([...base, 'schedule:', '  kind: cron', '  expression: "*/5 * * * *"', '  timeZone: local'])))
      .toBe('unsupportedSchedule: The cron expression \'*/5 * * * *\' cannot be represented by the current Automation editor.');
    expect(code(file([...base, 'schedule:', '  kind: cron', '  expression: "0 9 * * *"', '  timeZone: "UTC"'])))
      .toBe('unsupportedTimeZone: The time zone \'UTC\' is not supported. Use \'local\' so the schedule follows the importing user\'s time zone.');
    expect(code(file([...base, 'schedule:', '  kind: manual'], '  '))).toBe('missingPrompt: The Automation prompt must follow the frontmatter.');
  });

  it('keeps a description', () => {
    expect(parseAutomationBlueprint(file([...base, 'description: "Why"', 'schedule:', '  kind: manual'])).description).toBe('Why');
  });
});

describe('ahpd automation export', () => {
  let home: string;
  let had: string | undefined;
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'ahpd-automation-export-'));
    had = process.env['XDG_CONFIG_HOME'];
    process.env['XDG_CONFIG_HOME'] = home;
  });
  afterEach(() => {
    if (had === undefined) delete process.env['XDG_CONFIG_HOME'];
    else process.env['XDG_CONFIG_HOME'] = had;
    rmSync(home, { recursive: true, force: true });
  });

  const ID = '0b6f1c1e-4d8e-4d8a-9a43-6a3f4c2b9e10';
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  /** The daemon's folder, holding one daily automation in this host's zone. */
  const kept = (triggers: Bag[] = [schedule('0 9 * * *', zone)]): void => {
    const store = scheduledAutomations({ dir: automationsDir(), state: automationStatePath(), timer: () => ({ cancel: () => {} }) });
    store.create(`ahp-automation:/${ID}`, entry(triggers).definition);
    store.close?.();
  };

  const run = async (input: Record<string, unknown>): Promise<{ data: unknown; text: string }> => {
    const registry = cliRegistry();
    const command = registry.find('automation.export');
    if (command === undefined) throw new Error('no automation.export');
    const said = await registry.execute(command, { surface: 'cli', input, readStdin: async () => '' });
    if (said === null) throw new Error('answered nothing');
    return { data: said.data, text: typeof said.plain === 'function' ? said.plain() : said.plain ?? '' };
  };

  it('prints the file at a terminal', async () => {
    kept();
    const said = await run({ id: ID });
    const text = (said.data as { text: string }).text;
    expect(said.data).toMatchObject({ id: ID, fileName: 'review-yesterday-s-commits.automation.md' });
    expect(parseAutomationBlueprint(text).schedule).toMatchObject({ interval: 'daily', scheduleHour: 9 });
    expect(said.text).toBe(text);
  });

  it('writes the file with --out', async () => {
    kept();
    const out = join(home, 'out.automation.md');
    const said = await run({ id: `ahp-automation:/${ID}`, out });
    expect(said.text).toBe(`Wrote ${out}.\n`);
    expect(readFileSync(out, 'utf8')).toBe((said.data as { text: string }).text);
  });

  it('refuses an automation it cannot hold, and writes nothing', async () => {
    kept([schedule('*/5 * * * *', zone)]);
    const out = join(home, 'out.automation.md');
    await expect(run({ id: ID, out })).rejects.toThrow(`${ID} runs on "*/5 * * * *"`);
    expect(existsSync(out)).toBe(false);
  });

  it('refuses an id the store does not hold', async () => {
    await expect(run({ id: 'nothing' })).rejects.toThrow('No automation called nothing.');
  });

  describe('served', () => {
    let store: AutomationStore;
    beforeEach(() => {
      store = memoryAutomations();
      store.create(`ahp-automation:/${ID}`, entry([schedule('0 9 * * 1-5', zone)]).definition);
    });

    const facts = (): ServedFacts => ({
      options: optionsFrom({}),
      configFile: join(home, 'config.json'),
      running: () => ({ pid: process.pid, url: `ws://${AUTHORITY}`, host: '127.0.0.1', port: 9361, paths: [], startedAt: '' }),
      turning: () => [],
      automations: () => store,
      restart: () => {},
    });

    const call = async (path: string): Promise<Response> => {
      const handler = apiHandler({
        registry: servedRegistry(facts()),
        token: 'root-secret',
        program: { name: 'ahpd', version: '0.0.0' },
        origins: () => apiOrigins('127.0.0.1', undefined, 9361),
      });
      return handler(new Request(`http://${AUTHORITY}/api${path}`, {
        headers: { host: AUTHORITY, authorization: 'Bearer root-secret' },
      }));
    };

    it('answers the file over /api', async () => {
      const answer = await call(`/automation/export/${ID}`);
      expect(answer.status).toBe(200);
      const body = await answer.json() as { id: string; fileName: string; text: string };
      expect(body.fileName).toBe('review-yesterday-s-commits.automation.md');
      expect(parseAutomationBlueprint(body.text).schedule.interval).toBe('weekdays');
    });

    it('refuses one it cannot hold as a conflict', async () => {
      store.create('ahp-automation:/other', entry([schedule('0 9 * * *', 'Europe/Lisbon')]).definition);
      const answer = await call('/automation/export/other');
      expect(answer.status).toBe(409);
      expect((await answer.json() as { message: string }).message).toContain('runs in Europe/Lisbon');
    });
  });
});
