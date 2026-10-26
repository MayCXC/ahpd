---
title: The plugin root loads first
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/plugins.ts#L326-L339](../../../../packages/server/src/plugins.ts#L326-L339) - `rootsOf` puts the configuration directory before `AHPD_PLUGIN_ROOT`"
  - "[code://packages/server/src/install.ts#L492-L505](../../../../packages/server/src/install.ts#L492-L505) - `pluginRoot`, where install and update write"
  - "[code://packages/computer/src/parts.ts#L648-L661](../../../../packages/computer/src/parts.ts#L648-L661) - the ahpd part installs into its plugin root, with an empty configuration directory"
  - git://8fa0a22c - the last commit that holds the problem `an-old-plugin-in-the-config-hides-the-one-in-the-plugin-root`
---

## Objective

When `AHPD_PLUGIN_ROOT` is set, a bare name resolves from the plugin root first. An update moves the copies in the plugin root, so an older copy in the configuration directory no longer hides them. The desk met this on 2026-10-26: 0.13 copies in `~/.config/ahpd` loaded before the 0.14 copies in the desk's root, and each was refused.

## Files

- `UPDATE: packages/server/src/plugins.ts:326-339` - `rootsOf` answers the plugin root, then the configuration directory.
- `UPDATE: packages/server/test/plugin-resolve.test.ts` - the plugin root wins over a copy in the configuration directory, and the refusal names the plugin root first.
- `UPDATE: .project/specs/plugin-loading.md:49` - the order a bare name is resolved in.
- `DELETE: .project/problems/an-old-plugin-in-the-config-hides-the-one-in-the-plugin-root.md` - the fix is this task.

## Steps

1. Change `rootsOf` to answer `AHPD_PLUGIN_ROOT/node_modules` before the configuration directory.
2. Correct the comment on `rootsOf`, which says only the ahpd part sets the variable.
3. Change the resolve test for two copies of one name to expect the plugin root's copy.
4. Change the refusal test to expect the plugin root first.
5. Correct the scenario in the spec.
6. Delete the problem file.
7. Run the gates, and set this task and the plan row to `implemented`.

## Validation

- `packages/server/test/plugin-resolve.test.ts` passes.
- The gates pass.

## Resume
