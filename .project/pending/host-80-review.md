---
title: Review automations as Markdown files
plans:
  - plans/host/80-an-automation-is-a-markdown-file/plan.md
---

# Review automations as Markdown files

I ran the three checks on a second daemon on 2026-10-13. One passes, one fails because of an older bug, and one needs you for the ahpc form.

## Results

1. **Pass.** I changed the message in an automation's `.md` file. The next run sent the new text, with no restart.
2. **Fail.** A copy of an automation shows as a second automation, but it never fires while the original is on. Two automations with the same schedule run only the first. The cause is in the scheduler and is older than host/80, see [host/86](../plans/host/86-every-automation-due-at-once-fires/plan.md).
3. **Pass over the protocol.** `createAutomation` with a UUID id keeps the id, and a file with that name appears. I did not use the ahpc form.

## Also found in ahpc 0.8.0

- `ahpc automation`, `ahpc logs` and `ahpc auth` are missing from `COMMANDS` in ahpc's `src/flags.ts`, so their flags are read wrong.
- `ahpc automation show` and `ahpc automation runs` give wrong answers because of this.

## Check by hand

1. In ahpc, make an automation with the form.
2. Its file appears in `<configDir>/automations/`, named with its UUID.

## Reply

- Write "pass" or what you saw for the ahpc form.
- Tell me if host/80 closes now. The scheduler bug is host/86, because it is not in the file store.
