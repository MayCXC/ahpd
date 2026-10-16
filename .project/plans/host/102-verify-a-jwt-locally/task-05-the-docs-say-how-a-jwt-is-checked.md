---
title: The docs say how a JWT is checked
status: todo
depends: [task-03-the-tokens-exp-ends-the-sign-in.md, task-04-the-daemon-takes-the-setting.md]
layer: docs
refs:
  - "[code://docs/sdk/AUTHENTICATION.md#L80-L124](../../../../docs/sdk/AUTHENTICATION.md#L80-L124) - \"An issuer\" and \"An issuer per person\""
  - "[code://packages/sdk/src/issuers.ts#L1-L16](../../../../packages/sdk/src/issuers.ts#L1-L16) - the header that says JWTs are not checked"
---

## Objective

The docs say when the host checks a JWT itself, what it checks, and what it does not see.

## Files

- `UPDATE: docs/sdk/AUTHENTICATION.md:80-124` - the setting, the checks, and what `exp` does.
- `UPDATE: docs/server/USERS.md` - the setting beside `--issuer`.
- `UPDATE: packages/sdk/src/issuers.ts:1-16` - the header names both checks.

## Steps

1. Describe the setting and its default in `AUTHENTICATION.md`.
2. List what the host checks: the signature, `iss`, `aud`, `exp` and `nbf`.
3. Say that a token the provider revoked works until `exp`.
4. Say that GitHub tokens go to `userinfo`.
5. Add the setting to `docs/server/USERS.md`.
6. Update the header comment of `issuers.ts`.
7. Set this task and the plan row to `implemented`.

## Validation

- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/sdk/AUTHENTICATION.md` prints nothing new.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** keep each file's own style.
