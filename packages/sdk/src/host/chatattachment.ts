import { bag } from '../values.js';
import type { Bag } from '../types/common.js';
import type { MessageAttachment, MessageChatAttachment, SimpleMessageAttachment } from '@microsoft/agent-host-protocol';

/*
 * A `chat` attachment, as the backend is handed it.
 *
 * A message may point at another chat - the client's own `#chat:` completion
 * writes one - and what is attached is a reference: a URI and, when the client
 * knew one, the turn to read up to. A backend cannot read another chat, so the
 * reference is resolved here into the one thing every backend already knows how
 * to take: a `simple` attachment whose `modelRepresentation` is text.
 *
 * This is VS Code's `chatAttachmentContext.ts` ported rather than reinvented -
 * the pointer's wording, the 1000-character tail, the binding rules and the two
 * refusals are its own, because it is the same model reading the same kind of
 * attachment on the other host and a differently-worded pointer would be a
 * second behaviour to keep in step. The text is hard-coded English there and
 * here: the model reads it and no client shows it, so there is nothing to
 * translate and a locale would only be a way for two hosts to say it
 * differently.
 */

/**
 * How much of a referenced chat's transcript is inlined for the model.
 *
 * The transcript itself is unbounded, so rather than inline it whole the
 * pointer names the chat, gives a link to it and the tool that reads it, and
 * carries this much of the end as a taste of what is there. The tail and not
 * the head: the recent turns are what the reference is usually about.
 */
export const MAX_CHAT_ATTACHMENT_EXCERPT_CHARS = 1000;

/** The tool the pointer names, which this host serves - `tools/session.ts`. */
const GET_SESSION_CONTEXT = 'get_session_context';

/**
 * The turns of a chat up to and including one named turn.
 *
 * A named turn that is not in the transcript throws, and the caller turns that
 * into a refusal: the protocol says `endTurn` MUST name a completed retained
 * turn, and a client that named one this host cannot find has attached
 * something nobody can read. An absent one is every turn, because the caller
 * has already pinned the latest completed turn where it had to.
 *
 * The turns are a chat's own state rather than the protocol's `Turn`: what a
 * backend wrote is read field by field everywhere else in this host, and a
 * transcript off the wire is not a thing to trust as a type.
 */
export function boundChatTranscriptTurns(turns: readonly Bag[], endTurn?: string): readonly Bag[] {
  if (endTurn === undefined) return turns;
  const index = turns.findIndex((turn) => turn.id === endTurn);
  if (index < 0) throw new Error(`Chat attachment endTurn ${endTurn} was not found in the retained transcript.`);
  return turns.slice(0, index + 1);
}

/**
 * The bounded turns as plain text, for the model.
 *
 * Only what a person said and what the agent answered: the message's own text
 * and the markdown parts of the response. Tool calls, reasoning, notices and
 * the rest are left out, because what a chat is attached for is the
 * conversation in it and not the machinery that produced it - and because the
 * excerpt is cut to a length that one tool call's input would fill.
 *
 * A nested attachment is never expanded here. A chat attached to a message
 * inside the transcript is read as that message's text and nothing more, which
 * is what keeps this a bounded read: resolving one would read the chat it names
 * and whatever that one names in turn, for as long as a client cared to write.
 */
export function formatChatTranscript(turns: readonly Bag[]): string {
  const blocks: string[] = [];
  for (const turn of turns) {
    const message = bag(turn.message);
    const userText = typeof message.text === 'string' ? message.text.trim() : '';
    if (userText !== '') blocks.push(`User: ${userText}`);
    const parts = (Array.isArray(turn.responseParts) ? turn.responseParts : []) as Bag[];
    const assistantText = parts
      .filter((part) => part.kind === 'markdown')
      .map((part) => String(part.content ?? ''))
      .join('')
      .trim();
    if (assistantText !== '') blocks.push(`Assistant: ${assistantText}`);
  }
  return blocks.join('\n\n');
}

/**
 * The last `maxChars` characters of a text, dropping the front.
 *
 * The tail rather than a middle cut, so what survives is the most recent part
 * of the conversation - the same reason the excerpt is taken at all.
 */
function truncateFront(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.slice(text.length - maxChars);
}

