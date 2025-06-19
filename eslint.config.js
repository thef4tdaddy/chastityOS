import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base configuration recommended by ESLint
  pluginJs.configs.recommended,

  // Configuration block for all React-related linting
  {
    files: ['src/**/*.{js,jsx}'], // Apply these rules to all JS and JSX files in the src folder
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_ENV__: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
    rules: {
      // Start with the recommended rules from both plugins
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      
      // Your custom rule overrides
      'react/react-in-jsx-scope': 'off', // Not needed with modern React
      'react/prop-types': 'off', // Turn off prop-types validation
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          varsIgnorePattern: '^[A-Z_]',
        },
      ],
    },
  },
];
