# Firebase Security Rules Documentation

This document explains the Firebase Security Rules for ChastityOS, covering authentication, authorization, data validation, and security patterns.

## 🔒 Security Overview

Firebase Security Rules control access to Firestore, Storage, and Realtime Database. Our rules implement:

- **User Isolation**: Users can only access their own data
- **Keyholder Access**: Keyholders can access specific submissive data with proper authentication
- **Data Validation**: Strict validation on all writes to prevent malformed data
- **Rate Limiting**: Protection against spam and abuse
- **Audit Logging**: Security events are logged for monitoring

---

## 📋 Current Rules Structure

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data rules
    match /users/{userId} {
      // User profile and settings
      allow read, write: if isOwnerOrKeyholder(userId);

      // Chastity sessions
      match /sessions/{sessionId} {
        allow read, write: if isOwnerOrKeyholder(userId);
        allow create: if isValidSession();
        allow update: if isValidSessionUpdate();
        allow delete: if isOwner(userId);
      }

      // Event logging
      match /events/{eventId} {
        allow read, write: if isOwnerOrKeyholder(userId);
        allow create: if isValidEvent();
      }

      // Task management
      match /tasks/{taskId} {
        allow read: if isOwnerOrKeyholder(userId);
        allow create: if isValidTaskCreation();
        allow update: if isValidTaskUpdate();
        allow delete: if canDeleteTask();
      }

      // Keyholder relationships
      match /keyholders/{keyholderId} {
        allow read: if isOwnerOrKeyholder(userId);
        allow create: if isValidKeyholderLink();
        allow update: if canUpdateKeyholderLink();
        allow delete: if isOwner(userId);
      }
    }

    // Global collections (rate-limited)
    match /feedback/{docId} {
      allow create: if isAuthenticated() && isValidFeedback();
    }

    match /publicProfiles/{profileId} {
      allow read: if true; // Public profiles are readable by all
      allow write: if isOwner(profileId) && isValidPublicProfile();
    }
  }
}
```

---

## 🛡️ Authentication Rules

### Basic Authentication Check

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

### Keyholder Authentication

```javascript
function isKeyholder(userId) {
  // Check if current user is a verified keyholder for this user
  return isAuthenticated() &&
         request.auth.uid in get(/databases/$(database)/documents/users/$(userId)/keyholders).data.activeKeyholders;
}

function isOwnerOrKeyholder(userId) {
  return isOwner(userId) || isKeyholder(userId);
}

function hasKeyholderAccess(userId, requiredLevel) {
  let keyholderData = get(/databases/$(database)/documents/users/$(userId)/keyholders/$(request.auth.uid)).data;
  return keyholderData.accessLevel >= requiredLevel && keyholderData.status == 'active';
}
```

### Advanced Authentication Patterns

```javascript
function isVerifiedKeyholder(userId) {
  // Keyholder must be verified and have active status
  let keyholderRef = /databases/$(database)/documents/users/$(userId)/keyholders/$(request.auth.uid);

  return exists(keyholderRef) &&
         get(keyholderRef).data.status == 'active' &&
         get(keyholderRef).data.verifiedAt != null &&
         get(keyholderRef).data.verifiedAt > timestamp.date(2024, 1, 1); // Recent verification
}

function canAccessSensitiveData(userId) {
  // Only verified keyholders with high access level can access sensitive data
  return isOwner(userId) ||
         (isVerifiedKeyholder(userId) && hasKeyholderAccess(userId, 3));
}
```

---

## 📊 Data Validation Rules

### Session Validation

```javascript
function isValidSession() {
  let data = request.resource.data;

  return isAuthenticated() &&
         // Required fields
         'startTime' in data &&
         'userId' in data &&
         'status' in data &&

         // Field type validation
         data.startTime is timestamp &&
         data.userId is string &&
         data.status in ['active', 'paused', 'ended'] &&

         // Business logic validation
         data.userId == request.auth.uid &&
         data.startTime <= request.time &&

         // Optional fields validation
         (!('endTime' in data) || data.endTime is timestamp) &&
         (!('goalDuration' in data) || data.goalDuration is number) &&
         (!('pauseStates' in data) || data.pauseStates is list);
}

function isValidSessionUpdate() {
  let data = request.resource.data;
  let existing = resource.data;

  return isAuthenticated() &&
         // Immutable fields cannot be changed
         data.userId == existing.userId &&
         data.id == existing.id &&
         data.startTime == existing.startTime &&

         // Only certain fields can be updated
         (data.diff(existing).affectedKeys().hasOnly(['status', 'endTime', 'pauseStates', 'notes', 'lastUpdated'])) &&

         // Status transition validation
         isValidStatusTransition(existing.status, data.status) &&

         // End time validation
         (!('endTime' in data) || data.endTime >= data.startTime);
}

