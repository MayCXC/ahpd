/**
 * Automations that fire on their own: a clock, and the files they survive in.
 *
 * Each automation is one Markdown file a person reads and edits, and what
 * changes on every run is kept apart from it, in a state file of the daemon's
 * own. Decisions `a-person-edits-a-record-as-a-markdown-file` and
 * `an-automation-run-state-is-kept-apart`.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bag,
  disableConditionsOf,
  isRecordSlug,
  memoryAutomations,
  nextOccurrence,
  ownerOf,
  parseCron,
  readJson,
  reason,
  RECORD_SLUG,
  writeJsonAtomic,
} from '@ahpd/sdk';
import type {
  Automation,
  AutomationEntry,
  AutomationStore,
  Bag,
  CapturedPlugin,
  Cron,
  StoredRecord,
} from '@ahpd/sdk';
import { readRecordFile, recordFile } from './records.js';

/** How this store is built, and what a test replaces. */
export interface ScheduledOptions {
  /**
   * Where definitions are kept: one `<id>.md` per automation.
   *
   * Named by the caller rather than defaulted to somewhere under a home
   * directory. The daemon passes the folder beside its configuration.
   */
  dir: string;
  /**
   * Where the run state of every automation is kept.
   *
   * One file for all of them, and not the files above: a run rewrites this on
   * every occurrence, and a file a person edits must not be rewritten by a
   * clock. Named by the caller, as `dir` is.
   */
  state: string;
  /** The clock. A test supplies its own so a schedule can be reached without waiting for it. */
  now?(): Date;
  /**
   * How a timer is armed.
   *
   * Handed in for the same reason the clock is: a test that had to wait for a
   * real `setTimeout` would be a test that takes until nine in the morning.
   */
  timer?(fire: () => void, ms: number): { cancel(): void };
  /** Somewhere to say that a definition could not be read. */
  onProblem?(message: string): void;
}

/**
 * What the state file holds. Versioned, so a later shape can be recognised
 * rather than guessed at.
 *
 * Only what a run changes, and never a thing a person wrote: the definition,
 * its owner and when it was made are in the `.md` file. So a row here is keyed
 * by the automation it belongs to, and one whose file is gone is dropped at
 * the next save.
 */
interface RunState {
  version: 1;
  automations: {
    resource: string;
    /**
     * How many scheduled runs the allowance in force has paid for.
     *
     * Written down because the protocol says it is not reconstructed from the
     * runs, and this store keeps no run history to reconstruct it from anyway.
     * A row without it - every row written before this - reads as none used.
     */
    runCount?: number;
    /**
     * The copies of the client plugins the template names, as the host made
     * them.
     *
     * Written down because a restart does not bring the client back: the copy
     * is on this disk already, and an automation that came back without it
     * would be one whose every run the host then refuses for a plugin it
     * cannot capture.
     */
    customizations?: CapturedPlugin[];
    modifiedAt: string;
    /** The occurrence this was waiting for when it was written. What catch-up reads. */
    nextRunAt?: string;
  }[];
}

/** One row of the state file, as the store reads it back. */
type StateRow = RunState['automations'][number];

/** What one `.md` file held, as the store reads it. */
interface Held {
  definition: Bag;
  owner?: string;
  createdAt: string;
}

/** The scheme every automation's resource carries, and the id is what comes after it. */
const PREFIX = 'ahp-automation:/';

/** The field the body of a file is read from and written to. */
const BODY = 'message.text';

/** `setTimeout` will not wait longer than this, so a longer wait is done in instalments. */
const MAX_DELAY = 2_147_483_647;

/** One schedule an automation carries, ready to be asked when it next fires. */
interface Schedule {
  triggerId: string;
  cron: Cron;
  timeZone: string;
  /** Whether a missed occurrence is caught up. `runOnce` is the protocol's default. */
  catchUp: boolean;
}

