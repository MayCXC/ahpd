import { timingSafeEqual } from 'node:crypto';
import { routePrefix } from '@ahpd/sdk';
import type { Endpoint } from './record.js';
import type { Route } from '@ahpd/sdk';

/** The plugin's id, which is also the prefix its route is served under. */
export const NAME = 'webhook';

/** The path every endpoint is under, as the listener passes it: `/plugins/webhook/`. */
export const PREFIX = routePrefix(NAME);

/** What one target does with a call that passed the bearer check. */
export type Target = (endpoint: Endpoint, request: Request) => Promise<Response>;

/** What the route reads and calls, so a test gives each one. */
export interface WebhookSeams {
  /** The endpoint an open `webhook` connector of this id answers for, or nothing when none does. */
  endpoint(id: string): Endpoint | undefined | Promise<Endpoint | undefined>;
  /** What a call to a bot endpoint does. */
  bot?: Target;
  /** What a call to an automation endpoint does. */
  automation?: Target;
}

/** One JSON answer with a `message`, which is all a refusal says. */
export const answer = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** The token of an `Authorization: Bearer <token>` header, or nothing. */
const bearerOf = (request: Request): string | undefined => {
  const header = request.headers.get('authorization');
  if (header === null) return undefined;
  const match = /^Bearer\s+(\S+)\s*$/iu.exec(header);
  return match?.[1];
};

/** Whether two tokens are equal, in a time that does not depend on where they differ. */
const same = (given: string, kept: string): boolean => {
  const one = Buffer.from(given, 'utf8');
  const other = Buffer.from(kept, 'utf8');
  if (one.length !== other.length) return false;
  return timingSafeEqual(one, other);
};

/**
 * The one route the plugin serves: `POST /plugins/webhook/<endpoint>`.
 *
 * The route finds the open endpoint, checks the bearer against the secret it
 * holds, and passes the call to the endpoint's target. A connector that was
 * never opened, or was closed, answers 404 like an id nobody made. The body is
 * not read before the bearer passes.
 */
export function webhookRoute(seams: WebhookSeams): Route {
  return async (request) => {
    const path = new URL(request.url).pathname;
    const rest = path.startsWith(PREFIX) ? path.slice(PREFIX.length) : '';
    if (rest === '' || rest.includes('/')) return answer(404, { message: 'No webhook endpoint is at this path.' });
    if (request.method !== 'POST') return answer(405, { message: 'A webhook takes POST only.' });

    let id: string;
    try {
      id = decodeURIComponent(rest);
    }
    catch {
      return answer(404, { message: 'No webhook endpoint is at this path.' });
    }
    const endpoint = await seams.endpoint(id);
    if (endpoint === undefined) return answer(404, { message: 'No webhook endpoint is at this path.' });

    const token = bearerOf(request);
    if (token === undefined) return answer(401, { message: 'The call needs a bearer token.' });
    if (!same(token, endpoint.secret)) return answer(401, { message: 'The bearer token is not valid.' });

    const target = endpoint.bot !== undefined ? seams.bot : seams.automation;
    if (target === undefined) return answer(501, { message: 'This plugin cannot serve this endpoint yet.' });
    return await target(endpoint, request);
  };
}
