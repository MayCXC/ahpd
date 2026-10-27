---
title: A split character arrives whole
domain: host
status: built
priority: medium
created: 2026-10-27
revalidated: 2026-10-27
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L470-L471](../../../../packages/sdk/src/machines/terminals.ts#L470-L471) - the pipes of a shell, where each chunk is decoded on its own"
  - https://nodejs.org/api/stream.html#readablesetencodingencoding - "The `Readable` stream will properly handle multi-byte characters delivered through the stream that would otherwise become improperly decoded if simply pulled from the stream as `Buffer` objects"
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L109-L111 - `node-pty` reads the stream of its terminal with `setEncoding('utf8')`
---

## Goal

A shell on pipes writes bytes, and the bytes of one UTF-8 character can arrive in two reads.
The store decodes each read on its own, so the client receives two replacement characters for one character.
With this plan, each pipe decodes its reads as one stream, and the character arrives whole.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "toString\('utf8'\)" packages/sdk/src/machines` - the two pipe readers of the store.
- A run of the store, with a command that writes the two bytes of `é` in two writes, gives the chunks `"�"` and `"�\n"`.

### Runtime path

```
child stdout or stderr -> data -> said -> terminal/data -> the client
```

### Gaps

- Each chunk is decoded on its own, so a character that two reads split becomes two replacement characters.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each pipe decodes with `setEncoding('utf8')`, and its data handler takes the string that the stream made. | https://nodejs.org/api/stream.html#readablesetencodingencoding, and `node-pty`, which reads its terminal the same way (https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L109-L111) | 01 |

## Proposed architecture

- **Data flow** - each pipe gives the store strings that its own decoder made, and the store says them as before.
- **Event flow** - no change.
- **State flow** - no change.
- **Layer responsibilities** - `@ahpd/sdk`: the terminal store asks the stream for strings.
- **Source-of-truth files** - [`code://packages/sdk/src/machines/terminals.ts`](../../../../packages/sdk/src/machines/terminals.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Each pipe decodes as a stream](task-01-each-pipe-decodes-as-a-stream.md) | done | - |

## Risks and tradeoffs

- A read that holds only the start of a character says nothing until the next read - this is what the decoder is for.

## Resume state

- **Done so far:** planned and built 2026-10-27; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the case must split the character between two writes, or the old code passes it too.

## Final verification checklist

- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- [x] The new case fails on the store before this change.
- [x] `plans/index.md` updated.
