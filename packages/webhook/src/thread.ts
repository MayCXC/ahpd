import { randomUUID } from 'node:crypto';
import type { RecordCollection } from '@ahpd/sdk';

/**
 * One thread of one endpoint, as the `webhook-threads` collection holds it.
 *
 * A caller names its thread with any text, so the record's id is the plugin's
 * own, `t-<uuid>`, and the caller's id is a field. The record says which chat
 * of which session the thread's turns go to.
 */
export interface Thread {
  /** The record's id, `t-<uuid>`. */
  id: string;
  /** The endpoint the thread belongs to. */
  endpoint: string;
  /** The thread id the caller sent. */
  thread: string;
  /** The bot's session when the chat was made. */
  session: string;
  /** The chat the thread's turns go to. */
  chat: string;
}

/** A new thread record id. */
export const threadId = (): string => `t-${randomUUID()}`;

/** The thread record of one endpoint and caller thread id, or nothing. */
export async function findThread(threads: RecordCollection, endpoint: string, thread: string): Promise<Thread | undefined> {
  const found = await threads.find({ endpoint, thread });
  const one = found[0];
  if (one === undefined) return undefined;
  const { id, session, chat } = one;
  if (typeof session !== 'string' || typeof chat !== 'string') return undefined;
  return { id, endpoint, thread, session, chat };
}
