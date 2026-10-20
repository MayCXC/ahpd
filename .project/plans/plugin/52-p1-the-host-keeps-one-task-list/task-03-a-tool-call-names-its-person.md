---
title: A tool call names its person
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/host.ts#L768-L793](../../../../packages/sdk/src/types/host.ts#L768-L793) - `ToolCall`, which names the session and the chat but not the person"
  - "[code://packages/sdk/src/host/tooling.ts#L1370-L1376](../../../../packages/sdk/src/host/tooling.ts#L1370-L1376) - `toolContext`, where a call's context is built"
  - "[code://packages/sdk/src/host/spawn.ts#L297-L302](../../../../packages/sdk/src/host/spawn.ts#L297-L302) - the host keeps the sender of each turn"
---

## Objective

A host tool can read the person behind its call.
The tasks plugin then writes `by` on a stamp from the host, never from the model.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:768-793` - add `person()` to `ToolCall`, with its comment.
- `UPDATE: packages/sdk/src/host/tooling.ts:1370-1376` - answer `person()` from the sender of the running turn.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - a call in a turn names the sender of the turn.

## Steps

1. Add `person(): string | undefined` to `ToolCall`, read when called, like `turn()`.
2. Answer it in `toolContext` from the sender the host keeps for the running turn of the chat.
3. Answer the session owner, else `host`, for a call that no person is behind.
4. Add the method to every test double of `ToolCall` that the type check finds.

## Validation

- `packages/sdk/test/host-tools.test.ts`: a turn sent by `ana` gives `person()` the answer `ana`; a call with no turn gives the chosen fallback.
- `pnpm typecheck` passes.

## Resume

- **Done so far:** every step. `ToolCall.person()` answers the person behind the call. It is the sender of the running turn, as the principal this host knows (`ana`). It falls back to the sender's own owner text where this host knows no principal, then the session's owner (`user:ana`), then `host`. A root turn and a session owned by root answer `host`, because the host is not a person. No existing test double needed a change: they are casts, and the type check passes. `host-tools.test.ts` has a case for all three answers.
- **Next action:** task 04.
- **Open questions:** none.
- **Watch out for:** the lookup is `activeTurnOf(chatUri)` then `senderOf(turn)`. Reading the chat's state is what makes a turn count even though this host did not start it. The `personOf` helper beside the grant checks reads a `Principal` and is a different question; the new helper is `personOfCall`.
