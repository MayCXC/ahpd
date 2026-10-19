---
title: Check ahpd update on Debian and Windows
plans:
  - plans/daemon/35-the-daemon-updates-itself/plan.md
---

# Check ahpd update on Debian and Windows

daemon/35 is built and its tests pass against a fake npm and a fake registry. This run uses a real npm. It needs a release that has `ahpd update`, and an older release to update from.

## Set up

1. On a Debian machine, run `npm i -g @ahpd/server@<older>`, with a version older than the latest.
2. Run `ahpd plugin install @ahpd/agent-cofold`.
3. Run `ahpd start`.

## The check answers

1. Run `ahpd update --check`.
2. Check that it prints the installed and the latest version, and that the update may run.
3. Run `ahpd update --version <older>`, and check that it is refused.

## A daemon from ahpd start moves

1. Run `ahpd update`.
2. Check that `ahpd status` shows the latest version.
3. Check that `ahpd plugin list` shows `@ahpd/agent-cofold` with the new `@ahpd/sdk`.

## A daemon under the systemd unit moves

1. Install the older version again, and run `ahpd service install`.
2. Run `ahpd update`.
3. Check that `systemctl --user status ahpd` shows the daemon running, and that `ahpd status` shows the latest version.

## HTTP and AHP

1. Send `POST /api/update` with `{"check": true}` and a person's token, and check that the answer is 403.
2. Send the same request with the deployment token, and check that it answers the versions.
3. From ahpc as a person, call `x-ahpd/update`, and check that it is refused with `-32009`.

## Windows

1. On Windows, run `npm i -g @ahpd/server@<older>`, then `ahpd start`.
2. Run `ahpd update`.
3. Wait until `daemon.log` says "the daemon is up".
4. Check that `ahpd status` shows the latest version.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
