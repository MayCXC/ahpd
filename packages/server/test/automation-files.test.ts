import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bag } from '@ahpd/sdk';
import type { AutomationStore, Bag } from '@ahpd/sdk';
import { migrateAutomations, scheduledAutomations } from '../src/scheduled.js';

/*
 * What an automation *is* on this disk: one Markdown file a person reads and
 * writes, and a state file holding only what a run changes.
 *
 * The clock is handed in and never moved: nothing here is about when an
 * automation fires, and an occurrence would only be a run this file did not
 * ask for. What it is about is the shape of the two files.
 */

const ONE = 'ahp-automation:/one';

/** A clock that stands still, and a timer that is armed and never fires. */
const standing = (): { now: () => Date; timer: (fire: () => void, ms: number) => { cancel(): void } } => {
  const at = new Date('2026-09-01T08:00:00Z');
  return {
    now: () => at,
    timer: () => ({ cancel: () => { /* nothing was armed to let go of */ } }),
  };
};

/** A definition that fires at nine every morning, UTC. */
const nightly = (message: Bag = { text: 'review what changed today' }): Bag => ({
  title: 'Nightly review',
  enabled: true,
  message,
  session: { provider: 'echo' },
  triggers: [{ id: 't1', kind: 'schedule', schedule: { expression: '0 9 * * *', timeZone: 'UTC' } }],
});

let dir: string;
/** Where each automation is one `.md` file. */
let folder: string;
/** The one file the run state of all of them is in. */
let state: string;
let store: AutomationStore | undefined;

/** The file one automation is kept in. */
const fileOf = (id: string): string => join(folder, `${id}.md`);

/** The text of one automation's file. */
const textOf = (id: string): string => readFileSync(fileOf(id), 'utf8');

/** One written by hand, as a person leaves one. */
const hand = (id: string, text: string): void => {
  mkdirSync(folder, { recursive: true });
  writeFileSync(fileOf(id), text);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ahpd-files-'));
  folder = join(dir, 'automations');
  state = join(dir, 'automations-state.json');
});
afterEach(() => {
  store?.close?.();
  store = undefined;
  rmSync(dir, { recursive: true, force: true });
});

describe('one automation is one Markdown file', () => {
  it('writes an automation and reads the same row back', () => {
    const clock = standing();
    const first = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    const made = first.create(ONE, nightly({ text: 'first line\nsecond line', model: 'opus' }), 'user:ana');
    first.close?.();

    // A daemon that comes back reads what the person left, not what it thought
    // it wrote: the second store is built only from the two files.
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    expect(store.get(ONE)).toEqual(made);
  });

  it('keeps the message as plain text below the frontmatter', () => {
    const clock = standing();
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    store.create(ONE, nightly({ text: 'first line\nsecond line', model: 'opus' }));

    const text = textOf('one');
    // The one long text a person writes is the body, where an editor puts it,
    // and it is the text itself rather than a quoted string in the YAML above.
    expect(text).toContain('\n---\nfirst line\nsecond line\n');
    // Nothing of the message above the fence: what a person reads first is
    // what this automation does, not the string it says.
    expect(text.slice(0, text.lastIndexOf('---'))).not.toContain('first line');
    // Everything of the message that is not its text stays in the frontmatter,
    // so a field a client wrote is not lost by the file.
    expect(text.slice(0, text.lastIndexOf('---'))).toContain('model: opus');
    // The id is the file it is in, so the frontmatter carries none: a copy
    // under a new name is a new automation rather than a second copy of one.
    expect(text).not.toMatch(/^id:/m);
  });

  it('refuses an id that could not name a file', () => {
    const clock = standing();
    const one = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    store = one;

    // A path that climbs out of the folder, a name that is not lower case, and
    // one longer than a file name may be: each is refused before the store
    // underneath is asked, because every automation here is a file and this is
    // what that file would be named.
    expect(() => one.create('ahp-automation:/../escape', nightly())).toThrow(/not an automation this host can keep/);
    expect(() => one.create('ahp-automation:/One', nightly())).toThrow(/not an automation this host can keep/);
    expect(() => one.create(`ahp-automation:/${'a'.repeat(65)}`, nightly())).toThrow(/not an automation this host can keep/);
    // Nothing was made, so the folder is empty of automations rather than
    // holding a file named after a resource nobody can use.
    expect(one.list()).toEqual([]);
    expect(readdirSync(folder)).toEqual([]);
  });

  it('keeps an automation a client named with a UUID', () => {
    const uuid = '6106470a-395a-42c1-b85c-fa26299d296f';
    const automation = `ahp-automation:/${uuid}`;
    const clock = standing();
    const first = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    const made = first.create(automation, nightly(), 'root:soft-sandbox');
    first.close?.();

    // A UUID starts with a digit, which an automation's id may: it has a rule
    // of its own rather than the record store's slug, because here the id is
    // nothing but a file name - and a name one client already writes.
    expect(existsSync(fileOf(uuid))).toBe(true);
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    expect(store.list()).toEqual([made]);
    expect(store.get(automation)).toEqual(made);
  });
});

