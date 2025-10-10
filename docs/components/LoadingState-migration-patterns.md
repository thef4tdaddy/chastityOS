# LoadingState Migration Patterns

This document identifies existing loading patterns in the codebase that could be migrated to use the new LoadingState component in future PRs.

## Summary

Found **40+ instances** of loading patterns across the codebase that could benefit from standardization.

## Pattern Categories

### 1. FaSpinner with Text (20+ occurrences)

These are the most common patterns using react-icons FaSpinner with accompanying text.

**Files:**
- `src/pages/SettingsPage.tsx` (5 instances)
- `src/pages/FullReportPage.tsx`
- `src/pages/LogEventPage.tsx`
- `src/pages/KeyholderPage.tsx`
- `src/components/goals/SpecialChallengeSection.tsx`
- `src/components/tasks/TaskEvidenceUpload.tsx`
- `src/components/log_event/LogEventForm.tsx`
- `src/components/keyholder/KeyholderPasswordUnlock.tsx`
- `src/components/keyholder/ReleaseRequestCard.tsx`
- `src/components/keyholder/AccountLinkingComponents.tsx` (2 instances)
- `src/components/keyholder/KeyholderDashboard.tsx` (2 instances)
- `src/components/auth/GoogleSignInButton.tsx`
- `src/components/rewards_punishments/RewardsPunishmentsContent.tsx`
- `src/components/settings/DataControls.tsx` (2 instances)
- `src/components/settings/EmergencyPinSetup.tsx`
- `src/components/settings/ResetModal.tsx`
- `src/components/settings/EmergencyPinEdit.tsx`
- `src/components/relationships/RelationshipRequestForm.tsx`
- `src/components/relationships/PendingRequestsList.tsx` (2 instances)
- `src/components/relationships/MigrationBanner.tsx`
- `src/components/tracker/BegForReleaseButton.tsx` (3 instances)

**Example:**
```tsx
// Current
<FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
<div className="text-nightly-celadon">Loading report...</div>

// Can become
<LoadingState message="Loading report..." />
```

### 2. Full-Screen Loading States (4 instances)

**Files:**
- `src/components/tracker/SessionLoader.tsx`
- `src/App.jsx` (if isLoading)
- Others with fixed inset-0 patterns

**Example:**
```tsx
// Current
<div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
  <FaSpinner className="animate-spin text-4xl text-purple-400 mx-auto mb-4" />
  <h3>Loading Session...</h3>
</div>

// Can become
<LoadingState message="Loading Session..." fullScreen />
```

### 3. Custom Spinner Divs (5+ instances)

Custom implementations using Tailwind classes for spinners.

**Files:**
- `src/pages/TasksPage.tsx`
- `src/components/profile/ProfileErrorStates.tsx`
- `src/Root.tsx`

**Example:**
```tsx
// Current
<div className="inline-flex items-center space-x-2">
  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
  <span className="text-blue-200 text-lg">Loading tasks...</span>
</div>

// Can become
<LoadingState message="Loading tasks..." />
```

### 4. Page-Level Loading States (10+ instances)

Simple text or minimal loading indicators at page level.

**Files:**
- `src/pages/RulesPage.tsx`
- `src/pages/SettingsPage.tsx`
- Various other page components

**Example:**
```tsx
// Current
if (isLoading) {
  return (
    <div className="text-center p-8">
      <p>Loading rules...</p>
    </div>
  );
}

// Can become
if (isLoading) {
  return <LoadingState message="Loading rules..." />;
}
```

### 5. Inline Button/Form Loading (8+ instances)

Loading indicators within buttons or forms during async operations.

**Files:**
- Various form components
- Button components with loading states

**Example:**
```tsx
// Current
<button disabled={isSubmitting}>
  {isSubmitting ? <FaSpinner className="animate-spin" /> : "Submit"}
</button>

// Can become
<button disabled={isSubmitting}>
  {isSubmitting ? <LoadingState size="sm" message="" /> : "Submit"}
</button>
```

## Migration Priority

### High Priority (Most Common Patterns)
1. **FaSpinner + text combinations** - Most frequent, highly visible
2. **Full-screen loading states** - Critical user experience moments
3. **Page-level loading** - Consistent UX across pages

### Medium Priority
4. **Custom spinner implementations** - Code consistency
5. **Profile loading states** - Specialized but consistent

### Low Priority
6. **Inline button/form loading** - May need size adjustments
7. **Component-specific loading** - May have specific requirements

## Migration Guidelines

1. **Start with high-priority patterns** that are most visible to users
2. **Migrate file-by-file** to make reviews manageable
3. **Test each migration** to ensure visual consistency
4. **Keep existing functionality** - only change the implementation
5. **Use appropriate sizes**: 
   - `sm` for inline/button loading
   - `md` (default) for cards/sections
   - `lg` for prominent page sections
6. **Choose correct mode**:
   - Inline (default) for most cases
   - `fullScreen` for initial page loads
   - `overlay` for async operations over content

## Benefits of Migration

1. **Consistency** - Uniform loading UX across the app
2. **Accessibility** - Built-in ARIA attributes
3. **Maintainability** - Single source of truth for loading states
4. **Bundle Size** - Reduce duplicate spinner implementations
5. **Developer Experience** - Simpler API than manual spinner + layout

## Notes

- This is a **non-breaking change** - existing patterns continue to work
- Migration should be done **incrementally** in separate PRs
- Each migration PR should focus on a **specific area or pattern type**
- **Visual testing** recommended after each migration batch
