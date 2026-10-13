import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '../src/catalog.js';
import { ROOT, createHost } from '../src/host.js';
import { fileSessions } from '../src/sessions.js';
import { hostTools } from '../src/tools/index.js';
import {
  filterSessions, openLink, serializeContext, serializeSession, sessionMeant, sessionTools, statusWords,
} from '../src/tools/session.js';
import { directory, hello, root, signIn } from './users-gate-helpers.js';
import { claude, machine, peer, resetSdk, sdk, sessionQueries, settle } from './support/host.js';
import type { Summary } from '../src/types/catalog.js';
import type { HostOptions } from '../src/types/host.js';
import type { Grant } from '../src/types/users.js';

vi.mock('@anthropic-ai/claude-agent-sdk', async () => (await import('./support/claude-sdk.js')).fake);

beforeEach(resetSdk);

/*
 * The session tools, in the shapes VS Code's host answers them.
 *
 * What is under test is the mapping: the same names, the same filters, the
 * same keys in the rows and the same words in the answers, so a skill written
 * against the reference host reads these without noticing. The host half -
 * that a message actually starts a turn, that a session actually appears - is
 * in `host.test.ts`, where the backend is faked.
 */

const row = (over: Partial<Summary> & Record<string, unknown> = {}): Summary => ({
  resource: 'ahp-session:/s1',
  provider: 'claude',
  title: 'Fix the kqueue build',
  status: Status.Idle | Status.IsRead,
  createdAt: '2026-09-13T10:00:00.000Z',
  modifiedAt: '2026-09-13T11:00:00.000Z',
  workingDirectories: ['file:///brb_main/src/brb_backend'],
  ...over,
});

describe('the names a tool has for a session', () => {
  it('links the way the reference window opens: provider, id, and the chat when one is meant', () => {
    expect(openLink('ahp-session:/abc', 'claude')).toBe('agent-host-session://claude/abc');
    expect(openLink('claude:/abc', 'claude', 'c 2')).toBe('agent-host-session://claude/abc?chat=c%202');
  });

  it('finds a row by its URI or by its link, under either scheme', () => {
    const rows = [row(), row({ resource: 'claude:/on-disk' })];
    expect(sessionMeant('ahp-session:/s1', rows)?.session.resource).toBe('ahp-session:/s1');
    expect(sessionMeant('agent-host-session://claude/s1', rows)?.session.resource).toBe('ahp-session:/s1');
    expect(sessionMeant('agent-host-session://claude/on-disk', rows)?.session.resource).toBe('claude:/on-disk');
    expect(sessionMeant('agent-host-session://claude/s1?chat=side', rows)).toMatchObject({ chatId: 'side' });
    // Another provider's id is another session, however the id reads.
    expect(sessionMeant('agent-host-session://codex/s1', rows)).toBeUndefined();
    expect(sessionMeant('ahp-session:/nobody', rows)).toBeUndefined();
  });
});

describe('the words a status answers to', () => {
  it('names the activity once, and the flags beside it', () => {
    expect(statusWords(Status.Idle)).toEqual(['idle']);
    expect(statusWords(Status.InProgress)).toEqual(['inProgress']);
    // `inputNeeded` carries the in-progress bit; it is not both.
    expect(statusWords(Status.InputNeeded)).toEqual(['inputNeeded']);
    expect(statusWords(Status.Idle | Status.Error | Status.IsArchived)).toEqual(['idle', 'error', 'archived']);
    expect(statusWords(Status.IsRead)).toEqual([]);
  });
});

