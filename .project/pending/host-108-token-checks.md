---
title: Check a person's token from another computer and the token docs
plans:
  - plans/host/108-a-person-mints-tokens-of-their-own/plan.md
---

# Check a person's token from another computer and the token docs

host/108 is merged in PR 34, and its tests pass. These checks need a second computer and a daemon with a users file, after a restart onto this build.

## A proxy:write token from another computer

1. Turn on `httpApi` and `modelProxy` on the daemon, and make the API port reachable from the second computer.
2. Run `ahpd token mint --user ana --grant proxy:write --label laptop` on the daemon's computer.
3. On the second computer, call `GET http://<host>:<port>/v1/models` with the secret as `Authorization: Bearer`.
4. Check that the answer lists the model names.
5. Send one `POST /v1/chat/completions` or `POST /v1/messages` with a model from that list.
6. Check that the call gets an answer from the provider.
7. Call `GET http://<host>:<port>/api/status` with the same secret.
8. Check that the API refuses the call.
9. Run `ahpd token rm <token id> --user ana` on the daemon's computer.
10. Call `/v1/models` again from the second computer, and check that the daemon refuses it.

## The commands in the docs

1. Open `docs/server/USERS.md`, the section "Tokens of their own".
2. Run each command there as written, against a daemon with a users file.
3. Check that each output matches the text of the docs.
4. Run `ahpd token list` and check that it shows the id, the label, the grants, the date and the expiry, with no secret.
5. Do the same for the example in `docs/server/PROXY.md`, the section "Who may call".

## Reply

Write "pass", or what you saw. A pass ticks the matching line in the plan.
