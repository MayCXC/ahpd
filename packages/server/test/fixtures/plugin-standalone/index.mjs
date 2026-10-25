/**
 * A fixture plugin that sits in no package, described by its plugin.json.
 *
 * It exports no name: a standalone plugin's id is the one its manifest
 * declares, so the module has nothing to say about it.
 */

export function apply(host) {
  host.registerTool({
    definition: { name: 'standalone_tool', description: 'A tool from a standalone plugin', inputSchema: { type: 'object', properties: {} } },
    run: () => 'standalone',
  });
}