describe('a row as list_sessions answers it', () => {
  it('carries the reference host\'s keys, and only the ones with a value', () => {
    const said = serializeSession(row({
      activity: 'Grep: input.c',
      project: { uri: 'file:///brb_main/src/brb_backend', displayName: 'brb_backend' },
      changes: { files: 2, additions: 10, deletions: 3 },
      _meta: {
        git: { branchName: 'fix/kqueue', baseBranchName: 'main', outgoingChanges: 1, incomingChanges: 0, uncommittedChanges: 4 },
        github: { owner: 'brbyte', repo: 'brb_backend', pullRequestUrls: ['https://github.com/brbyte/brb_backend/pull/412'] },
      },
    }));
    expect(said).toEqual({
      session: 'ahp-session:/s1',
      openLink: 'agent-host-session://claude/s1',
      title: 'Fix the kqueue build',
      status: 'idle',
      activity: 'Grep: input.c',
      workingDirectory: 'file:///brb_main/src/brb_backend',
      project: 'brb_backend',
      projectUri: 'file:///brb_main/src/brb_backend',
      createdAt: '2026-09-13T10:00:00.000Z',
      modifiedAt: '2026-09-13T11:00:00.000Z',
      changes: { files: 2, additions: 10, deletions: 3 },
      git: { branch: 'fix/kqueue', baseBranch: 'main', ahead: 1, behind: 0, uncommittedChanges: 4 },
      github: { owner: 'brbyte', repo: 'brb_backend', pullRequestUrl: 'https://github.com/brbyte/brb_backend/pull/412' },
    });
  });

  it('says unread when the read bit is off, and lists the directories only when there are several', () => {
    const said = serializeSession(row({ status: Status.Idle, workingDirectories: ['file:///a', 'file:///b'] }));
    expect(said.unread).toBe(true);
    expect(said.workingDirectory).toBe('file:///a');
    expect(said.workingDirectories).toEqual(['file:///a', 'file:///b']);
    expect(serializeSession(row()).unread).toBeUndefined();
    expect(serializeSession(row()).workingDirectories).toBeUndefined();
  });
});

describe('the filters list_sessions takes', () => {
  const rows = [
    row({ resource: 'ahp-session:/idle' }),
    row({ resource: 'ahp-session:/busy', status: Status.InProgress | Status.IsRead, createdAt: '2026-09-14T00:00:00.000Z' }),
    row({ resource: 'ahp-session:/asking', status: Status.InputNeeded }),
    row({ resource: 'ahp-session:/done', status: Status.Idle | Status.IsRead | Status.IsArchived }),
    row({
      resource: 'ahp-session:/elsewhere',
      workingDirectories: ['file:///github/ahpc'],
      project: { uri: 'file:///github/ahpc', displayName: 'ahpc' },
      changes: { files: 1 },
      _meta: { github: { pullRequestUrls: ['https://github.com/softov/ahpc/pull/1'] } },
    }),
  ];
  const names = (args: Record<string, unknown>) => filterSessions(rows, args).map((one) => one.resource.slice('ahp-session:/'.length));

  it('leaves the archived out unless asked, either way', () => {
    expect(names({})).toEqual(['idle', 'busy', 'asking', 'elsewhere']);
    expect(names({ includeArchived: true })).toContain('done');
    expect(names({ status: ['archived'] })).toEqual(['done']);
  });

  it('matches a status by any of its words', () => {
    expect(names({ status: ['inProgress', 'inputNeeded'] })).toEqual(['busy', 'asking']);
  });

  it('matches a workspace by project name, project URI, or directory', () => {
    expect(names({ workspace: 'ahpc' })).toEqual(['elsewhere']);
    expect(names({ workspace: 'file:///github/ahpc' })).toEqual(['elsewhere']);
    expect(names({ workspace: '/github/ahpc/' })).toEqual(['elsewhere']);
  });

  it('matches a directory with a space, however the URI was written', () => {
    const spaced = row({ resource: 'ahp-session:/spaced', workingDirectories: ['file:///github/my%20dir'] });
    const found = (args: Record<string, unknown>) =>
      filterSessions([spaced], args).map((one) => one.resource);
    // A URI the client encoded and a path somebody typed are the same place,
    // and a workspace filter that compared their text matched neither.
    expect(found({ workspace: 'file:///github/my dir' })).toEqual(['ahp-session:/spaced']);
    expect(found({ workspace: 'file:///github/my%20dir' })).toEqual(['ahp-session:/spaced']);
    expect(found({ workspace: '/github/my dir/' })).toEqual(['ahp-session:/spaced']);
  });

  it('keeps the flags the reference host filters on', () => {
    expect(names({ unread: true })).toEqual(['asking']);
    expect(names({ withChanges: true })).toEqual(['elsewhere']);
    expect(names({ withPullRequest: true })).toEqual(['elsewhere']);
    expect(names({ createdAfter: '2026-09-13T12:00:00Z' })).toEqual(['busy']);
    expect(names({ createdBefore: '2026-09-13T12:00:00Z' })).toEqual(['idle', 'asking', 'elsewhere']);
  });

  it('answers a direct lookup with that row alone, archived or not', () => {
    expect(names({ session: 'agent-host-session://claude/done' })).toEqual(['done']);
    expect(names({ session: 'ahp-session:/nobody' })).toEqual([]);
  });

  it('refuses an argument of the wrong shape in the reference host\'s words', () => {
    expect(() => filterSessions(rows, { unread: 'yes' })).toThrow('Invalid list_sessions input: unread must be a boolean.');
    expect(() => filterSessions(rows, { createdAfter: 'yesterday' })).toThrow('createdAfter must be an ISO-8601 timestamp');
  });
});

