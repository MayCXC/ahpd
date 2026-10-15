---
title: The install script uninstalls
created: 2026-10-15
---

The install script of [daemon/27](../plans/daemon/27-ahpd-installs-with-one-line/plan.md) could take `--uninstall`.
It would remove `@ahpd/server` and the PATH line that it wrote.
`~/.config/ahpd` would stay, unless `--purge` is also given.
Until then, INSTALL.md names the three steps.