function isValidStatusTransition(fromStatus, toStatus) {
  // Define valid status transitions
  return (fromStatus == 'active' && toStatus in ['paused', 'ended']) ||
         (fromStatus == 'paused' && toStatus in ['active', 'ended']) ||
         (fromStatus == 'ended' && toStatus == 'ended'); // Allow updates to ended sessions
}
```

### Event Validation

```javascript
function isValidEvent() {
  let data = request.resource.data;

  return isAuthenticated() &&
         // Required fields
         'type' in data &&
         'timestamp' in data &&
         'userId' in data &&

         // Field validation
         data.type in ['orgasm', 'arousal', 'session_edit', 'task_completion', 'punishment'] &&
         data.timestamp is timestamp &&
         data.userId == request.auth.uid &&
         data.timestamp <= request.time &&

         // Type-specific validation
         isValidEventData(data.type, data);
}

function isValidEventData(eventType, data) {
  return eventType == 'orgasm' && isValidOrgasmEvent(data) ||
         eventType == 'arousal' && isValidArousalEvent(data) ||
         eventType == 'session_edit' && isValidSessionEditEvent(data) ||
         eventType == 'task_completion' && isValidTaskCompletionEvent(data) ||
         eventType == 'punishment' && isValidPunishmentEvent(data);
}

function isValidOrgasmEvent(data) {
  return // Required orgasm fields
         'intensity' in data &&
         'source' in data &&

         // Field validation
         data.intensity is number &&
         data.intensity >= 1 && data.intensity <= 10 &&
         data.source in ['self', 'partner', 'keyholder'] &&

         // Optional fields
         (!('duration' in data) || (data.duration is number && data.duration > 0)) &&
         (!('notes' in data) || (data.notes is string && data.notes.size() <= 500));
}

function isValidArousalEvent(data) {
  return 'level' in data &&
         data.level is number &&
         data.level >= 1 && data.level <= 10;
}
```

### Task Validation

```javascript
function isValidTaskCreation() {
  let data = request.resource.data;

  return isAuthenticated() &&
         // Task can be created by user or their keyholder
         (data.assignedBy == request.auth.uid || isKeyholder(data.userId)) &&

         // Required fields
         'title' in data &&
         'userId' in data &&
         'assignedBy' in data &&
         'status' in data &&
         'createdAt' in data &&

         // Field validation
         data.title is string && data.title.size() > 0 && data.title.size() <= 200 &&
         data.userId is string &&
         data.assignedBy is string &&
         data.status == 'pending' &&
         data.createdAt == request.time &&

         // Optional fields
         (!('description' in data) || (data.description is string && data.description.size() <= 1000)) &&
         (!('dueDate' in data) || data.dueDate is timestamp) &&
         (!('priority' in data) || data.priority in ['low', 'medium', 'high']);
}

function isValidTaskUpdate() {
  let data = request.resource.data;
  let existing = resource.data;

  return isAuthenticated() &&
         // User can update their own tasks, keyholder can update tasks they assigned
         (isOwner(data.userId) ||
          (isKeyholder(data.userId) && existing.assignedBy == request.auth.uid)) &&

         // Immutable fields
         data.id == existing.id &&
         data.userId == existing.userId &&
         data.assignedBy == existing.assignedBy &&
         data.createdAt == existing.createdAt &&

         // Valid status transitions
         isValidTaskStatusTransition(existing.status, data.status, existing.assignedBy);
}

function isValidTaskStatusTransition(fromStatus, toStatus, assignedBy) {
  // Users can mark tasks as completed or request changes
  let userTransitions = (fromStatus == 'pending' && toStatus in ['completed', 'in_progress']) ||
                       (fromStatus == 'in_progress' && toStatus in ['completed', 'pending']);

  // Keyholders can approve, reject, or modify tasks they assigned
  let keyholderTransitions = assignedBy == request.auth.uid &&
                            (fromStatus == 'completed' && toStatus in ['approved', 'rejected']) ||
                            (fromStatus in ['pending', 'in_progress'] && toStatus in ['cancelled']);

  return userTransitions || keyholderTransitions;
}
```

---

## 🔗 Keyholder Access Rules

### Keyholder Link Creation

```javascript
function isValidKeyholderLink() {
  let data = request.resource.data;

  return isAuthenticated() &&
         // Only user can initiate keyholder links
         isOwner(data.submissiveId) &&

         // Required fields
         'submissiveId' in data &&
         'keyholderId' in data &&
         'status' in data &&
         'requestedAt' in data &&

         // Field validation
         data.submissiveId == request.auth.uid &&
         data.keyholderId is string &&
         data.keyholderId != data.submissiveId && // Can't be keyholder of yourself
         data.status == 'pending' &&
         data.requestedAt == request.time &&

         // Prevent duplicate links
         !exists(/databases/$(database)/documents/users/$(data.submissiveId)/keyholders/$(data.keyholderId));
}