describe('what a run changes, and what it does not', () => {
  it('moves the count in the state file and leaves the file alone', async () => {
    const clock = standing();
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    store.create(ONE, { ...nightly(), disableConditions: [{ kind: 'afterRuns', max: 5 }] });
    const before = textOf('one');

    await store.run(ONE, { kind: 'trigger', triggerId: 't1', scheduledFor: '2026-09-01T09:00:00.000Z' }, async () => 'ahp-session:/made');

    // What a run changes is what it used and when it next fires, and both are
    // in the state file.
    expect(JSON.parse(readFileSync(state, 'utf8')).automations).toMatchObject([
      { resource: ONE, runCount: 1, nextRunAt: '2026-09-01T09:00:00.000Z' },
    ]);
    // The file is what the person wrote. A clock that rewrote it would be a
    // clock that overwrote an edit made while the run was going.
    expect(textOf('one')).toBe(before);
  });

  it('reads a copy under a new name as a second automation with no run state', async () => {
    const clock = standing();
    const first = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    first.create(ONE, { ...nightly(), disableConditions: [{ kind: 'afterRuns', max: 5 }] });
    await first.run(ONE, { kind: 'trigger', triggerId: 't1', scheduledFor: '2026-09-01T09:00:00.000Z' }, async () => 'ahp-session:/made');
    first.close?.();

    // What `cp one.md two.md` leaves: the frontmatter is the copy's, and the
    // file name is the only thing that makes this a different automation.
    writeFileSync(fileOf('two'), readFileSync(fileOf('one')));

    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    const two = store.get('ahp-automation:/two');
    expect(two?.definition.title).toBe('Nightly review');
    // Its own run state, which it has none of: the state file has no row for
    // it, and a count it never used is not one it inherited.
    expect(two?.runCount).toBe(0);
    expect(store.get(ONE)?.runCount).toBe(1);
  });
});

