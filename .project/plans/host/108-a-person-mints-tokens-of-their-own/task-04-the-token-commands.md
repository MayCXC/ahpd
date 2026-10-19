---
title: The token commands
status: todo
depends: [task-02-a-token-signs-in-narrowed.md, task-03-the-tokens-per-person-key.md]
layer: server
refs:
  - "[code://packages/server/src/commands/user.ts#L218-L247](../../../../packages/server/src/commands/user.ts#L218-L247) - `user token`, the mint and its shown-once warning"
  - "[code://packages/server/src/commands/user.ts#L303-L334](../../../../packages/server/src/commands/user.ts#L303-L334) - `user primary`, the pattern of a command that is free for one's own record and needs `user:write` for another"
  - "[code://packages/server/src/commands/user.ts#L34-L41](../../../../packages/server/src/commands/user.ts#L34-L41) - `bounded`, which refuses a caller who lacks a grant of the target"
  - "[code://packages/server/src/commands/user.ts#L54-L81](../../../../packages/server/src/commands/user.ts#L54-L81) - `people`, the directory for the daemon and for the terminal"
  - "[code://packages/server/src/commands/vault.ts#L138-L249](../../../../packages/server/src/commands/vault.ts#L138-L249) - `declareVault`, a module of commands with `scopes: []` that checks in the body"
  - "[code://packages/server/src/commands/served.ts#L100](../../../../packages/server/src/commands/served.ts#L100) - where the daemon declares the user commands"
  - "[code://packages/server/src/commands/registry.ts#L68](../../../../packages/server/src/commands/registry.ts#L68) - where the terminal declares the user commands"
---

## Objective

`ahpd token mint`, `ahpd token list` and `ahpd token rm` let a signed-in person manage their own tokens, at the terminal and over the HTTP API.
With `--user <id>`, an operator who holds `user:write` does the same for another person, bounded as `user token` is.

## Files

- `CREATE: packages/server/src/commands/token.ts` - `declareToken`, with the three commands and the check of whose tokens they are.
- `UPDATE: packages/server/src/commands/served.ts:100` - declare the token commands after the user commands.
- `UPDATE: packages/server/src/commands/registry.ts:68` - declare the token commands after the user commands.
- `CREATE: packages/server/test/token-command.test.ts` - the tests of the three commands at the terminal and over HTTP.

## Steps

1. Write the tests first, as `vault-command.test.ts` does.
2. Get the directory with `people(context, served)` from `user.ts`.
3. Refuse with `stop` when the directory has no `mintToken`, and say that this host keeps no tokens.
4. Give each command `scopes: []` and a comment that says the body decides, as `user primary` does.
5. Find whose tokens a command is about: `--user` when given, else the caller's own id.
6. At the terminal and for the deployment token, refuse a command without `--user`, except `token list` at the terminal.
7. Refuse a caller whose principal has `token` set, with "A minted token cannot manage tokens; sign in as yourself."
8. For another person, call `bounded(context, ['user:write'])`, then `bounded` with that person's grants.
9. Add `token mint`, with `--label`, `--grant` once per grant, `--expires` and `--url`.
10. Pass the label, the grants and the expiry to `mintToken`, and turn its refusals into `stop` with the same sentence.
11. Print the secret alone on stdout, or the URL from `personalUrl` with `--url`.
12. Print on stderr: "Shown once. This host keeps only its hash. Revoke it with: ahpd token rm <id>".
13. Add `token list`, which prints the id, the label, the grants, the creation date and the expiry of each token.
14. Never print a hash or a secret in `token list`, in text or in JSON.
15. Write "every grant of <id>" for a token without `grants`.
16. Add `token rm <token id>`, which finds the token's person in `tokens()` and checks that person as in step 8.
17. Answer `conflict` for an unknown token id, and for a token of another person without `user:write`.
18. Set the effects: `add` for mint, `read` for list and `remove` for rm, with `resource: { kind: 'token', key: 'id' }` on rm.
19. Set this task and the plan's Tasks table to `implemented`.

## Validation

- `token-command.test.ts`: a `member` mints a token over HTTP with their own token, and needs no grant for it.
- `token-command.test.ts`: the command refuses `--grant user:write` from a `member`, and names the grant.
- `token-command.test.ts`: the secret is on stdout once, and `token list` shows its id and label but no hash.
- `token-command.test.ts`: `token mint`, `token list` and `token rm` each refuse a minted token.
- `token-command.test.ts`: `token rm` of the person's own token makes the next request with it fail `401`.
- `token-command.test.ts`: the commands refuse a `member` who names `--user bob` or a token of bob.
- `token-command.test.ts`: an `admin` lists and removes the tokens of a `member` with `--user`.
- `token-command.test.ts`: `token mint --user` refuses a caller who lacks a grant of the person, such as `proxy:write`.
- `token-command.test.ts`: at the terminal, `token mint --user ana` works, and `token mint` without `--user` stops.
- `token-command.test.ts`: with `tokensPerPerson` 1 in the configuration file, the terminal refuses the second mint.
- `server-commands.test.ts` still passes, so the served manifest is valid with the new commands.
- `pnpm exec vitest run packages/server/test/token-command.test.ts packages/server/test/server-commands.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
