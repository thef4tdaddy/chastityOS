# ESLint Rules Documentation

This document provides detailed explanations for all ESLint rules configured in ChastityOS, including custom architectural rules and their rationale.

## 📋 Rule Categories

### 🏗️ Architectural Rules

Rules that enforce the architectural patterns and code organization.

### 🔒 Security Rules

Rules that prevent security vulnerabilities and unsafe practices.

### 📊 Performance Rules

Rules that optimize bundle size and runtime performance.

### 🎨 Code Quality Rules

Rules that improve code readability and maintainability.

---

## 🏗️ Architectural Rules

### `@typescript-eslint/no-unused-vars`

**Level**: Error
**Rationale**: Prevents unused imports and variables that bloat the bundle.

```javascript
// ❌ Bad
import { useState, useEffect } from "react"; // useEffect is unused
const [count, setCount] = useState(0); // setCount is unused

// ✅ Good
import { useState } from "react";
const [count] = useState(0);
```

**Configuration**:

```javascript
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_'
}]
```

### `react-hooks/rules-of-hooks`

**Level**: Error
**Rationale**: Enforces Rules of Hooks to prevent bugs and inconsistent behavior.

```javascript
// ❌ Bad - Hook called conditionally
if (someCondition) {
  const [state, setState] = useState(); // Error
}

// ❌ Bad - Hook in nested function
function handleClick() {
  const [state, setState] = useState(); // Error
}

// ✅ Good - Hook at top level
function Component() {
  const [state, setState] = useState();

  if (someCondition) {
    // Use the hook result conditionally, not the hook itself
    setState(newValue);
  }
}
```

### `react-hooks/exhaustive-deps`

**Level**: Warn
**Rationale**: Prevents stale closures and ensures effect dependencies are correct.

```javascript
// ❌ Bad - Missing dependency
useEffect(() => {
  fetchUser(userId); // userId not in deps array
}, []); // Error: Missing dependency 'userId'

// ✅ Good - All dependencies included
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// ✅ Good - Callback wrapped in useCallback
const fetchUserCallback = useCallback(() => {
  fetchUser(userId);
}, [userId]);

useEffect(() => {
  fetchUserCallback();
}, [fetchUserCallback]);
```

---

## 🏗️ Custom Architectural Rules

### `no-business-logic-in-components` (Custom Rule - Future)

**Level**: Error
**Rationale**: Enforces separation of concerns - components should only handle UI.

```javascript
// ❌ Bad - Business logic in component
function SessionTracker() {
  const [session, setSession] = useState(null);

  const startSession = async () => {
    // Business logic should not be here
    const sessionData = {
      id: generateId(),
      startTime: new Date(),
      userId: getCurrentUser().id,
    };

    await firebase.firestore().collection("sessions").add(sessionData);

    setSession(sessionData);
  };

  return <button onClick={startSession}>Start</button>;
}

// ✅ Good - Using service layer
function SessionTracker() {
  const { mutate: startSession } = useStartSessionMutation();

  return <button onClick={() => startSession()}>Start</button>;
}
```

### `no-direct-firebase-calls` (Custom Rule - Future)

**Level**: Error
**Rationale**: All Firebase calls should go through service layer for consistency.

```javascript
// ❌ Bad - Direct Firebase call
useEffect(() => {
  firebase.firestore().collection("sessions").get().then(setData);
}, []);

// ✅ Good - Using service layer
const { data } = useSessionsQuery();
```

### `require-error-logging` (Custom Rule - Future)

**Level**: Error
**Rationale**: All errors must be logged through centralized logger.

```javascript
// ❌ Bad - Direct console.log
catch (error) {
  console.log('Error:', error); // Should use logger
}

// ✅ Good - Using logger utility
catch (error) {
  logger.error('Failed to start session', error);
}
```

---

## 🔒 Security Rules

### `no-eval`

**Level**: Error
**Rationale**: Prevents code injection attacks.

```javascript
// ❌ Bad
const code = 'alert("Hello")';
eval(code); // Extremely dangerous

// ✅ Good - Use safe alternatives
const config = JSON.parse(jsonString); // For JSON
const fn = new Function("return " + expression); // Slightly safer but still avoid
```

### `no-implied-eval`

**Level**: Error
**Rationale**: Prevents implicit eval through setTimeout/setInterval.

```javascript
// ❌ Bad
setTimeout('alert("Hello")', 1000); // Implicit eval

// ✅ Good
setTimeout(() => alert("Hello"), 1000);
```

### `no-new-func`

**Level**: Error
**Rationale**: Prevents Function constructor which can execute arbitrary code.

```javascript
// ❌ Bad
const fn = new Function("a", "b", "return a + b");

// ✅ Good
const fn = (a, b) => a + b;
```

### `no-script-url`

**Level**: Error
**Rationale**: Prevents javascript: URLs which can execute arbitrary code.

