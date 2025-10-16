/**
 * ESLint Rule: enforce-ui-library
 *
 * Enforces usage of UI library components instead of custom implementations.
 *
 * Forbidden patterns:
 * - <button> elements (should use <Button>)
 * - <select> elements (should use <Select>)
 * - <input type="checkbox"> (should use <Checkbox>)
 * - <input type="radio"> (should use <Radio> or <RadioGroup>)
 * - className="glass-card" (should use <Card>)
 * - className="glass-input" (should use <Input> or <Textarea>)
 * - className="glass-button-*" (should use <Button variant="..">)
 *
 * Related: Issues #491, #498, #499, #500
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
      useSelectComponent:
        'Use <Select> from @/components/ui instead of <select> element. Import: import { Select } from "@/components/ui"',
      useCheckboxComponent:
        'Use <Checkbox> from @/components/ui instead of <input type="checkbox">. Import: import { Checkbox } from "@/components/ui"',
      useRadioComponent:
        'Use <Radio> or <RadioGroup> from @/components/ui instead of <input type="radio">. Import: import { Radio, RadioGroup } from "@/components/ui"',
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

        // Forbid plain <select> elements
        if (elementName === 'select') {
          context.report({
            node,
            messageId: 'useSelectComponent',
            fix(fixer) {
              // Auto-fix: Replace <select> with <Select>
              const openingTag = node.openingElement;
              const closingTag = node.closingElement;

              const fixes = [fixer.replaceText(openingTag.name, 'Select')];

              if (closingTag) {
                fixes.push(fixer.replaceText(closingTag.name, 'Select'));
              }

              return fixes;
            },
          });
        }

        // Forbid <input type="checkbox"> and <input type="radio">
        if (elementName === 'input') {
          const typeAttr = node.openingElement.attributes.find(
            attr =>
              attr.type === 'JSXAttribute' &&
              attr.name.name === 'type' &&
              attr.value?.type === 'Literal'
          );

          if (typeAttr) {
            const inputType = typeAttr.value.value;

            if (inputType === 'checkbox') {
              context.report({
                node,
                messageId: 'useCheckboxComponent',
              });
            } else if (inputType === 'radio') {
              context.report({
                node,
                messageId: 'useRadioComponent',
              });
            }
          }
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
            classValue = expression.quasis.map(q => q.value.raw).join('');
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
          /glass-button-(primary|secondary|danger|ghost)/
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
