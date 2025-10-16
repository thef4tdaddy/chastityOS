# Checkbox Instances Migration Documentation

This document tracks all checkbox implementations found in the codebase and their migration status.

## Summary

- **Total Instances Found:** 13
- **Standard Checkboxes Migrated:** 5
- **Toggle Switches (Skipped):** 6
- **UI Components (Skipped):** 2

## Checkbox Instances

### 1. SettingsPage.tsx - Notifications Toggle

- **File:** `/src/pages/SettingsPage.tsx` (Line ~374)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    className="sr-only peer"
    checked={notifications}
    onChange={(e) => setNotifications(e.target.checked)}
  />
  ```
- **Handler:** `setNotifications(e.target.checked)`
- **Label:** "Enable Notifications"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 2. SettingsPage.tsx - Public Profile Toggle

- **File:** `/src/pages/SettingsPage.tsx` (Line ~482)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    className="sr-only peer"
    checked={publicProfile}
    onChange={(e) => setPublicProfile(e.target.checked)}
  />
  ```
- **Handler:** `setPublicProfile(e.target.checked)`
- **Label:** "Public Profile"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 3. SettingsPage.tsx - Share Statistics Toggle

- **File:** `/src/pages/SettingsPage.tsx` (Line ~502)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    className="sr-only peer"
    checked={shareStatistics}
    onChange={(e) => setShareStatistics(e.target.checked)}
  />
  ```
- **Handler:** `setShareStatistics(e.target.checked)`
- **Label:** "Share Statistics"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 4. FeedbackModal.tsx - Include System Info

- **File:** `/src/components/feedback/FeedbackModal.tsx` (Line ~288)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={formData.includeSystemInfo}
    onChange={(e) => updateField("includeSystemInfo", e.target.checked)}
    className="sr-only peer"
  />
  ```
- **Handler:** `updateField("includeSystemInfo", e.target.checked)`
- **Label:** "Include System Info"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 5. RuleEditor.tsx - Rule Active Checkbox

- **File:** `/src/components/rules/RuleEditor.tsx` (Line ~107)
- **Type:** Standard Checkbox
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={isActive}
    onChange={(e) => onIsActiveChange(e.target.checked)}
    className="mr-2"
  />
  ```
- **Handler:** `onIsActiveChange(e.target.checked)`
- **Label:** "Rule is active"
- **Migration Notes:** Simple checkbox with label, standard pattern
- **Status:** ✅ Migrated

### 6. LogEventForm.tsx - Private Event Toggle

- **File:** `/src/components/log_event/LogEventForm.tsx` (Line ~196)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={isPrivate}
    onChange={(e) => onPrivacyChange(e.target.checked)}
    className="sr-only peer"
  />
  ```
- **Handler:** `onPrivacyChange(e.target.checked)`
- **Label:** "Keep this event private"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 7. TaskCreationWithRecurring.tsx - Recurring Task Checkbox

- **File:** `/src/components/keyholder/TaskCreationWithRecurring.tsx` (Line ~86)
- **Type:** Standard Checkbox
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    id="isRecurring"
    checked={isRecurring}
    onChange={(e) => setIsRecurring(e.target.checked)}
    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
  />
  ```
- **Handler:** `setIsRecurring(e.target.checked)`
- **Label:** Associated with label "isRecurring"
- **Migration Notes:** Styled checkbox with specific colors
- **Status:** ✅ Migrated

### 8. Switch.tsx - Toggle Switch Component

- **File:** `/src/components/ui/Form/Switch.tsx` (Line ~125)
- **Type:** Toggle Switch (sr-only pattern) - UI Component
- **Current Implementation:**
  ```tsx
  <input
    ref={ref}
    id={switchId}
    type="checkbox"
    className="sr-only peer"
    checked={checked}
    onChange={handleChange}
  />
  ```
- **Handler:** `handleChange` (internal handler)
- **Migration Notes:** This is already a UI component for toggle switches, should not be migrated
- **Status:** ⚠️ Skip (Already a UI component)

### 9. HardcoreModeSection.tsx - Hardcore Mode Toggle

- **File:** `/src/components/settings/HardcoreModeSection.tsx` (Line ~56)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={isHardcoreMode}
    onChange={(e) => setIsHardcoreMode(e.target.checked)}
    className="sr-only peer"
  />
  ```
- **Handler:** `setIsHardcoreMode(e.target.checked)`
- **Label:** "Hardcore Mode"
- **Migration Notes:** Toggle switch pattern with custom styling
- **Status:** ❌ Not migrated

