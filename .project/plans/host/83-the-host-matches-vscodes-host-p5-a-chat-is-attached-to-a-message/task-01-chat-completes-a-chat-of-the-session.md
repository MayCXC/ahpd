---
title: "`#chat:` completes a chat of the session"
status: todo
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
- `UPDATE: docs/AHP.md` - `#chat:` in the `completions` row.
- `UPDATE: docs/CHATS.md` - `#chat:` in the chat commands table.

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
12. Write `#chat:` in the `completions` row of `docs/AHP.md` and in the table of `docs/CHATS.md`.

## Validation

- `host-files.test.ts`: `#chat:` in a session with three chats lists the two other chats, and not the current one.
- `host-files.test.ts`: `#chat:rev` lists only the chat whose title holds `rev`.
- `host-files.test.ts`: a worker chat that `start.subagent` makes is not listed.
- `host-files.test.ts`: an item gets the `endTurn` of the last completed turn, and a chat with no turn gets none.
- `host-files.test.ts`: `#src/` still lists files.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume
