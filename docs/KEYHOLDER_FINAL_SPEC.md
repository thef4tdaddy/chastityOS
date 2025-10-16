# ChastityOS Keyholder System - Final Specification

## Overview

Based on final requirements clarification, the keyholder system will be a **dual-account system** where:

1. **Chastity Wearer** invites keyholder and can revoke access
2. **Keyholder** gets transformed account showing wearer's data with control capabilities

## User Flows

### 👤 Wearer Side (Submissive)

```
Normal ChastityOS Account Features:
├── Session tracking ✅
├── Event logging ✅
├── Task management ✅
├── Settings ✅
└── Statistics ✅

PLUS Keyholder Management:
├── 🔗 Invite Keyholder
│   ├── Generate secure code/QR/link
│   ├── Share with trusted person
│   └── Code expires after 24h or first use
├── 👀 Monitor Keyholder Activity
│   ├── See when KH is active
│   ├── View actions taken by KH
│   └── Audit trail of changes
└── 🚫 Revoke Access
    ├── Instant disconnection
    ├── Remove KH's access to all data
    └── Return to solo account
```

### 🔐 Keyholder Side (Dominant)

```
Account Transforms Into Keyholder Dashboard:

📊 Wearer Statistics Dashboard
├── Current session status (real-time)
├── Session history and analytics
├── Event history (all logged activities)
├── Task completion rates
├── Achievement progress
└── Overall statistics and trends

🎮 Control Capabilities
├── 📝 Event Logging
│   ├── Log events on wearer's behalf
│   ├── Add notes and details
│   └── Track sexual activities/orgasms
├── 📋 Task Management
│   ├── Create tasks for wearer
│   ├── Set deadlines and requirements
│   ├── Approve/reject task submissions
│   └── Track completion rates
├── 🎁 Rewards & Punishments
│   ├── Assign rewards for good behavior
│   ├── Give punishments for rule violations
│   ├── Modify session time (add/subtract)
│   └── Track reward/punishment history
├── 📏 Rules Management
│   ├── Create rules for wearer to follow
│   ├── Set consequences for violations
│   ├── Track rule compliance
│   └── Update rules as needed
└── ⚙️ Limited Settings Control
    ├── Modify session goals/requirements
    ├── Set minimum session lengths
    ├── Adjust tracking preferences
    └── Emergency unlock override

🔗 Relationship Management
└── 🚫 End Relationship
    ├── Revoke own access
    ├── Return account to normal wearer mode
    └── Optional: preserve data or anonymize
```

## Technical Implementation

### Database Schema (Simplified)

```typescript
// relationships/{relationshipId}
interface KeyholderRelationship {
  id: string;
  wearerId: string; // Submissive's account
  keyholderId: string; // Keyholder's account
  status: "active" | "ended";

  // Simple permissions
  keyholderCan: {
    viewAllStats: true; // Always true
    logEvents: true; // Always true
    manageTasks: true; // Always true
    assignRewards: true; // Always true
    setRules: true; // Always true
    modifySettings: boolean; // Configurable
  };

  // Linking metadata
  establishedAt: Timestamp;
  linkCode?: string; // For initial connection
  endedAt?: Timestamp;

  // Activity tracking
  lastKHAccess: Timestamp;
  lastWearerAccess: Timestamp;
}
```

### Account Transformation Logic

```typescript
// When user becomes a keyholder
export const transformToKeyholderAccount = (
  userId: string,
  relationshipId: string,
) => {
  // Account now shows:
  // - Wearer's data instead of own data
  // - Control interfaces instead of self-tracking
  // - Keyholder-specific navigation
};

// When relationship ends
export const revertToWearerAccount = (userId: string) => {
  // Account returns to normal wearer mode
  // Own data visible again
  // Standard ChastityOS interface
};
```

### Core Hooks Needed

```typescript
// Account state management
export const useAccountMode = (userId: string) => {
  // Returns: 'wearer' | 'keyholder' | 'both'
  // Determines UI mode and data source
};

// Keyholder relationship management
export const useKeyholderRelationship = (userId: string) => {
  // For wearers: manage sending invites, revoking access
  // For keyholders: view relationship status, end relationship
};

// Wearer data access (when in keyholder mode)
export const useWearerData = (relationshipId: string) => {
  // Access all wearer's stats, sessions, events
  // Read-only view of complete tracking data
};

// Keyholder control actions
export const useKeyholderControls = (relationshipId: string) => {
  // Task assignment, rewards/punishments, rule setting
  // Event logging on behalf of wearer
};
```

