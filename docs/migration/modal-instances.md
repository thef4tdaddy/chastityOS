# Modal Instances Documentation

This document catalogs all modal implementations in the ChastityOS codebase for migration to the standardized Modal component.

## Overview

The codebase contains multiple modal implementations with varying patterns. This document identifies each instance for systematic migration to the new Modal component (`/src/components/ui/Modal.tsx`).

## Modal Instances Found

### 1. PrivacyPolicyModal
**File:** `src/components/modals/PrivacyPolicyModal.tsx`

**Current Implementation:**
```tsx
<div className="glass-modal fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="glass-modal-content max-w-4xl w-full max-h-[90vh]...">
```

**Features:**
- Glass morphism backdrop and content
- Close button (X)
- Header with icon (FaShieldAlt) and title
- Scrollable content area
- Footer with action button
- Size: lg (max-w-4xl)

**Migration Notes:**
- Already uses glass-modal pattern
- Has header with icon and title
- Has footer section
- Requires size="lg"

---

### 2. FeedbackModal
**File:** `src/components/feedback/FeedbackModal.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-2xl w-full...">
```

**Features:**
- Backdrop with blur
- Close button (X)
- Header with dynamic icon and title
- Form content
- Size: md (max-w-2xl)
- Custom gradient background (not standard glass)

**Migration Notes:**
- Uses gradient background instead of glass-morphism
- Dynamic title and icon based on feedback type
- Form submission handling
- May need custom className for gradient styling

---

### 3. ResetModal
**File:** `src/components/settings/ResetModal.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gray-900 border-2 border-red-500 rounded-lg max-w-md w-full p-6">
```

**Features:**
- Backdrop with blur
- Red border (warning style)
- Title only (no close button)
- Content with list
- Action buttons in footer
- Size: sm (max-w-md)
- Status-based content display

**Migration Notes:**
- Uses red border for warning/danger state
- No close button (modal requires user action)
- Status messages (pending, success, error)
- May want showCloseButton={false}

---

### 4. EmergencyUnlockModal
**File:** `src/components/tracker/EmergencyUnlockModal/index.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-md w-full rounded-xl border-2 border-red-500...">
```

**Features:**
- Backdrop with blur (darker: 75% opacity)
- Close button (X) - disabled during processing
- Red border (warning/emergency state)
- Multi-stage content (warning, reason, confirmation, PIN validation)
- Size: sm (max-w-md)
- Complex state management

**Migration Notes:**
- Multi-stage modal with different content per stage
- Red border for emergency context
- Close button should be disabled during processing
- Complex internal logic with usePinValidation hook

---

### 5. SessionRecoveryModal
**File:** `src/components/tracker/SessionRecoveryModal.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md border border-purple-700">
```

**Features:**
- Backdrop (75% opacity)
- Purple border
- Title with description
- Action buttons
- Size: sm (max-w-md)

**Migration Notes:**
- Simple confirmation modal
- Purple border for info/recovery state
- Button actions for restore/discard

---

### 6. ConflictResolutionModal
**File:** `src/components/common/ConflictResolutionModal.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-gray-800 p-6 rounded shadow-lg max-w-md w-full">
```

**Features:**
- Simple backdrop (50% opacity)
- No close button
- Title and description
- Two action buttons
- Size: sm (max-w-md)

**Migration Notes:**
- Conflict resolution between local and cloud data
- Requires user to make a choice (no close button)
- Simple two-button layout

---

### 7. BegForReleaseButton Modal
**File:** `src/components/tracker/BegForReleaseButton.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90...">
```

**Features:**
- Backdrop with blur (75%)
- Purple/pink gradient background
- Close button (X)
- Title with emoji
- Textarea for message
- Footer with action buttons
- Size: sm (max-w-md)

**Migration Notes:**
- Custom purple/pink gradient styling
- Form with textarea
- Character counter
- May need custom className for gradient

---

### 8. RestoreSessionPrompt
**File:** `src/components/tracker/RestoreSessionPrompt.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center w-full max-w-md...">
```

