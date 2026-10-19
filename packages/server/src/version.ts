/*
 * What version this is, read from the manifest rather than written twice.
 *
 * A literal in the source is a literal that drifts, and a `--version` that
 * lies is worse than no `--version` at all.
 *
 * Found by walking up from this module rather than by a fixed relative path,
 * because the depth differs: `src/version.ts` in this checkout and
 * `dist/version.js` in an install, and neither should have to know which it
 * is. `package.json` is always at the package root and npm always ships it,
 * so the first one above this file is the right one - which in a workspace is
 * this package's rather than the repository's.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The root the nearest `package.json` was found in, and what it says. */
interface Located {
  root: string;
  name: string;
  version: string;
}

/**
 * The nearest `package.json` above this module, walked once for both the root
 * and what it says.
 *
 * The root is what an update replaces, so it is answered beside the manifest:
 * finding it by walking again would be the same walk twice, and in an install
 * the answer is the folder npm put this package in.
 */
const locate = (): Located | undefined => {
  let at = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    try {
      const found = JSON.parse(readFileSync(join(at, 'package.json'), 'utf8')) as { name?: unknown; version?: unknown };
      if (typeof found.version === 'string') {
        return { root: at, name: typeof found.name === 'string' ? found.name : 'unknown', version: found.version };
      }
    }
    catch { /* not this directory */ }
    const up = dirname(at);
    // The root of the filesystem, which means there is no manifest anywhere
    // above this file - a bundler inlined it, or something unpacked it wrong.
    if (up === at) return undefined;
    at = up;
  }
};

/**
 * The folder this package is installed in, which is the one an update replaces,
 * or nothing when no `package.json` was found above this module.
 */
export const packageRoot = (): string | undefined => locate()?.root;

/** The name and version in the nearest `package.json`, or `unknown` for each where there is none. */
export const manifest = (): { name: string; version: string } => {
  const found = locate();
  return found === undefined ? { name: 'unknown', version: 'unknown' } : { name: found.name, version: found.version };
};

/** The version alone, which is what `--version` prints. */
export const version = (): string => manifest().version;
