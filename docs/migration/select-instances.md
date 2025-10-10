# Select Component Migration Documentation

This document tracks all select/dropdown instances found in the codebase and their migration status.

## Summary

- **Total Instances Found**: 16
- **Migrated**: 0
- **Remaining**: 16

## Select Instances

### 1. SettingsPage.tsx - Timezone Select
- **File**: `src/pages/SettingsPage.tsx`
- **Line**: 344
- **Current Implementation**:
  ```tsx
  <select
    value={timezone}
    onChange={(e) => {
      setTimezone(e.target.value);
      setValidationError(null);
    }}
    // ... className
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Timezone selection dropdown

---

### 2. FeedbackModal.tsx - Feedback Type Select
- **File**: `src/components/feedback/FeedbackModal.tsx`
- **Line**: 102
- **Current Implementation**:
  ```tsx
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    disabled={disabled}
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Feedback category selection

---

### 3. RulesPageControls.tsx - Filter Select
- **File**: `src/components/rules/RulesPageControls.tsx`
- **Line**: 22
- **Current Implementation**:
  ```tsx
  <select
    value={filter}
    onChange={(e) =>
      onFilterChange(e.target.value as "all" | "active" | "inactive")
    }
    className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Rules filter dropdown with icon

---

### 4. RuleEditor.tsx - Created By Select
- **File**: `src/components/rules/RuleEditor.tsx`
- **Line**: 92
- **Current Implementation**:
  ```tsx
  <select
    value={createdBy}
    onChange={(e) =>
      onCreatedByChange(e.target.value as "submissive" | "keyholder")
    }
    className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Rule creator selection

---

### 5. RecurringTaskForm.tsx - Frequency Select
- **File**: `src/components/keyholder/RecurringTaskForm.tsx`
- **Line**: 67
- **Current Implementation**:
  ```tsx
  <select
    value={frequency}
    onChange={(e) =>
      setFrequency(e.target.value as RecurringConfig["frequency"])
    }
    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Recurring task frequency selection

---

### 6. KeyholderRelationshipsList.tsx - Wearer Select
- **File**: `src/components/keyholder/compound/KeyholderRelationshipsList.tsx`
- **Line**: 25
- **Current Implementation**:
  ```tsx
  <select
    value={selectedWearerId || ""}
    onChange={(e) => setSelectedWearer(e.target.value || null)}
    className="bg-black/20 text-nightly-honeydew px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Wearer relationship selection

---

### 7. KeyholderDashboard.tsx - Wearer Select
- **File**: `src/components/keyholder/KeyholderDashboard.tsx`
- **Line**: 44
- **Current Implementation**:
  ```tsx
  <select
    value={selectedWearerId || ""}
    onChange={(e) => onSetSelectedWearer(e.target.value || null)}
    className="bg-black/20 text-nightly-honeydew px-3 py-2 rounded w-full max-w-md"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Wearer selection for dashboard

---

### 8. RewardsPunishmentsControls.tsx - Filter Select
- **File**: `src/components/rewards_punishments/RewardsPunishmentsControls.tsx`
- **Line**: 20
- **Current Implementation**:
  ```tsx
  <select
    // ... implementation
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Rewards/Punishments filter

---

### 9. SecuritySettings.tsx - Auto-logout Select
- **File**: `src/components/settings/SecuritySettings.tsx`
- **Line**: 20
- **Current Implementation**:
  ```tsx
  <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
    <option value="never">Never</option>
    <option value="15">15 minutes</option>
    <option value="30">30 minutes</option>
    <option value="60">1 hour</option>
    <option value="240">4 hours</option>
  </select>
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Auto-logout timeout selection

---

### 10. RelationshipRequestForm.tsx - Role Select
- **File**: `src/components/relationships/RelationshipRequestForm.tsx`
- **Line**: 55
- **Current Implementation**:
  ```tsx
  <select
    id="role"
    value={value}
    onChange={(e) => onChange(e.target.value as "submissive" | "keyholder")}
    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Relationship role selection

---