describe('the one file an earlier daemon left', () => {
  /** The file every automation used to be a row in, where that daemon kept it. */
  const whole = (): string => join(dir, 'automations.json');

  /** One row of it, as a daemon before this wrote one. */
  const kept = (id: string, extra: Bag = {}): Bag => ({
    resource: `ahp-automation:/${id}`,
    definition: { ...nightly(), disableConditions: [{ kind: 'afterRuns', max: 5 }] },
    createdAt: '2026-08-01T07:00:00.000Z',
    modifiedAt: '2026-08-02T07:00:00.000Z',
    ...extra,
  });

  /** Write that file, as the daemon that kept it left it. */
  const left = (rows: Bag[]): void => {
    writeFileSync(whole(), `${JSON.stringify({ version: 1, automations: rows })}\n`);
  };

  it('gives every row a file of its own, and the run state one of its own', () => {
    left([kept('one'), kept('two'), kept('three')]);
    const told: string[] = [];
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: (message) => told.push(message) });

    expect(existsSync(fileOf('one'))).toBe(true);
    expect(existsSync(fileOf('two'))).toBe(true);
    expect(existsSync(fileOf('three'))).toBe(true);
    expect(existsSync(state)).toBe(true);
    expect(told).toEqual([]);
    // Renamed rather than left, which is what says it has been read.
    expect(existsSync(whole())).toBe(false);
    expect(existsSync(`${whole()}.migrated`)).toBe(true);
  });

  it('carries the run count and the occurrence it was waiting for', () => {
    left([kept('one', { runCount: 2, nextRunAt: '2026-09-01T09:00:00.000Z', owner: 'user:ana' })]);
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: () => { /* nothing was wrong */ } });

    expect(JSON.parse(readFileSync(state, 'utf8')).automations).toEqual([{
      resource: ONE,
      runCount: 2,
      modifiedAt: '2026-08-02T07:00:00.000Z',
      nextRunAt: '2026-09-01T09:00:00.000Z',
    }]);
    // And the store built over it reads the count back, and whose work it is
    // with it: what the conversion wrote is what the store would have written.
    const clock = standing();
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    expect(store.get(ONE)?.runCount).toBe(2);
    expect(store.get(ONE)?._meta?.['ahpd.owner']).toBe('user:ana');
  });

  it('gives a row a UUID names a file of its own', () => {
    // A UUID, which is what one client names an automation with, and it starts
    // with a digit: the id has a rule of its own rather than the slug a record
    // has, so this is a file like any other.
    const uuid = '6106470a-395a-42c1-b85c-fa26299d296f';
    left([kept('one'), kept(uuid)]);
    const told: string[] = [];
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: (message) => told.push(message) });

    expect(existsSync(fileOf(uuid))).toBe(true);
    expect(told).toEqual([]);
    expect(JSON.parse(readFileSync(state, 'utf8')).automations.map((row: Bag) => row.resource))
      .toEqual([ONE, `ahp-automation:/${uuid}`]);
  });

  it('leaves behind a row whose id could not name a file', () => {
    // An upper-case name, which is one this host will not write a file for:
    // the file name is the id, so an id that cannot be one has nowhere to go.
    left([kept('one'), kept('NotASlug')]);
    const told: string[] = [];
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: (message) => told.push(message) });

    expect(existsSync(fileOf('one'))).toBe(true);
    expect(existsSync(fileOf('NotASlug'))).toBe(false);
    expect(told.join('\n')).toContain('ahp-automation:/NotASlug');
    expect(told.join('\n')).toContain('was left behind');
    expect(JSON.parse(readFileSync(state, 'utf8')).automations.map((row: Bag) => row.resource)).toEqual([ONE]);
    // The row survives in the file it came from, which is renamed rather than
    // deleted, so nothing is lost - but it is not an automation this host runs.
    expect(readFileSync(`${whole()}.migrated`, 'utf8')).toContain('NotASlug');
  });

  it('leaves a file it does not understand where it is', () => {
    writeFileSync(whole(), `${JSON.stringify({ version: 2, automations: [] })}\n`);
    const told: string[] = [];
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: (message) => told.push(message) });

    // The only copy of what somebody scheduled, so named rather than guessed
    // at, and nothing made from it.
    expect(existsSync(whole())).toBe(true);
    expect(existsSync(`${whole()}.migrated`)).toBe(false);
    expect(existsSync(folder)).toBe(false);
    expect(told.join('\n')).toContain('was left alone');
  });

  it('leaves both alone when an automation is already in the folder', () => {
    hand('one', '---\ntitle: Nightly review\nenabled: true\n---\nreview what changed today\n');
    left([kept('two')]);
    const told: string[] = [];
    migrateAutomations({ file: whole(), dir: folder, state, onProblem: (message) => told.push(message) });

    // A folder holding an automation is the split already done, so the file is
    // not read at all.
    expect(existsSync(fileOf('two'))).toBe(false);
    expect(existsSync(whole())).toBe(true);
    expect(told).toEqual([]);
  });
});

