import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import zustandSafePatterns from "./eslint-rules/zustand-safe-patterns.js";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".git/**",
      "coverage/**",
      "*.min.js",
      "*.bundle.js",
      ".vscode/**",
      ".idea/**",
      "*.log",
      ".env*",
      "build/**",
      "public/**/*.js",
      "**/*.test.js",
      "**/*.spec.js",
      "**/__tests__/**", // Exclude test directories
      "scripts/**", // Allow console in build scripts
      "configs/linting/eslint-rules/**", // Exclude custom ESLint rule definitions
      "src/utils/logging.js", // Allow console in logger utility
    ],
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals (when globals: true in vitest.config.js)
        vi: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        suite: "readonly",
        // Node.js globals
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "zustand-safe-patterns": zustandSafePatterns,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off", // Disabled - causes false positives for React Context patterns
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^(_|[A-Z_]+)" }],
      "no-undef": "warn",
      "no-case-declarations": "warn",
      "no-useless-escape": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Block browser dialogs - use ChastityOS UI components instead
      "no-restricted-globals": [
        "error",
        {
          name: "alert",
          message:
            "Use toast notifications instead of alert(). Import { toast } from 'react-toastify' and use toast.error(), toast.success(), etc.",
        },
        {
          name: "confirm",
          message:
            "Use ConfirmModal instead of confirm(). Create a modal component or use a confirmation library.",
        },
        {
          name: "prompt",
          message:
            "Use PromptModal instead of prompt(). Create a modal component for user input.",
        },
      ],

      // Block React Context usage for server data - enforce TanStack Query + Zustand architecture
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["createContext", "useContext"],
              message:
                "Avoid React Context for server data - use TanStack Query + Dexie (see services/ and hooks/api/). For auth state, React Context is acceptable. For UI state: use Zustand stores in src/stores/.",
            },
          ],
        },
      ],

      // File size enforcement - encourage modular code
      "max-lines": [
        "warn",
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // Complexity rules - warn on moderate violations
      complexity: ["warn", { max: 15 }], // Warn on high complexity
      "max-depth": ["warn", 5], // Warn on deep nesting
      "max-params": ["warn", 5], // Warn on too many parameters
      "max-statements": ["warn", 25], // Warn on long functions
      "max-lines-per-function": [
        "warn",
        {
          max: 75,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-nested-callbacks": ["warn", 4], // Warn on nested callbacks

      // Block all console statements - use logger instead
      "no-console": "error",

      // 🏗️ Zustand Store Safety Rules - Prevent React error #185
      "zustand-safe-patterns/zustand-no-getstate-in-useeffect": "error", // CRITICAL: Prevent React error #185
      "zustand-safe-patterns/zustand-no-server-data": "error", // CRITICAL: Enforce TanStack Query for server data
      "zustand-safe-patterns/zustand-store-reference-pattern": "error", // CRITICAL: Prevent React error #185
      "zustand-safe-patterns/zustand-no-store-actions-in-deps": "error", // CRITICAL: Prevent infinite loops
      "zustand-safe-patterns/zustand-no-auto-executing-store-calls": "error", // CRITICAL: Prevent initialization issues
      "zustand-safe-patterns/zustand-selective-subscriptions": "warn", // Performance optimization
      "zustand-safe-patterns/zustand-no-conditional-subscriptions": "warn", // Memory leak prevention

      // Block window dialog patterns that no-restricted-globals doesn't catch
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='confirm']",
          message:
            "Use ConfirmModal instead of window.confirm(). Create a modal component for confirmations.",
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='alert']",
          message:
            "Use toast notifications instead of window.alert(). Import { toast } from 'react-toastify' and use toast.error(), toast.success(), etc.",
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='prompt']",
          message:
            "Use PromptModal instead of window.prompt(). Create a modal component for user input.",
        },
      ],
    },
  },
  {
    // Component architecture enforcement - prevent direct service imports in components
    files: ["src/components/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../services/*", "../../services/*", "../../../services/*"],
              message:
                "Components should not directly import services. Use hooks in src/hooks/ to encapsulate service calls. Utils and hooks are allowed.",
            },
            {
              group: [
                "**/firebase*",
                "**/dexie*",
                "**/storage/*",
                "**/sync/*",
              ],
              message:
                "Components should not import storage or sync utilities directly. Use service hooks from src/hooks/api/ instead.",
            },
          ],
        },
      ],
      // Block direct Firebase/database calls in components
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='firebase']",
          message:
            "Components should not call Firebase directly. Use service layer hooks from src/hooks/api/ instead.",
        },
        {
          selector: "CallExpression[callee.name='db']",
          message:
            "Components should not call database directly. Use service layer hooks from src/hooks/api/ instead.",
        },
        {
          selector: "MemberExpression[object.name='localStorage']",
          message:
            "Components should not use localStorage directly. Use Dexie service through hooks instead.",
        },
      ],
    },
  },
  {
    // Services directory rules - enforce separation from React
    files: ["src/services/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-*"],
              message: "Services should not import React. Keep business logic separate from UI.",
            },
          ],
        },
      ],
      // Services should not use React hooks
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name=/^use[A-Z]/]",
          message: "Services should not use React hooks. Move hook usage to src/hooks/ layer.",
        },
      ],
    },
  },
  {
    // Hooks directory rules - enforce React patterns
    files: ["src/hooks/**/*.{js,jsx}"],
    rules: {
      // Hook files must export hooks only
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration:not([declaration.id.name^='use'])",
          message: "Hook files should only export hooks (functions starting with 'use')",
        },
      ],
    },
  },
  {
    // Files over 400 lines need attention
    files: ["**/*.{js,jsx}"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 400, // 400+ lines = error, needs refactoring soon
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    // Files over 500 lines must be refactored
    files: ["**/*.{js,jsx}"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 500, // 500+ lines = critical, must be refactored
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    // Exclusions for complex utilities that legitimately need higher complexity
    files: [
      "src/utils/**/calculations/**/*.js",
      "src/utils/**/validation/**/*.js",
      "src/utils/**/formatting/**/*.js",
      "src/services/sync/**/*.js",
      "src/services/auth/**/*.js",
      "src/services/storage/**/*.js",
    ],
    rules: {
      complexity: "off", // Complex algorithms and calculations
      "max-depth": "off", // Deep conditional logic for business rules
      "max-statements": "off", // Data processing operations
      "max-lines-per-function": "off", // Complex calculations and transformations
      "max-nested-callbacks": "off", // Async data operations
    },
  },
  {
    // Exclusions for core infrastructure files
    files: [
      "**/firebase.js",
      "**/dexie-config.js",
      "**/main.jsx", // App entry point
      "**/App.jsx", // Main app component
    ],
    rules: {
      "max-lines": "off", // Core infrastructure needs comprehensive coverage
      "max-lines-per-function": "off", // Complex initialization flows
      "max-statements": "off", // Infrastructure setup requires many statements
      complexity: "off", // Core logic is inherently complex
      "max-depth": "off", // Configuration and setup needs deep conditional logic
      "max-params": "off", // Infrastructure methods may need many parameters
    },
  },
  {
    // Exclusions for auth-related files that can use React Context
    files: [
      "**/AuthContext.jsx", // Core auth context
      "**/contexts/*Auth*.{js,jsx}", // Any auth-related context files
      "src/contexts/**/*.{js,jsx}", // All context files
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [], // Allow React Context imports for auth but maintain other restrictions
        },
      ],
    },
  },
  {
    // Allow console statements only in logger.js
    files: ["**/logging.js", "**/logger.js"],
    rules: {
      "no-console": "off", // Logger utility can use console
    },
  },
  {
    // Development and configuration files
    files: [
      "**/*.config.{js,ts}",
      "**/vite.config.*",
      "**/tailwind.config.*",
      "**/postcss.config.*",
      "scripts/**/*.{js,ts}",
    ],
    rules: {
      "no-console": "off", // Allow console in config and build scripts
      "no-undef": "off", // Config files might need Node.js specific patterns
      "max-lines": "off", // Configuration files can be longer
      complexity: "off", // Build configurations can be complex
    },
  },
];