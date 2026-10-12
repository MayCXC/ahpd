---
title: Review who may delete a session
plans:
  - plans/host/52-deleting-a-session-deletes-the-backends-copy/task-05-only-the-owner-may-delete-a-session.md
---

# Review who may delete a session

Task 05 is merged, and tasks 01 to 04 were reviewed on 2026-10-10. A delete removes the backend's transcript and cannot be undone. Only the session's owner, or a caller who holds `session:*`, may delete a session.

## Read

- `mayDispose` in `packages/sdk/src/host/lifecycle.ts`.
- `packages/sdk/test/session-delete-owner.test.ts`.

Added in review: the `delete_session` tool acts as the owner of the session it runs in. This is so even when the owner has not signed in since the daemon started.

## Check by hand

You need two people on one daemon: an admin, and a member with `session:write`.

1. As the member, delete a session the admin owns. The refusal says "Only the session's owner can delete it.", and the session is still listed.
2. As the member, delete your own session. It goes.
3. As the admin, delete the member's session. It goes.

## Reply

Write "approved", or the findings. Approval sets task 05 to `done`, and every task of host/52 is then `done`.
