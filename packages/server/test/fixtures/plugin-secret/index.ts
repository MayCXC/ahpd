import type { PluginHost } from '@ahpd/sdk';

/**
 * A plugin with a credential among its options.
 *
 * `apiKey` is `writeOnly`, so a served answer says it is set and never what it
 * is; `region` is an ordinary option, answered as the file holds it; `retries`
 * is bounded, so a value can be refused.
 */

export const name = 'secret';

export function apply(_host: PluginHost): void {}
