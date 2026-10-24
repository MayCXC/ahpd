/**
 * Turning the icons a manifest or an adapter declares into what a client draws.
 *
 * A plugin names an icon as a file beside its package, such as `./icon.svg`,
 * and a client cannot read a file: what reaches it is a `data:` URI, read here
 * once rather than at each subscription. An `https:` URL or a `data:` URI is
 * already something a client can draw, so it is passed on as it is.
 *
 * An icon is decoration, so nothing here refuses: an icon that cannot be read
 * or is too large is dropped and said in one line, and the plugin that declared
 * it still loads. The limit is 32 KB, for each file and each `data:` URI,
 * because every client receives the whole of what is kept.
 */

import { readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import type { Icon } from '@ahpd/sdk';

/** The most one icon may be, in bytes, whether it is a file or a `data:` URI. */
export const ICON_LIMIT = 32 * 1024;

/** The content type each extension the host reads stands for. */
const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** Where one line about an icon that was dropped goes. */
export type IconProblem = (line: string) => void;

/** Whether a value is a plain record. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The optional members of one icon, kept when they are the shape they should be. */
const extrasOf = (held: Record<string, unknown>): Partial<Icon> => ({
  ...(typeof held['contentType'] === 'string' ? { contentType: held['contentType'] } : {}),
  ...(Array.isArray(held['sizes']) && held['sizes'].every((one) => typeof one === 'string')
    ? { sizes: [...held['sizes']] as string[] }
    : {}),
  ...(held['theme'] === 'light' || held['theme'] === 'dark' ? { theme: held['theme'] } : {}),
});

/** Whether a path is the base folder or somewhere under it. */
const inside = (at: string, base: string): boolean => at === base || at.startsWith(base + sep);

/**
 * The icons of a manifest or an adapter that a client can draw.
 *
 * `base` is the folder a relative `src` is resolved against: the plugin's
 * package, or the folder of a single-file plugin, which is what it has in place
 * of a package. Absent, only the two `src` forms that need no folder are kept.
 *
 * `by` names the plugin in every line `problem` receives, and each line is one
 * icon that was dropped.
 */
export function resolveIcons(icons: unknown, base: string | undefined, by: string, problem: IconProblem): Icon[] {
  if (!Array.isArray(icons)) return [];
  const kept: Icon[] = [];
  for (const held of icons) {
    if (!isRecord(held) || typeof held['src'] !== 'string' || held['src'].trim() === '') continue;
    const src = held['src'];
    const extras = extrasOf(held);

    // A URL or a URI a client already reads is the writer's decision, and
    // second-guessing one would be a second answer to a question already made.
    if (/^https:/i.test(src)) {
      kept.push({ src, ...extras });
      continue;
    }
    if (/^data:/i.test(src)) {
      if (Buffer.byteLength(src, 'utf8') > ICON_LIMIT) {
        problem(`${by}: an icon is a data: URI larger than ${ICON_LIMIT / 1024} KB`);
        continue;
      }
      kept.push({ src, ...extras });
      continue;
    }

    if (base === undefined) {
      problem(`${by}: the icon ${src} has no package to be relative to`);
      continue;
    }
    // The same rule an entry is held to: a manifest cannot point its own
    // package at a file somebody else owns.
    const at = resolve(base, src);
    if (!inside(at, base)) {
      problem(`${by}: the icon ${src} points outside the plugin package`);
      continue;
    }
    /*
     * A name that resolves inside the package can still be a link to a file
     * outside it, so the real paths decide. The base is read by its real path
     * too, for a package reached through a link of its own.
     */
    let real: string;
    try {
      real = realpathSync(at);
      if (!inside(real, realpathSync(base))) {
        problem(`${by}: the icon ${src} points outside the plugin package`);
        continue;
      }
    }
    catch {
      problem(`${by}: the icon ${src} could not be read`);
      continue;
    }

    let bytes: Buffer;
    try {
      const found = statSync(real);
      if (!found.isFile()) {
        problem(`${by}: the icon ${src} is not a file`);
        continue;
      }
      if (found.size > ICON_LIMIT) {
        problem(`${by}: the icon ${src} is larger than ${ICON_LIMIT / 1024} KB`);
        continue;
      }
      bytes = readFileSync(real);
    }
    catch {
      problem(`${by}: the icon ${src} could not be read`);
      continue;
    }

    const ext = extname(at).toLowerCase();
    const contentType = extras.contentType ?? TYPES[ext];
    if (contentType === undefined) {
      problem(`${by}: the icon ${src} has no content type, and ${ext === '' ? 'its extension' : ext} is not one of ${Object.keys(TYPES).join(', ')}`);
      continue;
    }
    // An SVG is scalable, so a manifest that names no size means every size.
    const sizes = extras.sizes ?? (contentType === 'image/svg+xml' ? ['any'] : undefined);
    kept.push({
      src: `data:${contentType};base64,${bytes.toString('base64')}`,
      contentType,
      ...(sizes === undefined ? {} : { sizes }),
      ...(extras.theme === undefined ? {} : { theme: extras.theme }),
    });
  }
  return kept;
}
