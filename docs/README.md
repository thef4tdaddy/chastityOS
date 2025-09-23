# ChastityOS Documentation

Welcome to the ChastityOS documentation! This comprehensive guide covers everything from getting started with development to understanding our architecture and contributing to the project.

## 🚀 Quick Start

### For Developers
- **[Getting Started](development/getting-started.md)** - Set up your development environment
- **[Architecture Overview](development/architecture/overview.md)** - Understand our modern architecture
- **[Contributing Guidelines](contributing/guidelines.md)** - How to contribute to the project

### For Users
- **[User Guides](user-guides/)** - How to use ChastityOS features
- **[Privacy & Security](security/)** - Our privacy practices and security measures

## 📚 Documentation Structure

### 🏗️ Development
- **[Getting Started](development/getting-started.md)** - Complete setup guide
- **[Architecture](development/architecture/)**
  - [Overview](development/architecture/overview.md) - High-level architecture
  - [Data Flow](development/architecture/data-flow.md) - Firebase ↔ Dexie ↔ TanStack flow
- **[Coding Standards](development/coding-standards/)**
  - [Components](development/coding-standards/components.md) - UI component patterns
  - [Hooks](development/coding-standards/hooks.md) - Custom hook patterns
  - [TypeScript](development/coding-standards/typescript.md) - TS conventions
- **[Tools](development/tools/)**
  - [ESLint Rules](development/tools/eslint-rules.md) - Detailed rule explanations
  - [Vite Configuration](development/tools/vite-config.md) - Build setup
  - [Debugging](development/tools/debugging.md) - Debug tools and techniques

### 🚀 Deployment
- **[Environments](deployment/environments.md)** - Nightly vs Production
- **[Firebase Setup](deployment/firebase-setup.md)** - Firebase configuration
- **[Vercel Deployment](deployment/vercel-deployment.md)** - Deployment process

### 📊 API Documentation
- **[Services](api/services/)**
  - [Session Service](api/services/session-service.md) - Session management API
  - [Task Service](api/services/task-service.md) - Task management API
  - [Event Service](api/services/event-service.md) - Event logging API
  - [Sync Service](api/services/sync-service.md) - Firebase ↔ Dexie sync
- **[Hooks](api/hooks/)**
  - [Query Hooks](api/hooks/queries.md) - TanStack Query hooks
  - [Mutation Hooks](api/hooks/mutations.md) - Data mutation hooks
  - [Store Hooks](api/hooks/stores.md) - Zustand store interfaces
- **[Types](api/types/)**
  - [Core Types](api/types/core-types.md) - Core TypeScript interfaces
  - [API Types](api/types/api-types.md) - API request/response types

### 🎯 Features
- **[Chastity Tracking](features/chastity-tracking.md)** - Session and timing features
- **[Keyholder System](features/keyholder-system.md)** - Admin access and linking
- **[Task Management](features/task-management.md)** - Task workflow and approval
- **[Event Logging](features/event-logging.md)** - Sexual activity logging
- **[Data Management](features/data-management.md)** - Import/export functionality

### 🔒 Security
- **[Authentication](security/authentication.md)** - Auth patterns and security
- **[Data Privacy](security/data-privacy.md)** - Privacy practices and GDPR
- **[Firebase Rules](security/firebase-rules.md)** - Security rule documentation
- **[Account Linking](security/account-linking.md)** - Secure keyholder linking

### 🤝 Contributing
- **[Guidelines](contributing/guidelines.md)** - How to contribute
- **[Code Review](contributing/code-review.md)** - PR process and standards
- **[Issue Templates](contributing/issue-templates.md)** - Issue creation guidelines
- **[Release Process](contributing/release-process.md)** - How releases are made

### 🔧 Troubleshooting
- **[Common Issues](troubleshooting/common-issues.md)** - FAQ and solutions
- **[Development Issues](troubleshooting/development-issues.md)** - Dev environment problems
- **[Build Issues](troubleshooting/build-issues.md)** - Build and deployment problems
- **[User Issues](troubleshooting/user-issues.md)** - End-user troubleshooting

## 🏗️ Architecture at a Glance

