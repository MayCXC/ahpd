---
title: The docs say how a JWT is checked
status: implemented
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

- **Done so far:** `AUTHENTICATION.md` has a `### Checking a token here` section under "An issuer": the setting and its default, the three values, what `jwt` checks (the algorithm, the signature, `typ`, `iss`, `aud`, `exp` and `nbf`, the subject), what `exp` does to a live sign-in, what a revocation does not do, and why GitHub is `userinfo` or `auto` and never `jwt`. The configuration key list gained `issuerVerify` beside `issuer`, and `USERS.md` gained the setting beside `--issuer` in "Sign in with GitHub or OpenID Connect". `issuers.ts`'s header now names both checks instead of saying neither verifies a JWT.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the prose linter's 25-word rule is applied to the sentences added, not to the file, which reports its own long sentences either way. The key list in `AUTHENTICATION.md` is outside this task's line range and was added because a setting documented without its key is a setting nobody finds.
