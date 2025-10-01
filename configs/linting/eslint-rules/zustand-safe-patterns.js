/**
 * Custom ESLint rules for safe Zustand patterns in ChastityOS
 * Prevents React error #185 and enforces architectural best practices
 *
 * These rules ensure proper separation between server state (TanStack Query)
 * and UI state (Zustand) while preventing dangerous patterns that cause
 * infinite render loops.
 */

export default {
  rules: {
    'zustand-no-getstate-in-useeffect': {
      meta: {
        type: 'error',
        docs: {
          description: 'Prevent getState() calls in useEffect hooks to avoid React error #185',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          noGetStateInUseEffect:
            'Dangerous pattern: getState() call in useEffect detected! This causes React error #185 infinite render loops. ' +
            'Use proper store subscription instead: const data = useUIStore(state => state.data). ' +
            'For server data, use TanStack Query hooks instead. See docs/development/architecture/data-flow.md for correct patterns.',
        },
      },
      create(context) {
        let inUseEffect = false;

        return {
          CallExpression(node) {
            // Detect useEffect calls
            if (node.callee.name === 'useEffect') {
              inUseEffect = true;
              return;
            }

            // Check for getState() calls inside useEffect
            if (
              inUseEffect &&
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'getState' &&
              node.arguments.length === 0
            ) {
              context.report({
                node,
                messageId: 'noGetStateInUseEffect',
              });
            }
          },

          'CallExpression:exit'(node) {
            if (node.callee.name === 'useEffect') {
              inUseEffect = false;
            }
          },
        };
      },
    },

    'zustand-no-server-data': {
      meta: {
        type: 'error',
        docs: {
          description: 'Prevent storing server data in Zustand stores - use TanStack Query instead',
          category: 'Architecture',
          recommended: true,
        },
        schema: [],
        messages: {
          noServerDataInZustand:
            "Zustand should only contain UI state! Server data like 'sessions', 'events', 'tasks', 'users' should use TanStack Query. " +
            'Move this to a service with TanStack Query hooks. See docs/development/architecture/overview.md for data flow patterns.',
        },
      },
      create(context) {
        const serverDataPatterns = [
          // ChastityOS server data
          /^(sessions?|currentSession)$/,
          /^(events?|sessionEvents?)$/,
          /^(tasks?|userTasks?)$/,
          /^(users?|userProfile|profile)$/,
          /^(keyholders?|keyholderData)$/,
          /^(settings|userSettings)$/,
          // Firebase/API data patterns
          /firebase/i,
          /api/i,
          /sync/i,
          /cache(?!d)/i, // Allow 'cached' but not 'cache'
          /server/i,
          /remote/i,
        ];

        return {
          ObjectExpression(node) {
            // Check if we're in a Zustand store (looking for patterns in store objects)
            const parent = node.parent;
            if (
              parent &&
              parent.type === 'CallExpression' &&
              (parent.callee.name === 'create' ||
                (parent.callee.type === 'MemberExpression' &&
                  parent.callee.property.name === 'create'))
            ) {
              // We're in a Zustand store, check for server data properties
              node.properties.forEach(prop => {
                if (prop.type === 'Property' && prop.key) {
                  const keyName = prop.key.name || prop.key.value;
                  if (typeof keyName === 'string') {
                    const hasServerDataPattern = serverDataPatterns.some(pattern =>
                      pattern.test(keyName)
                    );

                    if (hasServerDataPattern) {
                      context.report({
                        node: prop,
                        messageId: 'noServerDataInZustand',
                      });
                    }
                  }
                }
              });
            }
          },
        };
      },
    },

    'zustand-no-store-actions-in-deps': {
      meta: {
        type: 'error',
        docs: {
          description: 'Prevent Zustand store actions in useEffect dependency arrays',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          noStoreActionsInDeps:
            'Dangerous pattern: Store action in useEffect dependency array! This causes React error #185 infinite render loops. ' +
            'Zustand store actions are stable and should not be in dependency arrays. ' +
            'Remove store actions from the dependency array to fix this issue.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Look for useEffect calls
            if (node.callee.name === 'useEffect' && node.arguments.length >= 2) {
              const depsArray = node.arguments[1];

              // Check if dependencies array exists
              if (depsArray && depsArray.type === 'ArrayExpression') {
                depsArray.elements.forEach(dep => {
                  if (!dep || dep.type !== 'Identifier') return;

                  const depName = dep.name;

                  // Exclude common non-action patterns (props, state, config, flags)
                  const nonActionPatterns = [
                    /Enabled$/,    // realTimeSyncEnabled, featureEnabled, etc.
                    /Interval$/,   // syncInterval, updateInterval, etc.
                    /Permissions$/, // syncPermissions, userPermissions, etc.
                    /Settings$/,   // appSettings, userSettings, etc.
                    /Config$/,     // syncConfig, apiConfig, etc.
                    /Status$/,     // syncStatus, loadStatus, etc.
                    /^is[A-Z]/,    // isLoading, isOpen, etc.
                    /^has[A-Z]/,   // hasData, hasError, etc.
                    /^can[A-Z]/,   // canEdit, canDelete, etc.
                    /^should[A-Z]/, // shouldUpdate, shouldSync, etc.
                    /Data$/,       // userData, sessionData, etc.
                    /State$/,      // appState, formState, etc.
                  ];

                  // Check if it's a non-action pattern
                  const isNonAction = nonActionPatterns.some(pattern => pattern.test(depName));
                  if (isNonAction) return;

                  // Check for store hook calls that return actions
                  if (
                    // ChastityOS store action patterns (verbs only)
                    /^(open|close|set|toggle|update|reset|clear|add|remove|save|load|sync|start|end|pause|resume)[A-Z]/.test(
                      depName
                    )
                  ) {
                    context.report({
                      node: dep,
                      messageId: 'noStoreActionsInDeps',
                    });
                  }
                });
              }
            }
          },
        };
      },
    },

    'zustand-no-auto-executing-store-calls': {
      meta: {
        type: 'error',
        docs: {
          description: 'Prevent auto-executing store operations in module scope',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          noAutoExecutingStoreCalls:
            'Dangerous pattern: Store operation called in module scope! This can trigger React error #185 during app initialization. ' +
            'Move this call to explicit initialization functions instead of auto-executing on module load. ' +
            'Example: Create an init() function and call it from App component.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Check if we're in module scope (not inside a function/method)
            const ancestors = context.sourceCode?.getAncestors?.(node) || [];
            const inFunction = ancestors.some(
              ancestor =>
                ancestor.type === 'FunctionDeclaration' ||
                ancestor.type === 'FunctionExpression' ||
                ancestor.type === 'ArrowFunctionExpression' ||
                ancestor.type === 'MethodDefinition'
            );

            if (!inFunction) {
              // Look for store-related method calls that could trigger operations
              if (
                node.callee.type === 'MemberExpression' &&
                node.callee.property &&
                /^(restore|initialize|start|trigger|execute|run|sync|fetch|load|save)/.test(
                  node.callee.property.name
                ) &&
                // Exclude safe operations
                !/^(addEventListener|removeEventListener|initializeLogger|initializeFirebase)$/.test(
                  node.callee.property.name
                )
              ) {
                context.report({
                  node,
                  messageId: 'noAutoExecutingStoreCalls',
                });
              }
            }
          },
        };
      },
    },

    'zustand-store-reference-pattern': {
      meta: {
        type: 'error',
        docs: {
          description: 'Enforce store reference pattern for async operations in Zustand stores',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          useStoreReference:
            'Dangerous async store pattern detected! Use external store reference instead. ' +
            'Replace get().action() or store.action() with useStoreName.getState().action() in setTimeout/Promise callbacks. ' +
            'This prevents React error #185 infinite render loops. See docs/development/architecture/data-flow.md for examples.',
        },
      },
      create(context) {
        let inAsyncOperation = false;
        let inZustandStore = false;

        return {
          // Detect Zustand store creation
          CallExpression(node) {
            // Check for create() calls (Zustand stores)
            if (
              node.callee.name === 'create' ||
              (node.callee.type === 'MemberExpression' && node.callee.property.name === 'create')
            ) {
              inZustandStore = true;
              return;
            }

            // Check for async operations (setTimeout, setInterval, Promise chains)
            if (
              ['setTimeout', 'setInterval'].includes(node.callee.name) ||
              (node.callee.type === 'MemberExpression' &&
                ['then', 'catch', 'finally'].includes(node.callee.property.name))
            ) {
              inAsyncOperation = true;
              return;
            }

            // Check for dangerous patterns in async operations
            if (inAsyncOperation) {
              // 1. Check for get() calls in async operations
              if (node.callee.name === 'get' && node.arguments.length === 0) {
                context.report({
                  node,
                  messageId: 'useStoreReference',
                });
                return;
              }

              // 2. Check for store.action() calls in async operations
              if (
                node.callee.type === 'MemberExpression' &&
                node.callee.object.name === 'store' &&
                inZustandStore
              ) {
                context.report({
                  node,
                  messageId: 'useStoreReference',
                });
                return;
              }
            }
          },

          'CallExpression:exit'(node) {
            if (
              node.callee.name === 'create' ||
              (node.callee.type === 'MemberExpression' && node.callee.property.name === 'create')
            ) {
              inZustandStore = false;
            }

            if (
              ['setTimeout', 'setInterval'].includes(node.callee.name) ||
              (node.callee.type === 'MemberExpression' &&
                ['then', 'catch', 'finally'].includes(node.callee.property.name))
            ) {
              inAsyncOperation = false;
            }
          },
        };
      },
    },

    'zustand-selective-subscriptions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage selective subscriptions over full store subscriptions',
          category: 'Performance',
          recommended: true,
        },
        schema: [],
        messages: {
          useSelectiveSubscription:
            'Use selective subscriptions instead of subscribing to entire store. ' +
            'Replace useUIStore() with useUIStore(state => state.specificValue) to prevent unnecessary re-renders. ' +
            'See docs/development/architecture/data-flow.md for performance patterns.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Check for useStore() calls without selector
            if (
              node.callee.name &&
              (node.callee.name.includes('Store') || node.callee.name.includes('UI')) &&
              node.callee.name.startsWith('use') &&
              node.arguments.length === 0
            ) {
              context.report({
                node,
                messageId: 'useSelectiveSubscription',
              });
            }
          },
        };
      },
    },

    'zustand-no-conditional-subscriptions': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Prevent conditional Zustand store subscriptions that can cause memory leaks',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          noConditionalSubscriptions:
            'Avoid conditional store subscriptions. Move conditions inside the component instead of conditionally calling useStore hooks. ' +
            'This prevents React hooks rule violations and memory leaks.',
        },
      },
      create(context) {
        return {
          // Check for store hooks directly inside conditional statements
          CallExpression(node) {
            // Check if this is a store hook call
            if (
              node.callee &&
              node.callee.name &&
              (node.callee.name.includes('Store') ||
                node.callee.name.includes('UI')) &&
              node.callee.name.startsWith('use')
            ) {
              // Check if this hook call is directly inside a conditional
              const ancestors = context.sourceCode?.getAncestors?.(node) || [];
              
              // Look for immediate conditional parents (not deep nesting)
              for (let i = ancestors.length - 1; i >= 0; i--) {
                const ancestor = ancestors[i];
                
                // If we hit a function boundary, stop - we're at top level
                if (
                  ancestor.type === 'FunctionDeclaration' ||
                  ancestor.type === 'FunctionExpression' ||
                  ancestor.type === 'ArrowFunctionExpression'
                ) {
                  break;
                }
                
                // Check for conditional patterns
                if (
                  ancestor.type === 'IfStatement' ||
                  ancestor.type === 'ConditionalExpression' ||
                  (ancestor.type === 'LogicalExpression' && 
                   (ancestor.operator === '&&' || ancestor.operator === '||'))
                ) {
                  // Check if we're in the conditional branches
                  let isInConditionalBranch = false;
                  
                  if (ancestor.type === 'IfStatement') {
                    // For if statements, check if we're in consequent or alternate
                    const nextAncestor = ancestors[i + 1];
                    if (nextAncestor && (ancestor.consequent === nextAncestor || ancestor.alternate === nextAncestor)) {
                      isInConditionalBranch = true;
                    }
                  } else if (ancestor.type === 'ConditionalExpression') {
                    // For ternary operators, we need to check if the hook is in the consequent or alternate
                    // This is more complex due to how AST represents ternaries
                    isInConditionalBranch = true; // Any hook inside a ternary is conditional
                  } else if (ancestor.type === 'LogicalExpression') {
                    // For logical expressions (&&, ||), check if we're in the right side
                    const nextAncestor = ancestors[i + 1];
                    if (nextAncestor && ancestor.right === nextAncestor) {
                      isInConditionalBranch = true;
                    }
                  }
                     
                  if (isInConditionalBranch) {
                    context.report({
                      node,
                      messageId: 'noConditionalSubscriptions',
                    });
                    break;
                  }
                }
              }
            }
          },
        };
      },
    },
  },
};