describe('a transcript as get_session_context answers it', () => {
  const turn = (id: string, user: string, assistant: string, calls: { toolName: string; toolInput?: unknown; status?: string }[] = []) => ({
    id,
    state: 'complete',
    message: { text: user, origin: { kind: 'user' } },
    responseParts: [
      { kind: 'markdown', id: `${id}-m`, content: assistant },
      ...calls.map((call, index) => ({ kind: 'toolCall', id: `${id}-c${index}`, toolCall: { status: 'completed', ...call } })),
    ],
  });
  const snapshot = {
    turns: [
      turn('t1', 'what is in this directory', 'Four files.', [{ toolName: 'Bash', toolInput: { command: 'ls' } }]),
      turn('t2', 'delete the old script', 'Left it: it is FreeBSD-only.'),
    ],
    activeTurn: { id: 't3', message: { text: 'and the makefile?' }, responseParts: [] },
    hasMoreHistory: true,
  };

  it('numbers the turns, marks the running one, and holds the tool calls back at summary', () => {
    const said = serializeContext(row(), undefined, snapshot, 'summary', 10);
    expect(said.openLink).toBe('agent-host-session://claude/s1');
    expect(said.hasMoreHistory).toBe(true);
    expect(said.truncated).toBe(false);
    expect(said.transcript).toEqual([
      { turn: 1, state: 'complete', user: 'what is in this directory', assistant: 'Four files.' },
      { turn: 2, state: 'complete', user: 'delete the old script', assistant: 'Left it: it is FreeBSD-only.' },
      { turn: 3, state: 'inProgress', user: 'and the makefile?' },
    ]);
  });

  it('names the tool calls at digest and shows their input at full', () => {
    const digest = serializeContext(row(), 'side', snapshot, 'digest', 10);
    expect(digest.openLink).toBe('agent-host-session://claude/s1?chat=side');
    expect((digest.transcript as { toolCalls?: unknown }[])[0]?.toolCalls).toEqual(['Bash']);
    const full = serializeContext(row(), undefined, snapshot, 'full', 10);
    expect((full.transcript as { toolCalls?: unknown }[])[0]?.toolCalls).toEqual([{ name: 'Bash', input: 'ls' }]);
  });

  it('keeps the newest turns inside the limit, and says it cut', () => {
    const said = serializeContext(row(), undefined, snapshot, 'summary', 2);
    expect((said.transcript as { turn: number }[]).map((one) => one.turn)).toEqual([2, 3]);
    expect(said.truncated).toBe(true);
    const long = serializeContext(row(), undefined, { turns: [turn('t1', 'x'.repeat(500), 'y')], hasMoreHistory: false }, 'summary', 10);
    expect(long.truncated).toBe(true);
    expect(String((long.transcript as { user: string }[])[0]?.user).length).toBe(160);
  });
});

