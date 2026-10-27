/**
 * The files one `FILE` prop's value names, as the `ApFile` a piece reads.
 *
 * A value is one of three strings: an `https:` URL, a `data:` URI, or the name
 * of a file in the session's attachments folder. The first is read through the
 * guarded fetch, the second is decoded, and the third is resolved inside the
 * folder by `realpath`, so a path that leaves it is refused.
 *
 * A file is held whole in memory, because an `ApFile` carries a `Buffer` and a
 * piece reads it whole. A URL is read to 32 MB, and a `data:` URI or an
 * attachment has no limit of its own.
 */

import { readFile, realpath } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative } from 'node:path';
import { fetched } from './fetch.ts';
import type { Answer } from './fetch.ts';

/** The part of an `ApFile` a piece reads. */
export interface ApFile {
  /** What the file is called. */
  filename: string;
  /** Its bytes. */
  data: Buffer;
  /** Its extension, without the dot, when there is one. */
  extension?: string;
  /** The bytes as base64, which is what a piece sends. */
  readonly base64: string;
}

/** What a caller may hand a file read, so a test reaches no network. */
export interface FilesOptions {
  /** How an `https:` URL is read; `fetched` otherwise. */
  fetch?: (url: string) => Promise<Answer>;
}

/** The extension a media type is named with, where it has a common one. */
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/html': 'html',
  'application/zip': 'zip',
  'application/octet-stream': 'bin',
};

/** A file's own extension, without the dot. */
const extensionOfName = (name: string): string => extname(name).replace(/^\./u, '').toLowerCase();

/** The extension a media type is named with, or nothing where it names none. */
const extensionOfType = (type: string | undefined): string => {
  const one = (type ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (one === '') return '';
  const known = EXTENSIONS[one];
  if (known !== undefined) return known;
  if (one.endsWith('+json')) return 'json';
  if (one.endsWith('+xml')) return 'xml';
  const slash = one.indexOf('/');
  return slash < 0 ? '' : one.slice(slash + 1).replace(/[^a-z0-9]/gu, '');
};

/** One `ApFile`, with `base64` read from its bytes rather than kept. */
const apFile = (filename: string, data: Buffer, extension: string): ApFile => ({
  filename,
  data,
  ...(extension === '' ? {} : { extension }),
  get base64(): string {
    return data.toString('base64');
  },
});

/**
 * A URL's host, which is all a refusal names of it.
 *
 * A signed URL carries its token in the query, and a refusal is written to a
 * problem line, so neither the path nor the query is repeated.
 */
const hostOf = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return 'this URL';
  }
};

/** A URL's path, decoded, or nothing where it cannot be read. */
const pathOf = (value: string): string => {
  try {
    const path = new URL(value).pathname;
    return decodeURIComponent(path);
  } catch {
    return '';
  }
};

/** A data URI's payload, read as text when it is not base64. */
const textOf = (payload: string): string => {
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
};

/** Whether a path is inside a folder, and not merely prefixed by its name. */
const inside = (folder: string, path: string): boolean => {
  const held = relative(folder, path);
  return held !== '' && !held.startsWith('..') && !isAbsolute(held);
};

/** One `https:` URL, read through the guarded fetch. */
async function fromUrl(value: string, options: FilesOptions): Promise<ApFile> {
  const answer = await (options.fetch ?? fetched)(value);
  if (answer.status < 200 || answer.status >= 300) {
    throw new Error(`${hostOf(value)} answered HTTP ${answer.status}`);
  }
  const contentType = answer.headers['content-type'];
  const named = basename(pathOf(value));
  const extension = extensionOfName(named) || extensionOfType(contentType);
  const filename = named === '' || named === '.' || named === '/'
    ? `file${extension === '' ? '' : `.${extension}`}`
    : named;
  return apFile(filename, answer.bytes, extension);
}

/** One `data:` URI, decoded. */
function fromData(value: string): ApFile {
  const comma = value.indexOf(',');
  if (comma < 0) throw new Error('a data: URI needs a comma');
  const meta = value.slice('data:'.length, comma);
  const payload = value.slice(comma + 1);
  const parts = meta.split(';').map((one) => one.trim().toLowerCase());
  const type = parts[0] ?? '';
  const base64 = parts.slice(1).includes('base64');
  const bytes = base64 ? Buffer.from(payload, 'base64') : Buffer.from(textOf(payload), 'utf8');
  const extension = extensionOfType(type);
  return apFile(`file${extension === '' ? '' : `.${extension}`}`, bytes, extension);
}

/** The name of one file in the session's attachments folder. */
async function fromAttachment(value: string, folder: string | undefined): Promise<ApFile> {
  if (folder === undefined) {
    throw new Error(`${value} names a file, and this call has no attachments folder`);
  }
  const root = await realpath(folder).catch(() => undefined);
  if (root === undefined) throw new Error('this session has no attachments folder yet');
  // `join` keeps an absolute value under the folder, and `realpath` resolves a
  // link before the check, so a name that leaves the folder is refused.
  const found = await realpath(join(folder, value)).catch(() => undefined);
  if (found === undefined || !inside(root, found)) {
    throw new Error(`${value} is not a file in this session's attachments`);
  }
  const bytes = await readFile(found).catch(() => undefined);
  if (bytes === undefined) {
    throw new Error(`${value} is not a file in this session's attachments`);
  }
  const filename = basename(found);
  return apFile(filename, bytes, extensionOfName(filename));
}

/**
 * The file one `FILE` value names.
 *
 * `folder` is the session's attachments folder, or nothing where its store
 * keeps none. A name that is an `https:` URL or a `data:` URI needs no folder;
 * any other value is the name of a file in it.
 */
export async function fileOf(value: string, folder: string | undefined, options: FilesOptions = {}): Promise<ApFile> {
  if (/^https:/iu.test(value)) return await fromUrl(value, options);
  if (/^data:/iu.test(value)) return fromData(value);
  return await fromAttachment(value, folder);
}
