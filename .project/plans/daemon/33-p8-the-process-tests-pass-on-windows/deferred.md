---
title: The process tests pass on Windows - deferred
date: 2026-10-20
---

Found while this plan ran on a Windows desktop, and outside the process tests it covers.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| `install-ps1.test.ts` sits at the twenty-second Windows limit on a desktop. Each run of the installer writes the real user `Path` with `[Environment]::SetEnvironmentVariable(..., 'User')`, which broadcasts a settings change to every window and takes seconds; a run takes about 10 s. Alone on this host, "upgrades an existing install without a second PATH entry" took 12.6 s and "removes the package and the PATH entry under -Uninstall" 19.5 s, and in a full run both timed out, with a `Timeout calling "onTaskUpdate"` from the worker the synchronous spawns held. The `check-windows` runner passes them. | Softov, 2026-10-20, chose "Defer it (Recommended)". The fix that holds is a way for the installer's tests to keep the user `Path` out of the registry, which is a change to `install.ps1` and a decision of its own; a longer limit for the two cases would go against [On Windows, a test has twenty seconds](../../../decisions/on-windows-a-test-has-twenty-seconds.md). | unplanned |
| On Windows, `os.homedir()` reads `USERPROFILE`, not `HOME`, so a test that moves `HOME` does not move the home there. `wire.test.ts` now pins both; other suites that set only `HOME` read the person's own folders on Windows. | Not seen to fail or leak beyond the wire capture; a sweep of the suites is its own task. | unplanned |
