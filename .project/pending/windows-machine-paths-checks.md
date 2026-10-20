---
title: Check machine paths on Windows with Docker Desktop
plans:
  - plans/daemon/33-p7-a-windows-folder-has-a-path-in-the-machine/plan.md
---

# Check machine paths on Windows with Docker Desktop

daemon/33 p7 is built and its tests pass on Windows against a stand-in Docker.
This run uses the real Docker Desktop.
It answers the plan's open question and is task 06 step 4.

## Set up

1. Install Docker Desktop on Windows, and start it.
2. Build ahpd from the branch that holds p7, and start the daemon.
3. Make a folder with a git repository in it, for example `C:\work\demo`.

## How Docker Desktop names the folder

1. In VS Code, open a session in the folder, in a disposable machine.
2. Send one message, so the machine is made.
3. In a terminal, run `docker ps`, and find the machine.
4. Run `docker inspect <machine>`.
5. Find the entry under `Mounts` whose `Destination` is `/c/work/demo`.
6. Write down its `Source` exactly as it shows.

## A turn runs in the folder

1. In the session, ask the agent to run `pwd`.
2. Make sure that it prints `/c/work/demo`.
3. Ask the agent to make a file `hello.txt` in the folder.
4. Make sure that `C:\work\demo\hello.txt` is on Windows.
5. Make sure that the session's changes show `hello.txt`.

## Reply

Write "pass" for each section, or what you saw.
For the first section, write the `Source` you saw.

## Results on Windows, 2026-10-20

Run on a Windows 10 Pro 22H2 VM with Docker Desktop 29.9.1 (WSL 2), Git for Windows 2.56 with its default `core.autocrlf=true`, and Node 22.23.3, from a build of the branch that holds daemon/33 p7 tasks 07 and 08 on `main` at `8826a4be`.
The session was driven with `ahpc` 0.9.0 instead of VS Code, in a disposable machine of a `node:22` profile with `sessionFolder`, with the scripted ACP agent of `packages/agent-acp/test/fixtures/acp-server.mjs` as the agent.

- **How Docker Desktop names the folder:** the bind whose `Destination` is `/c/work/demo` showed `Source` `/run/desktop/mnt/host/c/work/demo` in two runs and `C:\work\demo` in another, from the same config. A plain `docker run -v 'C:\work\demo:/c/work/demo'` showed `C:\work\demo`.
- **A turn runs in the folder:** pass, apart from a turn that opens a terminal.
  - The machine works at `/c/work/demo`.
  - A file the agent wrote through `fs/write_text_file`, and one a command in the machine wrote, are in `C:\work\demo` on Windows.
  - `git status` in the machine names only those two files: the CRLF `README.md`, `0777` in the machine, is clean. Before task 07 it showed ` M README.md`.
  - The session's changes list both files as new.
  - A turn that opens a terminal fails: an ACP agent's `terminal/create` runs on the host, where `/c/work/demo` is no folder (`Cannot create process, error code: 267`). That is [acp/19](../plans/acp/19-a-terminal-in-a-machine-runs-in-the-machine/plan.md), and the `paint` turn is checked again when it is built.