### 10. LockCombinationSection.tsx - Save Lock Combination

- **File:** `/src/components/settings/LockCombinationSection.tsx` (Line ~33)
- **Type:** Standard Checkbox
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={saveLockCombination}
    onChange={(e) => setSaveLockCombination(e.target.checked)}
    className="rounded"
  />
  ```
- **Handler:** `setSaveLockCombination(e.target.checked)`
- **Label:** "Save Lock Combination (Optional)"
- **Migration Notes:** Simple checkbox
- **Status:** ✅ Migrated

### 11. ToggleSwitch.tsx - Generic Toggle Switch Component

- **File:** `/src/components/settings/ToggleSwitch.tsx` (Line ~23)
- **Type:** Toggle Switch (sr-only pattern) - Reusable Component
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    className="sr-only peer"
    checked={checked}
    onChange={(e) => onChange?.(e.target.checked)}
  />
  ```
- **Handler:** `onChange?.(e.target.checked)`
- **Migration Notes:** This is a reusable component, should not be migrated - it can continue to exist alongside the new Checkbox
- **Status:** ⚠️ Skip (Reusable toggle switch component)

### 12. AchievementPrivacySettings.tsx - Privacy Toggle

- **File:** `/src/components/achievements/AchievementPrivacySettings.tsx` (Line ~47)
- **Type:** Toggle Switch (sr-only pattern)
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    className="sr-only peer"
  />
  ```
- **Handler:** `onChange(e.target.checked)`
- **Label:** Passed as prop
- **Migration Notes:** Part of a reusable component pattern
- **Status:** ⚠️ Skip (Part of reusable component)

### 13. AchievementGallerySubComponents.tsx - Filter Checkbox

- **File:** `/src/components/achievements/AchievementGallerySubComponents.tsx` (Line ~144)
- **Type:** Standard Checkbox
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={showOnlyEarned}
    onChange={(e) => onEarnedFilterChange(e.target.checked)}
    className="rounded border-white/20 bg-white/10 text-nightly-aquamarine focus:ring-nightly-aquamarine"
  />
  ```
- **Handler:** `onEarnedFilterChange(e.target.checked)`
- **Label:** "Earned Only"
- **Migration Notes:** Filter checkbox
- **Status:** ✅ Migrated

### 14. DexieDemo.tsx - Demo Checkbox

- **File:** `/src/demo/components/DexieDemo.tsx` (Line ~170)
- **Type:** Standard Checkbox
- **Current Implementation:**
  ```tsx
  <input
    type="checkbox"
    checked={task.status === "completed"}
    onChange={() =>
      onUpdateTask(task.id, {
        status: task.status === "completed" ? "pending" : "completed",
      })
    }
    disabled={loading}
    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
  />
  ```
- **Handler:** Toggle task status between completed/pending
- **Label:** None (visual only)
- **Migration Notes:** Demo component
- **Status:** ✅ Migrated

## Migration Strategy

### Phase 1: Create Checkbox Component

1. Create `/src/components/ui/Form/Checkbox.tsx` with all required features
2. Export from Form index
3. Export from main UI index

### Phase 2: Identify Migration Types

Based on analysis, there are two main patterns:

1. **Standard Checkbox** - Visible checkbox with label (5 instances)
2. **Toggle Switch** - Hidden checkbox with toggle UI (6 instances, + 3 components)

Note: Some instances are already part of reusable components (Switch.tsx, ToggleSwitch.tsx, AchievementPrivacySettings.tsx) and should be left as is.

### Phase 3: Migrate Standard Checkboxes

- RuleEditor.tsx
- TaskCreationWithRecurring.tsx
- LockCombinationSection.tsx
- AchievementGallerySubComponents.tsx
- DexieDemo.tsx (demo)

### Phase 4: Consider Toggle Switch Migration

The toggle switch pattern is used extensively. Two options:

1. Keep existing Switch/ToggleSwitch components for toggle pattern
2. Extend Checkbox component to support toggle variant

**Recommendation:** Keep existing Switch component for toggle switches, use new Checkbox for standard checkboxes.

## Notes

- The `Switch.tsx` component in `/src/components/ui/Form/Switch.tsx` is already a well-designed toggle switch component
- The `ToggleSwitch.tsx` in settings is a simpler version that could potentially use the Form/Switch component
- Many instances use the "sr-only peer" pattern for custom toggle switches
- Focus should be on standard checkbox pattern, not toggle switches
