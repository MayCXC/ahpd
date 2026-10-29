---
title: A login's calls are kept on its connector
status: pending
depends: []
layer: sdk, agent-claude
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L913](../../../../packages/sdk/src/connectors/channel.ts#L913) - the check command"
  - "[code://packages/agent-claude/src/session/logins.ts#L183-L197](../../../../packages/agent-claude/src/session/logins.ts#L183-L197) - `refused`"
  - "[code://packages/agent-claude/src/plugin.ts#L159-L189](../../../../packages/agent-claude/src/plugin.ts#L159-L189) - the plugin's connection"
---

## Objective

The connectors channel keeps a call that the plugin of a connector's adapter notes.
The Claude engine notes each call of a login: a refusal with its words and its reset, and a turn that went through.

## Files

- `UPDATE: packages/sdk/src/connectors/channel.ts` - the `x-ahpd/connectors/note` command.
- `UPDATE: packages/agent-claude/src/logins.ts` - `OpenLogins.onCall` and `called`.
- `UPDATE: packages/agent-claude/src/session/logins.ts` - `refused` notes the failure, and `answered` notes a turn that went through.
- `UPDATE: packages/agent-claude/src/session/query.ts` - a result that went through calls `answered`.
- `UPDATE: packages/agent-claude/src/plugin.ts` - the plugin sends each note on its own connection.
- `UPDATE: docs/plugins/PLUGINS.md` - the command, and the calls a health keeps.
- `UPDATE: packages/sdk/test/connectors-channel.test.ts`, `packages/agent-claude/test/agent-claude-logins.test.ts` - the cases.

## Steps

1. Add a case that notes a call as the plugin of the adapter, and as a person.
2. Add a case that runs a turn, a refusal with a reset, and one more turn.
3. Make the plugin's case expect a note on its connection after each check, and after a turn that went through.
4. Run the cases, and see them fail.
5. Add the note command, the engine's notes, and the plugin's requests.
6. Run the cases again, and see them pass.

## Validation

- Run `connectors-channel.test.ts` and `agent-claude-logins.test.ts` before step 5, and see the new cases fail.
- Run them after step 5, and see every case pass.
- The type check passes.

## Resume

Not started.