/**
 * A host that fires its own automations.
 *
 * The other implementation of `AutomationStore`, and the one the port was
 * written for: `memoryAutomations` holds the definitions and the run history,
 * and everything added here is the clock and the file. Composed rather than
 * copied, so there is still one answer to what a run is.
 *
 * **It does not start sessions.** The clock decides it is time and says so
 * through `onDue`; the host, which is the only thing that knows what a session
 * is, calls `run`. That is the same division the port already describes, and
 * it is why an automation can fire with nobody connected.
 *
 * **Definitions survive a restart and run history does not.** A run names the
 * sessions it started, and this daemon's sessions are subprocesses that go
 * when it does - so a persisted history would be a list of links to things
 * that are not there. What is worth keeping across a restart is what somebody
 * wrote down, which is the definition and when it next fires.
 */
export function scheduledAutomations(options: ScheduledOptions): AutomationStore {
  const inner = memoryAutomations();
  const dir = options.dir;
  const state = options.state;
  const now = options.now ?? ((): Date => new Date());
  const arm = options.timer ?? ((fire, ms): { cancel(): void } => {
    const held = setTimeout(fire, ms);
    // A daemon should not be held open by the next automation, and should not
    // be kept alive by one either.
    held.unref?.();
    return { cancel: () => { clearTimeout(held); } };
  });
  const told = (message: string): void => { options.onProblem?.(message); };

  /** When each automation next fires, by resource. Absent means nothing will fire it. */
  const nextAt = new Map<string, Date>();
  /** Written timestamps, kept here so they survive a reload rather than becoming the load time. */
  const stamps = new Map<string, { createdAt: string; modifiedAt: string }>();
  /**
   * What this store last computed for each automation's file, by id.
   *
   * A save writes a file only when this changes, so an automation nobody
   * touched is not rewritten - and a write that does happen is this store's,
   * which the watch on the folder has to leave alone.
   */
  const said = new Map<string, string>();
  /**
   * The text each file held when this store last read or wrote it, by id.
   *
   * What the watch compares against: an event for a file holding this is an
   * event this store caused, and reading it again would be reading back what
   * it just wrote.
   */
  const known = new Map<string, string>();
  const due: ((event: { automation: string; origin: Bag }) => void)[] = [];
  const changed: ((event: { automation?: string; run?: string; removed?: string }) => void)[] = [];
  let timer: { cancel(): void } | undefined;
  /** Closed: the clock is let go of, and nothing is fired or written again. */
  let closed = false;

  /** The id a resource names, or nothing when it is not one this store can keep as a file. */
  const idOf = (resource: string): string | undefined => {
    const id = resource.startsWith(PREFIX) ? resource.slice(PREFIX.length) : undefined;
    return id !== undefined && isRecordSlug(id) ? id : undefined;
  };

  /** The id a resource names, refused: what a client naming one is told. */
  const idFor = (resource: string): string => {
    const id = idOf(resource);
    if (id !== undefined) return id;
    throw new Error(`${resource || 'That'} is not an automation this host can keep: its id after ${PREFIX} is ${RECORD_SLUG}`);
  };

  /** The file one automation is kept in. */
  const fileOf = (id: string): string => join(dir, `${id}.md`);

  /** The text of a file, or nothing when it is not there. */
  const textAt = (file: string): string | undefined => {
    try {
      return readFileSync(file, 'utf8');
    }
    catch {
      return undefined;
    }
  };

  /** One file written whole at mode `0600`: a temporary beside it, then renamed over it. */
  const wrote = (file: string, text: string): void => {
    const temporary = `${file}.${String(process.pid)}.tmp`;
    // Removed first, because `mode` applies only when a file is created.
    rmSync(temporary, { force: true });
    writeFileSync(temporary, text, { mode: 0o600 });
    renameSync(temporary, file);
  };

  /** The ids of the `.md` files in the folder, which are the automations it holds. */
  const idsIn = (): string[] => readdirSync(dir, { withFileTypes: true })
    .filter((one) => one.isFile() && one.name.endsWith('.md'))
    .map((one) => one.name.slice(0, -'.md'.length))
    .filter((id) => isRecordSlug(id));

  /**
   * One automation as the text of its file.
   *
   * The definition, whose work it is and when it was made go in the YAML
   * frontmatter; the message the automation sends is the body below it, which
   * is the one long text a person writes. Whatever else the message carried -
   * an origin, an attachment - stays in the frontmatter, so nothing a client
   * wrote is lost by the file.
   */
  const textOf = (held: Held): string => {
    // The one field `StoredRecord` insists on is the one this file writes as
    // its name instead: an automation's id is the file it is in, so a copy
    // under a new name is a new automation rather than a second copy of one.
    const fields = { ...held.definition } as StoredRecord;
    const message = bag(fields.message);
    const text = typeof message.text === 'string' ? message.text : '';
    const rest = { ...message };
    delete rest.text;
    // Left off rather than written empty: a message that is only its text is
    // the body below, and `message: {}` says nothing a reader came for.
    if (Object.keys(rest).length === 0) delete fields.message;
    else fields.message = rest;
    fields[BODY] = text;
    if (held.owner !== undefined) fields.owner = held.owner;
    fields.createdAt = held.createdAt;
    return recordFile(fields, BODY);
  };

  /** One file read as an automation, or nothing when it is reported instead. */
  const heldIn = (id: string, text: string): Held | undefined => {
    const file = fileOf(id);
    let fields: StoredRecord;
    try {
      fields = readRecordFile(text, BODY);
    }
    catch (error) {
      told(`${file} cannot be read: ${reason(error)}`);
      return undefined;
    }
    /*
     * Everything the file carries that is not the definition: the message text
     * below the frontmatter, whose work it is, and when it was made. An id
     * somebody wrote is dropped rather than read, because the file name is the
     * id - so a copy under a new name is a new automation whatever the
     * frontmatter it was copied from still says.
     */
    const { [BODY]: body, owner, createdAt, id: named, ...definition } = fields;
    return {
      definition: {
        ...definition,
        message: { ...bag(definition.message), text: typeof body === 'string' ? body : '' },
      },
      ...(typeof owner === 'string' ? { owner } : {}),
      createdAt: typeof createdAt === 'string' ? createdAt : now().toISOString(),
    };
  };

  /**
   * The schedules on one definition.
   *
   * An expression that will not parse is skipped and reported rather than
   * thrown: the automation is still a real thing somebody wrote, and refusing
   * to list it would lose the definition along with the typo. It fires
   * nothing, which is the same thing this host says by leaving `nextRunAt` off
   * an automation it will not fire.
   */
  const schedulesOf = (automation: Automation): Schedule[] => {
    const triggers = Array.isArray(automation.definition.triggers) ? automation.definition.triggers : [];
    const out: Schedule[] = [];
    for (const raw of triggers) {
      const trigger = bag(raw);
      if (trigger.kind !== 'schedule') continue;
      const schedule = bag(trigger.schedule);
      const expression = typeof schedule.expression === 'string' ? schedule.expression : '';
      const timeZone = typeof schedule.timeZone === 'string' && schedule.timeZone !== ''
        ? schedule.timeZone
        : 'UTC';
      try {
        out.push({
          triggerId: String(trigger.id ?? ''),
          cron: parseCron(expression),
          timeZone,
          catchUp: trigger.misfirePolicy !== 'skip',
        });
      }
      catch (error) {
        told(`${automation.resource}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return out;
  };

  /** The soonest any of an automation's schedules comes round, after that instant. */
  const soonest = (automation: Automation, after: Date): { at: Date; schedule: Schedule } | undefined => {
    if (automation.definition.enabled === false) return undefined;
    let best: { at: Date; schedule: Schedule } | undefined;
    for (const schedule of schedulesOf(automation)) {
      let at: Date | undefined;
      try { at = nextOccurrence(schedule.cron, after, schedule.timeZone); }
      catch (error) {
        // An unknown time zone, which `Intl` refuses only when asked to use it.
        told(`${automation.resource}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (at && (!best || at < best.at)) best = { at, schedule };
    }
    return best;
  };

  /** Everything this store knows, with what it added. */
  const dressed = (automation: AutomationEntry): AutomationEntry => {
    const at = nextAt.get(automation.resource);
    const stamp = stamps.get(automation.resource);
    return {
      ...automation,
      ...(stamp ?? {}),
      ...(at ? { nextRunAt: at.toISOString() } : {}),
    };
  };

  /**
   * Write what changed: the file of each automation whose definition moved,
   * and the state of all of them.
   *
   * One file per changed definition rather than every file every time, because
   * these are files a person edits: rewriting the ten nobody touched is ten
   * watch events, ten chances to overwrite an edit made in between, and ten
   * files whose mtime says something happened when nothing did.
   */
  const save = (): void => {
    if (closed) return;
    const held: RunState = { version: 1, automations: [] };
    const live = new Set<string>();
    for (const one of inner.list()) {
      const id = idOf(one.resource);
      if (id === undefined) continue;
      live.add(id);
      // The inner store answers the entry a client reads, which carries the
      // owner in `_meta` rather than under its own name.
      const owner = ownerOf(one._meta?.['ahpd.owner']);
      const stamp = stamps.get(one.resource) ?? { createdAt: one.createdAt, modifiedAt: one.modifiedAt };
      const text = textOf({
        definition: one.definition,
        ...(owner === undefined ? {} : { owner }),
        createdAt: stamp.createdAt,
      });
      if (said.get(id) !== text) {
        try {
          mkdirSync(dir, { recursive: true, mode: 0o700 });
          wrote(fileOf(id), text);
          said.set(id, text);
          known.set(id, text);
        }
        catch (error) {
          told(`Could not write ${fileOf(id)}: ${reason(error)}`);
        }
      }
      const at = nextAt.get(one.resource);
      held.automations.push({
        resource: one.resource,
        // Absent while the definition names no allowance, which is what the
        // entry carries too - a count written for an automation that has none
        // is a number nothing will ever read.
        ...(one.runCount === undefined ? {} : { runCount: one.runCount }),
        ...(one.customizations === undefined ? {} : { customizations: one.customizations }),
        modifiedAt: stamp.modifiedAt,
        ...(at ? { nextRunAt: at.toISOString() } : {}),
      });
    }
    // The file of one that is gone goes with it, and so does its state row -
    // which is this list, and the row was simply not added to it.
    for (const id of [...said.keys()]) {
      if (live.has(id)) continue;
      said.delete(id);
      known.delete(id);
      rmSync(fileOf(id), { force: true });
    }
    try {
      // Owner-only, as the daemon's own records are: this names whose work an
      // automation is, and that is not everybody's business on a host with
      // more than one person on it.
      writeJsonAtomic(state, held);
    }
    catch (error) {
      told(`Could not write ${state}: ${reason(error)}`);
    }
  };

  /**
   * Whether an automation's own date has gone by, so it schedules itself no more.
   *
   * Read rather than re-checked, exactly as the memory store reads it: a
   * definition that reached this store was refused at the write if its
   * conditions would not read, and one written before the host checked anything
   * is read for whatever it holds.
   */
  const expired = (definition: Bag, at: Date): boolean => {
    const stopsAfter = disableConditionsOf(definition.disableConditions).stopsAfter;
    return stopsAfter !== undefined && stopsAfter <= at.getTime();
  };

  /** Let go of the timer, so whatever is armed next is the only one. */
  const disarm = (): void => {
    timer?.cancel();
    timer = undefined;
  };

  /** Work out when everything next fires, and set one timer for the first of them. */
  const rearm = (): void => {
    disarm();
    if (closed) return;
    const at = now();
    /*
     * An automation whose date has gone by is switched off here rather than
     * left to fire - which is the other half of what `soonest` says by
     * answering nothing for it.
     *
     * Switching one off is a write, and a write is announced, so this comes
     * back through `onChanged` and this function runs again - with that
     * automation already disabled. Each iteration therefore re-reads what it is
     * about to switch off rather than trusting the list it is walking, and the
     * clock is armed from the state the pass leaves behind.
     */
    for (const automation of inner.list()) {
      const held = inner.get(automation.resource);
      if (held && held.definition.enabled !== false && expired(held.definition, at)) {
        inner.update(automation.resource, { enabled: false });
      }
    }
    let first: Date | undefined;
    for (const automation of inner.list()) {
      const found = soonest(automation, at);
      if (found) {
        nextAt.set(automation.resource, found.at);
        if (!first || found.at < first) first = found.at;
      }
      else nextAt.delete(automation.resource);
    }
    // Let go once more, for the same reason: a switch-off above may have armed
    // one through the rearm its own announcement triggered, and two timers
    // racing for the same clock is one firing an occurrence nobody is due.
    disarm();
    if (!first) return;
    // One timer for the earliest, not one per automation: the second earliest
    // is recomputed when the first fires, and a hundred automations should not
    // be a hundred timers.
    const wait = Math.max(0, first.getTime() - at.getTime());
    timer = arm(() => { fire(); }, Math.min(wait, MAX_DELAY));
  };

  /** Say what is due, then look again. */
  const fire = (): void => {
    if (closed) return;
    const at = now();
    for (const automation of inner.list()) {
      const when = nextAt.get(automation.resource);
      if (!when || when > at) continue;
      const schedule = soonest(automation, new Date(when.getTime() - 1));
      const origin: Bag = {
        kind: 'trigger',
        triggerId: schedule?.schedule.triggerId ?? '',
        scheduledFor: when.toISOString(),
      };
      for (const listener of due) listener({ automation: automation.resource, origin });
    }
    rearm();
  };

  /**
   * What was missed while this daemon was not running.
   *
   * `runOnce` is the protocol's default and its whole meaning: at most one
   * catch-up run however many occurrences went by, so a machine that was off
   * for a week comes back to one run and not to two hundred.
   */
  const catchUp = (loaded: { resource: string; nextRunAt?: string }[]): void => {
    const at = now();
    for (const one of loaded) {
      if (one.nextRunAt === undefined) continue;
      const missed = new Date(one.nextRunAt);
      if (!(missed < at)) continue;
      const automation = inner.get(one.resource);
      if (!automation || automation.definition.enabled === false) continue;
      // A date that has gone by while this daemon was not running is a
      // condition met, not an occurrence missed: caught up, it would be the one
      // run the automation asked never to have. Switched off and left there,
      // which `rearm` has already done by the time catch-up is asked for.
      if (expired(automation.definition, at)) continue;
      const schedule = soonest(automation, new Date(missed.getTime() - 1));
      if (!schedule?.schedule.catchUp) continue;
      const origin: Bag = {
        kind: 'trigger',
        triggerId: schedule.schedule.triggerId,
        scheduledFor: missed.toISOString(),
        catchUp: true,
      };
      for (const listener of due) listener({ automation: one.resource, origin });
    }
  };

  /** The run state of every automation, by resource, or nothing when it is reported instead. */
  const stateOf = (): Map<string, StateRow> => {
    const out = new Map<string, StateRow>();
    const read = readJson(state);
    // Nothing to read is nothing to catch up on, and nothing is said about it:
    // a daemon's first start, and a file that could not be opened, are both a
    // store with no run state in it.
    if (!read.ok && read.kind !== 'not-json') return out;
    if (!read.ok) {
      told(`Could not read ${state}: ${reason(read.error)}`);
      return out;
    }
    const held = read.value as Partial<RunState>;
    if (held.version !== 1 || !Array.isArray(held.automations)) {
      told(`${state} is not something this version understands, and was left alone`);
      return out;
    }
    for (const one of held.automations) {
      if (typeof one?.resource === 'string') out.set(one.resource, one);
    }
    return out;
  };

  /**
   * Read what was written: the folder, joined with the run state.
   *
   * A file with no row in the state file is an automation with no run state,
   * which is what a copy of another automation's file is - it has used none of
   * an allowance, and nothing is waiting for it.
   */
  const load = (): { resource: string; nextRunAt?: string }[] => {
    const rows = stateOf();
    const back: { resource: string; nextRunAt?: string }[] = [];
    // No folder is a daemon that has never been given an automation, which is
    // no automations rather than a problem.
    if (!existsSync(dir)) return back;
    let ids: string[];
    try {
      ids = idsIn();
    }
    catch (error) {
      told(`Could not read ${dir}: ${reason(error)}`);
      return back;
    }
    for (const id of ids) {
      const file = fileOf(id);
      const text = textAt(file);
      if (text === undefined) continue;
      const held = heldIn(id, text);
      if (held === undefined) continue;
      const resource = `${PREFIX}${id}`;
      const row = rows.get(resource);
      // What an allowance has paid for survives with the definition, because
      // the protocol says it is not reconstructed from the runs.
      const runCount = typeof row?.runCount === 'number' ? row.runCount : undefined;
      // Read for what a copy has to be, and nothing more: this is the host's
      // own file, but a copy without an id or a URI is one no session could be
      // handed, and one of those in the file is not a reason to lose the
      // definition it sits beside.
      const customizations = Array.isArray(row?.customizations)
        ? row.customizations.filter((copy) => typeof copy?.id === 'string' && typeof copy.uri === 'string')
        : undefined;
      try {
        inner.create(resource, held.definition, ownerOf(held.owner), runCount, customizations);
      }
      catch (error) {
        // A definition this host refuses, which the file of a person may name.
        // Reported and skipped rather than thrown: one file nothing can run is
        // not a reason for a daemon to start with no automations at all.
        told(`${file} was not loaded: ${reason(error)}`);
        continue;
      }
      stamps.set(resource, {
        createdAt: held.createdAt,
        modifiedAt: typeof row?.modifiedAt === 'string' ? row.modifiedAt : now().toISOString(),
      });
      said.set(id, textOf(held));
      known.set(id, text);
      back.push({
        resource,
        ...(typeof row?.nextRunAt === 'string' ? { nextRunAt: row.nextRunAt } : {}),
      });
    }
    return back;
  };

  // What was on the clock when this daemon last wrote itself down. Read before
  // `rearm`, which replaces it with what is on the clock now.
  const wasWaiting = load();
  rearm();

  /*
   * Everything the inner store announces, announced again once the clock has
   * caught up.
   *
   * The ordering matters and cost a wrong answer on the wire: the inner store
   * says "this changed" from *inside* its own `update`, and whoever is
   * listening immediately reads the entry back. Rearming after that call
   * returned meant the entry went out carrying the previous `nextRunAt` - so
   * switching an automation off announced it as still firing at nine.
   */
  inner.onChanged?.((event) => {
    if (event.automation !== undefined || event.removed !== undefined) {
      rearm();
      save();
    }
    for (const listener of changed) listener(event);
  });

  return {
    ...inner,
    list: () => inner.list().map(dressed),
    get: (resource) => {
      const found = inner.get(resource);
      return found && dressed(found);
    },

    /**
     * The event triggers this host understands, which are what the store
     * underneath lists.
     *
     * Schedule triggers are protocol-defined and never appear here - a client
     * may always write one - and manual is not a trigger at all: an empty
     * trigger list is what the protocol says manual-only means. Everything
     * else is the store's answer, and this one is the store a daemon is built
     * over, so a client asking the daemon gets the same form it would get from
     * memory.
     */
    triggers: (options) => inner.triggers(options),

    create: (resource, definition, owner, runCount, customizations) => {
      // Refused before the store underneath is asked, because every automation
      // here is a file and a resource with no usable id is one nothing could
      // name that file after.
      idFor(resource);
      const made = inner.create(resource, definition, owner, runCount, customizations);
      stamps.set(resource, { createdAt: made.createdAt, modifiedAt: made.modifiedAt });
      // `onChanged` above has already rearmed and written; the stamp is set
      // before this returns so what it wrote carries the right one.
      save();
      return dressed(inner.get(resource) ?? made);
    },

    update: (resource, changes, customizations) => {
      const after = inner.update(resource, changes, customizations);
      if (!after) return undefined;
      const stamp = stamps.get(resource);
      if (stamp) stamps.set(resource, { ...stamp, modifiedAt: after.modifiedAt });
      save();
      return dressed(inner.get(resource) ?? after);
    },

    remove: (resource) => {
      const gone = inner.remove(resource);
      if (!gone) return false;
      stamps.delete(resource);
      nextAt.delete(resource);
      save();
      return true;
    },

    /** Subscribed through, so the clock is caught up before anybody reads back. */
    onChanged: (observer) => { changed.push(observer); },

    onDue: (observer) => {
      due.push(observer);
      // Whatever was missed, told to whoever just asked - which is the host,
      // at startup, and is the only moment a catch-up can be reported to
      // anybody.
      catchUp(wasWaiting);
    },

    close: () => { closed = true; disarm(); },
  };
}
