import { describe, expect, it } from 'vitest';
import { pluginHost } from '@ahpd/sdk';
import { apply, defaults, name, settingsOf, title } from '../src/plugin.js';
import manifest from '../package.json' with { type: 'json' };
import type { LoaderContext } from '@ahpd/sdk';

/*
 * The two settings of the tasks plugin.
 *
 * Both are off by default, and each reads the option it is given. A value of
 * the wrong kind is reported through the host and costs that setting alone,
 * which is what a host built by hand gets when it skips the schema.
 */

const context = (): LoaderContext => ({
  path: '/tmp/tasks',
  paths: ['/tmp/tasks'],
  version: '0.12.0',
  hostName: 'tasks-test',
  configDir: '/tmp/tasks',
  log: () => {},
  say: () => {},
});

/** The schema the manifest declares, which a listing reads without importing. */
const optionsSchema = manifest.ahpd.optionsSchema;

describe('the tasks plugin', () => {
  it('calls itself tasks, prints Tasks, and declares both settings', () => {
    expect(name).toBe('tasks');
    expect(title).toBe('Tasks');
    expect(optionsSchema.properties).toHaveProperty('requireApproval');
    expect(optionsSchema.properties).toHaveProperty('sweepAfterDays');
  });

  it('has approval off and keeps every plan when it is given nothing', () => {
    const problems: string[] = [];
    expect(settingsOf({}, (line) => { problems.push(line); })).toEqual({ requireApproval: false });
    expect(problems).toEqual([]);
    expect(defaults.requireApproval).toBe(false);
  });

  it('takes a value that is set', () => {
    const problems: string[] = [];
    expect(settingsOf({ requireApproval: true, sweepAfterDays: 7 }, (line) => { problems.push(line); }))
      .toEqual({ requireApproval: true, sweepAfterDays: 7 });
    expect(problems).toEqual([]);
    expect(settingsOf({ requireApproval: false }, () => {})).toEqual({ requireApproval: false });
  });

  it('reports a value of the wrong kind and keeps that setting off', () => {
    const problems: string[] = [];
    expect(settingsOf({ requireApproval: 'yes', sweepAfterDays: 1.5 }, (line) => { problems.push(line); }))
      .toEqual({ requireApproval: false });
    expect(problems).toEqual([
      'tasks: requireApproval is "yes", which is not true or false; using false',
      'tasks: sweepAfterDays is 1.5, which is not a whole number of days; keeping finished plans forever',
    ]);
    expect(settingsOf({ sweepAfterDays: 0 }, () => {})).toEqual({ requireApproval: false });
  });

  it('reports a wrong kind through the host when apply reads it', async () => {
    const problems: string[] = [];
    const { host, seal } = pluginHost(name, context(), { alert: (alert) => { problems.push(alert.text); } });
    await apply(host, { sweepAfterDays: 'soon' });
    seal();
    expect(problems).toEqual([
      'tasks: sweepAfterDays is "soon", which is not a whole number of days; keeping finished plans forever',
    ]);
  });

  it('says nothing for the options it was written for', async () => {
    const problems: string[] = [];
    const { host, seal } = pluginHost(name, context(), { alert: (alert) => { problems.push(alert.text); } });
    await apply(host, { requireApproval: true, sweepAfterDays: 30 });
    seal();
    expect(problems).toEqual([]);
  });
});
