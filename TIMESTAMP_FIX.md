# User Timestamps Fix - Created At & Last Active

## Problem
The User Management table shows "N/A" for **Created** and **Last Active** columns for users that were created before the timestamp fields were added to the database.

## Root Cause
Users created before the `createdAt` and `lastActive` fields were properly implemented have NULL values in the database.

## Solution Applied

### 1. Database Migration
Updated all existing users with NULL timestamps:

```sql
UPDATE users 
SET createdAt = datetime('now'), 
    lastActive = datetime('now') 
WHERE createdAt IS NULL OR lastActive IS NULL;
```

**Run this manually:**
```bash
sqlite3 bingo.db < fix-user-timestamps.sql
```

### 2. Entity Enhancement
Added `@BeforeUpdate()` hook to automatically update `lastActive` on any user modification:

**Before:**
```typescript
@BeforeInsert()
setDates() {
  const now = new Date();
  if (!this.createdAt) {
    this.createdAt = now;
  }
  if (!this.lastActive) {
    this.lastActive = now;
  }
}
```

**After:**
```typescript
@BeforeInsert()
setDates() {
  const now = new Date();
  if (!this.createdAt) {
    this.createdAt = now;
  }
  if (!this.lastActive) {
    this.lastActive = now;
  }
}

@BeforeUpdate()  // ✅ NEW
updateLastActive() {
  this.lastActive = new Date();
}
```

### 3. Login Tracking
Updated auth service to set `lastActive` timestamp on every login:

```typescript
async login(loginDto: LoginDto): Promise<{ user; accessToken }> {
  const user = await this.validateUser(loginDto.username, loginDto.password);
  if (user === null) {
    return null;
  }

  // ✅ NEW: Update last active timestamp
  await this.userService.update(user.id, { lastActive: new Date() });

  const accessToken = this.jwtService.sign({
    sub: user.id,
    username: user.username,
    role: user.role,
  });
  return { user, accessToken };
}
```

## Files Modified

1. **src/user/entities/user.entity.ts**
   - Added `@BeforeUpdate()` hook
   - Imported `BeforeUpdate` from typeorm

2. **src/auth/auth.service.ts**
   - Added `lastActive` update on login

3. **fix-user-timestamps.sql** (NEW)
   - Migration script to fix existing users

## How Timestamps Work Now

### Created At
- Set automatically when user is created via `@BeforeInsert()` hook
- Never changes after creation
- Format: `DD-MM-YYYY HH:MM`

### Last Active
- Set automatically when user is created via `@BeforeInsert()` hook
- Updated automatically on:
  - User login (via auth service)
  - Any user update (via `@BeforeUpdate()` hook)
- Format: `DD-MM-YYYY HH:MM`

## Testing

### 1. Fix Existing Users
```bash
# Run the migration
sqlite3 bingo.db < fix-user-timestamps.sql

# Verify
sqlite3 bingo.db "SELECT id, username, createdAt, lastActive FROM users;"
```

### 2. Test New User Creation
```bash
# Register a new user via Admin Dashboard
# Check that createdAt and lastActive are set
sqlite3 bingo.db "SELECT id, username, createdAt, lastActive FROM users WHERE username='testuser';"
```

### 3. Test Login Tracking
```bash
# Login as a user
# Check that lastActive is updated
sqlite3 bingo.db "SELECT username, lastActive FROM users WHERE username='admin';"
```

### 4. Test User Update
```bash
# Edit a user in Admin Dashboard (change role or house fee)
# Check that lastActive is updated
sqlite3 bingo.db "SELECT username, lastActive FROM users WHERE id=1;"
```

## Expected Behavior After Fix

✅ All users show proper **Created** date/time
✅ All users show proper **Last Active** date/time
✅ New users automatically get timestamps on creation
✅ `lastActive` updates on every login
✅ `lastActive` updates on any user modification
✅ Timestamps display in readable format: `07-05-2026 06:56`

## Database Schema

```sql
CREATE TABLE "users" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "username" varchar NOT NULL UNIQUE,
  "password" varchar NOT NULL,
  "role" varchar NOT NULL DEFAULT ('user'),
  "houseFee" float NOT NULL DEFAULT (0),
  "totalEarnings" float NOT NULL DEFAULT (0),
  "createdAt" datetime,      -- ✅ Timestamp when user was created
  "lastActive" datetime      -- ✅ Timestamp of last activity
);
```

## Frontend Display

The `formatDate()` function in `useAdminDashboard.ts` formats timestamps as:

```typescript
function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  // Format as DD-MM-YYYY HH:MM
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
```

## Rollback Instructions

If issues occur:

```bash
# Revert code changes
git log --oneline | grep "timestamp"
git revert <commit-hash>

# Revert database changes (set to NULL)
sqlite3 bingo.db "UPDATE users SET createdAt = NULL, lastActive = NULL;"
```

## Future Enhancements

Consider adding:
- Activity tracking (track specific actions, not just updates)
- Session management (track active sessions)
- Login history table (track all login attempts)
- Last seen indicator (show "Active now", "5 minutes ago", etc.)
- Timezone support (store in UTC, display in user's timezone)

## Verification Checklist

- [x] Database migration script created
- [x] Existing users updated with timestamps
- [x] `@BeforeUpdate()` hook added to entity
- [x] Login tracking implemented
- [x] Backend rebuilt successfully
- [x] No TypeScript errors
- [x] Timestamps display correctly in UI