/**
 * The pointer a resolved chat attachment carries.
 *
 * It names the chat by the label the client gave it, identifies it by a link
 * where one could be built, and carries as much of the transcript as the cap
 * allows. The link is what the model reads the rest with: the tool it names is
 * this host's own and takes the link as its session argument.
 *
 * No link means the chat could not be named as one this host is running, and
 * the pointer then identifies it by the raw resource instead - a reference
 * that cannot be opened still carries what it can rather than failing a turn
 * somebody already sent.
 */
function buildChatAttachmentPointer(
  label: string,
  resource: string,
  openLink: string | undefined,
  transcript: string,
): string {
  const intro = openLink
    ? `The user referenced another chat, "${label}". `
      + `That chat is identified by the link ${openLink}. `
      + `To read its full transcript, call the ${GET_SESSION_CONTEXT} server tool with its "session" argument set to that link.`
    : `The user referenced another chat, "${label}", identified by ${resource}.`;

  if (transcript === '') {
    return `${intro}\n\nThe referenced chat has no transcript content up to the selected turn.`;
  }

  if (transcript.length > MAX_CHAT_ATTACHMENT_EXCERPT_CHARS) {
    const excerpt = truncateFront(transcript, MAX_CHAT_ATTACHMENT_EXCERPT_CHARS);
    return `${intro}\n\nThe excerpt below is only the tail end of that transcript up to the selected turn (about the last ${MAX_CHAT_ATTACHMENT_EXCERPT_CHARS} characters; the earlier part was omitted to keep the most recent content):\n\n${excerpt}`;
  }

  return `${intro}\n\nThe excerpt below is that chat's full transcript up to the selected turn:\n\n${transcript}`;
}

/**
 * The reference each pointer this process made was made of.
 *
 * A resolved attachment is what the backend is handed, and a backend hands the
 * turn it began back with the same objects on it - so the pointer would be what
 * a client reads on that turn, transcript and all, where what the person
 * attached was a reference to a chat. This is how the reference is found again
 * on the way out, without a turn id: the thing that was rewritten is the thing
 * to look it up by, and it works the same for a turn, a message waiting behind
 * one and a steering message, which are three different ids and three different
 * actions.
 *
 * A weak map because the bond lasts exactly as long as the pointer does, and a
 * pointer is let go of with the turn that carried it.
 */
const WAS = new WeakMap<MessageAttachment, MessageAttachment>();

/**
 * A pointer, remembering the chat attachment it stands for.
 *
 * Called where the pointer is made rather than where it is handed over, because
 * this is the only moment both are in hand.
 */
export function keepChatAttachment(
  pointer: SimpleMessageAttachment,
  was: MessageChatAttachment,
): SimpleMessageAttachment {
  WAS.set(pointer, was);
  return pointer;
}

/**
 * What this attachment was before this host resolved it.
 *
 * The attachment itself where it is not one this host made, so a message can be
 * put back whole by mapping this over its attachments.
 */
export function asSentAttachment(one: MessageAttachment): MessageAttachment {
  return WAS.get(one) ?? one;
}

/**
 * A `chat` attachment as the `simple` attachment the backend reads.
 *
 * The label and the range come across, because a client draws the label and
 * marks the range in the text it kept; everything else about the reference is
 * spent here. `sourceTurns` are the turns of the chat it names, already cut to
 * what the sender may read, and an empty list is a chat whose transcript is not
 * being handed over - the pointer says so rather than the turn failing.
 *
 * `keepChatAttachment` is the caller's, not this function's: what was resolved
 * is a decision the host made about a client's message, and a function that
 * only ever writes a pointer has no business knowing that a client ever sent
 * one.
 */
export function resolveChatAttachment(
  attachment: MessageChatAttachment,
  sourceTurns: readonly Bag[],
  openLink: string | undefined,
): SimpleMessageAttachment {
  const bounded = boundChatTranscriptTurns(sourceTurns, attachment.endTurn);
  const transcript = formatChatTranscript(bounded);
  const modelRepresentation = buildChatAttachmentPointer(
    attachment.label,
    attachment.resource,
    openLink,
    transcript,
  );
  return {
    // The protocol declares the discriminant as an enum member whose value is
    // this string. Cast rather than imported as a value: it is a `declare const
    // enum`, so there is nothing to import at runtime, and every other place in
    // this host reads and writes these discriminants as the strings on the
    // wire.
    type: 'simple' as SimpleMessageAttachment['type'],
    label: attachment.label,
    modelRepresentation,
    ...(attachment.range !== undefined ? { range: attachment.range } : {}),
  };
}
