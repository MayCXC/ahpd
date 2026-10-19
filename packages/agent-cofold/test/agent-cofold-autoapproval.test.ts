import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createFakeModel } from '@cofold/agents/testing';
import type { Bag, Session, Start } from '@ahpd/sdk';
import { cofoldAgent } from '../src/index.js';

/*
 * A shell command the owner's rules already allow.
 *
 * `Start.getAutoApproval` is the host's answer to "does this run without
 * asking?", and cofold raises an `approval.requested` when its policy would put
 * a call to a person. An approved `shell_exec` is answered with cofold's own
 * approval before the mapping opens a question, so no entry is raised and the
 * row is readied `not-needed`; a command the check says nothing about asks as
 * it always did, and a call that is not a shell never reaches the check.
 */

/** What the check was asked, in one line each. */
type Asked = { kind: string; line: string; shell: string }[];

/** The host's answer to "does this run without asking?", in one line each. */
type Check = NonNullable<Start['getAutoApproval']>;

/** The commands a session's check approves, and what it was asked. */
const approving = (allowed: string[]): { asked: Asked; check: Check } => {
  const asked: Asked = [];
  return {
    asked,
    check: (kind, line, shell) => {
      asked.push({ kind, line, shell });
      return allowed.includes(line) ? 'not-needed' as NonNullable<ReturnType<Check>> : undefined;
    },
  };
};

/** Waits for `check` to hold, turning the event loop, and throws once `ms` of wall-clock time has passed. */
const when = async (check: () => boolean, ms = 5000): Promise<void> => {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error('timed out waiting');
    await new Promise((r) => { setTimeout(r, 0); });
  }
};

type Note = { channel: 'session' | 'chat' | 'terminal'; action: Bag };

const ended = (notes: Note[]): boolean =>
  notes.some((one) => one.action.type === 'chat/turnComplete'
    || one.action.type === 'chat/turnCancelled'
    || one.action.type === 'chat/error');

const of = (notes: Note[], type: string): Bag[] =>
  notes.filter((one) => one.action.type === type).map((one) => one.action);

const readyFor = (notes: Note[], callId: string): Bag | undefined =>
  of(notes, 'chat/toolCallReady').find((action) => action.toolCallId === callId);

/** The tool call a shell command reaches the run as. */
const shell = (command: string) => [
  { toolCalls: [{ name: 'shell_exec', input: { command }, callId: 'c1' }] },
  { text: 'done' },
];

/** One session over a scripted model, with the host's check when it gave one. */
async function open(args: {
  script: Parameters<typeof createFakeModel>[0]['script'];
  check?: Check;
  settings?: Record<string, unknown>;
}) {
  const model = createFakeModel({ script: args.script, stream: true });
  const agent = cofoldAgent({ adapter: model, memory: true });
  const notes: Note[] = [];
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-cofold-autoapproval-'));
  const session: Session = agent.create({
    uri: 'ahp-session:/autoapproval',
    chatUri: 'ahp-chat:/autoapproval',
    settings: { ...agent.defaults(), ...(args.settings ?? {}) },
    workingDirectory: dir,
    schema: () => agent.schema(),
    emit: (channel: Note['channel'], action: Bag) => { notes.push({ channel, action }); },
    ...(args.check === undefined ? {} : { getAutoApproval: args.check }),
  } as unknown as Start);
  return { session, model, notes, dir };
}

it('runs a shell command the owner\'s rules allow, without asking', async () => {
  const { asked, check } = approving(['echo hi']);
  const { session, notes, dir } = await open({ script: shell('echo hi'), check });
  session.begin('t1', 'run it');
  await when(() => ended(notes));

  expect(asked).toEqual([{ kind: 'shell', line: 'echo hi', shell: 'bash' }]);
  // Nothing was drawn: a call nobody was asked about is not a question that
  // was answered, and the row says the approval came from a rule.
  expect(of(notes, 'session/inputNeededSet')).toEqual([]);
  expect(readyFor(notes, 'c1')?.confirmed).toBe('not-needed');
  expect(of(notes, 'chat/toolCallComplete').find((action) => action.toolCallId === 'c1')?.result)
    .toMatchObject({ success: true });
  rmSync(dir, { recursive: true, force: true });
});

it('asks for a shell command no rule matches', async () => {
  const { asked, check } = approving(['make test']);
  const { session, notes, dir } = await open({ script: shell('echo hi'), check });
  session.begin('t1', 'run it');
  await when(() => of(notes, 'session/inputNeededSet').length > 0);

  expect(asked).toEqual([{ kind: 'shell', line: 'echo hi', shell: 'bash' }]);
  expect((of(notes, 'session/inputNeededSet')[0]?.request as Bag).kind).toBe('toolConfirmation');
  session.confirm('c1', true);
  await when(() => ended(notes));
  expect(of(notes, 'chat/toolCallComplete').find((action) => action.toolCallId === 'c1')?.result)
    .toMatchObject({ success: true });
  rmSync(dir, { recursive: true, force: true });
});

it('asks when the host offers no check at all', async () => {
  const { session, notes, dir } = await open({ script: shell('echo hi') });
  session.begin('t1', 'run it');
  await when(() => of(notes, 'session/inputNeededSet').length > 0);

  expect((of(notes, 'session/inputNeededSet')[0]?.request as Bag).kind).toBe('toolConfirmation');
  session.confirm('c1', false);
  await when(() => ended(notes));
  rmSync(dir, { recursive: true, force: true });
});

it('asks the check only about cofold\'s shell', async () => {
  const { asked, check } = approving(['new']);
  const { session, notes, dir } = await open({
    script: [
      { toolCalls: [{ name: 'write_file', input: { path: 'b.txt', content: 'new' }, callId: 'c1' }] },
      { text: 'done' },
    ],
    check,
    // The mode that asks before a write, so the call reaches the policy.
    settings: { permissionMode: 'default' },
  });
  session.begin('t1', 'write it');
  await when(() => of(notes, 'session/inputNeededSet').length > 0);

  // A file write is not a command line, and the rules are about command lines.
  expect(asked).toEqual([]);
  session.confirm('c1', false);
  await when(() => ended(notes));
  rmSync(dir, { recursive: true, force: true });
});
