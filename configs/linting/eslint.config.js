import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

// Custom ESLint rules
import zustandSafePatterns from './eslint-rules/zustand-safe-patterns.js';
import noLegacyToast from './eslint-rules/no-legacy-toast.js';
import noArchitectureViolations from './eslint-rules/no-architecture-violations.js';
import noDirectIconImports from './eslint-rules/no-direct-icon-imports.js';
import enforceUILibrary from './eslint-rules/enforce-ui-library.js';

// Modular config files
import { baseRules } from './config-modules/base-rules.js';
import hooksConfig from './config-modules/hooks-config.js';
import componentsConfig from './config-modules/components-config.js';
import servicesConfig from './config-modules/services-config.js';
import exclusionsConfig from './config-modules/exclusions-config.js';

export default [
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      '.git/**',
      'coverage/**',
      '*.min.js',
      '*.bundle.js',
      '.vscode/**',
      '.idea/**',
      '*.log',
      '.env*',
      'build/**',
      'public/**/*.js',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/__tests__/**',
      'scripts/**',
      'configs/linting/eslint-rules/**',
      'configs/linting/config-modules/**', // Exclude config modules
      'configs/linting/eslint.config.js', // Exclude main config file
      'src/utils/logging.js',
      'original-app/**',
      'playwright.config.ts',
      'src/test/test-helpers.ts',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        suite: 'readonly',
        // Node.js globals
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'zustand-safe-patterns': zustandSafePatterns,
      'no-legacy-toast': { rules: { 'no-legacy-toast': noLegacyToast } },
      'no-architecture-violations': {
        rules: { 'no-architecture-violations': noArchitectureViolations },
      },
      'no-direct-icon-imports': {
        rules: { 'no-direct-icon-imports': noDirectIconImports },
      },
      'enforce-ui-library': {
        rules: { 'enforce-ui-library': enforceUILibrary },
      },
    },
    rules: {
      ...baseRules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // 🏗️ Zustand Store Safety Rules - Prevent React error #185
      'zustand-safe-patterns/zustand-no-getstate-in-useeffect': 'error',
      'zustand-safe-patterns/zustand-no-server-data': 'error',
      'zustand-safe-patterns/zustand-store-reference-pattern': 'error',
      'zustand-safe-patterns/zustand-no-store-actions-in-deps': 'error',
      'zustand-safe-patterns/zustand-no-auto-executing-store-calls': 'error',
      'zustand-safe-patterns/zustand-selective-subscriptions': 'warn',
      'zustand-safe-patterns/zustand-no-conditional-subscriptions': 'warn',

      // 🧹 Toast Migration Rule
      'no-legacy-toast/no-legacy-toast': [
        'warn',
        {
          allowedImports: [
            'src/components/achievements/AchievementNotification.tsx',
            'src/pages/showcase/TouchTargetsDemo.tsx',
          ],
          severity: 'warn',
        },
      ],

      // 🏗️ Architecture Violations - Enforce clean architecture patterns (Issue #421)
      'no-architecture-violations/no-architecture-violations': [
        'error',
        {
          allowStorageInServices: true,
        },
      ],

      // 🎨 Icon Import Enforcement - Centralized icon imports (Issue #516)
      'no-direct-icon-imports/no-direct-icon-imports': 'error',

      // 🎨 UI Library Enforcement - Use UI library components (Issue #491)
      'enforce-ui-library/enforce-ui-library': 'warn', // warn during migration
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: false,
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Directory-specific configurations
  componentsConfig,
  servicesConfig,
  hooksConfig,

  // File size enforcement
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'max-lines': [
        'error',
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'max-lines': [
        'error',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },

  // Exclusions and special cases
  ...exclusionsConfig,
];
