/**
 * A piece a test loads.
 *
 * It carries a function in each place a piece carries one: the auth's
 * `validate`, a dropdown's `options` and an action's `run`. The answer the
 * child gives must carry none of them.
 */
const validate = async () => ({ valid: true });

export const simple = {
  displayName: 'Simple',
  logoUrl: 'https://example.com/simple.svg',
  auth: {
    type: 'SECRET_TEXT',
    displayName: 'API Key',
    description: 'The key the simple API takes.',
    required: true,
    validate,
  },
  _actions: {
    say: {
      name: 'say',
      displayName: 'Say',
      description: 'Says the text it is given.',
      aiMetadata: { description: 'Says one line, for a model.', idempotent: true },
      props: {
        text: { type: 'SHORT_TEXT', displayName: 'Text', description: 'What to say.', required: true },
        loud: { type: 'CHECKBOX', displayName: 'Loud', required: false },
        count: { type: 'NUMBER', displayName: 'Count', required: false },
        format: {
          type: 'STATIC_DROPDOWN',
          displayName: 'Format',
          required: false,
          options: { options: [{ label: 'Plain', value: 'plain' }, { label: 'Markdown', value: 'markdown' }] },
        },
        channel: {
          type: 'DROPDOWN',
          displayName: 'Channel',
          required: false,
          refreshers: [],
          options: async () => ({ options: [] }),
        },
        when: { type: 'DATE_TIME', displayName: 'When', required: false },
        note: { type: 'MARKDOWN', displayName: 'Note', description: 'Read this first.', required: false },
      },
      run: async (context) => ({ said: context.propsValue.text, auth: context.auth }),
    },
    'upload-file': {
      name: 'upload-file',
      displayName: 'Upload file',
      description: 'Uploads a file.',
      props: {
        file: { type: 'FILE', displayName: 'File', required: true },
      },
      run: async () => ({ uploaded: true }),
    },
  },
  _triggers: {},
};
