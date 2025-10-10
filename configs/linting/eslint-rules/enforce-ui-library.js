/**
 * ESLint Rule: enforce-ui-library
 *
 * Enforces usage of UI library components instead of custom implementations.
 *
 * Forbidden patterns:
 * - <button> elements (should use <Button>)
 * - className="glass-card" (should use <Card>)
 * - className="glass-input" (should use <Input> or <Textarea>)
 * - className="glass-button-*" (should use <Button variant="..">)
 *
 * Related: Issue #491
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce usage of UI library components',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useButtonComponent:
        'Use <Button> from @/components/ui instead of <button> element. Import: import { Button } from "@/components/ui"',
      useCardComponent:
        'Use <Card> from @/components/ui instead of className="glass-card". Import: import { Card } from "@/components/ui"',
      useInputComponent:
        'Use <Input> or <Textarea> from @/components/ui instead of className="glass-input". Import: import { Input, Textarea } from "@/components/ui"',
      useButtonVariant:
        'Use <Button variant="{{ variant }}"> from @/components/ui instead of className="glass-button-{{ variant }}"',
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Allow all patterns in UI library directory
    if (filename.includes('src/components/ui/')) {
      return {};
    }

    return {
      // Check JSX elements
      JSXElement(node) {
        const elementName = node.openingElement.name.name;

        // Forbid plain <button> elements
        if (elementName === 'button') {
          context.report({
            node,
            messageId: 'useButtonComponent',
            fix(fixer) {
              // Auto-fix: Replace <button> with <Button>
              const openingTag = node.openingElement;
              const closingTag = node.closingElement;

              const fixes = [fixer.replaceText(openingTag.name, 'Button')];

              if (closingTag) {
                fixes.push(fixer.replaceText(closingTag.name, 'Button'));
              }

              return fixes;
            },
          });
        }
      },

      // Check className attributes
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        // Get className value
        let classValue = '';
        if (node.value?.type === 'Literal') {
          classValue = node.value.value || '';
        } else if (node.value?.type === 'JSXExpressionContainer') {
          // Handle template literals and expressions
          const expression = node.value.expression;
          if (expression.type === 'TemplateLiteral') {
            classValue = expression.quasis.map((q) => q.value.raw).join('');
          } else if (expression.type === 'Literal') {
            classValue = expression.value || '';
          }
        }

        if (typeof classValue !== 'string') return;

        // Check for glass-card
        if (classValue.includes('glass-card')) {
          context.report({
            node,
            messageId: 'useCardComponent',
          });
        }

        // Check for glass-input
        if (classValue.includes('glass-input')) {
          context.report({
            node,
            messageId: 'useInputComponent',
          });
        }

        // Check for glass-button-*
        const buttonVariantMatch = classValue.match(
          /glass-button-(primary|secondary|danger|ghost)/,
        );
        if (buttonVariantMatch) {
          context.report({
            node,
            messageId: 'useButtonVariant',
            data: {
              variant: buttonVariantMatch[1],
            },
          });
        }
      },
    };
  },
};