describe('a file a person edits while the daemon runs', () => {
  const TWO = 'ahp-automation:/two';

  /** The frontmatter of a definition that fires at the time given, as a person writes it. */
  const firing = (expression: string): string[] => [
    'title: Nightly review',
    'enabled: true',
    'session:',
    '  provider: echo',
    'triggers:',
    '  - id: t1',
    '    kind: schedule',
    '    schedule:',
    // Quoted, which is how a person writing a YAML file spells a line of stars.
    `      expression: "${expression}"`,
    '      timeZone: UTC',
  ];

  /** One of these files as a person leaves it: that frontmatter, then the message. */
  const person = (...lines: string[]): string =>
    ['---', ...lines, 'createdAt: 2026-09-01T08:00:00.000Z', '---', 'review what changed today', ''].join('\n');

  /** Open the store over the folder on a clock that stands still, holding one automation. */
  const opened = (onProblem?: (message: string) => void): AutomationStore => {
    const clock = standing();
    const one = scheduledAutomations({
      dir: folder,
      state,
      now: clock.now,
      timer: clock.timer,
      ...(onProblem === undefined ? {} : { onProblem }),
    });
    store = one;
    one.create(ONE, nightly());
    return one;
  };

  it('reads a schedule a person changed, and arms the clock for it', async () => {
    const one = opened();
    expect(one.get(ONE)?.nextRunAt).toBe('2026-09-01T09:00:00.000Z');

    hand('one', person(...firing('0 10 * * *')));

    await vi.waitFor(() => { expect(store?.get(ONE)?.nextRunAt).toBe('2026-09-01T10:00:00.000Z'); });
    // What the person did not touch is still there: a file is the whole
    // definition, so the line they edited did not take the rest away.
    expect(one.get(ONE)?.definition.title).toBe('Nightly review');
    expect(one.get(ONE)?.definition.enabled).toBe(true);
    expect(bag(one.get(ONE)?.definition.message).text).toBe('review what changed today');
  });

  it('takes away a field the file no longer names', async () => {
    const clock = standing();
    store = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    store.create(ONE, { ...nightly(), disableConditions: [{ kind: 'afterRuns', max: 5 }] });
    expect(store.get(ONE)?.definition.disableConditions).toBeDefined();

    hand('one', person(...firing('0 9 * * *')));

    // A deleted line is a field the automation no longer has, rather than one
    // the file simply did not mention: a patch leaves an absent key alone, and
    // a file is not a patch.
    await vi.waitFor(() => { expect(store?.get(ONE)?.definition.disableConditions).toBeUndefined(); });
    expect(textOf('one')).not.toContain('disableConditions');
  });

  it('hears nothing of the write it made itself', async () => {
    const clock = standing();
    const one = scheduledAutomations({ dir: folder, state, now: clock.now, timer: clock.timer });
    store = one;
    const heard: { automation?: string; removed?: string }[] = [];
    one.onChanged?.((event) => heard.push(event));

    one.create(ONE, nightly());

    // Long enough for the watch to have read the file back, had it not been
    // this store's own write: a store that heard itself would say so twice.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(heard).toEqual([{ automation: ONE }]);
  });

  it('lists a file copied in, and lets go of a file removed', async () => {
    const one = opened();

    // What `cp one.md two.md` leaves behind.
    writeFileSync(fileOf('two'), readFileSync(fileOf('one')));
    await vi.waitFor(() => { expect(store?.get(TWO)?.definition.title).toBe('Nightly review'); });
    expect(one.list()).toHaveLength(2);
    // An automation of its own, waiting for the occurrence its own schedule
    // gives it rather than carrying anything of the one it was copied from.
    expect(one.get(TWO)?.resource).toBe(TWO);
    expect(one.get(TWO)?.nextRunAt).toBe('2026-09-01T09:00:00.000Z');
    // The copy is the file that was copied, down to the line saying when it was
    // made: this store keeps what a file says rather than stamping its own.
    expect(textOf('two')).toBe(textOf('one'));

    rmSync(fileOf('two'));
    await vi.waitFor(() => { expect(store?.get(TWO)).toBeUndefined(); });
    expect(one.list()).toHaveLength(1);
    expect(one.get(ONE)?.definition.title).toBe('Nightly review');
  });

  it('reports a file it cannot read, and keeps the definition it had', async () => {
    const told: string[] = [];
    const one = opened((message) => told.push(message));
    const before = one.get(ONE)?.definition;

    // A line a person started and did not finish.
    hand('one', '---\ntitle: [unclosed\n');

    await vi.waitFor(() => { expect(told.length).toBeGreaterThan(0); });
    expect(new Set(told).size).toBe(1);
    expect(told[0]).toContain('one.md');
    expect(told[0]).toContain('cannot be read');
    // One file nothing can be read from is not a reason to drop the automation
    // it was: what this store had is what it still has.
    expect(one.get(ONE)?.definition).toEqual(before);
  });

  it('reports a definition the host will not run, and keeps the one it had', async () => {
    const told: string[] = [];
    const one = opened((message) => told.push(message));
    const before = one.get(ONE)?.definition;

    // A pinned automation that also runs in parallel, which is two turns at
    // once in one chat: refused wherever it is written, a file included.
    hand('one', person(...firing('0 9 * * *'), '_meta:', '  ahpd:', '    session: pinned', '    overlap: parallel'));

    await vi.waitFor(() => { expect(told.length).toBeGreaterThan(0); });
    expect(new Set(told).size).toBe(1);
    expect(told[0]).toContain('one.md');
    expect(told[0]).toContain('was not loaded');
    expect(one.get(ONE)?.definition).toEqual(before);
    // Left as the person wrote it rather than quietly corrected.
    expect(textOf('one')).toContain('overlap: parallel');
  });
});
