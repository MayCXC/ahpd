---
title: A person's own token names them at the door, unless the host requires the issuer
status: accepted
date: 2026-10-21
supersedes: decisions/the-door-is-a-door.md
refs:
  - "[code://packages/server/src/commands/run.ts#L553-L565](../../packages/server/src/commands/run.ts#L553-L565) - the daemon's `identify`, which names a person only when their token is trusted"
  - "[code://packages/sdk/src/host/handshake.ts#L584-L606](../../packages/sdk/src/host/handshake.ts#L584-L606) - `authenticate` for the sign-in resource, which calls the same `users.verify` as the door"
  - "[code://packages/sdk/src/access/users.ts#L1078-L1110](../../packages/sdk/src/access/users.ts#L1078-L1110) - `verify`, one check for a record's token, a minted token and an issuer's token"
  - git://d96c3473 - the last commit that holds decision `the-door-is-a-door`
---

## Context

Decision `the-door-is-a-door` made a person's own connection token open the socket and name nobody.
The person then had to send `authenticate` to sign in.
The reason was that a token in a URL leaks to logs and screenshots.

The door and `authenticate` both call `users.verify` on the same secret.
Whoever holds a leaked token can send it to `authenticate` and be that person, so the second step stops nobody.
It does stop every client that cannot sign in, such as the web UI, which connects with `?tkn=` and is never told who it is.

A second step has a meaning only when it asks for a different credential.
That is the case of a company that requires its own sign-in, through the issuer.

## Decision

A token that the users file accepts names its person at the door, the same as at `authenticate`.
This includes the record's own token and a token the person minted.

`requireIssuer` turns on the company case, as a host key and as a key on one record that wins over the host.
It is off by default.
When it is on, a local token only opens the socket, and `authenticate` accepts only a token from the record's issuer.

The deployment's token is unchanged and remains the host.
`trustToken`, on the host and on a record, goes away.

## Consequences

A client that connects with a person's token is that person from the first frame, and the handshake says so in `ahpd.principal`.
A leaked personal token is a full identity until somebody changes or revokes it.
That was already true through `authenticate`.
A deployment that wants the issuer as the only proof sets one key, and its people sign in through the issuer.
A configuration file that still sets `trustToken` starts, and the key is logged as unknown.

## Options

- **Keep the door naming nobody, with `trustToken` to opt out.** Rejected: the second step checks the same secret, so it adds no security.
  Every client with no sign-in flow also needs a key written for it.
- **Make an issuer on the record mean the issuer is required.** Rejected: a record can name an issuer and keep its own token.
  The existing records are written that way.
- **Drop the second step and leave the company case for later.** Rejected: Softov chose the setting, so a deployment can require its issuer now.
