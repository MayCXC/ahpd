---
title: dev02's Docker runs a session from a profile
status: done
depends: [task-03-the-code-arrives-by-clone.md, task-04-sessions-there-run-nested.md, task-07-a-profile-may-clone-from-origin.md]
layer: "computer (by hand)"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the image with ahpd installed"
---

## Objective

A disposable profile with `server: "dev02"` runs a cofold session on dev02, and its commit comes back as a branch.

## Files

- None in the repository; the configuration used is written into this task's Resume.

## Steps

1. Build an image with ahpd and the agent plugins on dev02's Docker.
2. Write a profile with that image and `server`, and name `cofoldApiKey` from the vault.
3. Start a disposable session, commit, leave, and check the branch on this host.
4. Do step 3 once with `code: "bundle"` and once with `code: "clone"` on a public repository.
5. Restart this host mid-session and continue.
6. Remove the key from the vault and start a session again.
7. Check that the refusal names the key and that no other profile or session is affected.

## Validation

- By hand, as above.

## Resume

- **Done:** 2026-10-30, on dev02's Docker, from a host with the plugins `@ahpd/agent-cofold` and `@ahpd/computer`.
- **Configuration:** `ssh.machines.dev02` with `destination: "dev02"`, and two disposable profiles with `server: "dev02"`, `image: "node:22"` and `sessionFolder: true`. `far` takes the default `code`, and `farclone` sets `code: "clone"`. Both have the needs of the example in `docs/plugins/COMPUTERS.md`, with `cofoldApiKey` named as `host:openrouter` in the vault.
- **Bundle:** a cofold session on `disposable:far` ran in the machine with the vault's key and committed. The commit came back to the session's branch on this host. The host restarted mid-session, and the same machine made a second commit after the resume. That commit came back too. After the session left, the machine and its git volume were removed 300000 ms later.
- **Clone:** a session on `disposable:farclone` cloned `main` from `https://github.com/softov/ahpd.git` at `fb7d9f34`. Its commit came back to `main` on this host, and the machine was removed after the delay.
- **Refusal:** with `host:openrouter` taken out of the vault, a session on `disposable:far` was refused with `machine need cofoldApiKey names host:openrouter: the vault holds no host:openrouter`. No machine was made. A session on this host started and was disposed as before.
- **Found:** an OpenRouter model id has a slash of its own, so `COFOLD_MODEL` takes it as `default/deepseek/deepseek-chat`. The docs say so now.
- **Found:** the first create on a box builds its parts there, which takes longer than ahpc's 30 s request timeout. The session is made, but the client hears a timeout.
- **Found:** the npm install of the plugins part failed once on dev02 and passed on the next create, with nothing changed.
- **Found:** a `createSession` that fails is told to the client only. The daemon writes no line for it.
- **Found:** `max` counts every machine with the plugin's label, on every runtime, including machines this host does not use.
- **Found:** a disposal of a session that this process does not hold does not tell the port that the session left. A disposable machine made for it stays until removed by hand. This is on `main` too, and a plan of its own fixes it.
