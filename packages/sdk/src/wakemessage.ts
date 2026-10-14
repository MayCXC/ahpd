/**
 * The message a woken run begins with.
 *
 * The agent reads its message and nothing else - the event that woke the run
 * rides on the run's origin, where no agent looks. So the message is where the
 * event has to arrive, twice over: named in the text where the person writing
 * the automation asked for it, and stated at the end so a run that names
 * nothing still knows what it is answering.
 */

/**
 * What a run is told about the event that woke it.
 *
 * The same facts wherever the wake came from. A session event names the
 * session it happened in; an event a plugin fired may name none, and a message
 * that asks for one is then filled with nothing rather than left as it was.
 */
export interface WakeFacts {
  /** The trigger's own title, as the saved trigger wrote it. */
  trigger: string;
  /** The event's plain title, as the type that offers it names it. */
  event: string;
  /** The session it happened in, where the event was about one. */
  session?: string | undefined;
  /** That session's title, where this host has one to give. */
  sessionTitle?: string | undefined;
  /** How many events the rule counted. */
  count: number;
  /** When it happened, ISO 8601. */
  at: string;
  /**
   * The data a plugin fired the event with, which `{{event.<field>}}` reads.
   * Absent on a session event.
   */
  data?: Record<string, unknown> | undefined;
}

/** The names a message may carry, in one place so the list is checkable. */
export const WAKE_PLACEHOLDERS = ['session', 'sessionTitle', 'event', 'count', 'trigger', 'at', 'event.<field>'] as const;

/** `{{name}}`, or `{{name.field}}` for one top-level field. */
const PLACEHOLDER = /\{\{(\w+)(?:\.(\w+))?\}\}/gu;

/** One field of a fire's data as text: a string as it is, any other value as JSON, and nothing for a missing one. */
const fieldText = (data: Record<string, unknown> | undefined, field: string): string => {
  if (data === undefined || !Object.hasOwn(data, field)) return '';
  const value = data[field];
  if (value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/**
 * A text with each `{{word}}` that `words` holds filled with its value.
 *
 * A dotted name such as `{{event.repo}}` is looked up whole. A name the map
 * does not hold is left exactly as it was written.
 */
export function fillWords(text: string, words: Readonly<Record<string, string>>): string {
  return text.replace(PLACEHOLDER, (whole, name: string, field: string | undefined) => {
    const key = field === undefined ? name : `${name}.${field}`;
    return Object.hasOwn(words, key) ? words[key] as string : whole;
  });
}

/**
 * The block a woken run's message ends with.
 *
 * Four lines, because four is what is worth knowing: what happened, where, how
 * many times, and when. A session is named by its title and its URI both,
 * because the title is what a person recognises and the URI is what a client
 * opens.
 */
const summary = (facts: WakeFacts): string => [
  `What woke this run: ${facts.event}`,
  ...(facts.session === undefined
    ? []
    : [`Session: ${facts.sessionTitle === undefined ? facts.session : `${facts.sessionTitle} (${facts.session})`}`]),
  `Count: ${String(facts.count)}`,
  `At: ${facts.at}`,
].join('\n');

/**
 * The first message of a woken run.
 *
 * Every placeholder the automation wrote is filled, and one that is not in
 * {@link WAKE_PLACEHOLDERS} is left exactly as it was written: this host fills
 * the ones it offers and does not claim a meaning for anything else.
 * `{{event.<field>}}` is one field of the fire's data.
 */
export function wakeMessage(text: string, facts: WakeFacts): string {
  const held: Record<Exclude<(typeof WAKE_PLACEHOLDERS)[number], 'event.<field>'>, string> = {
    session: facts.session ?? '',
    sessionTitle: facts.sessionTitle ?? '',
    event: facts.event,
    count: String(facts.count),
    trigger: facts.trigger,
    at: facts.at,
  };
  // Each field the text names, so a field the data does not hold is filled with nothing.
  const fields = Object.fromEntries([...text.matchAll(PLACEHOLDER)]
    .filter((match) => match[1] === 'event' && match[2] !== undefined)
    .map((match) => [`event.${match[2] as string}`, fieldText(facts.data, match[2] as string)]));
  return `${fillWords(text, { ...held, ...fields })}\n\n${summary(facts)}`;
}
