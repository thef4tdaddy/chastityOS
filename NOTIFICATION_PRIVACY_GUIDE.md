# Notification Privacy & Safety Guide

## Overview

ChastityOS now includes comprehensive privacy and safety features for notifications to protect user data and comply with GDPR regulations.

## Features

### 1. Privacy Mode

Privacy Mode automatically sanitizes notifications to remove sensitive personal information.

**What it does:**
- Removes personal names from notification titles and messages
- Replaces specific names with generic terms like "User" or "Keyholder"
- Strips sensitive metadata (names, emails, reasons, notes)
- Anonymizes time references (e.g., "30 minutes" becomes "some time")

**How to enable:**
1. Go to Settings → Notifications
2. Scroll to "Privacy & Safety" section
3. Toggle on "Privacy Mode"

**Example:**
- **Before**: "John completed a 24 hour session"
- **After**: "User completed some time session"

### 2. Anonymous User Protection

Anonymous users automatically receive sanitized notifications regardless of privacy settings.

**Automatic protections:**
- All notifications use generic language
- No personal identifiers included
- Metadata automatically stripped
- Privacy warning displayed in settings

### 3. Email Notification Opt-Out

GDPR-compliant email notification management with easy unsubscribe.

**Features:**
- One-click unsubscribe from settings
- Token-based unsubscribe links in emails
- Separate opt-out for different notification types
- 30-day token expiration for security

**How to opt-out:**
1. Go to Settings → Notifications → Privacy & Safety
2. Toggle off "Email Notifications"

Or use the unsubscribe link in any notification email.

### 4. Notification Type Controls

Fine-grained control over which notifications you receive.

**Available controls:**
- Session Notifications (starts, ends, milestones)
- Task Notifications (assignments, deadlines, approvals)
- Keyholder Notifications (actions, messages)
- System Notifications (updates, announcements)

## Technical Implementation

### For Users

All privacy settings are found in:
**Settings → Notifications → Privacy & Safety**

### For Developers

#### Privacy Utilities

The privacy utilities are located in `src/utils/notifications/privacy.ts`:

```typescript
import { sanitizeNotificationContent, shouldSendNotification } from "@/utils/notifications/privacy";

// Sanitize notification content
const sanitized = sanitizeNotificationContent(
  { title: "John's session", message: "John started a session" },
  privacyMode: true,
  isAnonymous: false
);

// Check if notification should be sent
const shouldSend = shouldSendNotification(
  "session",
  { sessionNotifications: true },
  { optedOut: false }
);
```

#### Notification Service Integration

The NotificationService automatically applies privacy settings:

```typescript
// Privacy settings are checked and applied automatically
await NotificationService.notifySessionCompleted({
  userId: "user123",
  sessionId: "session456",
  duration: 24,
  submissiveName: "John", // Will be sanitized if privacy mode enabled
});
```

#### Settings Integration

Privacy settings are stored in Firestore under:
`users/{userId}/settings/notifications`

```typescript
{
  privacyMode: boolean,
  emailNotifications: boolean,
  emailOptOut: boolean,
  sessionNotifications: boolean,
  taskNotifications: boolean,
  keyholderNotifications: boolean,
  systemNotifications: boolean
}
```

## GDPR Compliance

### User Rights

Users have the right to:
1. ✅ **Opt-out** of email notifications at any time
2. ✅ **Control** what types of notifications they receive
3. ✅ **Privacy mode** to protect personal information
4. ✅ **Easy unsubscribe** with one-click links

### Data Protection

- Personal information is never shared without consent
- Sensitive data can be stripped from notifications
- Anonymous users receive no personal identifiers
- Unsubscribe tokens expire after 30 days
- All preferences stored securely in Firestore

### Email Notifications

All email notifications include:
- Clear unsubscribe links
- Information about data usage
- Contact information for support
- Compliance with GDPR Article 7

## Testing

The privacy features include comprehensive tests:

```bash
npm test -- src/utils/notifications/__tests__/privacy.test.ts
```

**Test coverage:**
- ✅ Content sanitization (names, times, metadata)
- ✅ Anonymous user handling
- ✅ Notification preferences
- ✅ Token generation and parsing
- ✅ Token expiration
- ✅ Opt-out functionality

**Results:** 16 tests, all passing

## Security Considerations

### Token Security

- Unsubscribe tokens are base64-encoded
- Include timestamp for expiration (30 days)
- Should be sent only via secure channels (HTTPS emails)
- Future: Consider adding cryptographic signatures

### Data Minimization

- Only necessary data included in notifications
- Sensitive fields removed in privacy mode
- Metadata stripped when not needed
- Anonymous mode uses minimal identifiers

### Best Practices

1. **Always enable privacy mode** if sharing devices
2. **Use anonymous accounts** for maximum privacy
3. **Review notification settings** regularly
4. **Opt out of email notifications** if not needed
5. **Keep unsubscribe links** private and secure

## Future Enhancements

Planned improvements:
- [ ] Push notification privacy controls
- [ ] Advanced sanitization rules
- [ ] User-defined sensitive terms
- [ ] Notification preview with privacy mode
- [ ] Regional compliance (CCPA, etc.)
- [ ] Cryptographically signed unsubscribe tokens
- [ ] Audit log for privacy settings changes

## Support

For questions or issues:
- GitHub Issues: https://github.com/thef4tdaddy/chastityOS/issues
- Privacy concerns: Tag issues with `privacy` label
- GDPR requests: Include "GDPR" in issue title

## Related Documentation

- [NOTIFICATION_IMPLEMENTATION.md](./NOTIFICATION_IMPLEMENTATION.md) - Overall notification system
- [README.md](./README.md) - General project information
- Privacy Policy (in app footer)
