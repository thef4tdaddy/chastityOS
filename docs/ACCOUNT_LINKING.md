# 🔗 Account Linking System Documentation

The ChastityOS Account Linking System provides secure, private linking between keyholder and wearer accounts while maintaining the existing anonymous/Google SSO authentication system.

## Overview

This system allows:
- **Wearers** to generate secure link codes and share them with trusted keyholders
- **Keyholders** to gain admin-level access to their wearer's data and controls
- **Both parties** to maintain control with easy disconnection capabilities

## Architecture

### Core Components

1. **AccountLinkingService** (`src/services/auth/account-linking.ts`)
   - Handles link code generation and validation
   - Manages admin relationships
   - Provides session management

2. **useAccountLinking Hook** (`src/hooks/account-linking/useAccountLinking.ts`)
   - React hook for account linking functionality
   - Manages UI state and API calls
   - Provides validation and error handling

3. **Account Linking Types** (`src/types/account-linking.ts`)
   - Comprehensive TypeScript interfaces
   - Covers link codes, relationships, sessions, permissions

4. **UI Components**
   - `AccountLinkingPreview.tsx` - Link code generation and usage interface
   - `AdminDashboard.tsx` - Keyholder admin control panel

### Data Structure

#### Link Codes
```typescript
interface LinkCode {
  id: string;                 // 12-character secure code
  wearerId: string;          // Creator's user ID
  createdAt: Timestamp;      // Creation time
  expiresAt: Timestamp;      // 24-hour expiry
  status: 'pending' | 'used' | 'expired';
  maxUses: number;           // Usually 1
  usedBy: string | null;     // Keyholder who used it
  shareMethod: 'manual' | 'qr' | 'email' | 'url';
}
```

#### Admin Relationships
```typescript
interface AdminRelationship {
  id: string;
  keyholderId: string;       // Admin account
  wearerId: string;          // Managed account
  establishedAt: Timestamp;
  status: 'active' | 'paused' | 'terminated';
  permissions: AdminPermissions;
  security: SecuritySettings;
  privacy: PrivacySettings;
  linkMethod: 'code' | 'qr' | 'email';
}
```

## Usage Guide

### For Wearers (Submissives)

1. **Generate Link Code**
   - Navigate to Keyholder page
   - Click "Generate Link Code" in the Account Linking section
   - Code expires in 24 hours or after first use

2. **Share Securely**
   - Share the code privately with your keyholder
   - Options: verbal, text message, QR code, secure email
   - Code is single-use and time-limited

3. **Manage Relationships**
   - View active relationships in the dashboard
   - Disconnect keyholders instantly at any time
   - Control what data keyholders can access

### For Keyholders

1. **Use Link Code**
   - Navigate to Keyholder page
   - Click "Enter Link Code" 
   - Enter the code provided by your wearer
   - Confirm the admin relationship

2. **Admin Access**
   - Start admin sessions (30-minute timeout by default)
   - Full access to wearer's sessions, tasks, and settings
   - All actions are logged for transparency

3. **Multi-Wearer Management**
   - Manage multiple relationships from one account
   - Switch between different wearers
   - Independent permissions for each relationship

## Security Features

### Link Code Security
- **Cryptographically Secure**: Uses `crypto.getRandomValues()`
- **Time-Limited**: 24-hour automatic expiry
- **Single-Use**: Codes become invalid after first use
- **Secure Characters**: Excludes confusing characters (0, O, 1, I)

### Admin Session Security
- **Time-Limited Access**: 30-minute sessions with auto-expiry
- **Permission-Based**: Granular control over what keyholders can do
- **Audit Trail**: Complete logging of all admin actions
- **IP Logging**: Track access for security auditing

### Privacy Controls
- **Wearer Transparency**: Wearers can see all keyholder actions
- **Data Retention**: Control what happens to data after disconnection
- **Easy Disconnection**: Either party can terminate instantly
- **No Permanent Access**: Relationships require active maintenance

## Firebase Security Rules

The system includes comprehensive Firestore security rules:

```javascript
// Link codes - only creator can read, anyone can use once
match /linkCodes/{codeId} {
  allow read: if request.auth.uid == resource.data.wearerId;
  allow create: if request.auth.uid == request.resource.data.wearerId;
  allow update: if resource.data.status == 'pending' && 
                   request.resource.data.status == 'used';
}

// Admin relationships - both parties can read/update
match /adminRelationships/{relationshipId} {
  allow read: if request.auth.uid == resource.data.keyholderId ||
                 request.auth.uid == resource.data.wearerId;
  allow update: if request.auth.uid == resource.data.keyholderId ||
                   request.auth.uid == resource.data.wearerId;
}
```

## Integration with Existing System

The account linking system:
- **Preserves existing auth**: Anonymous accounts and Google SSO still work
- **Maintains privacy**: No central server knows relationship details
- **Extends functionality**: Adds multi-user support without breaking changes
- **Backward compatible**: Existing single-user functionality unchanged

## API Reference

### AccountLinkingService Methods

- `generateLinkCode(request)` - Create new link codes
- `useLinkCode(request)` - Establish admin relationships
- `validateLinkCode(code)` - Check code validity
- `getAdminRelationships(userId)` - Get user's relationships
- `updateRelationship(request)` - Modify existing relationships
- `startAdminSession(relationshipId)` - Begin admin access

### Hook Usage

```typescript
const {
  generateLinkCode,
  useLinkCode,
  relationships,
  currentLinkCode,
  isGeneratingCode,
  disconnectKeyholder
} = useAccountLinking();
```

## Error Handling

The system provides comprehensive error handling:
- **Network Errors**: Graceful degradation and retry logic
- **Permission Errors**: Clear error messages for unauthorized actions
- **Validation Errors**: Real-time feedback for invalid inputs
- **Session Expiry**: Automatic cleanup and user notification

## Future Enhancements

Planned improvements:
- **QR Code Generation**: Visual QR codes for easy sharing
- **Email Integration**: Encrypted email sharing
- **Advanced Permissions**: More granular control options
- **Relationship History**: Historical relationship data
- **Emergency Protocols**: Enhanced emergency access controls

## Support

For issues or questions about the account linking system:
1. Check the TypeScript types for API reference
2. Review the component props and hook return values
3. Check Firebase console for security rule issues
4. Enable debug logging in development mode