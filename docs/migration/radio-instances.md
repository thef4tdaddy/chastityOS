# Radio Button Instances - Migration Documentation

This document lists all radio button instances found in the codebase and their migration status.

## Summary
- **Total Instances Found:** 4 files with radio button implementations
- **Total Radio Buttons:** ~15+ individual radio buttons
- **Migration Status:** 3/4 complete (1 kept as-is due to custom UI design)

---

## 1. ManualEntryForm.tsx
**Location:** `/src/components/rewards_punishments/ManualEntryForm.tsx`  
**Lines:** 26-44  
**Type:** Radio Group (2 options)  
**Status:** ✅ Migrated

### Current Implementation
```tsx
<div className="flex gap-4">
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
</div>
```

### Migration Plan
- Convert to `RadioGroup` component
- Create options array with `reward` and `punishment` values
- Map `onChange` handler from event to value
- Add custom styling for colored labels (green/red)
- Name: `"entry-type"`

### Migration Code
```tsx
<RadioGroup
  name="entry-type"
  label="Type"
  value={type}
  onChange={(value) => onChange(value as "reward" | "punishment")}
  options={[
    { value: "reward", label: "Reward" },
    { value: "punishment", label: "Punishment" },
  ]}
  orientation="horizontal"
/>
```

### Custom Behavior to Preserve
- Green color for "Reward" label
- Red color for "Punishment" label
- Horizontal layout

---

## 2. ConflictResolutionModal.tsx
**Location:** `/src/components/common/ConflictResolutionModal.tsx`  
**Lines:** 52-82  
**Type:** Multiple Radio Groups (dynamic)  
**Status:** ⚠️ Not Migrated (Kept as-is - custom UI design with sr-only radio pattern)

### Current Implementation
```tsx
<input
  type="radio"
  name={conflictId}
  value={isLocal ? "local" : "remote"}
  checked={isSelected}
  onChange={onSelect}
  className="sr-only"
/>
<div className={`border-2 rounded-lg p-4 transition-colors ${
  isSelected
    ? "border-purple-500 bg-purple-500/10"
    : "border-gray-600 hover:border-purple-400"
}`}>
  {/* Content */}
</div>
```

### Migration Plan
- Keep using individual `Radio` components (not RadioGroup) due to custom layout
- Replace native radio input with `Radio` component
- The custom card UI is already wrapping the radio, so we integrate it
- Name: dynamic based on `conflictId`

### Migration Code
```tsx
<Radio
  name={conflictId}
  value={isLocal ? "local" : "remote"}
  checked={isSelected}
  onChange={onSelect}
  className="sr-only"
/>
```

### Custom Behavior to Preserve
- Screen reader only radio (sr-only class)
- Custom card UI with borders
- Dynamic names based on conflict ID
- Visual selection with border color changes

---

## 3. ReasonStage.tsx
**Location:** `/src/components/tracker/EmergencyUnlockModal/ReasonStage.tsx`  
**Lines:** 32-39  
**Type:** Radio Group (5+ options)  
**Status:** ✅ Migrated

### Current Implementation
```tsx
{EMERGENCY_UNLOCK_REASONS.map((emergencyReason) => (
  <label
    key={emergencyReason}
    className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${
      reason === emergencyReason
        ? "border-red-500 bg-red-900/30"
        : "border-gray-600 bg-gray-800/50 hover:bg-gray-700/50"
    }`}
  >
    <input
      type="radio"
      name="emergency-reason"
      value={emergencyReason}
      checked={reason === emergencyReason}
      onChange={(e) => setReason(e.target.value as EmergencyUnlockReason)}
      className="mt-1 mr-3 text-red-600"
    />
    <div>
      <div className="font-medium text-white">{emergencyReason}</div>
      <div className="text-xs text-gray-400 mt-1">
        {getReasonDescription(emergencyReason)}
      </div>
    </div>
  </label>
))}
```

### Migration Plan
- Convert to `RadioGroup` component
- Map `EMERGENCY_UNLOCK_REASONS` array to `RadioOption[]` format
- Include descriptions using `getReasonDescription()`
- Name: `"emergency-reason"`
- Keep custom styling for red theme

### Migration Code
```tsx
<RadioGroup
  name="emergency-reason"
  value={reason}
  onChange={(value) => setReason(value as EmergencyUnlockReason)}
  options={EMERGENCY_UNLOCK_REASONS.map((emergencyReason) => ({
    value: emergencyReason,
    label: emergencyReason,
    description: getReasonDescription(emergencyReason),
  }))}
/>
```

### Custom Behavior to Preserve
- Red theme for borders and backgrounds
- Card-style radio options
- Description text for each option
- Vertical layout

---

## 4. AchievementPrivacySettings.tsx
**Location:** `/src/components/achievements/AchievementPrivacySettings.tsx`  
**Lines:** 76-82 (within RadioOption component)  
**Type:** Radio Group (3 options)  
**Status:** ✅ Migrated

### Current Implementation
```tsx
const RadioOption: React.FC<RadioOptionProps> = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}) => (
  <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={(e) => onChange(e.target.value)}
      className="text-nightly-aquamarine focus:ring-nightly-aquamarine"
    />
    <div>
      <div className="font-medium text-nightly-honeydew">{title}</div>
      <div className="text-sm text-nightly-celadon">{description}</div>
    </div>
  </label>
);

// Usage in DisplayNameSection (lines 233-257)
<RadioOption
  name="displayName"
  value="anonymous"
  checked={settings.displayName === "anonymous"}
  onChange={(value) => onSettingChange("displayName", value)}
  title="Anonymous"
  description='Show as "ChastityUser_XXXX"'
/>
```

### Migration Plan
- Replace custom `RadioOption` component with `Radio` or `RadioGroup`
- Convert to `RadioGroup` in `DisplayNameSection` component
- Name: `"displayName"`
- Options: anonymous, username, real

### Migration Code
```tsx
<RadioGroup
  name="displayName"
  value={settings.displayName}
  onChange={(value) => onSettingChange("displayName", value)}
  options={[
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
  ]}
/>
```

### Custom Behavior to Preserve
- Glass-morphism background (bg-white/5)
- Rounded card style
- Nightly theme colors
- Description text for each option

---

## Migration Checklist

### Component Creation
- [x] Create `Radio.tsx` component
- [x] Create `RadioGroup.tsx` component
- [x] Export from `Form/index.ts`
- [x] Export from `ui/index.ts`
- [x] Document all instances in this file

### Migration Tasks
- [x] Migrate `ManualEntryForm.tsx`
- [x] Migrate `ConflictResolutionModal.tsx` (Kept as-is)
- [x] Migrate `ReasonStage.tsx`
- [x] Migrate `AchievementPrivacySettings.tsx`

### Testing Tasks
- [ ] Test ManualEntryForm functionality
- [ ] Test ConflictResolutionModal functionality
- [ ] Test ReasonStage functionality
- [ ] Test AchievementPrivacySettings functionality
- [ ] Test keyboard navigation in RadioGroups
- [ ] Test disabled states
- [ ] Test all size variants
- [ ] Test accessibility (screen readers, ARIA)

### Validation
- [ ] Run linting
- [ ] Run type checking
- [ ] Run build
- [ ] Manual testing in browser
- [ ] Screenshot all migrated components

---

## Notes
- All radio instances use TypeScript/TSX files
- Most instances would benefit from RadioGroup for consistency
- Some instances have custom styling that needs to be preserved
- Keyboard navigation is a new feature that RadioGroup adds
- Focus states and accessibility will be improved with new components
