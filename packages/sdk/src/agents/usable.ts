/**
 * Who may use an agent.
 *
 * One rule, asked in two places: the agent list a connection is sent, and the
 * start of a session on it. A caller that may not use an agent is not told it
 * exists - the list leaves it out and a start answers as it does for a provider
 * no host serves.
 */

import { onTeam } from '../channels/owners.js';
import type { AgentOwner } from '../types/agents.js';
import type { Principal } from '../types/users.js';

/**
 * Whether this caller may see and start a session on an agent.
 *
 * A host agent - the daemon's own, or one a plugin registered, which has no
 * record and so no owner - takes `session:write`. A team's agent takes a
 * membership of that team, and a person's agent is that person's own.
 *
 * A host with no users directory has nobody to ask, so every agent is the
 * daemon's and every caller keeps it. A root connection is the daemon rather
 * than somebody, and keeps every agent too.
 *
 * A caller that has not signed in is told about the host's agents alone. Those
 * are the ones anybody who may use this host may use, and the list is where an
 * unsigned client learns the resource it signs in with - so it is neither every
 * agent nor none.
 */
export const mayUseAgent = (
  principal: Principal | undefined,
  owner: AgentOwner | undefined,
  where: { root: boolean; hasDirectory: boolean },
): boolean => {
  if (!where.hasDirectory || where.root) return true;
  if (principal === undefined) return owner === undefined || owner === 'host';
  if (owner === undefined || owner === 'host') return principal.can('session:write');
  if (owner.startsWith('user:')) return principal.plugin === undefined && principal.id === owner.slice('user:'.length);
  return onTeam(principal, owner.slice('team:'.length));
};
