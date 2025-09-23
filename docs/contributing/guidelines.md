# Contributing Guidelines

Welcome to ChastityOS! We're excited you're interested in contributing. This guide will help you get started and ensure your contributions align with our project goals and standards.

## 🎯 Project Vision

ChastityOS is modernizing to become a robust, scalable, and user-friendly application with:
- **Offline-first architecture** with Firebase sync
- **Modern React patterns** with TypeScript
- **Clear separation of concerns** (UI vs. business logic)
- **Comprehensive testing** and quality assurance
- **Privacy-focused** design principles

## 🚀 Getting Started

### 1. Environment Setup

Follow our [Developer Setup Guide](../development/getting-started.md) to get your local environment running.

### 2. Understanding the Architecture

Read the [Architecture Overview](../development/architecture/overview.md) to understand our data flow and patterns:
- **Firebase** ↔ **Dexie** ↔ **TanStack Query** ↔ **React Components**
- **Zustand** for UI state only
- **React Context** for auth/app state
- **Services layer** for all business logic

### 3. Code Organization Rules

**Critical**: Components in `/src/components` must contain ONLY UI logic:

```typescript
// ✅ CORRECT: UI-only component
function SessionTracker() {
  const { data: session, isLoading } = useCurrentSession();
  const { mutate: startSession } = useStartSessionMutation();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="session-tracker">
      <SessionTimer session={session} />
      <button onClick={() => startSession()}>Start</button>
    </div>
  );
}

// ❌ INCORRECT: Business logic in component
function SessionTracker() {
  const [session, setSession] = useState(null);

  const startSession = async () => {
    // This belongs in a service!
    const sessionData = { /* ... */ };
    await firebase.firestore().collection('sessions').add(sessionData);
    setSession(sessionData);
  };

  return <button onClick={startSession}>Start</button>;
}
```

## 📋 Types of Contributions

### 🐛 Bug Reports

