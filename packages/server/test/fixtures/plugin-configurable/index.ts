import type { PluginHost } from '@ahpd/sdk';

/*
 * A plugin that declares an option it needs before it can run.
 *
 * Nothing imports this in the listing test: the schema's `required` list is
 * read out of the manifest, so a spec that does not set `token` is
 * `unconfigured` without the module running, which is the same reason the
 * schema exists.
 */

export const name = 'configurable';

export function apply(_host: PluginHost): void {
  throw new Error('the configurable fixture must not be loaded without a token');
}
