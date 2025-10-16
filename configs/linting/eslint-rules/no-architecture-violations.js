/**
 * ESLint Rule: no-architecture-violations
 * Enforces ChastityOS architecture patterns to prevent common violations
 *
 * Prevents:
 * 1. localStorage/sessionStorage usage outside service layer
 * 2. Utils files in hooks directory (should be in /src/utils/)
 * 3. Validation functions outside /src/utils/validation/
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce ChastityOS architecture patterns',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowStorageInServices: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noLocalStorageInHooks:
        'localStorage/sessionStorage should not be used in hooks. Use service layer (e.g., EventDraftStorageService, SessionPersistenceService) instead. See ARCHITECTURE_VIOLATIONS.md',
      noUtilsInHooks:
        'Utility files (*-utils.ts, *-helpers.ts) should be in /src/utils/, not /src/hooks/. Move to appropriate utils subdirectory. See ARCHITECTURE_VIOLATIONS.md',
      noValidationOutsideUtils:
        'Validation functions (validate*, is*Valid) should be in /src/utils/validation/, not in hooks. Extract to utils/validation/ directory. See ARCHITECTURE_VIOLATIONS.md',
    },
  },

  create(context) {
    const filename = context.getFilename();
    const options = context.options[0] || {};
    const allowStorageInServices = options.allowStorageInServices !== false;

    // Check if file is in hooks directory
    const isInHooksDir = filename.includes('/src/hooks/');
    const isInServicesDir = filename.includes('/src/services/');

    // Check if filename suggests it's a utils file
    const isUtilsFile =
      filename.endsWith('-utils.ts') ||
      filename.endsWith('-utils.tsx') ||
      filename.endsWith('-helpers.ts') ||
      filename.endsWith('-helpers.tsx');

    return {
      // Detect localStorage/sessionStorage usage
      MemberExpression(node) {
        // Skip if in services directory and storage is allowed
        if (isInServicesDir && allowStorageInServices) {
          return;
        }

        // Check for localStorage or sessionStorage
        if (
          node.object.type === 'Identifier' &&
          (node.object.name === 'localStorage' || node.object.name === 'sessionStorage')
        ) {
          // Only error in hooks directory
          if (isInHooksDir) {
            context.report({
              node,
              messageId: 'noLocalStorageInHooks',
            });
          }
        }
      },

      // Detect utils files in hooks directory
      Program(node) {
        if (isInHooksDir && isUtilsFile) {
          context.report({
            node,
            messageId: 'noUtilsInHooks',
          });
        }
      },

      // Detect validation functions outside utils/validation/
      FunctionDeclaration(node) {
        // Skip if already in utils/validation directory
        if (filename.includes('/src/utils/validation/')) {
          return;
        }

        // Check if function name suggests validation
        const functionName = node.id?.name || '';
        const isValidationFunction =
          functionName.startsWith('validate') ||
          functionName.endsWith('Valid') ||
          functionName.startsWith('isValid') ||
          functionName.startsWith('checkValid');

        // Only report if in hooks directory
        if (isInHooksDir && isValidationFunction) {
          context.report({
            node,
            messageId: 'noValidationOutsideUtils',
          });
        }
      },

      // Also check arrow function expressions and function expressions
      VariableDeclarator(node) {
        // Skip if already in utils/validation directory
        if (filename.includes('/src/utils/validation/')) {
          return;
        }

        // Check for exported const functionName = () => {} patterns
        if (
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
        ) {
          const variableName = node.id?.name || '';
          const isValidationFunction =
            variableName.startsWith('validate') ||
            variableName.endsWith('Valid') ||
            variableName.startsWith('isValid') ||
            variableName.startsWith('checkValid');

          // Only report if in hooks directory
          if (isInHooksDir && isValidationFunction) {
            context.report({
              node,
              messageId: 'noValidationOutsideUtils',
            });
          }
        }
      },
    };
  },
};
