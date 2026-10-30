/**
 * The agent record a host inside a machine was handed.
 *
 * A session of an agent made from a record that runs in a machine is served by
 * a host started there with the plugin of the record's engine. The record
 * itself is on the outer host only, so it is handed over in
 * `AGENT_RECORD_VARIABLE`, as JSON, and this host opens it with its engine at
 * start. It is served from memory: nothing writes it to this host's `agents`
 * collection, because the record holds its secrets read back from the vault.
 */

import { AGENT_RECORD_VARIABLE, isRecord } from '@ahpd/sdk';
import type { Agent, AgentOwner, ServedEngine } from '@ahpd/sdk';
import type { Icon } from '@microsoft/agent-host-protocol';

/** A string field of the handed record, or nothing for any other value. */
const text = (record: Record<string, unknown>, field: string): string | undefined => {
  const value = record[field];
  return typeof value === 'string' ? value : undefined;
};

/**
 * The agent of the record in `value`, opened with the engine it names.
 *
 * Nothing when the variable is not set. A value that is not a record, names no
 * id or engine, or names an engine no loaded plugin registered throws a
 * sentence that says which.
 */
export const handedAgent = (value: string | undefined, engines: Record<string, ServedEngine>): Agent | undefined => {
  if (value === undefined || value === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  }
  catch {
    throw new Error(`${AGENT_RECORD_VARIABLE} is not JSON, so the agent record it was meant to hold is not served`);
  }
  if (!isRecord(parsed)) throw new Error(`${AGENT_RECORD_VARIABLE} holds no record, so no agent record is served`);
  const id = text(parsed, 'id');
  const engine = text(parsed, 'engine');
  if (id === undefined || engine === undefined) {
    throw new Error(`${AGENT_RECORD_VARIABLE} holds a record with no id or no engine, so it is not served`);
  }
  const served = engines[engine];
  if (served === undefined) {
    throw new Error(`${AGENT_RECORD_VARIABLE} holds ${id}, of the ${engine} engine, which no plugin this host loaded registers`);
  }
  const agent = served.open({
    id,
    engine,
    owner: (text(parsed, 'owner') ?? 'host') as AgentOwner,
    name: text(parsed, 'name') ?? id,
    description: text(parsed, 'description'),
    icon: isRecord(parsed['icon']) ? parsed['icon'] as unknown as Icon : undefined,
    model: text(parsed, 'model'),
    config: isRecord(parsed['config']) ? parsed['config'] : {},
  });
  if (agent.provider !== id) throw new Error(`${engine} opened ${id} as ${agent.provider}, and an agent is served by the id of its record`);
  return agent;
};
