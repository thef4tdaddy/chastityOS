import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import { fixupConfigRules } from '@eslint/compat';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

export default [
  pluginJs.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    // FIX: This section now explicitly applies all the React rules and settings
    // to both .js and .jsx files within your 'src' directory.
    files: ['src/**/*.{js,jsx}'],
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
        version: 'detect',
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
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
