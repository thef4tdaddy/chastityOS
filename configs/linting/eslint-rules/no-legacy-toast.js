/**
 * ESLint rule: no-legacy-toast
 * Prevents usage of legacy toast methods and encourages migration to new toast system
 */

const noLegacyToast = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow legacy toast usage (react-toastify, custom alert banners)",
      category: "Migration",
      recommended: true,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allowedImports: {
            type: "array",
            items: { type: "string" },
            description: "List of allowed legacy imports (for gradual migration)",
          },
          severity: {
            type: "string",
            enum: ["warn", "error"],
            default: "warn",
            description: "Severity level for the rule",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noReactToastifyImport: 
        "Legacy toast import detected. Use 'import { useToast } from \"@/contexts\"' instead of react-toastify.",
      noToastCall: 
        "Legacy toast method call detected. Use 'const { showSuccess, showError } = useToast()' instead of toast.{{ methodName }}().",
      noAlertCall:
        "Legacy alert() detected. Use 'const { showError } = useToast()' instead of alert().",
      noConfirmCall:
        "Legacy confirm() detected. Use toast with action button instead of confirm().",
      useNewToastSystem:
        "Consider using the new toast system: const { showSuccess, showError, showWarning, showInfo, showUrgent } = useToast()",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedImports = options.allowedImports || [];
    const sourceCode = context.getSourceCode();

    // Track if file has legacy imports that might be allowed temporarily
    let hasAllowedLegacyImport = false;

    return {
      // Check for react-toastify imports
      ImportDeclaration(node) {
        if (node.source.value === "react-toastify") {
          // Check if this import is in the allowed list
          const filePath = context.getFilename();
          const isAllowed = allowedImports.some(pattern => 
            filePath.includes(pattern) || pattern === "*"
          );

          if (!isAllowed) {
            context.report({
              node,
              messageId: "noReactToastifyImport",
              fix(fixer) {
                // Suggest replacement import
                return fixer.replaceText(
                  node,
                  'import { useToast } from "@/contexts";'
                );
              },
            });
          } else {
            hasAllowedLegacyImport = true;
          }
        }
      },

      // Check for toast method calls
      CallExpression(node) {
        // Skip if file has allowed legacy imports
        if (hasAllowedLegacyImport) return;

        // Check for toast.method() calls
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "toast" &&
          node.callee.property.type === "Identifier"
        ) {
          const methodName = node.callee.property.name;
          context.report({
            node,
            messageId: "noToastCall",
            data: { methodName },
            fix(fixer) {
              // Simple replacement for common patterns
              let replacement = "";
              switch (methodName) {
                case "success":
                  replacement = "showSuccess";
                  break;
                case "error":
                  replacement = "showError";
                  break;
                case "warn":
                case "warning":
                  replacement = "showWarning";
                  break;
                case "info":
                  replacement = "showInfo";
                  break;
                default:
                  replacement = "showToast";
              }
              
              // Only fix simple cases with string message
              if (node.arguments.length === 1 && 
                  node.arguments[0].type === "Literal" &&
                  typeof node.arguments[0].value === "string") {
                return fixer.replaceText(
                  node,
                  `${replacement}("${node.arguments[0].value}")`
                );
              }
              return null; // Complex cases need manual migration
            },
          });
        }

        // Check for alert() calls
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "alert"
        ) {
          context.report({
            node,
            messageId: "noAlertCall",
            fix(fixer) {
              if (node.arguments.length === 1 && 
                  node.arguments[0].type === "Literal" &&
                  typeof node.arguments[0].value === "string") {
                return fixer.replaceText(
                  node,
                  `showError("${node.arguments[0].value}")`
                );
              }
              return null;
            },
          });
        }

        // Check for confirm() calls
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "confirm"
        ) {
          context.report({
            node,
            messageId: "noConfirmCall",
          });
        }
      },

      // Provide helpful suggestions at the end of files without toast imports
      "Program:exit"(node) {
        if (hasAllowedLegacyImport) return;

        // Check if file uses any toast-related patterns but doesn't import useToast
        const hasUseToastImport = sourceCode.text.includes("useToast");
        const hasToastUsage = 
          sourceCode.text.includes("toast.") ||
          sourceCode.text.includes("alert(") ||
          sourceCode.text.includes("confirm(");

        if (hasToastUsage && !hasUseToastImport) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "useNewToastSystem",
          });
        }
      },
    };
  },
};

export default noLegacyToast;