```javascript
// ❌ Bad
<a href="javascript:void(0)">Click me</a>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

---

## 📊 Performance Rules

### `react/no-array-index-key`

**Level**: Warn
**Rationale**: Using array indices as keys can cause performance issues and bugs.

```javascript
// ❌ Bad - Array index as key
{
  items.map((item, index) => (
    <Item key={index} data={item} /> // Can cause rendering issues
  ));
}

// ✅ Good - Stable unique key
{
  items.map((item) => <Item key={item.id} data={item} />);
}

// ✅ Acceptable - When list never reorders and items don't have IDs
{
  staticList.map((item, index) => <StaticItem key={index} data={item} />);
}
```

### `react/jsx-no-bind`

**Level**: Warn
**Rationale**: Prevents creating new functions on every render.

```javascript
// ❌ Bad - New function on every render
<button onClick={() => handleClick(item.id)}>Click</button>

<button onClick={function() { handleClick(item.id); }}>Click</button>

<button onClick={handleClick.bind(this, item.id)}>Click</button>

// ✅ Good - Stable function reference
const handleItemClick = useCallback(() => {
  handleClick(item.id);
}, [item.id]);

<button onClick={handleItemClick}>Click</button>

// ✅ Good - For simple cases without dependencies
<button onClick={handleClick}>Click</button>
```

### `react/no-unstable-nested-components`

**Level**: Error
**Rationale**: Prevents performance issues from recreating components on every render.

```javascript
// ❌ Bad - Component defined inside render
function ParentComponent() {
  // This creates a new component on every render
  function ChildComponent() {
    return <div>Child</div>;
  }

  return <ChildComponent />;
}

// ✅ Good - Component defined outside
function ChildComponent() {
  return <div>Child</div>;
}

function ParentComponent() {
  return <ChildComponent />;
}

// ✅ Good - Memoized component for dynamic cases
function ParentComponent({ config }) {
  const ChildComponent = useMemo(() => {
    return function Child() {
      return <div>{config.text}</div>;
    };
  }, [config.text]);

  return <ChildComponent />;
}
```

---

## 🎨 Code Quality Rules

### `prefer-const`

**Level**: Error
**Rationale**: Prevents accidental reassignment and clarifies intent.

```javascript
// ❌ Bad
let count = 0; // Never reassigned
let items = []; // Never reassigned

// ✅ Good
const count = 0;
const items = [];

// ✅ Good - Reassignment intended
let currentValue = 0;
currentValue = calculateNewValue();
```

### `no-var`

**Level**: Error
**Rationale**: Prevents function-scoped variables and hoisting confusion.

```javascript
// ❌ Bad
var name = "John"; // Function-scoped, hoisted

// ✅ Good
const name = "John"; // Block-scoped
let age = 25; // Block-scoped when reassignment needed
```

### `object-shorthand`

**Level**: Error
**Rationale**: Promotes cleaner, more concise object syntax.

```javascript
// ❌ Bad
const user = {
  name: name,
  getId: function () {
    return this.id;
  },
  save: function () {
    /* ... */
  },
};

// ✅ Good
const user = {
  name,
  getId() {
    return this.id;
  },
  save() {
    /* ... */
  },
};
```

### `arrow-body-style`

**Level**: Error
**Rationale**: Enforces consistent arrow function style.

```javascript
// ❌ Bad - Unnecessary block body
const double = (x) => {
  return x * 2;
};

// ✅ Good - Concise body
const double = (x) => x * 2;

// ✅ Good - Block body when necessary
const processData = (data) => {
  const processed = transform(data);
  log("Data processed");
  return processed;
};
```

---

## 🚨 Custom Rules Configuration

### Future Custom Rules

#### `enforce-service-layer-pattern`

```javascript
// Will enforce that components use service layer
'custom/enforce-service-layer-pattern': ['error', {
  'allowedDirectCalls': ['useState', 'useEffect', 'useCallback', 'useMemo'],
  'requireServiceFor': ['firebase', 'fetch', 'axios']
}]
```

#### `no-console-in-production`

```javascript
// Will prevent console.log in production builds
'custom/no-console-in-production': ['error', {
  'allowedMethods': [], // No console methods allowed
  'requireLogger': true // Must use logger utility
}]
```

#### `enforce-error-boundaries`

```javascript
// Will require error boundaries for route components
'custom/enforce-error-boundaries': ['error', {
  'routeComponents': true,
  'asyncComponents': true
}]
```

---

## 🔧 ESLint Configuration

### Base Configuration

```javascript
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
    },
    rules: {
      // ... rules configuration
    },
  },
];
```

### Environment-Specific Rules

```javascript
// Development environment - more lenient
{
  files: ['**/*.{js,jsx,ts,tsx}'],
  rules: {
    'no-console': 'warn', // Allow console in development
    'no-debugger': 'warn', // Allow debugger in development
  },
},

