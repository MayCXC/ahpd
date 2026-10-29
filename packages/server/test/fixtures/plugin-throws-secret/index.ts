import type { PluginHost } from '@ahpd/sdk';

/**
 * A plugin whose `apply` throws, quoting the credential options it was handed.
 *
 * A plugin's own error is the ordinary place it names what it was given, and
 * `apiKey` and `token` are credentials, one marked `writeOnly` and one marked
 * `secret`. A row served from this failure must take both values out of the
 * sentence, as it does from the options themselves.
 */

export const name = 'throws-secret';

export function apply(_host: PluginHost, options: Record<string, unknown>): void {
  throw new Error(`the secret fixture threw with apiKey ${String(options['apiKey'])} and token ${String(options['token'])} in ${String(options['region'])}`);
}