function canUpdateKeyholderLink() {
  let data = request.resource.data;
  let existing = resource.data;

  return isAuthenticated() &&
         // Submissive can update their side, keyholder can respond
         (isOwner(existing.submissiveId) || request.auth.uid == existing.keyholderId) &&

         // Immutable fields
         data.submissiveId == existing.submissiveId &&
         data.keyholderId == existing.keyholderId &&
         data.requestedAt == existing.requestedAt &&

         // Valid status transitions
         isValidKeyholderStatusTransition(existing.status, data.status, existing.submissiveId, existing.keyholderId);
}

function isValidKeyholderStatusTransition(fromStatus, toStatus, submissiveId, keyholderId) {
  // Keyholder can accept or reject pending requests
  let keyholderActions = request.auth.uid == keyholderId &&
                        fromStatus == 'pending' &&
                        toStatus in ['active', 'rejected'];

  // Submissive can cancel pending requests or deactivate active relationships
  let submissiveActions = request.auth.uid == submissiveId &&
                         ((fromStatus == 'pending' && toStatus == 'cancelled') ||
                          (fromStatus == 'active' && toStatus == 'deactivated'));

  return keyholderActions || submissiveActions;
}
```

### Access Level Management

```javascript
function canModifyAccessLevel(userId, keyholderId) {
  // Only submissive can modify keyholder access levels
  return isOwner(userId) &&
         exists(/databases/$(database)/documents/users/$(userId)/keyholders/$(keyholderId)) &&
         get(/databases/$(database)/documents/users/$(userId)/keyholders/$(keyholderId)).data.status == 'active';
}

function isValidAccessLevel(level) {
  // Access levels: 1 = View Only, 2 = Task Management, 3 = Session Control, 4 = Full Control
  return level is number && level >= 1 && level <= 4;
}
```

---

## 🚦 Rate Limiting Rules

### General Rate Limiting

```javascript
function isWithinRateLimit(collection, limit, timeWindow) {
  // Check how many documents user has created in the time window
  let recentDocs = query(/databases/$(database)/documents/$(collection))
    .where('createdBy', '==', request.auth.uid)
    .where('createdAt', '>', timestamp.date(now.year, now.month, now.day).addDuration(duration.value(-timeWindow, 'h')))
    .limit(limit + 1);

  return recentDocs.size() <= limit;
}

// Usage in rules
function canCreateEvent() {
  return isAuthenticated() &&
         isValidEvent() &&
         isWithinRateLimit('events', 100, 24); // 100 events per 24 hours
}

function canCreateTask() {
  return isAuthenticated() &&
         isValidTaskCreation() &&
         isWithinRateLimit('tasks', 50, 24); // 50 tasks per 24 hours
}
```

### Feedback Rate Limiting

```javascript
function canSubmitFeedback() {
  let data = request.resource.data;

  return isAuthenticated() &&
         isValidFeedback() &&
         // Limit feedback to 5 submissions per day
         isWithinRateLimit('feedback', 5, 24);
}

function isValidFeedback() {
  let data = request.resource.data;

  return 'type' in data &&
         'message' in data &&
         'submittedBy' in data &&
         'submittedAt' in data &&

         data.type in ['bug', 'feature', 'general'] &&
         data.message is string &&
         data.message.size() > 10 && data.message.size() <= 2000 &&
         data.submittedBy == request.auth.uid &&
         data.submittedAt == request.time;
}
```

---

## 🔍 Security Monitoring Rules

### Audit Logging

```javascript
function logSecurityEvent(eventType, details) {
  // Security events are automatically logged by Cloud Functions
  // This function documents the events we track
  // Tracked events:
  // - unauthorized_access_attempt
  // - keyholder_access
  // - sensitive_data_access
  // - bulk_operations
  // - failed_validations
  // - rate_limit_exceeded
}

