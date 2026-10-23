import type { OutputTerminal } from '@ahpd/sdk';

/**
 * What the CLI answers when asked for one task's output.
 *
 * The SDK ships this call - `getTaskOutput` on a query, `get_task_output` on
 * the wire - but declares neither the method on `Query` nor this answer, so the
 * shape is written here. `agent-claude-sdk-task-output.test.ts` reads the
 * package and fails when it stops shipping them, which is what keeps this copy
 * from outliving the call it describes.
 */
export interface TaskOutput {
  /** The end of the output, decoded as UTF-8; at most the last 8 KiB. */
  output: string;
  /** The size of the whole output in bytes, which is how much the task wrote. */
  total_bytes: number;
  /** Whether `output` holds only the end of a longer output. */
  truncated: boolean;
}

/** The one call this backend needs from a query, which the SDK does not type. */
export interface TaskOutputReader {
  getTaskOutput(taskId: string): Promise<TaskOutput>;
}

/** How often a live task's output is read, in milliseconds. */
export const POLL_MS = 1000;

const utf8 = (text: string): number => Buffer.byteLength(text, 'utf8');

/**
 * The last `bytes` bytes of `text`, as text.
 *
 * A tail cut in the middle of a UTF-8 sequence starts on a continuation byte,
 * and decoding from there is a replacement character rather than the character
 * the byte was cut out of. Skipping ahead to the next lead byte is what keeps
 * an append from writing half a character into a terminal nothing can mend.
 */
export const tailText = (text: string, bytes: number): string => {
  if (bytes <= 0) return '';
  const all = Buffer.from(text, 'utf8');
  if (bytes >= all.length) return text;
  let at = all.length - bytes;
  while (at < all.length && ((all[at] as number) & 0xc0) === 0x80) at += 1;
  return all.subarray(at).toString('utf8');
};

/** What a caller may do to a running poll. */
export interface TaskOutputPoll {
  /** Take one more read, then say the output has ended. */
  finish(): void;
  /** Stop where it is, without a last read. A session closing, not a task ending. */
  cancel(): void;
}

export interface TaskOutputOptions {
  /** The harness's task id, which is what `getTaskOutput` names. */
  taskId: string;
  /** The terminal the text goes into. */
  terminal: OutputTerminal;
  /** One read, as the query offers it. */
  read(taskId: string): Promise<TaskOutput>;
  /** How often to read while the task runs. The backend's own second by default. */
  everyMs?: number;
  /** What to do about a read that failed, which is not the same as a task ending. */
  onError?(error: unknown): void;
}

/**
 * Follow one background shell's output for as long as it runs.
 *
 * A read is made at once, then one after each second. Reads never overlap: a
 * read that is slow queues the next behind it rather than racing it, so the
 * bytes appended are in the order the task wrote them.
 *
 * What is appended is the growth `total_bytes` reports, taken from the end of
 * the tail - the tail is the end of the whole output, not of the growth. When
 * more was written between two reads than the tail holds, the bytes between are
 * gone, so the content is replaced with the tail rather than appended to a
 * transcript that would claim bytes nobody saw.
 */
export const pollTaskOutput = (options: TaskOutputOptions): TaskOutputPoll => {
  const every = options.everyMs ?? POLL_MS;
  /** The bytes of output already written to the terminal. */
  let seen = 0;
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const write = (answer: TaskOutput): void => {
    const total = Number.isFinite(answer.total_bytes) ? Math.max(0, answer.total_bytes) : seen;
    const output = typeof answer.output === 'string' ? answer.output : '';
    const grown = total - seen;
    seen = total;
    if (grown <= 0) return;
    if (grown > utf8(output)) options.terminal.replace(output);
    else options.terminal.append(tailText(output, grown));
  };

  /** One read, queued behind any read still in flight. */
  let queue: Promise<void> = Promise.resolve();
  const take = (): Promise<void> => {
    queue = queue.then(async () => {
      try {
        write(await options.read(options.taskId));
      }
      catch (error) {
        options.onError?.(error);
      }
    });
    return queue;
  };

  const again = (): void => {
    if (done) return;
    timer = setTimeout(() => { void take().then(again); }, every);
  };

  const settle = (last: boolean): void => {
    if (done) return;
    done = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (!last) return;
    void take().then(() => { options.terminal.finalize(); });
  };

  void take().then(again);
  return {
    finish: () => { settle(true); },
    cancel: () => { settle(false); },
  };
};
