/**
 * ESLint rule: no-direct-icon-imports
 * Enforces centralized icon imports through utils/iconImport.ts
 *
 * This rule prevents direct imports from react-icons/* and lucide-react/*
 * to ensure all icon usage goes through the centralized icon utility.
 *
 * Related: Issue #516
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce centralized icon imports through utils/iconImport',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noDirectIconImport:
        'Direct icon imports are not allowed. Import from centralized utility instead:\n' +
        "  import { IconName } from '../utils/iconImport'\n\n" +
        'If the icon is missing, add it to src/utils/iconImport.ts first.',
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Check if importing from react-icons/* or lucide-react/*
        const isReactIconsImport = source === 'react-icons' || source.startsWith('react-icons/');
        const isLucideImport = source === 'lucide-react' || source.startsWith('lucide-react/');

        if (isReactIconsImport || isLucideImport) {
          context.report({
            node,
            messageId: 'noDirectIconImport',
          });
        }
      },
    };
  },
};
