/**
 * `x-ahpd/me`: who a connection is, answered to that connection.
 *
 * | Command | Params | Answers |
 * | --- | --- | --- |
 * | `x-ahpd/me` | none | the `Me` of the caller |
 *
 * The grant is `user:get`, and `authorize` lets in every reader without it,
 * a minted token too: the answer is only ever about the caller. The root
 * connection has no reader and is answered from its owner, `root:<host>`.
 */

import { RpcError } from '../rpc.js';
import { poolsFor } from '../usage/scopes.js';
import type { PluginMethod } from '../types/plugin.js';
import type { Grant, Me, Principal, Users } from '../types/users.js';

/** What a connection that names nobody is told. */
const NOBODY = 'This connection names nobody; sign in first.';

export const meMethods = (directory: Users): Record<string, PluginMethod> => {
  /**
   * What the reader may do now, as a list.
   *
   * A minted token is held to both halves, as `can` holds it: the person's
   * grants and the token's own list, so each candidate is asked of `can`
   * rather than read off either list alone.
   */
  const grantsOf = async (reader: Principal): Promise<Grant[]> => {
    const person = await directory.grantsOfRoles(reader.roles);
    if (reader.token === undefined) return person;
    const minted = (await directory.tokens?.(reader.id))?.find((one) => one.id === reader.token);
    const candidates = new Set<Grant>([...person, ...(minted?.grants ?? [])]);
    return [...candidates].filter((grant) => reader.can(grant));
  };

  /** The answer for a signed-in reader. */
  const person = async (reader: Principal, owner: string | undefined): Promise<Me> => {
    const record = (await directory.list()).find((one) => one.id === reader.id);
    return {
      principal: owner ?? `user:${reader.id}`,
      kind: reader.plugin === undefined ? 'user' : 'plugin',
      id: reader.id,
      roles: [...reader.roles],
      rolesFromSignIn: [...(reader.rolesFromSignIn ?? [])],
      grants: await grantsOf(reader),
      ...(reader.token === undefined ? {} : { token: reader.token }),
      memberships: [...(reader.memberships ?? [])],
      ...(reader.primary === undefined ? {} : { primary: reader.primary }),
      ...(record?.issuer === undefined ? {} : { issuer: record.issuer }),
      ...(record?.rolesFrom === undefined ? {} : { rolesFrom: record.rolesFrom }),
      pools: poolsFor(reader),
    };
  };

  return {
    'x-ahpd/me': {
      grant: 'user:get',
      describe: () => ({ title: 'Who am I', description: 'Who this connection is, what it may do and where its work is charged.' }),
      authorize: async () => true,
      handle: async (_params, reader, _client, owner) => {
        if (reader !== undefined) return await person(reader, owner);
        if (owner?.startsWith('root:')) {
          return {
            principal: owner,
            kind: 'root',
            roles: [],
            rolesFromSignIn: [],
            grants: ['*:*'],
            pools: [owner],
          } satisfies Me;
        }
        throw new RpcError(-32007, NOBODY);
      },
    },
  };
};
