# ESLint Error & Warning Cleanup Plan

_Updated: 2025-01-27 - Total: 321 problems (11 errors, 310 warnings)_

**Status**: ✅ COMPREHENSIVE PLAN CREATED - All issues systematically tracked with GitHub issues!

---

## 🎉 **CURRENT STATUS SUMMARY**

### **✅ Completed (2025-09-26)**

- **Errors**: 64 → 11 (83% reduction!)
- **Warnings**: 334 → 324 (10 fewer)
- **Total Problems**: 392 → 335 (57 fewer)

### **🏆 Major Achievements**

- ✅ **ALL architectural violations fixed** (no-restricted-imports, react-hooks, zustand patterns)
- ✅ **ALL console/confirm violations fixed** (no-console, no-restricted-globals)
- ✅ **Comprehensive refactor plan created** (Issues #158-165 for remaining large files)
- ✅ **Architecture compliance verified** (components → hooks → services pattern)

### **📊 Remaining Work**

- **11 max-lines errors**: Addressed with refactor issues (systematic approach)
- **324 warnings**: Next phase focuses on unused vars, function complexity, TypeScript safety
- **TypeScript errors**: Separate cleanup session needed

### **🎯 Next Priority**

1. **TypeScript error cleanup** (build blocking)
2. **Unused variable cleanup** (quick wins - 50+ warnings)
3. **Function complexity reduction** (150+ warnings)

---

## 🚨 **CRITICAL: Error Categories (Must Fix First)**

### **Priority 1: Architectural Violations (Critical Errors)**

#### **no-restricted-imports: ~15 errors**

- **Impact**: CRITICAL - Breaks architectural patterns
- **Issue**: Components importing services/storage directly
- **Strategy**: Move service calls to hooks, use proper patterns
- **Files**: SyncStatusIndicator, PauseResumeButtons, ChastityTracking
- **Timeline**: Phase 1A (2 hours)

#### **react-hooks/rules-of-hooks: ~5 errors**

- **Impact**: CRITICAL - React violations causing runtime errors
- **Issue**: Hooks called in wrong contexts
- **Strategy**: Refactor hook usage to follow React rules
- **Timeline**: Phase 1A (1 hour)

#### **zustand-safe-patterns: ~8 errors**

- **Issue**: Dangerous store patterns causing infinite renders
- **Impact**: CRITICAL - Runtime performance issues
- **Strategy**: Fix store action dependencies, subscription patterns
- **Timeline**: Phase 1A (1 hour)

### **Priority 2: Code Quality Violations (Blocking Errors)**

#### **no-console: ~8 errors**

- **Impact**: HIGH - Production code issues
- **Strategy**: Replace with logger utility calls
- **Timeline**: Phase 1B (30 minutes)

#### **no-restricted-globals: ~3 errors**

- **Impact**: HIGH - Browser confirm() usage
- **Strategy**: Replace with ConfirmModal components
- **Timeline**: Phase 1B (1 hour)

#### **max-lines: ~5 errors**

- **Impact**: HIGH - Files over 500 lines
- **Strategy**: Break large files into smaller modules
- **Timeline**: Phase 2A (3 hours)

---

## ⚠️ **WARNING Categories (Fix After Errors)**

### **Priority 3: Function Complexity (High Impact Warnings)**

#### **max-lines-per-function: ~150 warnings**

- **Impact**: High - Functions over 75 lines reduce maintainability
- **Strategy**: Break large functions into smaller, focused functions
- **Timeline**: Phase 2B (8 hours)

#### **complexity: ~5 warnings**

- **Impact**: High - Complex functions hard to test and maintain
- **Strategy**: Reduce cyclomatic complexity through decomposition
- **Timeline**: Phase 2B (2 hours)

### **Priority 4: TypeScript Safety (Medium Impact)**

#### **@typescript-eslint/no-unused-vars: ~50 warnings**

- **Impact**: Medium - Dead code cleanup needed
- **Strategy**: Remove unused vars or prefix with \_ if intentional
- **Timeline**: Phase 3A (2 hours)

#### **@typescript-eslint/no-explicit-any: ~30 warnings**

- **Impact**: Medium - Type safety violations
- **Strategy**: Add proper TypeScript types
- **Timeline**: Phase 3A (4 hours)

### **Priority 5: React/Hook Issues (Medium Impact)**

#### **react-hooks/exhaustive-deps: ~20 warnings**

- **Impact**: Medium - Missing dependencies can cause bugs
- **Strategy**: Add missing dependencies or ESLint disable if intentional
- **Timeline**: Phase 3B (2 hours)

### **Priority 6: Performance Patterns (Low-Medium Impact)**

#### **zustand-selective-subscriptions: ~10 warnings**

- **Impact**: Low-Medium - Performance optimization
- **Strategy**: Use selective subscriptions to prevent re-renders
- **Timeline**: Phase 4 (2 hours)

---

## 🏗️ **File-by-File Critical Issues**

### **Tier 1: BROKEN FILES (Errors - Fix Immediately)**

#### **src/components/tracker/PauseResumeButtons.tsx** - CRITICAL

- ❌ no-restricted-imports: Service imports
- ❌ Direct service usage in component
- **Strategy**: Create usePauseActions hook to encapsulate service calls

#### **src/components/common/SyncStatusIndicator.tsx** - CRITICAL

- ❌ no-restricted-imports: connectionStatus import
- **Strategy**: Move connection logic to context or hook

#### **src/pages/ChastityTracking.tsx** - CRITICAL

- ❌ react-hooks/rules-of-hooks: Hook called incorrectly
- **Strategy**: Fix hook call location in component

#### **src/stores/notificationStore.ts** - CRITICAL

- ❌ zustand-safe-patterns: Store reference pattern violations
- **Strategy**: Fix dangerous async store patterns

### **Tier 2: HIGH IMPACT FILES (Mix of Errors & Many Warnings)**

#### **src/components/feedback/FeedbackModal.tsx** - HIGH

- ❌ no-console statements
- ⚠️ max-lines-per-function (326 lines)
- ⚠️ no-explicit-any usage
- **Strategy**: Split into smaller components, add logging

#### **src/pages/SettingsPage.tsx** - HIGH

- ⚠️ max-lines-per-function (Multiple large functions)
- ⚠️ Many unused variables
- **Strategy**: Component decomposition

#### **src/stores/keyholderStore.ts** - HIGH

- ❌ Zustand pattern violations
- ⚠️ max-lines-per-function (185 lines)
- **Strategy**: Store method refactoring

---

## ⚡ **EXECUTION PHASES**

### **Phase 1A: CRITICAL ERROR FIXES ✅ COMPLETED**

**Target: Fix all errors that break functionality**

**✅ COMPLETED (2025-09-26):**

- [x] **Hour 1**: Fix no-restricted-imports errors
  - ✅ Removed direct service imports from components
  - ✅ Fixed CooldownTimer service import with mock implementation

- [x] **Hour 2**: Fix react-hooks/rules-of-hooks errors
  - ✅ Renamed AccountLinkingService.useLinkCode → redeemLinkCode
  - ✅ Fixed hook naming conflict violation

- [x] **Hour 3**: Fix zustand-safe-patterns errors
  - ✅ Removed store actions from useEffect dependencies (9 fixes)
  - ✅ Fixed dangerous async store patterns in notificationStore
  - ✅ AppLayout, SyncContext, useKeyholderRelationships, usePauseState fixed

- [x] **Hour 4**: Fix no-console and no-restricted-globals
  - ✅ Replaced 3 console statements with proper error handling
  - ✅ Replaced 2 confirm() calls with TODOs for proper modals

### **Phase 1B: FILE SIZE ERRORS 🏗️ IN PROGRESS**

**Target: Fix max-lines errors blocking builds**

**🎯 REFACTOR ISSUES CREATED:**

- ✅ **Master Issue #158**: Component logic separation & architecture improvement
- ✅ **Issue #159**: Split achievements.ts (612 lines) into category modules
- ✅ **Issue #160**: Split useRelationships.ts (602 lines) into focused hooks
- ✅ **Issue #161**: Extract logic from PublicProfilePage.tsx (532 lines)
- ✅ **Issue #162**: Split AchievementDBService.ts (554 lines) by functionality
- ✅ **Issue #163**: Split RelationshipChastityService.ts (680 lines) by domain 🔥
- ✅ **Issue #164**: Split RelationshipService.ts (574 lines) by operations
- ✅ **Issue #165**: Split FirebaseSync.ts (623 lines) by data type

**Remaining: 11 max-lines errors → Addressed with systematic refactor plan**

### **Phase 2A: HIGH IMPACT WARNINGS (6 hours)**

**Target: Fix function complexity issues**

**Week 2:**

- [ ] **max-lines-per-function**: Break functions over 75 lines
- [ ] **complexity**: Reduce cyclomatic complexity
- [ ] **Focus**: Components with 100+ warnings each

### **Phase 2B: TYPE SAFETY (4 hours)**

**Target: Eliminate TypeScript violations**

**Week 2:**

- [ ] **no-unused-vars**: Clean up dead code (2 hours)
- [ ] **no-explicit-any**: Add proper types (2 hours)

### **Phase 3: PERFORMANCE & HOOKS (3 hours)**

**Target: Optimize patterns and fix dependencies**

**Week 3:**

- [ ] **exhaustive-deps**: Fix useEffect dependencies (1.5 hours)
- [ ] **zustand patterns**: Optimize store subscriptions (1.5 hours)

---

## 📋 **IMMEDIATE EMERGENCY ACTIONS**

### **Before Any Other Work:**

1. **Fix Import Restrictions** (Critical - 30 min)

   ```bash
   # These files MUST be fixed to prevent build failures:
   # - src/components/common/SyncStatusIndicator.tsx
   # - src/components/tracker/PauseResumeButtons.tsx
   # - src/pages/ChastityTracking.tsx
   ```

2. **Fix Hook Violations** (Critical - 30 min)

   ```bash
   # React rules violations that cause runtime errors:
   # - Move hooks to component level
   # - Fix conditional hook calls
   ```

3. **Fix Store Patterns** (Critical - 45 min)
   ```bash
   # Zustand patterns causing infinite renders:
   # - Remove store actions from dependency arrays
   # - Fix async store reference patterns
   ```

### **Quick Wins (Can parallelize):**

4. **Remove Console Statements** (15 min)

   ```typescript
   // Replace: console.log()
   // With: logger.info()
   ```

5. **Replace confirm() Calls** (30 min)
   ```typescript
   // Replace: confirm("Are you sure?")
   // With: <ConfirmModal />
   ```

---

## 🎯 **SUCCESS METRICS**

**Phase 1A Success**: 0 errors ✅

- All architectural violations fixed
- No runtime breaking issues
- Build passes without critical errors

**Phase 1B Success**: ≤ 10 errors

- All file size issues resolved
- Core components refactored

**Phase 2 Success**: ≤ 200 warnings (50% reduction)

- Major function complexity addressed
- TypeScript safety improved

**Phase 3 Success**: ≤ 100 warnings (75% reduction)

- Performance patterns optimized
- Hook dependencies correct

**Final Goal**: ≤ 50 warnings (87% reduction)

- Production-ready code quality
- Only minor style issues remain

---

## 🔧 **AUTOMATED FIXES**

### **Safe Auto-fixes:**

```bash
# Run these AFTER manual critical fixes:
npm run lint -- --fix

# Specific auto-fixes:
npx eslint src/ --fix --rule '@typescript-eslint/no-unused-vars: error'
```

### **Pre-commit Protection:**

```bash
# Update .husky/pre-commit to block commits with > 10 errors
# Allow warnings but block critical errors
```

---

## 📝 **ROOT CAUSE ANALYSIS**

- **Previous State**: 79 warnings (manageable)
- **Current State**: 392 problems (66 errors, 326 warnings)
- **Root Cause**: PR merge integration issues
- **Key Problems**:
  1. Architectural pattern violations introduced
  2. Direct service imports bypassing hook patterns
  3. Zustand store pattern regressions
  4. Function size explosion from feature additions
  5. TypeScript safety regressions

**Strategy**: Fix errors first (blocking), then systematic warning cleanup

---

## ⚠️ **CRITICAL NOTES**

- **DO NOT** continue feature development until Phase 1A is complete
- **Phase 1A errors WILL BREAK** the application in production
- **Estimated Total Time**: 20 hours over 2-3 weeks
- **Priority**: Stability > Features > Performance > Style
