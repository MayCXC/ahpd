import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture that reads a frontmatter through its context and writes it back.
 *
 * What it wrote is left on `globalThis` for the test, because the loader
 * imports this module and the test does not hold it.
 */

export const name = 'yaml';

/** A frontmatter as `stringifyYaml` writes one. */
export const FRONTMATTER = 'id: helper\nname: "Helper: the first"\nlabels:\n  - a\n  - b\ncount: 2\n';

export function apply(host: PluginHost): void {
  const fields = host.parseYaml(FRONTMATTER);
  (globalThis as Record<string, unknown>).__yamlWritten = { fields, text: host.stringifyYaml(fields) };
}
