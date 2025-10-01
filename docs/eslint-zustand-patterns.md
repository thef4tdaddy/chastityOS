# Zustand ESLint Rule: zustand-no-conditional-subscriptions

This document explains the patterns that the `zustand-no-conditional-subscriptions` ESLint rule catches and allows.

## ✅ Correct Patterns (No Warnings)

### Top-level subscriptions (recommended)

```tsx
const MyComponent = () => {
  // ✅ GOOD: Top-level subscriptions are always allowed
  const isUnlocked = useKeyholderStore(
    (state) => state.isKeyholderModeUnlocked,
  );
  const passwordAttempt = useKeyholderStore((state) => state.passwordAttempt);

  // ✅ GOOD: Conditional rendering with pre-subscribed values
  if (isUnlocked) {
    return <div>Unlocked content</div>;
  }

  return <div>Enter password: {passwordAttempt}</div>;
};
```

## ❌ Incorrect Patterns (Will Trigger Warnings)

### Conditional hook calls

```tsx
const MyComponent = ({ condition }) => {
  // ❌ BAD: Hook called inside if statement
  if (condition) {
    const data = useKeyholderStore((state) => state.data); // WARNING
    return <div>{data}</div>;
  }

  // ❌ BAD: Hook called inside ternary operator
  const conditionalData = condition
    ? useKeyholderStore((state) => state.data) // WARNING
    : null;

  // ❌ BAD: Hook called inside logical expression
  const logicalData = condition && useKeyholderStore((state) => state.data); // WARNING

  return <div>Content</div>;
};
```

## 🔧 How to Fix Violations

Replace conditional hook calls with top-level subscriptions and conditional usage:

```tsx
// Before (incorrect)
const BadComponent = ({ showData }) => {
  if (showData) {
    const data = useStore((state) => state.data); // ❌ Conditional hook
    return <div>{data}</div>;
  }
  return <div>No data</div>;
};

// After (correct)
const GoodComponent = ({ showData }) => {
  const data = useStore((state) => state.data); // ✅ Top-level subscription

  if (showData) {
    return <div>{data}</div>; // ✅ Conditional usage
  }
  return <div>No data</div>;
};
```

## Why This Rule Exists

1. **React Rules of Hooks**: Hooks must be called in the same order every render
2. **Memory Leaks**: Conditional subscriptions can cause memory leaks
3. **Performance**: Proper subscriptions enable better optimization
4. **Reliability**: Consistent subscription patterns prevent bugs

## Rule Implementation

The rule checks for Zustand store hooks (functions starting with `use` and containing `Store` or `UI`) that are called inside:

- `IfStatement` blocks
- `ConditionalExpression` (ternary operators)
- `LogicalExpression` with `&&` or `||` operators

It uses AST ancestry analysis to ensure only directly conditional calls are flagged, not hooks that happen to be in components with conditional logic.
