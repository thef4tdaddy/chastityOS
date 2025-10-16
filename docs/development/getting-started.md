# Getting Started with ChastityOS Development

Welcome to ChastityOS development! This guide will get you up and running in under 30 minutes.

## 📋 Prerequisites

### Required Software

- **Node.js 22+** (LTS version)
- **npm** (comes with Node.js)
- **Git**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Code Editor** (VS Code recommended with extensions below)

### Recommended VS Code Extensions

- ESLint
- Prettier
- Auto Rename Tag
- Tailwind CSS IntelliSense
- Firebase
- GitLens

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/thef4tdaddy/chastityOS.git
cd chastityOS

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Firebase Configuration

#### Development Setup

```bash
# Login to Firebase CLI
firebase login

# Set the project
firebase use --add
# Select your Firebase project or create a new one

# Get Firebase config (ask project maintainer for keys)
```

#### Environment Variables

Edit `.env.local` with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server

```bash
# Start nightly development server
npm run dev:nightly

# Or start production mode for testing
npm run dev:prod
```

Visit `http://localhost:5173` to see the app running!

## 🏗️ Architecture Overview

ChastityOS follows a modern, scalable architecture:

```
Firebase (Cloud) ↔ Dexie (Local) ↔ TanStack Query (Cache) ↔ React Components
                                                      ↑
                                               Zustand (UI State)
                                                      ↑
                                            React Context (Auth/App)
```

### Key Principles

- **UI Components**: Only contain UI logic (no business logic)
- **Services Layer**: All business logic lives in `src/services/`
- **Data Flow**: Firebase is source of truth, Dexie provides offline storage
- **State Management**: TanStack Query for server state, Zustand for UI state only
- **TypeScript**: Gradual migration from JavaScript (Phase 2)

## 📁 Project Structure

```
src/
├── components/           # UI components only (NO business logic)
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── modals/          # Modal components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
│   ├── api/            # TanStack Query hooks
│   ├── state/          # Zustand store hooks
│   ├── ui/             # UI-specific hooks
│   └── utils/          # Utility hooks
├── services/           # Business logic (NO UI)
│   ├── api/           # Firebase API services
│   ├── storage/       # Dexie local storage
│   ├── auth/          # Authentication services
│   └── sync/          # Firebase ↔ Dexie sync
├── stores/            # Zustand stores
│   ├── ui/           # UI state stores
│   └── cache/        # Cache management stores
├── utils/            # Pure utility functions
│   ├── validation/   # Form validation
│   ├── formatting/   # Data formatting
│   ├── constants/    # App constants
│   └── helpers/      # General helpers
├── contexts/         # React contexts (auth, app state)
└── types/           # TypeScript type definitions
```

## 🛠️ Development Workflow

### Branch Strategy

- **nightly**: Development branch (all PRs go here)
- **main**: Production branch (only nightly can merge here)

### Development Process

1. **Create Feature Branch**

   ```bash
   git checkout nightly
   git pull origin nightly
   git checkout -b feature/your-feature-name
   ```

2. **Follow Coding Standards**
   - UI components in `/src/components` contain ONLY UI logic
   - Business logic goes in `/src/services`
   - Use TanStack Query for server state
   - Use Zustand only for UI state
   - Follow ESLint rules strictly

3. **Run Quality Checks**

   ```bash
   # Lint code
   npm run lint

   # Fix linting issues
   npm run lint:fix

   # Format code
   npm run format

   # Check formatting
   npm run format:check

   # Run full CI locally
   npm run ci
   ```

4. **Test Your Changes**

   ```bash
   # Build nightly version
   npm run build:nightly

   # Build production version
   npm run build:production

   # Run health check
   npm run health-check
   ```

5. **Commit Changes**

   ```bash
   # Follow conventional commits
   git add .
   git commit -m "feat: add new feature description"

   # Push to your branch
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Target the `nightly` branch
   - Include clear description
   - Link related issues
   - Ensure CI passes

## 🎯 Common Development Tasks

### Adding a New Feature

1. **Create service layer** in `src/services/`
2. **Create TanStack Query hooks** in `src/hooks/api/`
3. **Create UI components** in `src/components/`
4. **Add Zustand store** for UI state (if needed)
5. **Write tests** (coming in Phase 2)

### Working with Data

```javascript
// ✅ CORRECT: Use service layer
import { SessionService } from 'src/services/api/session-service';
import { useSessionQuery } from 'src/hooks/api/use-session-query';

function MyComponent() {
  const { data: session } = useSessionQuery();
  // UI logic only
}

// ❌ INCORRECT: Business logic in component
function MyComponent() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Don't put API calls directly in components
    firebase.firestore().collection('sessions')...
  }, []);
}
```

### State Management Patterns

```javascript
// ✅ Server state with TanStack Query
const { data, isLoading, error } = useSessionQuery();

// ✅ UI state with Zustand
const { isModalOpen, openModal, closeModal } = useUIStore();

// ✅ App state with React Context
const { user, isAuthenticated } = useAuth();

// ❌ INCORRECT: Using Zustand for server data
const { sessions, setSessions } = useSessionStore(); // Don't do this
```

## 🔧 Useful Commands

### Development

```bash
npm run dev              # Start development server
npm run dev:nightly      # Start nightly mode
npm run dev:prod         # Start production mode
npm run preview          # Preview production build
```

### Building

```bash
npm run build            # Build for development
npm run build:nightly    # Build nightly version
npm run build:production # Build production version
npm run clean            # Clean build artifacts
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run typecheck        # Run TypeScript checks (Phase 2)
```

### Testing

```bash
npm run test             # Run tests (Phase 2)
npm run test:watch       # Watch mode (Phase 2)
npm run test:coverage    # Coverage report (Phase 2)
npm run test:full        # Full test suite
```

### Maintenance

```bash
npm run deps:check       # Check outdated dependencies
npm run deps:update      # Update dependencies safely
npm run deps:audit       # Security audit
npm run health-check     # App health check
```

## 🐛 Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clean everything and reinstall
npm run clean:all
```

#### Firebase Connection Issues

```bash
# Check Firebase project
firebase projects:list

# Verify authentication
firebase login:list
```

#### Vite Development Server Issues

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### ESLint Errors

```bash
# Fix automatically
npm run lint:fix

# Check ESLint configuration
npx eslint --print-config src/App.jsx
```

### Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: Create GitHub issue for bugs
- **Architecture Questions**: See `docs/development/architecture/`
- **API Reference**: See `docs/api/`

## 📚 Next Steps

1. **Read Architecture Docs**: `docs/development/architecture/overview.md`
2. **Review Coding Standards**: `docs/development/coding-standards/`
3. **Explore API Documentation**: `docs/api/`
4. **Check Contributing Guidelines**: `docs/contributing/guidelines.md`

## 🎉 You're Ready!

You should now have ChastityOS running locally. Time to build something awesome!

Remember: Keep UI components pure, use the service layer for business logic, and follow the data flow architecture. Happy coding! 🚀