// Example usage in sensitive operations
function accessSensitiveData(userId) {
  // Log before allowing access
  logSecurityEvent("sensitive_data_access", {
    userId: userId,
    accessor: request.auth.uid,
    timestamp: request.time,
    isKeyholder: isKeyholder(userId),
  });

  return canAccessSensitiveData(userId);
}
```

### Suspicious Activity Detection

```javascript
function detectSuspiciousActivity() {
  // Patterns that trigger security alerts:

  // 1. Rapid bulk operations
  let recentWrites = query(/databases/$(database)/documents)
    .where('updatedBy', '==', request.auth.uid)
    .where('updatedAt', '>', timestamp.now().addDuration(duration.value(-5, 'm')));

  if (recentWrites.size() > 100) {
    logSecurityEvent('bulk_operations', {'count': recentWrites.size()});
  }

  // 2. Access to multiple user accounts
  let accessedUsers = query(/databases/$(database)/documents/users)
    .where('lastAccessedBy', '==', request.auth.uid)
    .where('lastAccessedAt', '>', timestamp.now().addDuration(duration.value(-1, 'h')));

  if (accessedUsers.size() > 5) {
    logSecurityEvent('multiple_user_access', {'userCount': accessedUsers.size()});
  }

  // 3. Failed validation attempts
  // Tracked automatically when validation functions fail
}
```

---

## 🛠️ Development vs Production Rules

### Development Environment

```javascript
// More permissive rules for development
function isDevelopmentEnvironment() {
  return request.headers["x-environment"] == "development";
}

// Allow more lenient validation in development
function isValidSessionDev() {
  return isDevelopmentEnvironment()
    ? isValidSessionLenient()
    : isValidSession();
}

function isValidSessionLenient() {
  // Relaxed validation for testing
  let data = request.resource.data;
  return "userId" in data && data.userId == request.auth.uid;
}
```

### Production Environment

```javascript
// Strict rules for production
function isProductionEnvironment() {
  return !isDevelopmentEnvironment();
}

// Enhanced security for production
function isValidSessionProd() {
  return (
    isValidSession() &&
    isWithinRateLimit("sessions", 10, 24) && // Stricter rate limits
    hasValidUserAgent() && // Require valid user agent
    !isFromSuspiciousIP()
  ); // Block known malicious IPs
}

function hasValidUserAgent() {
  return (
    "user-agent" in request.headers && request.headers["user-agent"].size() > 10
  );
}
```

---

## 🔄 Migration and Updates

### Rule Versioning

```javascript
// Version 2.0 - Current
// - Added keyholder access controls
// - Enhanced validation
// - Rate limiting

// Version 1.0 - Legacy (deprecated)
// - Basic user isolation
// - Simple validation

function getRuleVersion() {
  return resource.data.ruleVersion || 1.0;
}

function shouldUseNewRules() {
  return getRuleVersion() >= 2.0;
}
```

### Backward Compatibility

```javascript
function isValidSessionAnyVersion() {
  return shouldUseNewRules() ? isValidSession() : isValidSessionLegacy();
}

function isValidSessionLegacy() {
  // Legacy validation for older data
  let data = request.resource.data;
  return "userId" in data && data.userId == request.auth.uid;
}
```

---

## 📊 Performance Optimization

### Query Optimization

```javascript
// Use efficient queries with proper indexing
function getRecentSessions(userId) {
  // This query uses composite index: userId + startTime (desc)
  return query(/databases/$(database)/documents/users/$(userId)/sessions)
    .where('userId', '==', userId)
    .orderBy('startTime', 'desc')
    .limit(10);
}

// Avoid expensive operations in rules
function isValidSessionOptimized() {
  // Minimize database reads in validation
  let data = request.resource.data;

  // Quick validations first (no DB reads)
  if (!(data.userId == request.auth.uid && 'status' in data)) {
    return false;
  }

  // More expensive validations only if needed
  return hasActiveSession(data.userId) ? false : isValidSession();
}
```

### Caching Strategy

```javascript
// Cache frequently accessed data
function getCachedUserSettings(userId) {
  // Use cached data when available
  return exists(/databases/$(database)/documents/users/$(userId)/cache/settings) ?
         get(/databases/$(database)/documents/users/$(userId)/cache/settings).data :
         get(/databases/$(database)/documents/users/$(userId)/settings).data;
}
```

---

This Firebase Security Rules documentation ensures robust security while maintaining performance and usability. Regular audits and updates keep the rules current with evolving security threats and application features.
