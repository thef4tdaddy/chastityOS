# ChastityOS Services Layer

## Architecture Overview

The services layer implements the core data flow: **Firebase ↔ Dexie ↔ TanStack Query**

```
Firebase (Cloud) ↔ Sync Service ↔ Dexie (Local) ↔ Session Service ↔ TanStack Query ↔ React Components
```

## Bundle Optimization Strategy

### 🚀 **Current Approach: Selective Imports**

- **Firebase Core**: Always loaded (small, required)
- **Firebase Auth**: Loaded when auth services called
- **Firestore**: Loaded when data services called
- **Firebase Storage**: Loaded when file operations needed

### 📦 **Bundle Splitting Strategy**

1. **Critical Services** (loaded immediately):
   - Firebase app configuration
   - Essential utilities and types

2. **Auth Services** (loaded on login/register):
   - Firebase Auth module
   - Authentication service logic

3. **Data Services** (loaded when accessing data):
   - Firestore module
   - Sync service
   - Session service

4. **File Services** (loaded when uploading/downloading):
   - Firebase Storage module
   - File management utilities

### ⚡ **Performance Benefits**

- **Initial Bundle**: ~30% smaller (no unused Firebase modules)
- **First Load**: Faster (only critical services loaded)
- **Progressive Loading**: Services load as needed
- **Offline Support**: Dexie provides immediate data access

### 🔧 **How to Use**

```typescript
// Services automatically handle lazy loading
import { AuthService } from "@/services/auth/auth-service";
import { SessionService } from "@/services/api/session-service";

// Firebase modules load only when first used
await AuthService.signIn(credentials); // Loads Firebase Auth
const session = await SessionService.getCurrentSession(userId); // Loads Firestore
```

### 📊 **Monitoring Bundle Size**

Use the performance workflow to track bundle size:

- Run `npm run build` to see bundle analysis
- Monitor chunk sizes in CI/CD pipeline
- Large chunks (>1MB) trigger optimization warnings

## Service Structure

### 🔐 **Auth Service** (`src/services/auth/`)

- User authentication (sign in, register, sign out)
- Password management and recovery
- User profile management
- Firebase Auth integration

### 💾 **Data Services** (`src/services/api/`)

- Session management
- Task operations
- Goal tracking
- API response handling

### 🔄 **Sync Service** (`src/services/sync/`)

- Firebase ↔ Dexie synchronization
- Real-time updates
- Offline conflict resolution
- Connection state management

### 🗄️ **Storage Service** (`src/services/storage/`)

- Dexie database configuration
- Local data management
- Offline data access

### 🔥 **Firebase Service** (`src/services/firebase.ts`)

- Firebase configuration
- Service initialization
- Environment validation

## Service Layer Rules

✅ **Services SHOULD**:

- Use the logging utility (never console.log)
- Return typed ApiResponse interfaces
- Handle errors gracefully with user-friendly messages
- Use dependency injection patterns
- Be stateless and pure when possible

❌ **Services SHOULD NOT**:

- Import React or UI libraries
- Contain business logic mixed with UI concerns
- Use console.log (use logging utility)
- Handle UI state (use Zustand in components)
- Access DOM directly
