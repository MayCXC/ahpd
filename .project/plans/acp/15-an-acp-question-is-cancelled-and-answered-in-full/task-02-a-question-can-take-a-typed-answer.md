---
title: A question can take a typed answer
status: blocked
depends: []
layer: "packages/agent-acp"
refs:
  - "[code://packages/agent-acp/src/mapping.ts#L591-L634](../../../../packages/agent-acp/src/mapping.ts#L591-L634) - `questionOf`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/codex/codexUserInputMapper.ts - a single-select question with `allowFreeformInput` from `isOther`
---

## Objective

A select question whose field has `_meta.codex.isOther` set to true has `allowFreeformInput: true`.
A person can then type an answer that is not one of the options.

## Files

- `UPDATE: packages/agent-acp/src/mapping.ts:591-634` - read the flag on a select question.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - the cases below.

## Steps

1. Find where Codex's ACP adapter puts `isOther` in an elicitation schema, and note the source in Resume.
2. Stop and ask Softov if the adapter does not send it.
3. Set `allowFreeformInput: true` on a single-select or multi-select question when the field's flag is true.
4. Leave every other question as it is.

## Validation

- A field with the flag gives a question with `allowFreeformInput: true`.
- A field without it gives no `allowFreeformInput`.
- `pnpm exec vitest run packages/agent-acp` passes.

## Resume

Implemented 2026-10-11, in `mapping.ts` and the fixture.

Step 1 is answered, and the plan's reference is not where the flag is. There is no codex-acp source checkout on this machine; what there is is the compiled global install, `/usr/local/lib/node_modules/@agentclientprotocol/codex-acp/dist/index.js` (version 1.13.1), an unminified esbuild bundle that keeps its module banners and names. Its `// src/CodexElicitationHandler.ts` module is the adapter, and `buildUserInputRequest` is where the elicitation is built. It writes the flag on the field's own schema - `_meta: { codex: { isOther: question.isOther, isSecret: question.isSecret } }` at lines 32052-32057, spread into `properties[question.id]` at 32060 and 32078 - and the request goes out as `methods.client.elicitation.create` with `mode: 'form'` at 32093-32108. So the adapter does send it, step 2 does not fire, and `_meta.codex.isOther` is read from the property schema, which is where `questionOf` already has it.

The plan's other reference, VS Code's `codexUserInputMapper.ts`, is a precedent rather than a source: it sets `allowFreeformInput` from `ToolRequestUserInputQuestion.isOther` (line 31), which is a typed field of Codex's own app-server `request_user_input`, not a `_meta` on an ACP schema. `/github/externals/vscode` contains no ACP code at all - a search of the whole checkout for `agentclientprotocol` and for whole-word `ACP` returns nothing - so no VS Code file reads this flag. The translation from `_meta.codex.isOther` to `allowFreeformInput` exists only here.

`questionOf` now reads it in the branch that already knows the field has choices, and only there: `bag(bag(schema._meta).codex).isOther === true` adds `allowFreeformInput: true`, on the single-select and the multi-select alike, because the schema says the same thing about both. The strict equality is deliberate - the adapter writes `question.isOther` whether or not it is set, and `JSON.stringify` drops an undefined, so a field without the mark has no key and a field with it has `true`. Every other question is untouched, which is step 4: a text, number, boolean or unknown field never reaches this branch.

The fixture gained one script, `elicitother`, a form of three choice fields - `mode` and `tags` marked on their `_meta`, `size` not - so one case proves the mark and its absence side by side. The case answers the form as well, so what is asserted is that the mark changed the question and nothing else about the answer path.

Files changed, uncommitted:

- `UPDATE: packages/agent-acp/src/mapping.ts` - the `freeform` read in `questionOf`'s choices branch.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - the `elicitother` script and its header bullet.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - `asks a choice the server marked isOther as one an answer of one's own may be given to`.

`pnpm -s typecheck` and `pnpm -s boundary` pass. The suite passes 243 of 243 with the `queue.ts` repair recorded in task 01, and 71 of 243 fail without it; that repair is not part of this task either, and was reverted.

**Open question - where a typed answer actually goes, which this task's Files line does not reach.** Reading the adapter's answer path (`convertUserInputResponse`, lines 32140-32168 of the same bundle) shows that `_meta.codex.isOther` is not the whole of how codex-acp takes a free answer. When a Codex question is `isOther` with options, `buildUserInputRequest` does two more things: it appends an option `{ const: 'None of the above', title: 'None of the above', description: 'Provide a different answer in the note field.' }` to the field's `oneOf` (32069-32073), and it adds a **second property** to the schema, `<question.id>_note`, titled "Additional answer or note", carrying `_meta: { codex: { questionId, role: 'user_note', isSecret } }` (32079-32090). The answer is read back as `content[question.id]` for the pick plus `content['<id>_note']` for the typed words, which are forwarded prefixed `user_note: ` (32153-32158). So codex-acp's own design is that the free text travels in a sibling form field - and this bridge already draws that sibling as an ordinary text question, because nothing tells it what `role: 'user_note'` means.

That leaves two things undecided, and neither is in this task's Files or Steps. First, whether the free-form box this task now offers on the select should also be honoured on the way back: a person who types into it sends `ChatInputSelectedAnswerValue.freeformValues`, and `answerOf` at `packages/agent-acp/src/mapping.ts:678-683` reads `value.value` and drops it, so the words would not reach the server as `content[<id>]`. Second, whether the adapter's `<id>_note` field should stay a question of its own, be hidden and folded into the select's own free-form answer, or be left as it is. Both are about the answer path rather than the question, which is why they are written here rather than implemented.

One caveat on the evidence: the `_meta` shape above is read from the installed codex-acp 1.13.1, and the registry's `latest` is 2.2.2, so a person running the published one is running a build whose elicitation code this task did not read. The `_meta.codex.isOther` key and the property-level placement are the plan's own locked decision and are implemented as written; a bump to 2.2.2 should be checked against the same two line ranges.

The review held this task back from main: a typed answer is offered but not sent. The work is on branch `held/acp15-t02`.
