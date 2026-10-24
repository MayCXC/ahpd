/**
 * Who may use an agent.
 *
 * One rule, asked wherever an agent is chosen: the agent list a connection is
 * sent, the start of a session on it, the save of an automation or a bot that
 * names one, and the wake of a bot. A caller that may not use an agent is not
 * told it exists - the list leaves it out and a start answers as it does for a
 * provider no host serves.
 */

import { onTeam } from '../channels/owners.js';
import type { AgentOwner } from '../types/agents.js';
import type { Owner } from '../types/usage.js';
import type { Principal } from '../types/users.js';

/**
 * What the owners map says about one id.
 *
 * `recorded` is the difference between an id a record holds and one nothing
 * holds. An id with no entry is the daemon's own agent, or one a plugin
 * registered, and so a host agent. An entry is a record, and a record whose
 * owner could not be read is nobody's to use rather than the host's - a record
 * mid-edit or mid-removal must not fall through to the host rule.
 */
export interface Ownership {
  /** Whether a record holds this id. */
  readonly recorded: boolean;
  /** Whose it is, where a record holds it. A record with none is nobody's. */
  readonly owner?: AgentOwner;
}

/** An id no record holds: the daemon's own agent, or one a plugin registered. */
export const hostAgent: Ownership = { recorded: false };

/** What the owners map says about one id, keeping absent and unowned apart. */
export const ownershipOf = (
  owners: ReadonlyMap<string, AgentOwner | undefined> | undefined,
  id: string,
): Ownership => {
  if (owners === undefined || !owners.has(id)) return { recorded: false };
  const owner = owners.get(id);
  return { recorded: true, ...(owner === undefined ? {} : { owner }) };
};

/**
 * Whether this caller may see and start a session on an agent.
 *
 * A host agent - the daemon's own, or one a plugin registered, which has no
 * record and so no owner - takes `session:write`. A team's agent takes a
 * membership of that team, and a person's agent is that person's own. A record
 * whose owner is not readable is refused to everyone, root included: it is not
 * a host agent, and there is nobody it could be given to.
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
  agent: Ownership,
  where: { root: boolean; hasDirectory: boolean },
): boolean => {
  if (agent.recorded && agent.owner === undefined) return false;
  if (!where.hasDirectory || where.root) return true;
  const owner = agent.owner;
  if (principal === undefined) return !agent.recorded || owner === 'host';
  if (owner === undefined || owner === 'host') return principal.can('session:write');
  if (owner.startsWith('user:')) return principal.plugin === undefined && principal.id === owner.slice('user:'.length);
  return onTeam(principal, owner.slice('team:'.length));
};

/**
 * Who work acts for when no client's connection sent it.
 *
 * An automation's run, a bot's wake and a tool's start are the owner's own
 * work rather than a request somebody is waiting on: `owner` is who it is
 * charged to, and `principal` is that person, where this process has met them.
 */
export interface Acting {
  readonly owner?: Owner;
  readonly principal?: Principal;
}

/**
 * The principal an owner's own work acts as.
 *
 * The owner rules ask what the owner's scope reaches, not which grants the
 * person held when the work was made: the host's agents, the person's own, and
 * the agents of the teams they belong to. So the one grant this principal
 * answers is `session:write`, which is what a host agent asks of a person - a
 * start the host makes for an owner is not a client's request to refuse for a
 * grant, and the host asks the owner's own grants on the road beside this one.
 *
 * A person this process has met supplies who they are and the teams they
 * belong to, so a member's work reaches the team's agent. A `project:` or
 * `plugin:` owner is nobody's person and no team's, so it reaches the host's
 * agents alone - the same reading `sameOwnerOrHost` gives an automation's
 * connectors, one step fuller because an agent may be a team's.
 */
const actingAs = (owner: Owner, met: Principal | undefined): Principal => {
  const sessionWrite = (grant: string): boolean => grant === 'session:write';
  if (owner.startsWith('user:')) {
    const person = met ?? { id: '', roles: [] as const, can: sessionWrite };
    return { ...person, id: owner.slice('user:'.length), can: sessionWrite };
  }
  if (owner.startsWith('team:')) {
    return { id: '', roles: [], can: sessionWrite, memberships: [owner.slice('team:'.length)] };
  }
  return { id: '', roles: [], can: sessionWrite };
};

/**
 * Whether the owner a start acts for may use an agent, when no connection sent
 * it.
 *
 * Host work - nobody's owner, or a `root:` one - keeps every agent the daemon
 * has, as the root connection does. Otherwise this is `mayUseAgent` for the
 * owner, with the person this process met where it met one.
 */
export const mayUseAgentFor = (
  acting: Acting | undefined,
  agent: Ownership,
  where: { hasDirectory: boolean },
): boolean => {
  const owner = acting?.owner;
  if (owner === undefined || owner.startsWith('root:')) {
    return mayUseAgent(acting?.principal, agent, { root: true, hasDirectory: where.hasDirectory });
  }
  return mayUseAgent(actingAs(owner, acting?.principal), agent, { root: false, hasDirectory: where.hasDirectory });
};
