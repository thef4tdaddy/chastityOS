/**
 * ESLint Configuration: Hooks Directory
 * Enforces React patterns and architecture rules for hooks
 */

export default {
  // Hooks directory rules - enforce React patterns (excluding utility files)
  files: ['src/hooks/**/*.{js,jsx,ts,tsx}'],
  ignores: [
    'src/hooks/api/queryClient.ts', // QueryClient setup utility
    'src/hooks/**/types.{ts,tsx}', // Type definition files
    'src/hooks/**/constants.{ts,tsx}', // Constants files
    'src/hooks/**/*-utils.{ts,tsx}', // Utility files (e.g., auth-utils.ts, events-utils.ts)
    'src/hooks/**/*-operations.{ts,tsx}', // Operations files (e.g., notification-operations.ts)
  ],
  rules: {
    // Hook files must export hooks only - allow types and interfaces
    'no-restricted-syntax': [
      'error',
      {
        selector: "ExportDefaultDeclaration > Identifier:not([name^='use'])",
        message: "Hook files should only export hooks (functions starting with 'use')",
      },
      {
        selector:
          'ExportNamedDeclaration:not(:has(TSTypeAliasDeclaration, TSInterfaceDeclaration)) > VariableDeclaration > VariableDeclarator[id.name!=/^use/]',
        message:
          "Hook files should only export hooks (functions starting with 'use') - types and interfaces are allowed",
      },
      {
        selector:
          'ExportNamedDeclaration:not(:has(TSTypeAliasDeclaration, TSInterfaceDeclaration)) > FunctionDeclaration[id.name!=/^use/]',
        message:
          "Hook files should only export hooks (functions starting with 'use') - types and interfaces are allowed",
      },
    ],
  },
};
