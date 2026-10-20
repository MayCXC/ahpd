---
title: Review automations as Markdown files
plans:
  - plans/host/80-an-automation-is-a-markdown-file/plan.md
---

# Review automations as Markdown files

I ran the three checks on a second daemon on 2026-10-13. Two pass, and one needs you for the ahpc form.

## Results

1. **Pass.** I changed the message in an automation's `.md` file. The next run sent the new text, with no restart.
2. **Pass.** A copy of an automation fires beside the original. On 2026-10-13 only the first ran. [host/86](../plans/host/86-every-automation-due-at-once-fires/plan.md) fixed the scheduler, and on 2026-10-20 two automations due at one minute both ran.
3. **Pass over the protocol.** `createAutomation` with a UUID id keeps the id, and a file with that name appears. I did not use the ahpc form.

## Also found in ahpc 0.8.0

- `ahpc automation`, `ahpc logs` and `ahpc auth` are missing from `COMMANDS` in ahpc's `src/flags.ts`, so their flags are read wrong.
- `ahpc automation show` and `ahpc automation runs` give wrong answers because of this.

## Check by hand

1. In ahpc, make an automation with the form.
2. Its file appears in `<configDir>/automations/`, named with its UUID.

## Reply

- Write "pass" or what you saw for the ahpc form.
- Tell me if host/80 closes now.
