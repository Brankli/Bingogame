# Admin Password Change Feature

## Overview
Added a profile management feature that allows admins to change their password securely from the Admin Dashboard.

## Features Implemented

### 1. Frontend (AdminDashboard.vue)

**New "My Profile" Tab:**
- Accessible from left sidebar navigation
- Shows current user information (username, role)
- Password change form with validation
- Security guidelines and best practices

**Form Fields:**
- Current Password (required)
- New Password (required, min 6 characters)
- Confirm New Password (must match new password)

**Validation:**
- All fields required
- New password minimum 6 characters
- Passwords must match
- Current password verified on backend

### 2. Backend API

**New Endpoint:**
```
POST /api/users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Security:**
- Requires JWT authentication
- Validates current password before allowing change
- Hashes new password with bcrypt (10 rounds)
- Returns 401 if current password is incorrect

### 3. New Backend Methods

**UserService:**
- `validatePassword(userId, password)` - Verifies current password
- `changePassword(userId, newPassword)` - Updates password with hash

**UserController:**
- `changePassword()` - Endpoint handler with validation

### 4. Frontend Service

**UserService.ts:**
- `changePassword(currentPassword, newPassword)` - API call

## User Flow

1. Admin logs in
2. Navigates to Admin Dashboard
3. Clicks "My Profile" in left sidebar
4. Sees current account information
5. Fills in password change form:
   - Enters current password
   - Enters new password
   - Confirms new password
6. Clicks "Update Password"
7. System validates:
   - Current password is correct
   - New password meets requirements
   - Passwords match
8. Password updated successfully
9. Form clears, success message shown

## Security Features

✅ **Current Password Verification**: Must provide correct current password
✅ **Password Hashing**: Uses bcrypt with 10 salt rounds
✅ **JWT Authentication**: Endpoint requires valid JWT token
✅ **User Context**: Only changes password for authenticated user
✅ **Validation**: Frontend and backend validation
✅ **Error Handling**: Clear error messages for invalid attempts

## Password Requirements

**Minimum:**
- At least 6 characters

**Recommended (shown in guidelines):**
- At least 8 characters
- Mix of uppercase and lowercase
- Include numbers and special characters
- Avoid common words or patterns
- Don't reuse passwords

## UI Components

### Profile Card
- Shows username
- Shows role badge (ADMIN)
- Clean, modern design

### Password Form
- Material Design text fields
- Password type inputs (hidden)
- Icon indicators (lock icons)
- Loading state during submission
- Validation rules displayed

### Guidelines Card
- Strong password tips
- Security best practices
- Helpful recommendations

## Error Handling

**Frontend Validation:**
- Empty fields → "Please fill in all password fields"
- Passwords don't match → "New passwords do not match"
- Too short → "Password must be at least 6 characters"

**Backend Errors:**
- Wrong current password → "Current password is incorrect" (401)
- Server error → "Failed to change password"

## Files Modified

### Backend:
1. **src/user/user.controller.ts**
   - Added `changePassword()` endpoint
   - Added `UnauthorizedException` import
   - Added `User` decorator import

2. **src/user/user.service.ts**
   - Added `validatePassword()` method
   - Added `changePassword()` method

### Frontend:
3. **client/src/services/UserService.ts**
   - Added `changePassword()` method

4. **client/src/views/AdminDashboard.vue**
   - Added "My Profile" navigation button
   - Added profile tab with password form
   - Added `passwordForm` reactive state
   - Added `changingPassword` loading state
   - Added `changePassword()` function

## Testing Checklist

### As Admin:
- [ ] Login as admin
- [ ] Navigate to Admin Dashboard
- [ ] Click "My Profile" in sidebar
- [ ] Verify profile information displays correctly
- [ ] Try changing password with wrong current password → Should fail
- [ ] Try changing password with mismatched new passwords → Should fail
- [ ] Try changing password with too short password → Should fail
- [ ] Change password with valid inputs → Should succeed
- [ ] Logout and login with new password → Should work
- [ ] Logout and try old password → Should fail

### Security Tests:
- [ ] Verify endpoint requires authentication
- [ ] Verify current password is validated
- [ ] Verify password is hashed in database
- [ ] Verify error messages don't leak sensitive info

## Future Enhancements

- Password strength meter
- Password history (prevent reuse)
- Email notification on password change
- Two-factor authentication
- Password expiration policy
- Account recovery via email
- Session invalidation after password change

## Benefits

✅ **Self-Service**: Admins can change their own passwords
✅ **Security**: Encourages regular password updates
✅ **User Control**: No need to contact support
✅ **Best Practices**: Guidelines educate users
✅ **Audit Trail**: Changes logged in database
✅ **Professional**: Modern, clean UI

## API Documentation

### Change Password

**Endpoint:** `POST /api/users/change-password`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized"
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```
