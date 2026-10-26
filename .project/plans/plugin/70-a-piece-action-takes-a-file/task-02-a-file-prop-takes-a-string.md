---
title: A FILE prop takes a URL, a data URI or a name
status: todo
depends: [task-01-a-call-carries-the-attachments.md]
layer: "activepieces"
refs:
  - "[code://packages/activepieces/src/mapping.ts#L60](../../../../packages/activepieces/src/mapping.ts#L60) - `propOf`, which drops a `FILE` prop"
  - "[code://packages/activepieces/src/mapping.ts#L103](../../../../packages/activepieces/src/mapping.ts#L103) - `inputOf`, which drops an action with a required `FILE` prop"
  - "[code://packages/activepieces/src/mapping.ts#L207](../../../../packages/activepieces/src/mapping.ts#L207) - the problem line this task removes"
  - "[code://packages/activepieces/src/mapping.ts#L168](../../../../packages/activepieces/src/mapping.ts#L168) - `RunCallArgs`, which gains `files`"
  - "[code://packages/activepieces/src/plugin.ts#L297](../../../../packages/activepieces/src/plugin.ts#L297) - the `run` request to the child"
  - "[code://packages/activepieces/src/child.ts#L265-L289](../../../../packages/activepieces/src/child.ts#L265-L289) - where the child builds the context of one call"
  - npm://@activepieces/pieces-framework@0.32.0 - `ApFile(filename, data, extension)`, what a piece reads from a `FILE` prop
---

## Objective

An action with a `FILE` prop is offered, and its input schema says the prop is a string.
Before the action runs, the child turns each `FILE` value into an `ApFile`.
The value is an `https:` URL, a `data:` URI or the name of a session attachment.

## Files

- `UPDATE: packages/activepieces/src/mapping.ts:60` - offer a `FILE` prop as a string, with a description that names the three forms.
- `UPDATE: packages/activepieces/src/mapping.ts:103` - keep a required `FILE` prop required, and keep the action.
- `UPDATE: packages/activepieces/src/mapping.ts:207` - remove the problem line for an action that needs a file.
- `UPDATE: packages/activepieces/src/mapping.ts:168` - add `files?: string` to `RunCallArgs`.
- `UPDATE: packages/activepieces/src/plugin.ts:297` - pass `call.files` to the child in the `run` request.
- `CREATE: packages/activepieces/src/fetch.ts` - a fetch that takes only `https:` and refuses loopback, link-local and private addresses.
- `CREATE: packages/activepieces/src/files.ts` - turn one `FILE` value into an `ApFile`.
- `UPDATE: packages/activepieces/src/child.ts:265-289` - turn each `FILE` prop of the input into an `ApFile` before the action runs.
- `CREATE: packages/activepieces/test/fetch.test.ts` - cases for each refused address range, a refused scheme and a redirect to a private address.
- `CREATE: packages/activepieces/test/files.test.ts` - cases for each form, a path outside the folder, a link that leaves it, and a call with no folder.
- `UPDATE: packages/activepieces/test/mapping.test.ts` - cases for an action with a required and an optional `FILE` prop.

## Steps

1. In `fetch.ts`, refuse any URL whose scheme is not `https:`.
2. Look up the host name, and refuse the request when any address is loopback, link-local, private or unspecified.
3. Cover IPv4 and IPv6, and an IPv4 address written as IPv6.
4. Connect to the checked address, so a second lookup cannot change it.
5. Follow each redirect by hand, and check its URL and address again.
6. In `files.ts`, decode a `data:` URI, and take its extension from the media type.
7. Fetch an `https:` URL with `fetch.ts`, and take the file name from the URL path.
8. Resolve any other value as a name inside the folder with `realpath`, and refuse it when it leaves the folder.
9. Refuse a name when the call has no folder.
10. In the child, read the action's `FILE` props, and replace each value with its `ApFile` before `run`.
11. Change `propOf` and `inputOf` to offer the prop, and remove the problem line.
12. Pass `files` from the plugin to the child, and add the test cases.

## Validation

- `pnpm exec vitest run packages/activepieces` passes, with the new cases.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.
- By hand: in a test daemon, an agent sends a pasted image through an action that takes a file.

## Resume