describe('the set itself', () => {
  it('is the reference host\'s nine, by name, with the required fields it requires', () => {
    const tools = sessionTools();
    expect(tools.map((one) => one.definition.name)).toEqual([
      'list_sessions', 'get_current_session', 'set_workspace', 'create_session', 'create_chat',
      'rename_chat', 'send_message', 'get_session_context', 'delete_session',
    ]);
    const schema = (name: string) => tools.find((one) => one.definition.name === name)?.definition.inputSchema as { required?: string[] };
    expect(schema('create_session').required).toEqual(['relationship', 'prompt', 'title']);
    expect(schema('set_workspace').required).toEqual(['workspaceFolder', 'isolation']);
    expect(schema('send_message').required).toEqual(['session', 'message']);
    expect(schema('rename_chat').required).toEqual(['title']);
  });

  it('shapes rename_chat by the title strategy the session runs under', () => {
    const rename = sessionTools().find((one) => one.definition.name === 'rename_chat');
    expect(rename?.forSession).toBeDefined();
    // Deferred is the only strategy a session runs under, and the host reaches
    // the tool through the discovery the artifact instruction points at.
    expect(rename?.deferLoading).toBe(true);
    // A utility strategy names chats itself, so the tool is not offered.
    expect(rename?.forSession?.({ titleStrategy: 'utility' })).toEqual({ offered: false });
    // An active agent names its own chats with the tool as it stands.
    expect(rename?.forSession?.({ titleStrategy: 'activeAgent' })).toBeUndefined();
    const deferred = rename?.forSession?.({ titleStrategy: 'deferred' });
    expect(deferred?.offered).toBe(true);
    const definition = deferred?.definition as {
      description?: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] };
    };
    expect(definition.description).not.toBe(rename?.definition.description);
    expect(definition.description).toContain('Automatic naming is handled by the host');
    // No `automatic` argument under deferred naming, since the host does the
    // automatic half.
    expect(definition.inputSchema?.properties).not.toHaveProperty('automatic');
    expect(Object.keys(definition.inputSchema?.properties ?? {})).toEqual(['session', 'chat', 'title']);
    expect(definition.inputSchema?.required).toEqual(['title']);
  });
});

/*
 * The person a session tool acts for.
 *
 * A tool is reached from inside a turn and the turn carries the person who sent
 * it, so a tool answers with that person's grants rather than with the
 * window's. The turns below are real ones: a signed-in client sends them
 * through `chat/turnStarted`, and the CLI behind them is the fake one, which
 * holds a turn open until the test moves it - so every call here is made where
 * a tool call is always made, inside a turn that is running.
 */
