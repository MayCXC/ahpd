---
title: "`#chat:` completes a chat of the session"
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L443-L496](../../../../packages/sdk/src/host/sessionmethods.ts#L443-L496) - the completions command and the `#chat:` early return"
  - "[code://packages/sdk/src/host/catalogue.ts#L338-L344](../../../../packages/sdk/src/host/catalogue.ts#L338-L344) - a chat's `title`, `origin` and `interactivity`"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/node/agentHostChatCompletionProvider.ts`: the whole provider, 216 lines"
---

## Objective

`#chat:<filter>` answers the other chats of the same session whose title holds the filter.
Each item inserts `#chat:<title> ` and carries a `chat` attachment pinned to the last completed turn of that chat.

## Files

- `UPDATE: packages/sdk/src/host/sessionmethods.ts:443-496` - `#chat:` and `#ch` answer chat items before the file items.
- `UPDATE: packages/sdk/test/host-files.test.ts` - the completion cases below.
- `UPDATE: docs/sdk/AHP.md` - `#chat:` in the `completions` row.
- `UPDATE: docs/sdk/CHATS.md` - `#chat:` in the chat commands table.

## Steps

1. Read the plan's *Decisions locked in* rows for task 01.
2. Port `extractChatToken` from VS Code, so `#`, `#ch` and `#chat:` start a chat token and `#chat:foo` gives the filter `foo`.
3. Port `sanitizeChatTitle`, which puts the title on one line.
4. Remove the early return that answers `#chat:` with no items.
5. Find the session of the channel, and its default chat, for a chat channel and for a session channel.
6. List the chats of that session, except the current chat, a chat whose `origin.kind` is `tool`, and a `hidden` chat.
7. Keep a chat whose sanitized title holds the filter, case blind, and keep every chat for an empty filter.
8. Sort the chats newest first by modified time, and return at most 20 items, as VS Code's `MAX_RESULTS` does.
9. Give each item `insertText` `#chat:<title> `, the token's range, and the attachment `{ type: 'chat', resource, label: <title> }`.
10. Add `endTurn` to the attachment with the id of the last completed turn of that chat, when it has one.
11. Keep the file items for a `#` token that cannot become `#chat:`.
12. Write `#chat:` in the `completions` row of `docs/sdk/AHP.md` and in the table of `docs/sdk/CHATS.md`.

## Validation

- `host-files.test.ts`: `#chat:` in a session with three chats lists the two other chats, and not the current one.
- `host-files.test.ts`: `#chat:rev` lists only the chat whose title holds `rev`.
- `host-files.test.ts`: a worker chat that `start.subagent` makes is not listed.
- `host-files.test.ts`: an item gets the `endTurn` of the last completed turn, and a chat with no turn gets none.
- `host-files.test.ts`: `#src/` still lists files.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

Built, and then reviewed and fixed once: a hash still on its way to `chat:` offers both lists, as VS Code's own client shows them.

### What changed, file by file

- `packages/sdk/src/host/sessionmethods.ts`
  - The `#chat:` early return is gone and the hash is read before the file list. `chatFilter` is VS Code's `extractChatToken` on the text after the `#`, with the walk back to the token already done by the pattern that found it: a filter once the word says `chat:`, an empty filter while the rest of it is still a prefix of `chat:`, and nothing for anything else - so `#src/` and every other non-chat hash still completes paths.
  - The review fix: `partial` is `wanted !== undefined && !typed_.toLowerCase().startsWith(CHAT_PREFIX)`, which is the word being `#`, `#ch` or `#chat` rather than `#chat:`. VS Code's window fans one completions request out to every provider and shows the items merged, so a partial word is answered with the chats and then the files, and only a word that has arrived at `chat:` is answered with chats alone. Both branches end in one return (`[...chats.map(...), ...(partial ? await files() : [])]`), and the file list moved into a local `files` arrow so both branches share it - the same list, the same range and the same `resource` attachment an at-sign gets. A partial word on a channel with no session behind it is the files alone, which is what a bare `#` did before this task.
  - The chat branch resolves the session and the current chat from the channel the same way the file branch does (`meantBy`, `byChat`), and a session channel is answered as the chat that session hands out - the two spellings one exclusion, which is what VS Code's `_canonicalChatId` folds together. It lists `held.chats` minus the current chat, minus a chat whose `madeFrom` origin is `tool`; keeps a chat whose `oneLine(title)` holds the filter, case blind, and every chat for an empty filter; sorts newest first by `modifiedAt`; and cuts to `CHAT_MOST = 20`, VS Code's `MAX_RESULTS`.
  - Each item is `insertText: '#chat:<title> '`, the token's range (`from` to `offset`, so the typed `#chat:...` is replaced whole) and a `chat` attachment `{ type, resource, label }`, with `endTurn` set to the id of the chat's last completed turn when it has one. Absent - not empty - when it has none: the protocol reads an absent `endTurn` as the whole transcript, and a chat with no completed turn has no id to name.
  - `resource` is respelled into the spelling this connection knows the session by (`spellingOf`/`respell`, both now destructured), because the default chat's URI is derived from the session URI: a client that opened `ahp-session:/x` was told `ahp-chat://default/<base64url(ahp-session:/x)>`, and handing it the host's held spelling would name a chat it cannot open. A peer chat is the client's own name and comes back unchanged.
  - `CHAT_MOST` and `CHAT_PREFIX` sit with `PAGE_CAP`/`PAGE_MOST`; `oneLine` (VS Code's `sanitizeChatTitle`) and `chatFilter` sit with the other local helpers before the methods object.
- `packages/sdk/test/host-files.test.ts` - five new cases and one reshaped, in `completing a hash sign`: the files beside the chats while the hash is still becoming one, the session's other chats with the current one left out (from a session channel and from a peer channel), the filter and its case blindness, a worker from `start.subagent` not offered, the pinning of `endTurn` and the chat that has none, and the reshaped `answers nothing for #chat:` - now asked on a channel with no session behind it, which is the case that still has an answer. Helpers: `holding` (a host whose backend's starts are kept, so a worker can be opened on one), `chatty` (a session with three chats, each titled by its first message), `spoken` (one finished turn under a named id) and `completing`. A `Start` type import.
- `docs/sdk/AHP.md` - the `completions` row: `#chat:`, the filter, the cap of twenty, the `chat` attachment and its `endTurn`, the two exclusions, the spelling a resource comes back in, and that a `#` still on its way to `#chat:` - `#`, `#ch`, `#chat` - is answered with the chats and the files both while a word that already says `chat:` is answered with chats alone.
- `docs/sdk/CHATS.md` - the `completions` row of the commands table now names the `#` rather than `#chat:`, since a bare one is answered too.

### Decisions, as read from the plan

- The cap is 20, VS Code's `MAX_RESULTS`, and the order is newest first by modified time.
- A word that could still become `#chat:` is answered with the chats and the files, because VS Code's `agentHostCompletions.ts` asks every provider and merges the items. Answering the chats alone emptied the file list under somebody typing `#` on the way to `#chat:`, which is not what the window they are copying does.
- A chat with no completed turn is offered, with no `endTurn`. This is the plan's own deviation from VS Code, which skips such a chat: the protocol makes `endTurn` optional and forbids refusing an attachment for having no completed turn.
- The tool-origin guard is kept, and it cannot fire here: a chat a tool started is a `LiveSubagent`, which has no `Session` and is never in `held.chats`. The worker case is tested through `start.subagent` all the same, and asserts that the worker is a chat of the session (its catalogue row says `origin: { kind: 'tool' }`) and still not an item.
- **This host has no hidden chat.** Nothing under `packages/sdk` or the three backends ever writes `interactivity: 'hidden'`; every held chat's summary is `'full'` and the read-only rows are workers. So VS Code's `ChatInteractivity.Hidden` clause has nothing to read, and is not written rather than written dead - which is why the code says the tool-origin question is the one being asked.

### Validation

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` all exit 0. The schema came back byte-identical (508 definitions from 506 exported types) and is not in the diff.
- vitest, with `--maxWorkers=2 --testTimeout=10000`, over the four packages in one run: 4314 passed in 240 files - `packages/sdk` 2816 in 144, `packages/server` 957 in 49, `packages/agent-claude` and `packages/agent-acp` 541 in 47.

### Left

- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by the suite again, and the restore command is still denied in this session, so it needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` from somebody who can run one. 33 lines, and none of them this task's: the fixture is catching up with work already on the branch - a plugin's config key renamed from `plugins../fixtures/plugin-secret/index.ts` to `plugins.secret`, and a `changes: { files, additions, deletions }` added to the session rows. The one `completions` frame in the file is untouched (one in `HEAD`, one in the worktree, on no changed line), and my own change adds nothing to it.
- Nothing is committed. Task 02 is untouched.
