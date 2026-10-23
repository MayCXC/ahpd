/**
 * A piece whose actions a call makes.
 *
 * Each action reads a different part of the context, so a case can tell what
 * the child built: `echo` reads `auth` and `propsValue`, `remember` and `recall`
 * read the connector's `store`, `env` reads the child's environment, `fail`
 * throws, and `slow` answers after the timeout a call gives up at.
 */
export const runnable = {
  displayName: 'Runnable',
  description: 'A piece whose calls a test makes.',
  auth: { type: 'SECRET_TEXT', displayName: 'API Key', required: true },
  _actions: {
    echo: {
      name: 'echo',
      displayName: 'Echo',
      description: 'Answers the text it got, and the auth it ran with.',
      props: { text: { type: 'SHORT_TEXT', displayName: 'Text', required: true } },
      run: async (context) => ({ text: context.propsValue.text, auth: context.auth }),
    },
    remember: {
      name: 'remember',
      displayName: 'Remember',
      description: 'Keeps the text in the connector store, and answers what was there.',
      props: { text: { type: 'SHORT_TEXT', displayName: 'Text', required: true } },
      run: async (context) => {
        const before = await context.store.get('text');
        await context.store.put('text', context.propsValue.text);
        return { before };
      },
    },
    recall: {
      name: 'recall',
      displayName: 'Recall',
      description: 'Answers the text the connector kept.',
      props: {},
      run: async (context) => ({ text: await context.store.get('text') }),
    },
    env: {
      name: 'env',
      displayName: 'Env',
      description: 'Answers the daemon token the child can read, if any.',
      props: {},
      run: async () => ({ token: process.env.AHPD_TOKEN ?? null }),
    },
    fail: {
      name: 'fail',
      displayName: 'Fail',
      description: 'Throws an error.',
      props: {},
      run: async () => { throw new Error('the action failed'); },
    },
    slow: {
      name: 'slow',
      displayName: 'Slow',
      description: 'Answers after a while.',
      props: {},
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { late: true };
      },
    },
  },
  _triggers: {},
};
