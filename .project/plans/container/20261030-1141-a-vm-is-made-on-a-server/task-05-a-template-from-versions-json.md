---
title: A VM template is built from versions.json and rebuilt when it moves
status: doing
depends: [task-03-libvirt-makes-a-machine.md]
layer: "computer"
refs:
  - "[code://.project/plans/container/05-p3-parts-are-built-from-one-versions-file/plan.md](../05-p3-parts-are-built-from-one-versions-file/plan.md) - `versions.json`, `hashOf` and `ahpd-agents:<hash>`"
---

## Objective

The libvirt runtime makes `ahpd-template-<hash>` the first time a VM is asked for at a hash it has no template for, with every part at `/opt/ahpd`, and a later VM backs onto it.

## Files

- `CREATE: packages/computer/src/template.ts` - `ensureTemplate(runtime, hash)`, the one place a template is made, so the way it gets the parts can change.
- `UPDATE: packages/computer/src/libvirt.ts` - `run` asks for the template first.

## Steps

1. Boot the cloud image once with cloud-init (this host's key, nothing else), copy `/opt/ahpd` out of `ahpd-agents:<hash>` with `docker create` and `docker cp`, copy it into the VM over ssh, shut the VM down, and keep its disk as `ahpd-template-<hash>`; the helper VM is removed whether this succeeds or not.
2. Two creates at once build the template once; the second waits.
3. A template a VM still backs onto is never removed; an old one is listed in the log, not deleted.

## Validation

- With the fakes, a first create builds a template and a second does not; a changed hash builds a second.
- By hand: a VM from the template runs `/opt/ahpd/ahpd/bin/ahpd --version` at this host's version, the path task 03's `hostCommand` answers.

## Resume

- Code and tests done on 2026-10-30. The check by hand on dev02 waits on task 01.
- `template.ts` holds the recipe. `templateMaker` makes one template per server and hash, and a second ask waits for the first build.
- The recipe: boot a helper VM, copy the parts in, run `cloud-init clean --logs --machine-id`, shut the helper down, and keep its disk.
- libvirt gives the steps. The helper disk backs onto `libvirt.image`, and the helper domain is undefined without its storage.
- `partsFromDocker` sends `docker cp <id>:/opt/ahpd -` straight to `sudo tar -x -C /opt` in the VM. Nothing is written on this host.
- The helper installs the joined image's packages: `ca-certificates`, `git` and `ripgrep`.
- `libvirt.template` still names an operator's own template, which is used as it is and never built.
- A failed build removes the helper and its disk. An older template is named in the log and kept.
- Not yet known: whether a command in a VM finds a part's launcher by its bare name. The joined image puts each part's `bin` on `PATH`, and the template does not. The run on dev02 checks it.

