# Demo App - ChastityOS

This directory contains demo/showcase functionality that demonstrates features without requiring authentication or real data. The demo app is **excluded from production PWA builds** to keep the mobile app bundle size small.

## 📁 Directory Structure

```
/src/demo/
├── components/     # Demo-specific components with mock data
│   ├── SessionPersistenceDemo.tsx
│   ├── DatabaseDemo.tsx
│   ├── AccountLinkingDemo.tsx
│   ├── AccountLinkingDemoComponents.tsx
│   ├── TypedKeyholderDemo.tsx
│   └── DexieDemo.tsx
├── hooks/          # Demo hooks with mock datasets
│   ├── useAccountLinkingDemo.ts
│   ├── useDexieSync.ts
│   └── useOfflineDemo.ts
├── pages/          # Showcase pages for UI demonstrations
│   ├── ButtonVariantsDemo.tsx
│   ├── HapticFeedbackDemo.tsx
│   ├── InputExamplesDemo.tsx
│   ├── PullToRefreshDemo.tsx
│   ├── ShowcaseHeader.tsx
│   ├── SwipeableCardDemo.tsx
│   ├── ToastDemo.tsx
│   └── TouchTargetsDemo.tsx
└── README.md       # This file
```

## 🎯 Purpose

Demo files serve multiple purposes:

1. **Marketing/Showcase**: Demonstrate features on the website without requiring users to sign up
2. **Development Testing**: Quick testing of UI components and interactions
3. **Documentation**: Visual examples of how features work
4. **Prototyping**: Experiment with new features before integrating into production

## 🏗️ Architecture Separation

### Build Modes

- **Development** (`npm run dev`): Demo code included for testing
- **Nightly** (`npm run build:nightly`): Demo code included for internal testing
- **Production** (`npm run build:production`): **Demo code EXCLUDED** from PWA bundle

### ESLint Configuration

Demo files have **relaxed ESLint rules** compared to production code:

- ✅ No function length limits (`max-lines-per-function` off)
- ✅ No file size limits (`max-lines` off)
- ✅ No complexity checks (`complexity` off)
- ✅ Relaxed Zustand patterns (warnings instead of errors)
- ✅ Architecture violations allowed (localStorage, direct imports, etc.)

**Rationale**: Demo code prioritizes demonstrating functionality over production-level code quality.

## 🚀 Usage

### Creating Demo Components

Demo components should:

1. Use mock data from demo hooks
2. Import from `../hooks/` or production services as needed
3. Be self-contained with all necessary mock data
4. Demonstrate functionality without requiring authentication

```tsx
// Example: src/demo/components/MyFeatureDemo.tsx
import React from "react";
import { useMyFeatureDemo } from "../hooks/useMyFeatureDemo";

export const MyFeatureDemo: React.FC = () => {
  const { mockData, actions } = useMyFeatureDemo();

  return <div>{/* Demo UI */}</div>;
};
```

### Creating Demo Hooks

Demo hooks should:

1. Provide mock data scenarios
2. Simulate real hook behavior
3. Be located in `src/demo/hooks/`

```tsx
// Example: src/demo/hooks/useMyFeatureDemo.ts
export const useMyFeatureDemo = (scenario: DemoScenario) => {
  const [data, setData] = useState(getMockData(scenario));

  return {
    data,
    actions: {
      simulate: () => {
        /* mock action */
      },
    },
  };
};
```

### Accessing Demo Pages

Demo pages are accessible via routes:

- `/toast-demo` - Toast notification demonstrations
- `/keyholder-demo` - Keyholder account linking demo
- (Add more as needed)

## ⚠️ Important Notes

### DO NOT:

- ❌ Import demo code into production components
- ❌ Mix production business logic with demo code
- ❌ Store real user data in demo hooks
- ❌ Use demo code for anything other than demonstrations

### DO:

- ✅ Keep demo code self-contained in `/src/demo/`
- ✅ Use mock data for all demonstrations
- ✅ Follow the naming convention: `*Demo.tsx` or `*Demo.ts`
- ✅ Test demos regularly to ensure they still work

## 🔧 Technical Details

### Vite Configuration

Demo code is excluded from production builds via `configs/build/vite.config.js`:

```javascript
// Exclude demo code from PWA bundle in production
if (shouldExcludeDemo && id.includes("/src/demo/")) {
  return undefined; // Don't create a chunk for demo files
}
```

### Bundle Size Impact

- **With demo code**: ~2.5MB (estimate)
- **Without demo code** (production PWA): Smaller bundle, faster load times
- **Benefit**: Reduced bundle size for mobile users

## 📊 Issue Tracking

This architecture was implemented as part of:

- **Epic #308**: Demo App Separation - Clean Architecture & PWA Build
  - Phase 1: Demo Data Extraction ✅
  - Phase 2: Demo Page Separation ✅
  - Phase 3: Component Logic Extraction ✅
  - Phase 4: Build Configuration ✅

## 🤝 Contributing

When adding new demo functionality:

1. Place files in the appropriate `/src/demo/` subdirectory
2. Follow the naming convention (`*Demo.tsx`)
3. Use mock data from demo hooks
4. Keep code self-contained
5. Update this README with new demos

---

**Architecture Compliance**: ChastityOS v4.0.0
**Last Updated**: 2025-01-09
**Maintained By**: ChastityOS Development Team
