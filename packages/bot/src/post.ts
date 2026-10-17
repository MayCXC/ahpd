import type { HostTool } from '@ahpd/sdk';
import type { Wake } from './wake.js';

/**
 * The tool a back session answers its main chat with.
 *
 * A person says something to a bot in its main chat, and that message wakes a
 * back session as a turn (see `wake.ts`). The main turn stays open while the
 * work is done, and this is how it ends: the back session calls `post_message`
 * with what the person should be told, and the text becomes the response of the
 * turn they are waiting on.
 *
 * The main chat is found from the session the call was made in, which is the
 * one thing about a call a caller cannot choose - `at.session` - and never from
 * an input. So a back session posts into the chat that woke it and nowhere
 * else, and a session this wake never woke has nothing to post to.
 *
 * A session that ends its turn without posting is ended with a notice instead,
 * which `plugin.ts` hears on `turn_end`; both roads go through the wake, so the
 * two can never end one main turn twice.
 */
/**
 * What a back session is told about the person waiting on it.
 *
 * The bot's own rules are not here - they are its `AGENTS.md`, which its
 * harness reads - and this is the one thing about *this* session no file on
 * disk could say: somebody said something in the main chat, that turn is still
 * open, and `post_message` is what answers it. It is the tool's instruction,
 * so a session is told it exactly when it is offered the tool, a restart
 * included.
 *
 * `send_message` is named because it is the near miss. From inside a session it
 * looks like answering - it puts words where somebody will read them - but it
 * starts a turn somewhere else, and the person in the main chat is not reached
 * by it.
 */
export const POST_INSTRUCTION = 'A person is waiting in the main chat for your reply to the message that woke this session. Only post_message answers them: call it once, when the answer is ready, and the text you give it becomes their reply. send_message starts a turn in another session and does not reply to the person waiting, so do not use it to answer.';

export function postMessage(wake: Wake): HostTool {
  return {
    definition: {
      name: 'post_message',
      title: 'Post Message',
      description: 'Post the reply to the main chat that woke this session. The turn the person is waiting on ends with this text. Post once, when the answer is ready.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'What to say in the main chat, in Markdown.' },
        },
        required: ['text'],
      },
      annotations: { title: 'Post Message', readOnlyHint: false, destructiveHint: false },
    },
    /*
     * Only a session that asked for it has it.
     *
     * The tool means one thing: the chat that woke this session is waiting on
     * the reply. A session nobody is waiting on - anything but a bot's back
     * session - has no such chat, and offering the tool there would be offering
     * a reply to nowhere. The wake names it when it starts a back session, and
     * the name is kept with the session, so a restart offers it again.
     */
    optIn: true,
    instruction: POST_INSTRUCTION,
    /*
     * An answer for the model either way rather than a throw: posting into a
     * chat that is no longer waiting is a call the session can recover from -
     * it says what happened in its own reply - and not a failure of the tool.
     */
    run: (input, at) => {
      const asked = input['text'];
      const text = typeof asked === 'string' ? asked.trim() : '';
      if (text === '') return 'What should the reply say? Give post_message the text to post.';
      if (!wake.posted(at.session, text)) {
        return 'There is no main chat waiting on this session, so there is nothing to post to.';
      }
      return 'Posted to the main chat.';
    },
  };
}
