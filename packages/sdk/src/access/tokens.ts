/**
 * The three token commands, by name, for a client on a person's connection.
 *
 * | Command | Params | Answers |
 * | --- | --- | --- |
 * | `x-ahpd/tokens/mint` | `user?`, `label?`, `grants?`, `expires?`, `scope?` | the `MintedToken`, with its `secret` |
 * | `x-ahpd/tokens/list` | `user?` | the token records, without their hashes |
 * | `x-ahpd/tokens/revoke` | `id`, `user?` | `{}` |
 *
 * Each needs `user:write`, and `authorize` lets in a reader without it for
 * their own tokens, as the usage commands do for a reader's own pools. The
 * commands of `ahpd token` do the same work with the same checks; `expires` is
 * epoch milliseconds here, which is the unit a token record keeps.
 */

import { refusalReason } from '../host.js';
import { INVALID_PARAMS, RpcError } from '../rpc.js';
import type { PluginMethod } from '../types/plugin.js';
import type { Grant, Principal, TokenRecord, Users } from '../types/users.js';

/** What a minted token is told when it asks to manage tokens. */
const MINTED = 'A minted token cannot manage tokens; sign in as yourself.';

/** What a directory that keeps no tokens answers. */
const NO_TOKENS = 'This host keeps no tokens, so there are none to manage.';

/** A string param, absent as undefined, or a refusal naming the command and the param. */
const option = (command: string, params: Record<string, unknown>, name: string): string | undefined => {
  const value = params[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new RpcError(INVALID_PARAMS, `${command} takes ${name} as a string`);
  return value;
};

/** The grants a token is limited to, or a refusal saying the param is a list of grant strings. */
const grantsParam = (command: string, params: Record<string, unknown>): Grant[] | undefined => {
  const value = params['grants'];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((one) => typeof one !== 'string')) {
    throw new RpcError(INVALID_PARAMS, `${command} takes grants as a list of grant strings`);
  }
  return value as Grant[];
};

/** When the token stops working, as epoch milliseconds; a record keeps the same unit. */
const expiresParam = (command: string, params: Record<string, unknown>): number | undefined => {
  const value = params['expires'];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RpcError(INVALID_PARAMS, `${command} takes expires as epoch milliseconds`);
  }
  return value;
};

export const tokenMethods = (directory: Users): Record<string, PluginMethod> => {
  /** The three calls, when the directory keeps tokens at all. */
  const keeper = () => {
    const { mintToken, tokens, revokeToken } = directory;
    if (mintToken === undefined || tokens === undefined || revokeToken === undefined) throw new RpcError(-32009, NO_TOKENS);
    return { mintToken, tokens, revokeToken };
  };

  /**
   * Whose tokens a command is about, or the refusal that takes no body.
   *
   * A principal carrying a `token` id signed in with a minted token, so it is
   * not the person and may not manage the person's tokens. The root connection
   * has no reader and no tokens of its own, so it has to name a person.
   */
  const whose = (
    command: string,
    params: Record<string, unknown>,
    reader: Principal | undefined,
  ): { target: string; own: string | undefined } => {
    if (reader?.token !== undefined) throw new RpcError(-32009, MINTED);
    const named = option(command, params, 'user');
    const target = named === undefined || named === '' ? reader?.id : named;
    if (target === undefined) throw new RpcError(INVALID_PARAMS, `${command} needs user when nobody is signed in`);
    return { target, own: reader?.id };
  };

  /**
   * Another person's tokens need `user:write`, and are bounded by every grant they hold.
   *
   * The root connection is not held to either, as the deployment token is not
   * over `/api`. The `user:write` check repeats the method grant here because
   * `authorize` is asked only of a caller the grant refused: a body reached
   * some other way must still refuse what the gate would have.
   */
  const bound = async (reader: Principal | undefined, target: string, own: string | undefined): Promise<void> => {
    if (reader === undefined || target === own) return;
    if (!reader.can('user:write')) throw new RpcError(-32009, refusalReason(reader.id, 'user:write'));
    const held = await directory.grantsOfPerson(target);
    const missing = (held ?? []).find((grant) => !reader.can(grant));
    if (missing !== undefined) throw new RpcError(-32009, refusalReason(reader.id, missing));
  };

  /**
   * A reader's own tokens need no grant; another person's do.
   *
   * Asked only of a caller the `user:write` grant refuses, so a reader who
   * holds it is never asked and reaches the body's own check.
   */
  const authorize: PluginMethod['authorize'] = async (params, reader) => {
    if (reader.token !== undefined) return false;
    const named = params['user'];
    return named === undefined || named === reader.id;
  };

  const mint = 'x-ahpd/tokens/mint';
  const list = 'x-ahpd/tokens/list';
  const revoke = 'x-ahpd/tokens/revoke';

  return {
    [mint]: {
      grant: 'user:write',
      describe: () => ({ title: 'Mint a token', description: 'A token of yours, limited to grants you hold, shown once.' }),
      authorize,
      handle: async (params, reader) => {
        const { mintToken } = keeper();
        const { target } = whose(mint, params, reader);
        await bound(reader, target, reader?.id);
        const label = option(mint, params, 'label');
        const grants = grantsParam(mint, params);
        const expires = expiresParam(mint, params);
        const scope = option(mint, params, 'scope');
        // The directory refuses a grant the person does not hold, a scope they
        // are not in, an expiry in the past and a mint past the limit; its
        // sentence is the answer.
        return await mintToken(target, {
          ...(label === undefined ? {} : { label }),
          ...(grants === undefined ? {} : { grants }),
          ...(expires === undefined ? {} : { expires }),
          ...(scope === undefined ? {} : { scope }),
        }).catch((error: unknown) => {
          throw new RpcError(-32009, error instanceof Error ? error.message : String(error));
        });
      },
    },
    [list]: {
      grant: 'user:write',
      describe: () => ({ title: 'Tokens', description: 'The tokens you hold, without their hashes.' }),
      authorize,
      handle: async (params, reader) => {
        const { tokens } = keeper();
        const { target } = whose(list, params, reader);
        await bound(reader, target, reader?.id);
        return await tokens(target);
      },
    },
    [revoke]: {
      grant: 'user:write',
      describe: () => ({ title: 'Revoke a token', description: 'Take one of your tokens out; the next call with it is refused.' }),
      authorize,
      handle: async (params, reader) => {
        const { tokens, revokeToken } = keeper();
        if (reader?.token !== undefined) throw new RpcError(-32009, MINTED);
        const named = option(revoke, params, 'user');
        // The token id finds the person, so a root connection names one the way
        // it does for the other two rather than removing any token by id.
        if (reader === undefined && (named === undefined || named === '')) {
          throw new RpcError(INVALID_PARAMS, `${revoke} needs user when nobody is signed in`);
        }
        const id = option(revoke, params, 'id');
        if (id === undefined || id === '') throw new RpcError(INVALID_PARAMS, `${revoke} needs id, a token id`);
        const one: Omit<TokenRecord, 'token'> | undefined = (await tokens()).find((each) => each.id === id);
        if (one === undefined || (named !== undefined && named !== '' && named !== one.user)) {
          throw new RpcError(-32008, `No token called ${id}.`);
        }
        // Another person's token is missing to a reader who may not manage it,
        // as the terminal's `token rm` answers, so its id is not confirmed.
        if (reader !== undefined && one.user !== reader.id && !reader.can('user:write')) {
          throw new RpcError(-32008, `No token called ${id}.`);
        }
        await bound(reader, one.user, reader?.id);
        if (!await revokeToken(id)) throw new RpcError(-32008, `No token called ${id}.`);
        return {};
      },
    },
  };
};
