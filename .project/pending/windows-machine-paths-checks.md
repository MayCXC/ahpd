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
