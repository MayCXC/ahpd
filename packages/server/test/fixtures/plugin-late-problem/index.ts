import type { PluginHost } from '@ahpd/sdk';

/**
 * A plugin that says one problem while it applies and keeps the host, so a case
 * can say another after `apply` returned.
 *
 * The line said while the load runs is carried in the load's answer; the one
 * said after has no reader left there and goes to the log instead. A plugin
 * holding a watch - the bot store, refusing a record edited by hand - is one
 * that says its lines at that second moment.
 */

export const name = 'late-problem';

export function apply(host: PluginHost): void {
  host.problem('late-problem: said while applying');
  (globalThis as Record<string, unknown>).__pluginLateProblemHost = host;
}
