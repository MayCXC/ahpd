---
title: A Windows folder has a path in the machine - deferred
date: 2026-10-20
---

Found by the full test run on a Windows VM with Docker Desktop, 2026-10-20, and outside what this plan changes.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| An ACP agent's terminal in a machine runs on the host, on every platform | A sandbox fix in agent-acp, not a Windows path | [acp/19](../../acp/19-a-terminal-in-a-machine-runs-in-the-machine/plan.md) |
| The tests the Windows job does not run fail on Windows: `server-cli-*`, `server-http`, `daemon-backend`, `nested-process`, `host-terminals`, `pty`, `conformance`, `changes-refresh`, `agent-acp-blocks`, `agent-pi-lazy` - 91 cases with the computer ones, most of them timeouts on a VM that took 58 minutes for the run, and among the rest `spawn sh ENOENT`, `spawnSync mkfifo ENOENT` and `systemctl --user ... spawn systemctl ENOENT` | The run was before the VM's scanner was told to skip the work folder, so the timeouts have to be run again before any is a finding | unplanned: a daemon/33 child plan for the process tests on Windows |
| The `ahpd` part is built from a checkout with `spawnSync('pnpm', ...)` and no shell (`packages/computer/src/parts.ts:331`), which on Windows finds no `pnpm.cmd` | Read, not run: only cofold and pi ask for that part | unplanned |
| `ahpc changes` shows a Windows file as `/C:/work/demo/hello.txt`, the URI's path with its leading slash | A client display, in the ahpc repository | unplanned, ahpc |
