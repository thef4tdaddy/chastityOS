# Keyholder TypeScript Hooks

This directory contains TypeScript hooks for keyholder functionality with proper type safety and no explicit `any` types.

## Available Hooks

### `useKeyholderSession`
Manages keyholder session state including locking/unlocking controls and duration management.

**Features:**
- Session locking/unlocking
- Required duration management  
- Keyholder name and password hash management
- Session expiration detection
- Activity tracking

### `useKeyholderRewards`
Handles reward and punishment logic with time calculations and logging.

**Features:**
- Add time-based rewards (reduce chastity duration)
- Add time-based punishments (increase chastity duration)
- Create standardized log entries
- Automatic time calculation with validation

### `useAdminSession`
Manages admin sessions with permission-based access control.

**Features:**
- Start/end admin sessions with timeout
- Permission management (manage_users, view_sessions, etc.)
- Session expiration detection
- Activity refresh

### `useMultiWearer`
Handles multiple wearer scenarios with group settings.

**Features:**
- Add/remove wearers
- Set active wearer
- Manage wearer permissions and status
- Group settings configuration
- Individual session management per wearer

## Type Safety

All hooks are fully typed with:
- **No explicit `any` types** - All parameters and return values have specific types
- **Proper interfaces** - Well-defined data structures for all entities
- **Generic types** - Where appropriate for flexibility
- **Union types** - For known possible values (e.g., wearer status: 'active' | 'inactive' | 'pending')
- **Optional properties** - Using `?` for optional fields instead of `| undefined`

## Usage Example

```typescript
import { useKeyholderSession, useKeyholderRewards } from './hooks/keyholder';
import type { RewardData } from './types/keyholder';

function KeyholderComponent() {
  const session = useKeyholderSession({
    userId: 'user123',
    isAuthReady: true,
    saveDataToFirestore: saveData,
  });

  const rewards = useKeyholderRewards({
    userId: 'user123',
    requiredKeyholderDurationSeconds: session.session.requiredKeyholderDurationSeconds || 0,
    saveDataToFirestore: saveData,
    addTask: addTaskToLog,
  });

  const handleReward = async () => {
    const reward: RewardData = {
      timeSeconds: 3600, // 1 hour
      type: 'manual',
      description: 'Good behavior reward'
    };
    
    await rewards.addReward(reward);
  };
}
```

## ESLint Configuration

The TypeScript ESLint rule `@typescript-eslint/no-explicit-any` is set to `error` level to ensure no `any` types are used:

```javascript
'@typescript-eslint/no-explicit-any': 'error'
```

This helps maintain type safety and catches potential runtime errors at compile time.