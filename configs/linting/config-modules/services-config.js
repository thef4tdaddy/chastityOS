/**
 * ESLint Configuration: Services Directory
 * Enforce separation from React - services should be pure business logic
 */

export default {
  files: ['src/services/**/*.{js,jsx,ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['react', 'react-*'],
            message: 'Services should not import React. Keep business logic separate from UI.',
          },
        ],
      },
    ],
    // Services should not use React hooks
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name=/^use[A-Z]/]',
        message: 'Services should not use React hooks. Move hook usage to src/hooks/ layer.',
      },
    ],
  },
};