describe('what a session tool asks of the turn it runs in', () => {
  type Answer = { content: { text: string }[]; isError?: boolean };
  type Tool = { name: string; handler: (input: unknown) => Promise<Answer> };
  type Client = ReturnType<ReturnType<typeof createHost>['accept']>;

  /** One session's tools, as the model reaches them. */
  const toolsOf = (index = -1): Record<string, Tool> => {
    const servers = sessionQueries().at(index)?.options.mcpServers as Record<string, { tools: Tool[] }> | undefined;
    return Object.fromEntries((servers?.ahp?.tools ?? []).map((one) => [one.name, one]));
  };
  const call = async (name: string, input: unknown, index = -1): Promise<Answer> => {
    const tool = toolsOf(index)[name];
    if (!tool) throw new Error(`no ${name}`);
    return tool.handler(input);
  };
  // A refusal is a tool result too: the backend hands the model the message as
  // text, marked as an error, which is how a model hears what it got wrong.
  const said = (one: Answer): string => one.content[0]?.text ?? '';

  /**
   * A member: the read half of sessions and the write half.
   *
   * The built-in role of that name holds more - files, terminals, the proxy -
   * and none of it is anything a session tool asks about, so these two are the
   * whole of what these cases need.
   */
  const MEMBER: Grant[] = ['session:read', 'session:write'];
  /**
   * A reader: the read half, and the right to say something in what it reads.
   *
   * The second is not decoration. The built-in guest role holds `session:read`
   * alone, and a chat's write group is its session's, so a guest can never send
   * a turn - and a tool runs in a turn. These two are the least it takes to
   * stand in one: read what is here, and speak in it.
   */
  const READER: Grant[] = ['session:read', 'chat:send'];

  /** A clock a case moves, so a wake falls due without waiting for one. */
  const clock = () => {
    let at = Date.parse('2026-10-13T12:00:00Z');
    const armed: (() => void)[] = [];
    return {
      now: (): Date => new Date(at),
      timer: (fire: () => void): { cancel(): void } => {
        armed.push(fire);
        return { cancel: () => { const i = armed.indexOf(fire); if (i >= 0) armed.splice(i, 1); } };
      },
      /** Move time by `minutes`, then run whatever came due. */
      pass: (minutes: number): void => {
        at += minutes * 60_000;
        for (const fire of armed.splice(0)) fire();
      },
    };
  };

  /**
   * A host that knows these people, with a clock the case moves.
   *
   * Nothing sleeps, so a session stays the one it was across a moved clock and
   * the only thing the clock is for is the wake.
   */
  const hosting = (tokens: Record<string, Grant[]>, over: Partial<HostOptions> = {}) => {
    const time = clock();
    const host = createHost({
      path: root, agents: [claude({ paths: [root] })], ...machine(),
      users: directory(tokens), tools: hostTools(),
      now: time.now, timer: time.timer, sleepAfterMinutes: 0,
      ...over,
    });
    return { host, time };
  };

  /** One connection, signed in as whoever the token names. */
  const signing = async (host: ReturnType<typeof createHost>, token: string) => {
    const p = peer();
    const client = host.accept(p);
    await hello(client, token);
    await signIn(client, token);
    return { client, p };
  };

  /** A client watching a session and the chat it means, which is what talking in it takes. */
  const watching_ = async (client: Client, ...channels: string[]) => {
    for (const channel of channels) await client.handle({ method: 'subscribe', params: { channel } });
  };

  /** One session running on this host, and the chat it runs. */
  const opening = async (client: Client, name: string) => {
    const uri = `ahp-session:/${name}`;
    await client.handle({ method: 'createSession', params: { channel: uri, provider: 'claude' } });
    const chat = (await client.handle({ method: 'subscribe', params: { channel: uri } }) as {
      snapshot: { state: { defaultChat: string } };
    }).snapshot.state.defaultChat;
    await watching_(client, chat);
    return { uri, held: `claude:/${name}`, chat };
  };

  /** A client says a turn has begun in one chat, which is how a turn is sent. */
  const saying = async (client: Client, chat: string, turnId: string, text: string) => {
    await client.handle({
      method: 'dispatchAction',
      params: { channel: chat, action: { type: 'chat/turnStarted', turnId, message: { text } } },
    });
    await settle(8);
  };

  it('answers a reader with what it may read, and refuses it the writes', async () => {
    const { host } = hosting({ member: MEMBER, reader: READER });
    const { client: member } = await signing(host, 'member');
    const notes = await opening(member, 'notes');
    // The reader stands in the member's session: it may read the session and
    // say something in it, which is what it takes to be in a turn it may not
    // write in. The tools it reaches are that session's own.
    const { client: reader } = await signing(host, 'reader');
    await watching_(reader, notes.uri, notes.chat);
    await saying(reader, notes.chat, 'r1', 'what is in here');

    const rows = JSON.parse(said(await call('list_sessions', {}, 0))) as { sessions: { session: string }[] };
    expect(rows.sessions.map((one) => one.session)).toEqual([notes.held]);
    expect(said(await call('get_current_session', {}, 0))).toContain(notes.held);

    const refused = await call('create_session', { relationship: 'currentSession', title: 'x', prompt: 'y' }, 0);
    expect(said(refused)).toContain('may not session:write here');
    // Named, because there is a person to name: this is the host's own refusal
    // with the reader's id in front of it.
    expect(said(refused)).toContain('reader may not session:write here');
    expect(refused.isError).toBe(true);
  });

  it('carries the member into a session its turn opened, and no further', async () => {
    const { host } = hosting({ member: MEMBER, other: MEMBER });
    const { client } = await signing(host, 'member');
    const lead = await opening(client, 'lead');
    // Another person's session, to tell the member apart from the host itself:
    // a member may write a session and may not delete one that is not theirs.
    const { client: other } = await signing(host, 'other');
    const theirs = await opening(other, 'theirs');
    await saying(client, lead.chat, 't1', 'start something else');
    expect(said(await call('create_session', {
      relationship: 'independent', workspace: root, title: 'Child', prompt: 'go', worktree: false,
    }, 0))).toMatch(/^New session created \(/);
    await settle(8);

    // The child's turn is the member's, so the child may do what the member
    // may: it reads the host, and it writes a chat of its own session.
    const child = sessionQueries().length - 1;
    const rows = JSON.parse(said(await call('list_sessions', {}, child))) as { sessions: unknown[] };
    expect(rows.sessions).toHaveLength(3);
    expect(said(await call('create_session', { relationship: 'currentSession', title: 'Grandchild', prompt: 'go' }, child)))
      .toMatch(/^Chat created in the current session/);
    // And not a thing more: a session the member does not own is not theirs to
    // delete, and the child is refused it exactly as the member is.
    expect(said(await call('delete_session', { session: theirs.held }, child)))
      .toBe("Only the session's owner can delete it.");
  });

  it('lets a turn nobody sent read, and refuses it every write', async () => {
    const { host, time } = hosting({ member: MEMBER });
    const { client } = await signing(host, 'member');
    const alone = await opening(client, 'alone');
    // No turn is running, so nobody sets this wake - and the turn it begins
    // carries nobody, which is what the host's own turn looks like too. Asked
    // without a turn at all, which is what a call no backend makes looks like.
    expect(said(await call('schedule_wakeup', { delaySeconds: 60, prompt: 'carry on' }, 0))).toContain('Wakeup scheduled');
    time.pass(2);
    await settle(8);

    // A turn is running now, and it is nobody's.
    expect(said(await call('get_current_session', {}, 0))).toContain(alone.held);
    expect(said(await call('get_session_context', { session: alone.held }, 0))).toContain('transcript');
    const rows = JSON.parse(said(await call('list_sessions', {}, 0))) as { sessions: { session: string }[] };
    expect(rows.sessions.map((one) => one.session)).toEqual([alone.held]);

    for (const [name, input] of [
      ['set_workspace', { workspaceFolder: root, isolation: false }],
      ['create_session', { relationship: 'currentSession', title: 'x', prompt: 'y' }],
      ['create_chat', { prompt: 'x' }],
      ['rename_chat', { title: 'x' }],
      ['send_message', { session: alone.held, message: 'x' }],
      ['delete_session', { session: alone.held }],
    ] as [string, Record<string, unknown>][]) {
      const refused = await call(name, input, 0);
      expect(said(refused), name).toBe('this turn may not session:write here');
      expect(refused.isError, name).toBe(true);
    }
  });

  it('refuses a call with no turn running, and lists as nobody', async () => {
    const { host } = hosting({ member: MEMBER });
    const { client } = await signing(host, 'member');
    const idle = await opening(client, 'idle');
    // Nothing is running in this chat. A window outlives the turn it sent, so a
    // tool can be reached now that the turn that asked for it has ended - and
    // no turn is what carries a person, so the call is nobody's. The danger is a
    // backgrounded subagent or shell reaching a tool after its turn ended: if
    // this answered as the session's person, it would write as the member.
    expect(said(await call('send_message', { session: idle.held, message: 'x' }, 0)))
      .toBe('this turn may not session:write here');
    expect(said(await call('delete_session', { session: idle.held }, 0)))
      .toBe('this turn may not session:write here');
    // Reading is what nobody holds, so the listing still answers.
    const rows = JSON.parse(said(await call('list_sessions', {}, 0))) as { sessions: { session: string }[] };
    expect(rows.sessions.map((one) => one.session)).toEqual([idle.held]);
  });

  it('carries the member through a wake, and through a reload of the store', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ahpd-wake-'));
    const { host: before } = hosting({ member: MEMBER }, { sessions: fileSessions({ dir }) });
    const { client } = await signing(before, 'member');
    const waiting = await opening(client, 'waiting');
    await saying(client, waiting.chat, 't1', 'leave a wake');
    expect(said(await call('schedule_wakeup', { delaySeconds: 60, prompt: 'come back to this' }, 0)))
      .toContain('Wakeup scheduled');
    await before.close();
    // The transcript the backend answers about by id, which is what makes the
    // record the store kept a session its successor can start again.
    sdk.sessions.push({ sessionId: 'waiting', summary: 'Waiting', lastModified: Date.now(), cwd: root });

    // A successor over the same store: the wake, and the person it belongs to,
    // are read back off the record rather than remembered.
    const { host: after, time } = hosting({ member: MEMBER, other: MEMBER }, { sessions: fileSessions({ dir }) });
    const { client: member } = await signing(after, 'member');
    // Somebody else's session, to tell the person apart from the host itself:
    // a member may write a session and may not delete another person's.
    const { client: other } = await signing(after, 'other');
    const theirs = await opening(other, 'theirs');

    // Due only now, and the member is here to carry it.
    time.pass(2);
    await settle(8);
    const woken = sessionQueries().length - 1;
    // The turn the wake began is the member's: a write the member may make is
    // made, and one the member may not is refused as the member is refused it.
    expect(said(await call('rename_chat', { title: 'Woken' }, woken))).toBe('Renamed chat to "Woken".');
    expect(said(await call('delete_session', { session: theirs.held }, woken)))
      .toBe("Only the session's owner can delete it.");
  });

  it('asks nobody where there is no users directory, and the tools act as they did', async () => {
    const time = clock();
    const host = createHost({
      path: root, agents: [claude({ paths: [root] })], ...machine(), tools: hostTools(),
      now: time.now, timer: time.timer, sleepAfterMinutes: 0,
    });
    const client = host.accept(peer());
    await hello(client);
    const solo = await opening(client, 'solo');
    // No turn is running and no grant is asked: the calls the turn with no
    // person was refused above are answered here, as they were before there
    // was anybody to ask.
    expect(said(await call('rename_chat', { title: 'Renamed' }, 0))).toBe('Renamed chat to "Renamed".');
    expect(said(await call('create_session', { relationship: 'currentSession', title: 'x', prompt: 'y' }, 0)))
      .toMatch(/^Chat created in the current session/);
    expect(said(await call('schedule_wakeup', { delaySeconds: 60, prompt: 'later' }, 0))).toContain('Wakeup scheduled');

    time.pass(2);
    await settle(8);
    // The turn the wake began is nobody's too, and writes as it always did.
    expect(said(await call('rename_chat', { title: 'Woken' }, 0))).toBe('Renamed chat to "Woken".');
    const rows = JSON.parse(said(await call('list_sessions', {}, 0))) as { sessions: { session: string }[] };
    expect(rows.sessions.map((one) => one.session)).toContain(solo.held);
  });
});
