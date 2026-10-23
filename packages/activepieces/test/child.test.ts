import { fork } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { ChildProcess } from 'node:child_process';
import type { Answer, DescribedAnswer } from '../src/wire.js';

/*
 * The child process, asked directly.
 *
 * The plugin is what forks it, but a piece is what the child must survive: a
 * piece that turns off the certificate check, a piece that is not installed,
 * and a piece that carries functions of its own. Each case forks the source the
 * plugin forks, and speaks the wire the plugin speaks.
 */

/** The child's entry, which is the source in development and the build otherwise. */
const CHILD = fileURLToPath(new URL('../src/child.ts', import.meta.url));

/** A fixture piece, as the child imports it: by its URL. */
const fixture = (name: string): string =>
  pathToFileURL(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))).href;

let loose: ChildProcess[] = [];
afterEach(() => {
  for (const one of loose) one.kill();
  loose = [];
});

/** One child, forked the way the plugin forks it, with the environment a case needs. */
function start(env: Record<string, string> = {}): ChildProcess {
  const forked = fork(CHILD, [], {
    execArgv: [],
    env: { ...process.env, ...env },
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  loose.push(forked);
  return forked;
}

/** One request to the child, and the answer to it. */
function ask(child: ChildProcess, request: Record<string, unknown>): Promise<Answer> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { reject(new Error('the child did not answer')); }, 10_000);
    child.once('message', (message) => {
      clearTimeout(timer);
      resolve(message as Answer);
    });
    child.send({ id: 1, ...request });
  });
}

/** The answer to a `describe`, which a case that got another answer should not read. */
const described = (answer: Answer): DescribedAnswer => {
  if (answer.type !== 'described') throw new Error(`the child answered ${answer.type}: ${answer.type === 'failed' ? answer.message : ''}`);
  return answer;
};

/** One child's exit, and the code it exited with. */
function exit(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { reject(new Error('the child did not exit')); }, 10_000);
    child.once('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

describe('a child asks for pieces', () => {
  it('answers a piece as its auth and its actions, with no function in the answer', async () => {
    const answer = described(await ask(start(), { type: 'describe', pieces: [fixture('piece-simple.mjs')] }));

    expect(answer.errors).toEqual([]);
    expect(answer.pieces).toEqual([{
      package: fixture('piece-simple.mjs'),
      displayName: 'Simple',
      auth: {
        type: 'SECRET_TEXT',
        displayName: 'API Key',
        description: 'The key the simple API takes.',
      },
      actions: [
        {
          name: 'say',
          displayName: 'Say',
          description: 'Says the text it is given.',
          aiDescription: 'Says one line, for a model.',
          props: {
            text: { type: 'SHORT_TEXT', displayName: 'Text', description: 'What to say.', required: true },
            loud: { type: 'CHECKBOX', displayName: 'Loud', required: false },
            count: { type: 'NUMBER', displayName: 'Count', required: false },
            format: {
              type: 'STATIC_DROPDOWN',
              displayName: 'Format',
              required: false,
              options: ['plain', 'markdown'],
            },
            channel: { type: 'DROPDOWN', displayName: 'Channel', required: false },
            when: { type: 'DATE_TIME', displayName: 'When', required: false },
            note: { type: 'MARKDOWN', displayName: 'Note', description: 'Read this first.', required: false },
          },
        },
        {
          name: 'upload-file',
          displayName: 'Upload file',
          description: 'Uploads a file.',
          props: {
            file: { type: 'FILE', displayName: 'File', required: true },
          },
        },
      ],
    }]);
  });

  it('ignores a piece that turns off the certificate check', async () => {
    const answer = described(await ask(
      start({ NODE_TLS_REJECT_UNAUTHORIZED: '1' }),
      { type: 'describe', pieces: [fixture('piece-tls.mjs')] },
    ));

    expect(answer.errors).toEqual([]);
    expect(answer.pieces.map((one) => one.package)).toEqual([fixture('piece-tls.mjs')]);
  });

  it('names a package that is not installed and still answers the others', async () => {
    const answer = described(await ask(
      start(),
      { type: 'describe', pieces: ['@activepieces/piece-nowhere', fixture('piece-simple.mjs')] },
    ));

    expect(answer.errors).toHaveLength(1);
    expect(answer.errors[0]).toContain('@activepieces/piece-nowhere');
    expect(answer.pieces.map((one) => one.package)).toEqual([fixture('piece-simple.mjs')]);
  });

  it('exits when the parent closes the channel', async () => {
    const child = start();
    // Connected, so `disconnect` is the closure a daemon exit makes.
    await ask(child, { type: 'describe', pieces: [] });
    const ended = exit(child);
    child.disconnect();
    expect(await ended).toBe(0);
  });
});
