import type { PluginHost } from '@ahpd/sdk';

/*
 * A plugin whose options carry the two keywords the protocol's schema has room
 * for on an array and on nothing else.
 *
 * `paths` is an array with both item bounds, which a client is shown; `label`
 * carries the same two keywords under a `string`, which it is not. The schema
 * is in the package.json beside this file, where a listing reads it without an
 * import.
 */

export const name = 'bounded';

export function apply(_host: PluginHost): void {}