## UI/UX Design

### Wearer Account (Enhanced)

```
┌─────────────────────────────────────┐
│        Standard ChastityOS          │
│                                     │
│  [Dashboard] [Tracking] [Tasks]     │
│  [Events] [Stats] [Settings]        │
│                                     │
│  NEW: [⚙️ Keyholder Management]      │
│  ┌─────────────────────────────────┐ │
│  │  Status: No Keyholder Linked    │ │
│  │  [📱 Invite Keyholder]          │ │
│  │                                 │ │
│  │  OR if linked:                  │ │
│  │  Status: ✅ Keyholder Active    │ │
│  │  Last seen: 2 hours ago        │ │
│  │  [📋 View KH Activity Log]      │ │
│  │  [🚫 Revoke Access]            │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Keyholder Account (Transformed)

```
┌─────────────────────────────────────┐
│       Keyholder Dashboard           │
│       Managing: [Username]          │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │        Current Session          │ │
│  │  ⏱️ Active: 2d 4h 15m           │ │
│  │  🎯 Goal: 7 days                │ │
│  │  📈 Progress: 35%               │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [📊 Stats] [📝 Log Event] [📋 Tasks] │
│  [🎁 Rewards] [📏 Rules] [⚙️ Control]  │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │      Quick Actions              │ │
│  │  [➕ Assign Task]               │ │
│  │  [🎁 Give Reward]               │ │
│  │  [⚖️ Add Punishment]            │ │
│  │  [📏 Create Rule]               │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [🔗 Manage Relationship]           │
└─────────────────────────────────────┘
```

## Implementation Phases

### Week 1: Account Linking Foundation

- [ ] Secure code generation system (12-char codes)
- [ ] QR code and shareable link generation
- [ ] Basic relationship establishment
- [ ] Account mode detection and transformation

### Week 2: Keyholder Dashboard

- [ ] Stats dashboard showing wearer's data
- [ ] Real-time session monitoring
- [ ] Event history viewing
- [ ] Basic navigation and UI

### Week 3: Control Features

- [ ] Task assignment system
- [ ] Event logging on behalf of wearer
- [ ] Basic rewards/punishments assignment
- [ ] Rule creation and management

### Week 4: Polish & Advanced Features

- [ ] Enhanced UI/UX for both modes
- [ ] Relationship management (revoke access)
- [ ] Audit logs and activity tracking
- [ ] Testing and bug fixes

## Key Benefits

### For Wearers

✅ **Maintain Control**: Can revoke access anytime
✅ **Enhanced Experience**: Keyholder can add tasks, rewards, rules
✅ **Transparency**: See all actions taken by keyholder
✅ **Security**: Secure linking process with time-limited codes

### For Keyholders

✅ **Complete Visibility**: See all wearer stats and progress
✅ **Active Control**: Can assign tasks, rewards, punishments
✅ **Real-time Updates**: Monitor sessions and activities live
✅ **Simple Interface**: Account transforms to focus on management

### Technical

✅ **Clean Architecture**: Clear separation between modes
✅ **Secure**: Proper permission system and audit trails
✅ **Scalable**: Foundation supports future enhancements
✅ **Maintainable**: Simple 1:1 relationship model

## Security & Privacy

### Account Security

- 12-character cryptographically secure link codes
- 24-hour expiration on invite codes
- Both parties can end relationship at any time
- No shared passwords or login credentials

### Data Privacy

- Keyholder sees only what wearer explicitly shares via relationship
- Audit trail of all keyholder actions
- Option to anonymize data when relationship ends
- Clear consent flow for data access

### Permission Model

- Wearer always retains ultimate control
- Keyholder permissions are clearly defined and limited
- Emergency unlock capabilities for safety
- Transparent activity logging

---

**This specification provides exactly what you described**:

- Wearers invite keyholders and can revoke access
- Keyholder accounts transform to show wearer's data with control capabilities
- Clean 1:1 relationship with full transparency
- 4-week implementation timeline
