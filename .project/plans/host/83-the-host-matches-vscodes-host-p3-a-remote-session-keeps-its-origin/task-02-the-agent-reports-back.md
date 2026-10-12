---
title: The agent is told to report back to the origin
status: implemented
depends: [task-01-the-host-takes-a-remote-session.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1061](../../../../packages/sdk/src/host/tooling.ts#L1061) - `instructions`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/chatContributions/remoteSessionOrigin/remoteSessionOriginContribution.ts - the text and the rule
---

## Objective

A turn in a session that has an origin gets the `<remote_session_origin>` instruction, word for word, when an active client offers `send_remote_message`.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1041-1069` - the rule in `instructions`, and the text it gives, at the top of the file.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:826-882` - the creating client is in the session before the backend starts.
- `UPDATE: packages/sdk/test/host-remote-session.test.ts` - the cases below.

## Steps

1. Copy the instruction text from `remoteSessionOriginContribution.ts`.
2. Give it when the session has an origin and an active client offers `send_remote_message`.
3. Give nothing in every other case.

## Validation

- A session with an origin and the client tool gets the instruction.
- A session without the origin, or without the tool, does not.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

The instruction is given in `instructions` in `packages/sdk/src/host/tooling.ts`, from the text at the top of that file. The text is the window's own, word for word. The tool's name is the one spelling this host supplies. `SEND_REMOTE_MESSAGE` comes from `packages/sdk/src/remotesession.ts`, so the words and the rule cannot come apart.

The rule is the window's own: the session has an origin, and a client in it announced a tool called `send_remote_message`. The announcement is read rather than the list offered to the model. This host names a client's tool `<clientId>__<name>`, and the text names the bare one. A presence entry always carries a client id here, named or filled in as `anonymous`, so the two agree on which clients count.

`## Files` named `tooling.ts` alone. `packages/sdk/src/host/sessionmethods.ts` is the second source file, and the reason is a departure. What a chat is handed and what the model is told are both read once, when the backend starts. There is no seam to add either later. The creating client was put into the session after that start. A window that delegates work announces its tools in the create request. That client was in no session the instruction could see at the start.

The client is now put in before `openSession`. The announcement is still dispatched after it, because a session nobody can subscribe to yet has nobody to tell. That is the behavior `spawn.ts` already claims for tools, in the comment on the `tools` it hands down. A session that fails to open takes the client back out, so a request that came to nothing leaves nothing behind.

The instruction stands for the life of the backend, which is what a create-time option can do. A client that announces itself into a session already running contributes tools but no instruction, and the window's per-turn rule would tell it. The limit is recorded here rather than treated as parity.

Files changed:

- `packages/sdk/src/host/tooling.ts`
- `packages/sdk/src/host/sessionmethods.ts`
- `packages/sdk/test/host-remote-session.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass.
