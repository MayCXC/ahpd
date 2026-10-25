import type { PluginHost } from '@ahpd/sdk';

/**
 * A plugin that keeps what it was handed, so a case can reach back in.
 *
 * It holds the host it was given on `globalThis`, so a case can register
 * through the host - or try to - after `apply` returned and the loader has
 * taken what it keeps. Those are the writes this boundary refuses.
 */

export const name = 'after';

export function apply(host: PluginHost): void {
  (globalThis as Record<string, unknown>).__pluginAfterHost = host;
}