ChastityOS uses a modern, offline-first architecture:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Firebase  │◄──►│    Dexie     │◄──►│ TanStack Query  │◄──►│  React Components │
│  (Cloud DB) │    │ (Local DB)   │    │ (Server Cache)  │    │   (UI Only)     │
└─────────────┘    └──────────────┘    └─────────────────┘    └────────────────┘
                                                    ▲
                                                    │
                                              ┌─────────────┐
                                              │   Zustand   │
                                              │ (UI State)  │
                                              └─────────────┘
```

### Key Principles
- **Firebase**: Source of truth, cloud sync, real-time updates
- **Dexie**: Offline storage, fast local queries, automatic sync
- **TanStack Query**: Server state caching, optimistic updates, background sync
- **Zustand**: UI state only (modals, forms, preferences)
- **React Context**: Auth state, app-level state
- **Services Layer**: All business logic (separated from UI components)

## 📋 Project Status

### Current Version: 4.0.0-nightly.1

### 🏗️ Phase 1: Foundation & Architecture (In Progress)
- ✅ Configuration organization
- ✅ Directory structure
- ✅ Package updates
- ✅ GitHub workflows
- 🔄 Documentation (this effort)
- ⏳ ESLint rules implementation
- ⏳ TypeScript migration prep

### 💾 Phase 2: Data Layer Modernization (Planned)
- TanStack Query implementation
- Dexie local database setup
- Firebase sync service
- Zustand UI state management

### 🔗 Phase 3: Multi-User & Account Linking (Planned)
- Keyholder system implementation
- Account linking security
- Firebase security rules

### 🎨 Phase 4: UI/UX Modernization (Planned)
- Glass morphism design system
- Modern component library
- Enhanced mobile PWA

### ⚡ Phase 5: Performance & Polish (Planned)
- Performance optimization
- Comprehensive testing
- Final architecture polish

## 🔗 Quick Links

### Essential Reading
1. **[Getting Started](development/getting-started.md)** - Start here for development
2. **[Architecture Overview](development/architecture/overview.md)** - Understand the big picture
3. **[Contributing Guidelines](contributing/guidelines.md)** - How to contribute

### Common Tasks
- **Adding a new feature**: [Contributing Guidelines](contributing/guidelines.md) → [Architecture Overview](development/architecture/overview.md)
- **Fixing a bug**: [Development Issues](troubleshooting/development-issues.md) → [Getting Started](development/getting-started.md)
- **Understanding data flow**: [Data Flow](development/architecture/data-flow.md) → [Session Service](api/services/session-service.md)
- **Setting up environment**: [Getting Started](development/getting-started.md) → [Firebase Setup](deployment/firebase-setup.md)

### API References
- **Session Management**: [Session Service](api/services/session-service.md)
- **Task System**: [Task Service](api/services/task-service.md)
- **Event Logging**: [Event Service](api/services/event-service.md)
- **Data Sync**: [Sync Service](api/services/sync-service.md)

## 🛟 Getting Help

### Before Asking
1. **Search this documentation** - Use Ctrl+F to find relevant sections
2. **Check troubleshooting guides** - Common issues have solutions
3. **Review GitHub issues** - Your question might be answered already

### How to Get Help
- **Development questions**: Check [Development](development/) section first
- **Bug reports**: Use [GitHub Issues](https://github.com/thef4tdaddy/chastityOS/issues)
- **Feature requests**: Use [GitHub Discussions](https://github.com/thef4tdaddy/chastityOS/discussions)
- **General questions**: Start with [Common Issues](troubleshooting/common-issues.md)

### Response Times
- **Documentation issues**: 1-2 days
- **Bug reports**: 2-3 days
- **Feature requests**: 1 week
- **General questions**: 1-2 days

## 🎯 Documentation Goals

This documentation aims to:
- **Get developers productive quickly** (< 30 minutes setup)
- **Explain architectural decisions** and patterns
- **Provide comprehensive API references** with examples
- **Ensure code quality** through clear standards
- **Support the modernization effort** with clear migration paths

## 📝 Contributing to Documentation

Found something unclear or missing? Documentation contributions are welcome!

1. **Small fixes**: Edit directly and submit PR
2. **New sections**: Follow existing structure and patterns
3. **Major updates**: Discuss in issues first

### Documentation Standards
- **Clear and concise** writing
- **Practical examples** for all concepts
- **Up-to-date** with current codebase
- **Searchable structure** with good headings
- **Cross-referenced** between related topics

---

Welcome to ChastityOS development! We're building something modern, robust, and user-focused. Let's create something amazing together! 🚀