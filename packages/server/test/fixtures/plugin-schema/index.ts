import type { PluginHost } from '@ahpd/sdk';

/*
 * A plugin that declares a schema for its options.
 *
 * `command` is required and has no default, `greeting` is required and has
 * one, so the loader is seen checking the options after the defaults are
 * merged. `internal` is a default the schema does not name, which is the
 * plugin's own and not something the configuration said. `apply` keeps what it
 * was given, so a case can see what reached it and whether it ran at all.
 *
 * The schema is in the package.json beside this file, where a listing reads it
 * without an import.
 */

export const name = 'schema';

export const defaults = { greeting: 'hi', internal: true };

export function apply(_host: PluginHost, options: Record<string, unknown>): void {
  (globalThis as Record<string, unknown>).__pluginSchemaApplied = options;
}