Before creating a bug report:
1. Check existing [GitHub issues](https://github.com/thef4tdaddy/chastityOS/issues)
2. Test on both nightly and stable versions
3. Gather reproduction steps

**Bug Report Template:**
```markdown
## Bug Description
Clear description of what's broken

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: [Chrome 120, Firefox 115, etc.]
- Version: [4.0.0-nightly.1]
- Device: [Desktop, Mobile, etc.]

## Additional Context
Screenshots, error logs, etc.
```

### 💡 Feature Requests

Feature requests should align with our modernization goals:

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Architecture Impact
How does this fit with our data flow and patterns?

## Alternative Solutions
Other ways to solve this problem

## Implementation Notes
Technical considerations, if any
```

### 🔧 Code Contributions

All code contributions must follow our architectural patterns and quality standards.

## 🌿 Branch Strategy

```
main (production)
 ↑
nightly (development) ← All PRs target this branch
 ↑
feature/your-feature ← Your work happens here
```

### Branch Naming Convention

- `feature/session-pause-improvements`
- `fix/firebase-sync-error`
- `docs/api-documentation-update`
- `refactor/service-layer-optimization`
- `test/session-service-unit-tests`

## 🔄 Development Workflow

### 1. Create Feature Branch

```bash
# Start from nightly
git checkout nightly
git pull origin nightly

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Follow Development Standards

#### Code Quality Checklist
- [ ] **ESLint passes**: `npm run lint`
- [ ] **Prettier formatted**: `npm run format`
- [ ] **TypeScript compiles**: `npm run typecheck` (Phase 2)
- [ ] **Tests pass**: `npm run test` (Phase 2)
- [ ] **Builds successfully**: `npm run build:nightly`

#### Architectural Compliance
- [ ] **UI components** contain only UI logic
- [ ] **Business logic** is in service layer
- [ ] **TanStack Query** used for server state
- [ ] **Zustand** used only for UI state
- [ ] **Error handling** uses centralized logger
- [ ] **No direct Firebase calls** in components

#### Code Style
- [ ] **Consistent naming**: camelCase for variables, PascalCase for components
- [ ] **Clear function names**: `getCurrentSession()` not `getSession()`
- [ ] **Proper TypeScript types**: No `any` types
- [ ] **Documentation**: Complex logic is commented
- [ ] **No console.log**: Use logger utility instead

### 3. Testing Your Changes

```bash
# Run full quality checks
npm run ci

# Test different build modes
npm run build:nightly
npm run build:production

# Run health check
npm run health-check

# Manual testing
npm run dev:nightly
```

### 4. Commit Standards

We use [Conventional Commits](https://conventionalcommits.org/):

```bash
# Format: type(scope): description
git commit -m "feat(sessions): add pause cooldown functionality"
git commit -m "fix(auth): resolve Firebase connection timeout"
git commit -m "docs(api): update SessionService documentation"
git commit -m "refactor(storage): optimize Dexie query performance"
git commit -m "test(hooks): add unit tests for useCurrentSession"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 5. Pull Request Process

#### Before Creating PR
- [ ] Rebase on latest nightly: `git rebase origin/nightly`
- [ ] Squash related commits into logical units
- [ ] Ensure CI passes locally
- [ ] Write clear commit messages

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added unit tests (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
Related to #456

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

#### PR Requirements
- **Target nightly branch** (never main directly)
- **Pass all CI checks**
- **Include tests** for new features
- **Update documentation** if needed
- **Link related issues**
- **Clear description** of changes

## 🧪 Testing Guidelines

### Unit Tests (Phase 2)
```typescript
// Example service test
describe('SessionService', () => {
  it('should start session with valid data', async () => {
    const mockData = { userId: 'test-user' };
    const result = await SessionService.startSession(mockData);

    expect(result.status).toBe('active');
    expect(result.userId).toBe('test-user');
  });

  it('should throw error for invalid data', async () => {
    const invalidData = { userId: '' };

    await expect(SessionService.startSession(invalidData))
      .rejects.toThrow('Invalid user ID');
  });
});
```

### Component Tests (Phase 2)
```typescript
// Example component test
describe('SessionTracker', () => {
  it('should display current session', () => {
    const mockSession = { id: '123', status: 'active' };
    render(<SessionTracker session={mockSession} />);

    expect(screen.getByText('Active Session')).toBeInTheDocument();
  });

  it('should handle start session click', async () => {
    const mockStartSession = jest.fn();
    render(<SessionTracker onStart={mockStartSession} />);

    fireEvent.click(screen.getByText('Start'));
    expect(mockStartSession).toHaveBeenCalled();
  });
});
```

### Integration Tests (Phase 2)
- Test complete user workflows
- Test offline/online scenarios
- Test data sync between layers

## 📖 Documentation Standards

### Code Documentation
```typescript
/**
 * Starts a new chastity session with optimistic updates
 *
 * @param data - Session configuration data
 * @returns Promise that resolves to the created session
 * @throws SessionServiceError when validation fails or user has active session
 *
 * @example
 * ```typescript
 * const session = await SessionService.startSession({
 *   userId: 'user123',
 *   goalDuration: 24 * 60 * 60 * 1000 // 24 hours
 * });
 * ```
 */
async startSession(data: StartSessionData): Promise<ChastitySession> {
  // Implementation...
}
```

### README Updates
- Update feature lists for new functionality
- Add setup instructions for new dependencies
- Update architecture diagrams if needed

### API Documentation
- Document all public methods
- Include usage examples
- Specify error conditions
- Update TypeScript interfaces

## 🛡️ Security Guidelines

### Sensitive Data Handling
- **Never log** sensitive user data
- **Validate all inputs** on both client and server
- **Use TypeScript** to prevent type-related vulnerabilities
- **Follow Firebase Security Rules** for data access

### Authentication
- **Respect user privacy** - anonymous by default
- **Secure keyholder access** with proper validation
- **Handle auth state** through React Context only

### Data Privacy
- **Local-first storage** - sensitive data stays local when possible
- **Encrypted transmission** - all Firebase communication is encrypted
- **User consent** - respect user data preferences

## 🎨 UI/UX Guidelines

### Design Principles
- **Glass morphism aesthetic** - translucent, layered interfaces
- **Accessibility first** - WCAG 2.1 AA compliance
- **Mobile responsive** - works on all device sizes
- **Dark mode support** - respects user preferences

### Component Standards
```typescript
// Use proper TypeScript interfaces
interface SessionTrackerProps {
  session?: ChastitySession;
  onStart?: () => void;
  className?: string;
}

// Use consistent class naming with Tailwind
function SessionTracker({ session, onStart, className }: SessionTrackerProps) {
  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-md rounded-xl border border-white/20",
      "p-6 shadow-lg transition-all duration-200",
      className
    )}>
      {/* Component content */}
    </div>
  );
}
```

### Tailwind CSS Guidelines
- **Use glass morphism patterns**: `bg-white/10 backdrop-blur-md`
- **Consistent spacing**: Use Tailwind spacing scale
- **Responsive design**: Mobile-first approach
- **Dark mode**: Use `dark:` prefixes for dark mode styles

## 🔍 Code Review Process

### As a Reviewer
- **Check architectural compliance** - does code follow our patterns?
- **Verify test coverage** - are new features tested?
- **Review security implications** - any sensitive data handling?
- **Test functionality** - does it work as expected?
- **Provide constructive feedback** - suggest improvements clearly

### Review Checklist
- [ ] **Architectural patterns** followed correctly
- [ ] **Code quality** meets standards (ESLint, TypeScript)
- [ ] **Tests included** for new functionality
- [ ] **Documentation updated** if needed
- [ ] **No breaking changes** or properly documented
- [ ] **Security considerations** addressed
- [ ] **Performance impact** considered

### Common Review Comments
```markdown
# Architectural feedback
"This business logic should be moved to a service. Components should only handle UI."

