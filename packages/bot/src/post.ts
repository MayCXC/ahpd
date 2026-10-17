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
