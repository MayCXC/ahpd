import type { PluginHost } from '@ahpd/sdk';

/**
 * A plugin whose `apply` throws, quoting the write-only option it was handed.
 *
 * A plugin's own error is the ordinary place it names what it was given, and
 * `apiKey` is a credential. A row served from this failure must take the value
 * out of the sentence, as it does from the options themselves.
 */

export const name = 'throws-secret';

export const optionsSchema = {
  type: 'object',
  properties: {
    apiKey: { type: 'string', writeOnly: true },
    region: { type: 'string' },
  },
};

export function apply(_host: PluginHost, options: Record<string, unknown>): void {
  throw new Error(`the secret fixture threw with apiKey ${String(options['apiKey'])} in ${String(options['region'])}`);
}