# Performance feedback
"Consider using useCallback here to prevent unnecessary re-renders."

# Security feedback
"User input should be validated before processing."

# Style feedback
"Let's use the consistent error handling pattern with our logger utility."
```

## 🚀 Release Process

### Version Strategy
- **Nightly releases**: Automatic from nightly branch
- **Stable releases**: Manual from main branch via PR
- **Semantic versioning**: MAJOR.MINOR.PATCH format

### Release Criteria
- [ ] All tests pass
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Breaking changes documented

## 🆘 Getting Help

### Resources
- **Documentation**: Check `docs/` directory first
- **Architecture questions**: See `docs/development/architecture/`
- **API reference**: See `docs/api/`
- **Setup issues**: See `docs/development/getting-started.md`

### Communication
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Code reviews**: For implementation feedback

### Response Times
- **Bug reports**: Within 2-3 days
- **Feature requests**: Within 1 week
- **Pull requests**: Within 3-5 days
- **Questions**: Within 1-2 days

## 🏆 Recognition

Contributors will be recognized through:
- **GitHub contributors list**
- **Release notes mentions**
- **Special thanks** for significant contributions
- **Beta tester credits** for testing efforts

## 📜 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Provide constructive feedback**
- **Focus on the code**, not the person
- **Welcome newcomers** and help them learn
- **Respect privacy** and security concerns

### Unacceptable Behavior
- Personal attacks or harassment
- Discriminatory language or behavior
- Sharing sensitive user data
- Spamming or trolling
- Violating user privacy

## 🎉 Thank You!

Thank you for contributing to ChastityOS! Your efforts help make this application better for our users while advancing modern web development practices.

Every contribution, from bug reports to major features, helps improve the codebase and user experience. We appreciate your time and expertise! 🚀