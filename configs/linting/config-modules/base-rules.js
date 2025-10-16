/**
 * ESLint Configuration: Base Rules
 * Core rules that apply to all files
 */

import js from '@eslint/js';

export const baseRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|[A-Z_]+)' }],
  'no-undef': 'warn',
  'no-case-declarations': 'warn',
  'no-useless-escape': 'warn',

  // Block browser dialogs - use new toast system instead
  'no-restricted-globals': [
    'error',
    {
      name: 'alert',
      message:
        "Use new toast system instead of alert(). Import { useToast } from '@/contexts' and use showError(), showSuccess(), etc.",
    },
    {
      name: 'confirm',
      message:
        'Use toast with action button instead of confirm(). Use showWarning() with action option or create ConfirmModal.',
    },
    {
      name: 'prompt',
      message: 'Use PromptModal instead of prompt(). Create a modal component for user input.',
    },
  ],

  // Block React Context usage for server data - enforce TanStack Query + Zustand architecture
  // Block direct icon imports - enforce centralized icon utility
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'react',
          importNames: ['createContext', 'useContext'],
          message:
            'Avoid React Context for server data - use TanStack Query + Dexie (see services/ and hooks/api/). For auth state, React Context is acceptable. For UI state: use Zustand stores in src/stores/.',
        },
        {
          name: 'react-toastify',
          message:
            "Use new toast system instead of react-toastify. Import { useToast } from '@/contexts' and use showSuccess(), showError(), etc.",
        },
        {
          name: 'react-icons',
          message:
            "Import icons from the local utility only: import { IconName } from '../utils/iconImport'",
        },
        {
          name: 'lucide-react',
          message:
            "Import icons from the local utility only: import { IconName } from '../utils/iconImport'",
        },
      ],
      patterns: [
        {
          group: ['react-icons/*'],
          message:
            "Import icons from the local utility only: import { IconName } from '../utils/iconImport'",
        },
        {
          group: ['lucide-react/*'],
          message:
            "Import icons from the local utility only: import { IconName } from '../utils/iconImport'",
        },
      ],
    },
  ],

  // File size enforcement - encourage modular code
  'max-lines': [
    'warn',
    {
      max: 300,
      skipBlankLines: true,
      skipComments: true,
    },
  ],

  // Complexity rules - warn on moderate violations
  complexity: ['warn', { max: 15 }],
  'max-depth': ['warn', 5],
  'max-params': ['warn', 5],
  'max-statements': ['warn', 25],
  'max-lines-per-function': [
    'warn',
    {
      max: 150,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true,
    },
  ],
  'max-nested-callbacks': ['warn', 4],

  // Phase 3 COMPLETE: Block all console statements - use logger instead
  'no-console': 'error',

  // Block window dialog patterns that no-restricted-globals doesn't catch
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.object.name='window'][callee.property.name='confirm']",
      message:
        'Use ConfirmModal instead of window.confirm(). Create a modal component for confirmations.',
    },
    {
      selector: "CallExpression[callee.object.name='window'][callee.property.name='alert']",
      message:
        "Use new toast system instead of window.alert(). Import { useToast } from '@/contexts' and use showError(), showSuccess(), etc.",
    },
    {
      selector: "CallExpression[callee.object.name='window'][callee.property.name='prompt']",
      message:
        'Use PromptModal instead of window.prompt(). Create a modal component for user input.',
    },
  ],

  // Ignore merge conflict markers to reduce noise in lint tracking
  'no-irregular-whitespace': [
    'error',
    {
      skipTemplates: true,
      skipComments: true,
      skipRegExps: true,
      skipJSXText: true,
    },
  ],
};
