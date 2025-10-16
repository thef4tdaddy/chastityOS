/**
 * ESLint Configuration: Components Directory
 * Component architecture enforcement - prevent direct service imports
 */

export default {
  files: ['src/components/**/*.{js,jsx,ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../services/*', '../../services/*', '../../../services/*'],
            message:
              'Components should not directly import services. Use hooks in src/hooks/ to encapsulate service calls. Utils and hooks are allowed.',
          },
          {
            group: ['**/firebase*', '**/dexie*', '**/storage/*', '**/sync/*'],
            message:
              'Components should not import storage or sync utilities directly. Use service hooks from src/hooks/api/ instead.',
          },
        ],
      },
    ],
    // Block direct Firebase/database calls in components
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='firebase']",
        message:
          'Components should not call Firebase directly. Use service layer hooks from src/hooks/api/ instead.',
      },
      {
        selector: "CallExpression[callee.name='db']",
        message:
          'Components should not call database directly. Use service layer hooks from src/hooks/api/ instead.',
      },
      {
        selector: "MemberExpression[object.name='localStorage']",
        message:
          'Components should not use localStorage directly. Use Dexie service through hooks instead.',
      },
    ],
  },
};
