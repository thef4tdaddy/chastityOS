# Radio Button Migration Documentation

This document tracks all radio button implementations in the codebase and their migration status.

## Overview

- **Total Instances Found**: 4
- **Migrated**: 0
- **Remaining**: 4

## Radio Button Instances

### 1. ManualEntryForm.tsx - Type Selection (Reward/Punishment)

**File**: `/src/components/rewards_punishments/ManualEntryForm.tsx`  
**Lines**: 26-44  
**Type**: Radio Group  
**Migration Status**: ❌ Not Migrated

**Current Implementation**:
```tsx
<label className="flex items-center">
  <input
    type="radio"
    value="reward"
    checked={type === "reward"}
    onChange={(e) => onChange(e.target.value as "reward" | "punishment")}
    className="mr-2"
  />
  <span className="text-green-400">Reward</span>
</label>
<label className="flex items-center">
  <input
    type="radio"
    value="punishment"
    checked={type === "punishment"}
    onChange={(e) => onChange(e.target.value as "reward" | "punishment")}
    className="mr-2"
  />
  <span className="text-red-400">Punishment</span>
</label>
```

**Migration Plan**:
- Convert to RadioGroup with 2 options
- Map onChange from event to value callback
- Preserve color styling for labels (green for reward, red for punishment)
- Use horizontal orientation

**RadioGroup Configuration**:
```tsx
const typeOptions: RadioOption[] = [
  { value: "reward", label: "Reward" },
  { value: "punishment", label: "Punishment" },
];

<RadioGroup
  name="type"
  value={type}
  onChange={(value) => onChange(value as "reward" | "punishment")}
  options={typeOptions}
  orientation="horizontal"
  size="md"
/>
```

**Custom Styling Needed**:
- Labels need color override: Reward (green), Punishment (red)

---

### 2. ConflictResolutionModal.tsx - Version Selection

**File**: `/src/components/common/ConflictResolutionModal.tsx`  
**Lines**: 52-59  
**Type**: Radio Group (per conflict)  
**Migration Status**: ❌ Not Migrated

**Current Implementation**:
```tsx
<input
  type="radio"
  name={conflictId}
  value={isLocal ? "local" : "remote"}
  checked={isSelected}
  onChange={onSelect}
  className="sr-only"
/>
```

**Migration Plan**:
- Already using custom radio styling with sr-only input
- Convert to RadioGroup with 2 options per conflict (local/remote)
- Preserve custom border and background styling for selected state
- Map onChange to handle selection

**RadioGroup Configuration**:
```tsx
const versionOptions: RadioOption[] = [
  { 
    value: "local", 
    label: "This Device",
    description: formatValue(conflict.localData)
  },
  { 
    value: "remote", 
    label: "Other Device",
    description: formatValue(conflict.remoteData)
  },
];

<RadioGroup
  name={conflictId}
  value={resolution || ""}
  onChange={(value) => onResolutionChange(conflictId, value as "local" | "remote")}
  options={versionOptions}
  orientation="horizontal"
  size="md"
/>
```

**Notes**:
- Already has custom card styling for each version
- Need to integrate Radio component with existing card design

---

### 3. ReasonStage.tsx - Emergency Unlock Reasons

**File**: `/src/components/tracker/EmergencyUnlockModal/ReasonStage.tsx`  
**Lines**: 32-39  
**Type**: Radio Group  
**Migration Status**: ❌ Not Migrated

**Current Implementation**:
```tsx
<input
  type="radio"
  name="emergency-reason"
  value={emergencyReason}
  checked={reason === emergencyReason}
  onChange={(e) => setReason(e.target.value as EmergencyUnlockReason)}
  className="mt-1 mr-3 text-red-600"
/>
```

**Migration Plan**:
- Convert to RadioGroup with EMERGENCY_UNLOCK_REASONS options
- Already has custom styling with border and background for each option
- Map descriptions to RadioOption description field
- Preserve red theme for emergency context

**RadioGroup Configuration**:
```tsx
const reasonOptions: RadioOption[] = EMERGENCY_UNLOCK_REASONS.map(reason => ({
  value: reason,
  label: reason,
  description: getReasonDescription(reason),
}));

<RadioGroup
  name="emergency-reason"
  value={reason}
  onChange={(value) => setReason(value as EmergencyUnlockReason)}
  options={reasonOptions}
  size="md"
/>
```

**Notes**:
- Already has custom card styling for each reason
- Need to preserve red border styling for selected state

---

### 4. AchievementPrivacySettings.tsx - Display Name Selection

**File**: `/src/components/achievements/AchievementPrivacySettings.tsx`  
**Lines**: 76-82  
**Type**: Radio Group  
**Migration Status**: ❌ Not Migrated

**Current Implementation**:
```tsx
<input
  type="radio"
  name={name}
  value={value}
  checked={checked}
  onChange={(e) => onChange(e.target.value)}
  className="text-nightly-aquamarine focus:ring-nightly-aquamarine"
/>
```

**Migration Plan**:
- Convert RadioOption component to use RadioGroup
- Three options: anonymous, username, real
- Each has title and description already defined
- Preserve nightly theme colors

**RadioGroup Configuration**:
```tsx
const displayNameOptions: RadioOption[] = [
  {
    value: "anonymous",
    label: "Anonymous",
    description: 'Show as "ChastityUser_XXXX"',
  },
  {
    value: "username",
    label: "Username",
    description: "Use your username if available",
  },
  {
    value: "real",
    label: "Real Name",
    description: "Use your real name (not recommended)",
  },
];

<RadioGroup
  name="displayName"
  label="Display Name"
  value={settings.displayName}
  onChange={(value) => onSettingChange("displayName", value)}
  options={displayNameOptions}
  size="md"
/>
```

**Notes**:
- Currently wrapped in bg-white/5 rounded-lg cards
- Need to adapt RadioGroup to match existing card styling

---

## Migration Strategy

### Phase 1: Component Creation ✅
- [x] Create Radio component
- [x] Create RadioGroup component
- [x] Add CSS animations
- [x] Export from ui/index.ts

### Phase 2: Simple Migrations
- [ ] Migrate ManualEntryForm.tsx (simplest case)
- [ ] Migrate AchievementPrivacySettings.tsx

### Phase 3: Complex Migrations
- [ ] Migrate ReasonStage.tsx (custom card styling)
- [ ] Migrate ConflictResolutionModal.tsx (most complex)

### Phase 4: Testing & Validation
- [ ] Test keyboard navigation
- [ ] Test focus states
- [ ] Test disabled states
- [ ] Test responsive behavior
- [ ] Verify accessibility

## Testing Checklist

For each migrated component:
- [ ] Radio button selects on click
- [ ] Only one radio in group can be selected
- [ ] Selected state displays correctly
- [ ] onChange fires with correct value
- [ ] Label click selects radio
- [ ] Keyboard support works (arrow keys)
- [ ] Disabled state prevents interaction
- [ ] Error state displays correctly (if applicable)
- [ ] Size variants render properly
- [ ] Layout (horizontal/vertical) works
- [ ] Animations are smooth
- [ ] Styling matches theme

## Notes

- All radio implementations are in TypeScript (.tsx) files
- No JSX files contain radio buttons
- Most implementations already have custom styling that should be preserved
- Focus on maintaining existing UX while standardizing the component
