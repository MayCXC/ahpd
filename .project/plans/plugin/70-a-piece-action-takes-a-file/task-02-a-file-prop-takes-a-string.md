---
title: A FILE prop takes a URL, a data URI or a name
status: done
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

- **Done so far:** `propOf` offers a `FILE` prop as a string, with a description that names the three forms. The prop's own description comes first when it has one. `inputOf` keeps a required `FILE` prop required, and `adapterOf` keeps every action. The six actions the plugin used to report are offered, and no problem line is written for them. `fetch.ts` reads only `https:` and resolves the name. It refuses the call when any address is loopback, link-local, private or unspecified, in IPv4 or IPv6. An IPv4 address written as IPv6 is read as the IPv4 address it holds. It connects to the address that was checked, and follows each redirect by hand with the same check, up to five. `files.ts` turns a value into the `ApFile` a piece reads. An `https:` URL is read through the guarded fetch. A `data:` URI is decoded, and any other value is resolved inside the session's folder by `realpath`. A path that leaves the folder, a link that leaves it, or a name the folder does not hold is refused. The child replaces each `FILE` value with its `ApFile` before the action runs, and `wire.ts` carries the folder with the run request. A call with no folder reads a URL or a data URI, and refuses a name. Each answer is read to 32 MB, from `content-length` or as the bytes arrive. A request that takes over 30 s is ended, and its socket with it. A refusal names a host, and never a URL's path or query. The shared, benchmarking, multicast and reserved ranges are refused too, and so is a NAT64 address whose IPv4 address is refused.
- **Next action:** [task-03-a-written-file-is-an-attachment.md](task-03-a-written-file-is-an-attachment.md).
- **Files:** `packages/activepieces/src/mapping.ts`, `packages/activepieces/src/fetch.ts`, `packages/activepieces/src/files.ts`, `packages/activepieces/src/child.ts`, `packages/activepieces/src/wire.ts`, `packages/activepieces/tsconfig.json`, `packages/activepieces/test/fetch.test.ts`, `packages/activepieces/test/files.test.ts`, `packages/activepieces/test/mapping.test.ts`, `packages/activepieces/test/pieces.test.ts`, `packages/activepieces/test/child.test.ts`, `packages/activepieces/test/run.test.ts`, `packages/activepieces/test/fixtures/piece-run.mjs`, `docs/plugins/activepieces.md`, this task file, the plan and the index. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** `plugin.ts` is unchanged. Its run request already spreads the call, so `files` reaches the child with no line added. The `run` request was widened in `wire.ts` instead of at the call site. `packages/activepieces/tsconfig.json` gains `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`. The child is run from source by Node in development and in the tests. Node does not remap a `.js` specifier to a `.ts` file. The build rewrites `./files.ts` and `./fetch.ts` back to `.js`. `pieces.test.ts` is not in the plan's list but had to change. The six actions are offered now, so the counts rise and the problem line is gone. `child.test.ts` and `run.test.ts` are not in this task's list either. The first carries the cases for a value turned into a file. The second runs a write and a read through the adapter, which is what proves the folder reaches the child. The by-hand check in a daemon with a pasted image is **not run**. It needs a test daemon and a real piece, and the brief for this session rules the network out. A later review added the 32 MB size, the 30 s timeout, the host-only refusals and the extra refused ranges. Each has a case in `fetch.test.ts` or `files.test.ts`, and the token case there is what proves no refusal repeats a path or a query.
- **Watch out for:** the refusal messages name the host a URL was about, or an attachment name the caller gave. They never hold the folder, a URL's path or query, or the bytes. `fetch.test.ts` and `files.test.ts` assert that, and so does `child.test.ts`. The fetch's address tests use a lookup and a requester of their own, so no name is resolved and no socket opens. `groupsOf` reads the IPv4 tail of an address as two groups. That is what lets `::ffff:127.0.0.1` be refused as the loopback address it is, rather than as unreadable.
