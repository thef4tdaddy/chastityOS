# Zustand Stores

This directory contains all Zustand stores for client-side UI state management in ChastityOS.

## Architecture

The stores follow a clear separation of concerns:

- **UI State**: Handled by Zustand stores (this directory)
- **Server State**: Handled by TanStack Query (hooks/api/)
- **App State**: Handled by React Context (contexts/)

## Available Stores

### 🧭 NavigationStore (`navigationStore.ts`)

Manages navigation-related UI state:

- Mobile menu open/closed state
- Page titles and descriptions
- Breadcrumb navigation
- Navigation loading states

**Usage:**

```tsx
import { useNavigationStore } from "@/stores";

const MyComponent = () => {
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigationStore();

  return (
    <button onClick={toggleMobileMenu}>
      {isMobileMenuOpen ? "Close" : "Open"} Menu
    </button>
  );
};
```

### 🪟 ModalStore (`modalStore.ts`)

Centralized modal management with advanced features:

- Modal visibility state
- Z-index management for stacking
- Modal configuration (size, closable, persistent)
- onOpen/onClose callbacks

**Usage:**

```tsx
import { useModalStore } from "@/stores";

const MyComponent = () => {
  const { openModal, closeModal, isModalOpen } = useModalStore();

  const handleOpenModal = () => {
    openModal("my-modal", {
      title: "My Modal",
      size: "lg",
      onClose: () => console.log("Modal closed"),
    });
  };

  return (
    <>
      <button onClick={handleOpenModal}>Open Modal</button>
      {isModalOpen("my-modal") && (
        <div className="modal">
          <button onClick={() => closeModal("my-modal")}>Close</button>
        </div>
      )}
    </>
  );
};
```

### 📢 NotificationStore (`notificationStore.ts`)

Toast notification system with rich features:

- Multiple notification types (success, error, warning, info, loading)
- Auto-dismiss with configurable duration
- Positioning (top-right, top-left, etc.)
- Action buttons
- Max notification limits

**Usage:**

```tsx
import { useNotificationStore } from "@/stores";

const MyComponent = () => {
  const { success, error, warning, info } = useNotificationStore();

  const handleSuccess = () => {
    success("Operation completed successfully!");
  };

  const handleError = () => {
    error("Something went wrong", {
      actions: [{ label: "Retry", handler: () => console.log("Retrying...") }],
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
};
```

### 🎨 ThemeStore (`themeStore.ts`)

Theme and UI preferences management:

- Light/dark/system theme modes
- Color schemes (nightly, classic, high-contrast)
- Font size preferences
- Animation speed settings
- Accessibility options
- System preference detection

**Usage:**

```tsx
import { useThemeStore } from "@/stores";

const ThemeToggle = () => {
  const { mode, toggleMode, colorScheme, setColorScheme } = useThemeStore();

  return (
    <div>
      <button onClick={toggleMode}>Current: {mode}</button>
      <select
        value={colorScheme}
        onChange={(e) => setColorScheme(e.target.value)}
      >
        <option value="nightly">Nightly</option>
        <option value="classic">Classic</option>
        <option value="high-contrast">High Contrast</option>
      </select>
    </div>
  );
};
```

### 🔐 KeyholderStore (`keyholderStore.ts`)

Keyholder-specific UI state (existing):

- Password management UI state
- Dialog visibility
- Form state for keyholder operations

## Store Features

### 🛠️ Built-in Features

- **TypeScript**: Full type safety with strict typing
- **DevTools**: Zustand DevTools integration (dev/nightly only)
- **Persistence**: Theme preferences persist across sessions
- **Logging**: Comprehensive logging for debugging
- **Error Handling**: Robust error handling with try/catch blocks
- **Performance**: Optimized for minimal re-renders

### 🧪 Testing

Each store includes comprehensive unit tests:

```bash
npm test -- stores
```

### 🔍 Selective Subscriptions

For optimal performance, use selective subscriptions:

```tsx
// ❌ Don't subscribe to entire store
const store = useNavigationStore();

// ✅ Subscribe only to what you need
const isMobileMenuOpen = useNavigationStore((state) => state.isMobileMenuOpen);
const toggleMobileMenu = useNavigationStore((state) => state.toggleMobileMenu);
```

## Store Patterns

### 🏗️ Store Structure

Each store follows a consistent pattern:

```typescript
interface StoreState {
  // State properties
}

interface StoreActions {
  // Action methods
}

interface Store extends StoreState, StoreActions {}

export const useStore = create<Store>()(
  devtools(
    persist(
      // Only for stores that need persistence
      (set, get) => ({
        // State and actions implementation
      }),
      { name: "store-name" },
    ),
    { name: "store-name" },
  ),
);
```

### 🔄 State Updates

- Use `set()` for state updates
- Use `get()` to access current state in actions
- Prefer immutable updates for complex state

### 📝 Logging

All stores include structured logging:

```typescript
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("StoreName");

// In actions
logger.debug("Action performed", { data });
logger.info("Important state change", { newState });
logger.error("Error occurred", { error });
```

## Future Stores

### 📋 FormStore (Planned)

- Form state management
- Validation state
- Dirty/pristine tracking
- Form submission states

### ⌨️ KeyboardStore (Planned)

- Keyboard shortcut management
- Key combination handling
- Context-aware shortcuts

### 🔍 SearchStore (Planned)

- Search query state
- Filter state
- Search history
- Results pagination

## Best Practices

1. **Single Responsibility**: Each store handles one concern
2. **Selective Subscriptions**: Subscribe only to needed state
3. **Immutable Updates**: Use spread operators for state updates
4. **Error Handling**: Wrap async operations in try/catch
5. **TypeScript**: Use strict typing for better DX
6. **Testing**: Write unit tests for all store logic
7. **Logging**: Add appropriate logging for debugging

## Performance Tips

1. Use selective subscriptions to prevent unnecessary re-renders
2. Split large stores into smaller, focused ones
3. Use shallow equality for object/array comparisons
4. Avoid nested subscriptions in components
5. Use store actions for complex state updates
