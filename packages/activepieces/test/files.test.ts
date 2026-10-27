import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fileOf } from '../src/files.js';
import type { Answer } from '../src/fetch.js';

/*
 * The file one FILE value names.
 *
 * An attachment is read from a folder this file makes for each case; a URL is
 * answered by a fetch the case gives, so nothing is looked up and no request is
 * made. A refusal never names the folder, and never repeats the bytes.
 */

/** The folders a case made, removed after it. */
const made: string[] = [];

afterEach(() => {
  for (const one of made.splice(0)) rmSync(one, { recursive: true, force: true });
});

/** One empty folder for a case. */
function folder(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-files-'));
  made.push(dir);
  return dir;
}

/** One folder with the named files written into it. */
function withFiles(files: Record<string, string>): string {
  const dir = folder();
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

/** The message a call threw, which a case reads instead of a value. */
async function messageOf(call: Promise<unknown>): Promise<string> {
  try {
    await call;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('the call answered, and the case expected a refusal');
}

/** An answer of the guarded fetch, as the bytes and type it read. */
const answered = (status: number, contentType: string, bytes: Buffer): Answer => ({
  status,
  headers: { 'content-type': contentType },
  bytes,
});

describe('a FILE value names an attachment', () => {
  it('reads a file in the folder, with its name, bytes and extension', async () => {
    const dir = withFiles({ 'notes.txt': 'hello' });
    const file = await fileOf('notes.txt', dir);

    expect(file.filename).toBe('notes.txt');
    expect(file.extension).toBe('txt');
    expect(file.data.toString('utf8')).toBe('hello');
    expect(file.base64).toBe(Buffer.from('hello').toString('base64'));
  });

  it('reads a file in a subfolder of the folder', async () => {
    const dir = withFiles({ 'sub/a.json': '{"a":1}' });
    const file = await fileOf('sub/a.json', dir);

    expect(file.filename).toBe('a.json');
    expect(file.data.toString('utf8')).toBe('{"a":1}');
  });

  it('refuses a name that leaves the folder, without naming the folder', async () => {
    const dir = withFiles({ 'notes.txt': 'hello' });
    const outside = join(dir, '..', `${basename(dir)}-outside.txt`);
    writeFileSync(outside, 'outside-bytes');
    made.push(outside);

    const said = await messageOf(fileOf(`../${basename(outside)}`, dir));

    expect(said).toContain(basename(outside));
    expect(said).toContain('is not a file in this session');
    expect(said).not.toContain(dir);
    expect(said).not.toContain('outside-bytes');
  });

  it('refuses an absolute path outside the folder, without naming the folder', async () => {
    const dir = withFiles({ 'notes.txt': 'hello' });
    const other = withFiles({ 'secret.txt': 'secret-bytes' });

    const said = await messageOf(fileOf(join(other, 'secret.txt'), dir));

    expect(said).toContain('is not a file in this session');
    expect(said).not.toContain(dir);
    expect(said).not.toContain('secret-bytes');
  });

  it('refuses a link that leaves the folder', async () => {
    const dir = withFiles({ 'notes.txt': 'hello' });
    const other = withFiles({ 'secret.txt': 'secret-bytes' });
    symlinkSync(join(other, 'secret.txt'), join(dir, 'link.txt'));

    const said = await messageOf(fileOf('link.txt', dir));

    expect(said).toContain('link.txt');
    expect(said).toContain('is not a file in this session');
    expect(said).not.toContain('secret-bytes');
  });

  it('refuses a name the folder does not hold', async () => {
    const dir = withFiles({ 'notes.txt': 'hello' });

    expect(await messageOf(fileOf('nowhere.txt', dir))).toContain('nowhere.txt is not a file in this session');
  });

  it('refuses a name when the call has no folder', async () => {
    const said = await messageOf(fileOf('notes.txt', undefined));

    expect(said).toBe('notes.txt names a file, and this call has no attachments folder');
  });

  it('refuses a name when the folder was never made', async () => {
    const dir = join(folder(), 'not-made');

    expect(await messageOf(fileOf('notes.txt', dir))).toBe('this session has no attachments folder yet');
  });
});

describe('a FILE value is a data: URI', () => {
  it('decodes base64, and takes the extension from the media type', async () => {
    const bytes = Buffer.from('png-bytes');
    const file = await fileOf(`data:image/png;base64,${bytes.toString('base64')}`, undefined);

    expect(file.filename).toBe('file.png');
    expect(file.extension).toBe('png');
    expect(file.data.equals(bytes)).toBe(true);
  });

  it('decodes text, and takes the extension from the media type', async () => {
    const file = await fileOf('data:text/plain,hello%20world', undefined);

    expect(file.filename).toBe('file.txt');
    expect(file.extension).toBe('txt');
    expect(file.data.toString('utf8')).toBe('hello world');
  });

  it('names a URI with no media type file, and leaves the extension off', async () => {
    const file = await fileOf('data:,hello', undefined);

    expect(file.filename).toBe('file');
    expect(file).not.toHaveProperty('extension');
    expect(file.data.toString('utf8')).toBe('hello');
  });

  it('takes a +json type as json', async () => {
    const file = await fileOf('data:application/ld+json,{}', undefined);

    expect(file.extension).toBe('json');
  });

  it('refuses a URI with no comma', async () => {
    expect(await messageOf(fileOf('data:image/png', undefined))).toBe('a data: URI needs a comma');
  });
});

describe('a FILE value is an https: URL', () => {
  it('reads the bytes, and takes the name from the URL path', async () => {
    const bytes = Buffer.from('png-bytes');
    const file = await fileOf('https://files.example/a.png?token=x', undefined, {
      fetch: async () => answered(200, 'image/png', bytes),
    });

    expect(file.filename).toBe('a.png');
    expect(file.extension).toBe('png');
    expect(file.data.equals(bytes)).toBe(true);
  });

  it('names a URL with no file in its path after its media type', async () => {
    const file = await fileOf('https://files.example/', undefined, {
      fetch: async () => answered(200, 'text/csv; charset=utf-8', Buffer.from('a,b')),
    });

    expect(file.filename).toBe('file.csv');
    expect(file.extension).toBe('csv');
  });

  it('takes the extension from the URL when the media type says nothing', async () => {
    const file = await fileOf('https://files.example/report.pdf', undefined, {
      fetch: async () => answered(200, 'application/octet-stream', Buffer.from('pdf')),
    });

    expect(file.filename).toBe('report.pdf');
    expect(file.extension).toBe('pdf');
  });

  it('refuses an answer that is not a success', async () => {
    expect(await messageOf(fileOf('https://files.example/a.png', undefined, {
      fetch: async () => answered(404, 'text/plain', Buffer.from('gone')),
    }))).toBe('files.example answered HTTP 404');
  });

  it('names only the host of a signed URL it refuses, never its path or query', async () => {
    const said = await messageOf(fileOf('https://files.example/a.png?token=secret', undefined, {
      fetch: async () => answered(403, 'text/plain', Buffer.from('no')),
    }));

    expect(said).toBe('files.example answered HTTP 403');
    expect(said).not.toContain('secret');
    expect(said).not.toContain('a.png');
  });

  it('uses the guarded fetch when the caller gives none', async () => {
    // A loopback URL is refused by the fetch itself, before any socket opens.
    expect(await messageOf(fileOf('https://127.0.0.1/a.png', undefined)))
      .toContain('127.0.0.1 answers on an address that this plugin does not fetch');
  });
});