### 11. PauseResumeButtons.tsx - Pause Reason Select
- **File**: `src/components/tracker/PauseResumeButtons.tsx`
- **Line**: 112
- **Current Implementation**:
  ```tsx
  <select
    value={selectedReason}
    onChange={(e) => onReasonChange(e.target.value as EnhancedPauseReason)}
    className="w-full p-2 rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Pause reason selection

---

### 12. LeaderboardView.tsx - Category Select
- **File**: `src/components/achievements/LeaderboardView.tsx`
- **Line**: 177
- **Current Implementation**:
  ```tsx
  <select
    value={selectedCategory}
    onChange={(e) =>
      onCategoryChange(e.target.value as LeaderboardCategory)
    }
    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Leaderboard category filter

---

### 13. LeaderboardView.tsx - Period Select
- **File**: `src/components/achievements/LeaderboardView.tsx`
- **Line**: 202
- **Current Implementation**:
  ```tsx
  <select
    value={selectedPeriod}
    onChange={(e) => onPeriodChange(e.target.value as LeaderboardPeriod)}
    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Leaderboard period filter

---

### 14. AchievementGallerySubComponents.tsx - Category Select
- **File**: `src/components/achievements/AchievementGallerySubComponents.tsx`
- **Line**: 108
- **Current Implementation**:
  ```tsx
  <select
    value={selectedCategory}
    onChange={(e) =>
      onCategoryChange(e.target.value as AchievementCategory | "all")
    }
    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Achievement category filter

---

### 15. AchievementGallerySubComponents.tsx - Difficulty Select
- **File**: `src/components/achievements/AchievementGallerySubComponents.tsx`
- **Line**: 125
- **Current Implementation**:
  ```tsx
  <select
    value={selectedDifficulty}
    onChange={(e) =>
      onDifficultyChange(e.target.value as AchievementDifficulty | "all")
    }
    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
  >
  ```
- **Migration Status**: ⏳ Pending
- **Notes**: Achievement difficulty filter

---

### 16. MainNav.jsx - Mobile Navigation Select (Note: In original-app directory)
- **File**: `original-app/components/MainNav.jsx`
- **Line**: ~17
- **Current Implementation**:
  ```jsx
  <select
    value={currentPage}
    onChange={(e) => setCurrentPage(e.target.value)}
    className="w-full p-3 rounded-lg bg-gray-700 text-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-gray-600 shadow-sm text-sm"
  >
  ```
- **Migration Status**: ⏳ Pending  
- **Notes**: Mobile navigation dropdown (in archived original-app, low priority)

---

## Migration Checklist Template

For each select migration:

1. ✅ Import Select component from `@/components/ui`
2. ✅ Convert options to `SelectOption[]` format
3. ✅ Replace `<select>` with `<Select>`
4. ✅ Map `value` prop
5. ✅ Map `onChange` handler (receives value directly, not event)
6. ✅ Add `label` if appropriate
7. ✅ Add `error` handling if validation exists
8. ✅ Remove custom select styling classes
9. ✅ Test functionality
10. ✅ Test keyboard navigation
11. ✅ Test accessibility

## Common Patterns

### Pattern 1: Basic Select
```tsx
// Before
<select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="..."
>
  <option value="opt1">Option 1</option>
  <option value="opt2">Option 2</option>
</select>

// After
<Select
  value={value}
  onChange={setValue}
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
  ]}
/>
```

### Pattern 2: Select with Type Casting
```tsx
// Before
<select
  value={filter}
  onChange={(e) => onFilterChange(e.target.value as FilterType)}
  className="..."
>

// After
<Select
  value={filter}
  onChange={(value) => onFilterChange(value as FilterType)}
  options={filterOptions}
/>
```

### Pattern 3: Select with Label
```tsx
// Before
<label htmlFor="timezone">Timezone</label>
<select id="timezone" value={timezone} onChange={...}>

// After
<Select
  label="Timezone"
  value={timezone}
  onChange={setTimezone}
  options={timezoneOptions}
/>
```