**Features:**
- Simple backdrop (75% opacity)
- No close button (requires user action)
- Title and description
- Two action buttons
- Size: sm (max-w-md)

**Migration Notes:**
- Session restore decision modal
- No close button (user must choose)
- Simple centered text layout

---

### 9. PauseResumeButtons Modals
**File:** `src/components/tracker/PauseResumeButtons.tsx`

**Current Implementation:**
Multiple modal instances for pause confirmation and cooldown messages.

```tsx
<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center w-full max-w-md...">
```

**Features:**
- Backdrop (75% opacity)
- No explicit close button
- Title and message
- Action buttons
- Size: sm (max-w-md)

**Migration Notes:**
- Multiple modal states (pause reason, cooldown message)
- Textarea for pause reason
- Different button configurations per state

---

### 10. ReleaseRequestCard Modal
**File:** `src/components/keyholder/ReleaseRequestCard.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6...">
```

**Features:**
- Backdrop with blur (75%)
- Close button (X)
- Gradient background
- Title and content
- Image display for evidence
- Footer with buttons
- Size: md (max-w-2xl)

**Migration Notes:**
- View/respond to release requests
- Image evidence display
- Approval/denial buttons
- Custom gradient styling

---

### 11. TaskEvidenceDisplay Modal
**File:** `src/components/tasks/TaskEvidenceDisplay.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
  <img src={evidenceUrl} alt="Task Evidence"...>
```

**Features:**
- Dark backdrop (90% opacity)
- Click anywhere to close
- Full-screen image display
- No borders or header

**Migration Notes:**
- Image lightbox/viewer
- Very simple - just displays image
- Click backdrop to close
- May not need full Modal component (too simple)

---

### 12. SessionLoader Modals
**File:** `src/components/tracker/SessionLoader.tsx`

**Current Implementation:**
```tsx
<div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center...">
```

**Features:**
- Full-screen backdrop (no transparency)
- No close button
- Loading spinner or error message
- Size: sm (max-w-md)

**Migration Notes:**
- Loading/error state modals
- No close button (loading state)
- May not need migration (special case)

---

## Migration Priority

### High Priority (Core User Flows)
1. EmergencyUnlockModal - Critical safety feature
2. SessionRecoveryModal - Data recovery
3. RestoreSessionPrompt - Session management

### Medium Priority (Common Use Cases)
4. PrivacyPolicyModal - Legal/compliance
5. FeedbackModal - User engagement
6. BegForReleaseButton - Key feature
7. ReleaseRequestCard - Keyholder feature

### Low Priority (Simple/Edge Cases)
8. ResetModal - Settings/admin
9. ConflictResolutionModal - Edge case
10. PauseResumeButtons - Can be refactored
11. TaskEvidenceDisplay - Simple lightbox
12. SessionLoader - Special case

## Migration Checklist Template

For each modal migration:

- [ ] Import Modal component from '@/components/ui'
- [ ] Map existing props to Modal props
  - [ ] isOpen
  - [ ] onClose
  - [ ] title
  - [ ] icon
  - [ ] size
  - [ ] showCloseButton
  - [ ] closeOnBackdropClick
  - [ ] closeOnEscape
- [ ] Move content to children prop
- [ ] Move action buttons to footer prop
- [ ] Apply custom className if needed for special styling
- [ ] Test open/close functionality
- [ ] Test backdrop click behavior
- [ ] Test ESC key behavior
- [ ] Test focus trap
- [ ] Verify animations work
- [ ] Test on mobile/responsive
- [ ] Verify accessibility (screen reader, keyboard nav)

## Notes

- The new Modal component uses the existing `.glass-modal` and `.glass-modal-content` classes from the CSS
- Custom gradient backgrounds will need to be applied via className prop
- Modals that prevent closing (no close button, no backdrop click) should set appropriate props
- The focus trap will help with accessibility but needs testing
- Body scroll prevention is handled automatically
