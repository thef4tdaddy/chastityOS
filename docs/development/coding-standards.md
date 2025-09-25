# Coding Standards

This document outlines the coding standards and conventions used in ChastityOS.

## Icon Import Policy

### Overview
All icon imports in ChastityOS must go through the centralized icon utility located at `src/utils/iconImport.ts`. This policy ensures consistency, enables centralized icon management, and prevents direct dependencies on icon libraries throughout the codebase.

### Policy
- **Prohibited**: Direct imports from `react-icons/*` or `lucide-react/*` packages
- **Required**: Import all icons from the centralized utility only

### Usage

#### ❌ Incorrect (Direct Import)
```tsx
import { FaTimes, FaLock } from 'react-icons/fa';
import { Lock, X } from 'lucide-react';
```

#### ✅ Correct (Utility Import)
```tsx
import { FaTimes, FaLock } from '../utils/iconImport';
import { FaTimes, FaLock } from '../../utils/iconImport'; // Adjust path as needed
```

### Adding New Icons

When you need to use a new icon:

1. Add the icon to `src/utils/iconImport.ts`:
```tsx
export {
  // ... existing icons
  FaNewIcon, // Add your new icon here
} from 'react-icons/fa';
```

2. Import from the utility in your component:
```tsx
import { FaNewIcon } from '../utils/iconImport';
```

### Enforcement

This policy is enforced by ESLint rules:
- Direct imports from `react-icons/*` or `lucide-react/*` will result in an **error**
- The `src/utils/iconImport.ts` file itself is exempt from this rule

### Benefits

1. **Consistency**: All icons come from a single source
2. **Tree Shaking**: Better optimization through centralized imports
3. **Maintenance**: Easy to see which icons are used across the app
4. **Flexibility**: Can easily switch icon libraries in the future
5. **Standards**: Enforces architectural consistency

### Migration

All existing icon imports have been migrated to use this utility. The ESLint rule ensures no new direct imports are introduced.

For questions or clarifications about this policy, refer to the codebase examples or raise an issue in the repository.