// Production environment - strict
{
  files: ['**/*.{js,jsx,ts,tsx}'],
  env: {
    NODE_ENV: 'production',
  },
  rules: {
    'no-console': 'error', // No console in production
    'no-debugger': 'error', // No debugger in production
  },
},
```

---

## 🛠️ Rule Overrides

### Test Files

```javascript
{
  files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
  rules: {
    // Test files can be more lenient
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/rules-of-hooks': 'off', // Tests might call hooks conditionally
  },
}
```

### Configuration Files

```javascript
{
  files: ['**/*.config.{js,ts}', '**/vite.config.*', '**/tailwind.config.*'],
  rules: {
    // Config files might need Node.js specific patterns
    'no-undef': 'off',
    'import/no-default-export': 'off',
  },
}
```

---

## 📖 Best Practices

### 1. Gradual Adoption

- Start with warnings for new rules
- Fix existing violations over time
- Use `eslint-disable-next-line` sparingly with comments explaining why

### 2. Team Consistency

- All team members should use the same ESLint configuration
- Use pre-commit hooks to enforce rules
- Regular code reviews to catch rule violations

### 3. Performance Considerations

- Use `cache: true` in ESLint configuration for faster subsequent runs
- Consider using ESLint flat config for better performance
- Run ESLint in parallel with other tools in CI

### 4. Rule Documentation

- Document any custom rules thoroughly
- Provide examples of violations and corrections
- Keep this documentation updated as rules change

---

## 🔄 Migration Strategy

### Phase 1: Foundation Rules (Current)

- Core JavaScript/TypeScript rules
- React hooks rules
- Basic security rules

### Phase 2: Architectural Rules (Future)

- Service layer enforcement
- Component purity rules
- Import/export restrictions

### Phase 3: Performance Rules (Future)

- Bundle size optimization rules
- Runtime performance rules
- Memory leak prevention

### Phase 4: Advanced Rules (Future)

- Custom business logic rules
- Framework-specific optimizations
- Team-specific conventions

---

## 🎯 Custom ChastityOS Rules (Implemented)

### Zustand Safety Rules

Our custom rules prevent React error #185 and enforce proper architecture:

#### `zustand-safe-patterns/zustand-no-server-data`

**Level**: Error
**Rationale**: Enforces that Zustand stores only contain UI state, not server data.

```javascript
// ❌ Bad - Server data in Zustand
const useStore = create((set) => ({
  sessions: [], // Should use TanStack Query
  currentUser: null, // Should use React Context
}));

// ✅ Good - UI state only in Zustand
const useUIStore = create((set) => ({
  isModalOpen: false,
  theme: "light",
  sidebarCollapsed: false,
}));
```

#### `zustand-safe-patterns/zustand-no-getstate-in-useeffect`

**Level**: Error
**Rationale**: Prevents infinite render loops from getState() calls in useEffect.

```javascript
// ❌ Bad - getState() in useEffect
useEffect(() => {
  const state = store.getState(); // Causes React error #185
  // ...
}, []);

// ✅ Good - Proper subscription
const data = useUIStore((state) => state.data);
useEffect(() => {
  // Use the subscribed data
}, [data]);
```

#### `zustand-safe-patterns/zustand-store-reference-pattern`

**Level**: Error
**Rationale**: Prevents dangerous async patterns that cause infinite loops.

```javascript
// ❌ Bad - Store reference in async operation
setTimeout(() => {
  store.action(); // Dangerous!
}, 1000);

// ✅ Good - External store reference
setTimeout(() => {
  useStoreName.getState().action();
}, 1000);
```

## 📊 Current Codebase Analysis

As of implementation, the ESLint rules detected:

- **137 total violations** (83 errors, 54 warnings)
- **Major categories:**
  - Console.log usage: 50+ violations (will use logger utility)
  - Firebase imports in components: 10+ violations (will use service layer)
  - Large functions/files: 30+ violations (will be refactored during modernization)
  - alert() usage: 5+ violations (will use toast notifications)

**Note**: These violations will be naturally resolved during the Phase 2+ modernization rewrite, as we're implementing the new architecture patterns from scratch.

## 🔄 Migration Strategy

### Phase 1: Rules Implementation ✅

- Custom Zustand safety rules created
- Architectural enforcement rules configured
- File size and complexity warnings established

### Phase 2: Natural Resolution During Rewrite

- Service layer implementation will fix component architecture violations
- TanStack Query + Zustand implementation will fix state management violations
- Logger utility adoption will fix console.log violations
- Toast system will fix alert() violations

### Phase 3: Strict Enforcement

- Promote warnings to errors for new code
- Enforce architectural patterns for all new development
- Add pre-commit hooks for rule enforcement

This ESLint configuration ensures code quality, security, and architectural consistency while supporting the modernization effort with clear patterns for the new architecture.
