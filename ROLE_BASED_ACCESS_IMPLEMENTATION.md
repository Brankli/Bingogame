# Role-Based Access Control Implementation

## Overview

This implementation adds a comprehensive role-based access control (RBAC) system to the Bingo game application.

## Features Implemented

### 1. User Roles

**Two roles:**
- **Admin**: Full system access
- **User**: Limited access, can be assigned to manage specific rooms

### 2. Admin Capabilities

- Create, edit, and delete users
- Create and delete rooms
- Assign users to manage specific rooms
- Remove room managers
- Full access to all room controls
- View all users and rooms

### 3. Room Manager Capabilities (Assigned Users)

When a user is assigned to manage a room, they can:
- Set ticket price for the room
- Start game
- Pause game
- Verify wins
- Select winning pattern
- Reset game
- View pattern on 5x5 grid
- Manage users in their assigned room

### 4. Backend Changes

#### New Entities
- `UserRole` enum (admin/user) in `User` entity
- `RoomManager` entity to track room assignments

#### New Guards
- `RolesGuard`: Checks if user has required role
- `RoomManagerGuard`: Checks if user can manage a specific room

#### New Endpoints

**Room Management:**
- `POST /rooms/assign-manager` - Assign user to manage a room (Admin only)
- `POST /rooms/remove-manager` - Remove user from managing a room (Admin only)
- `GET /rooms/user/:userId/managed` - Get rooms managed by a user
- `GET /rooms/:id/can-manage` - Check if current user can manage a room

**User Management:**
- `POST /users` - Create user (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `GET /users` - List all users (Authenticated)
- `GET /users/:id` - Get user details (Authenticated)

#### Protected Endpoints
- `POST /rooms/:id/ticket-price` - Requires room manager permission
- `POST /rooms/:id/reset-prize` - Requires room manager permission
- `DELETE /rooms/:id` - Requires admin role

### 5. Frontend Changes

#### Updated Components
- `BingoRoomView.vue`: Now checks `canManageRoom` instead of just `isOwner`
- Admin controls show for:
  - Room owner
  - Assigned room managers
  - Admin users

#### New Computed Property
```typescript
const canManageRoom = computed(() => {
  if (!room.value || !user) return false;
  
  // Admin can manage any room
  if (user.role === 'admin') return true;
  
  // Owner can manage their room
  if (room.value.owner?.id === user.id) return true;
  
  // Check if user is assigned as manager
  if (room.value.managers) {
    return room.value.managers.some((m: any) => m.user.id === user.id);
  }
  
  return false;
});
```

## Installation Steps

### 1. Run Database Migration

```bash
# Using MySQL client
mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql

# Or using Docker
docker-compose exec db mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql
```

### 2. Restart Backend Server

```bash
npm run start:dev
```

### 3. Restart Frontend

```bash
cd client
npm run serve
```

## Usage

### As Admin

1. **Login as admin** (user ID 1 by default after migration)
2. **Create rooms** or use existing rooms
3. **Assign users to rooms:**
   ```bash
   POST /api/rooms/assign-manager
   {
     "userId": 2,
     "roomId": 1
   }
   ```

### As Room Manager

1. **Login as assigned user**
2. **Navigate to assigned room**
3. **See all game controls:**
   - Start Game button
   - Pause button (when playing)
   - Verify input and button (when paused)
   - Reset button
   - Pattern selector
   - Pattern preview grid

### Pattern Display

- **Before game starts**: Manager selects pattern from dropdown
- **Pattern preview**: Shows on 5x5 grid with checkmarks
- **After verification**: If win is valid, shows winning pattern on card

## API Examples

### Assign Room Manager (Admin Only)

```bash
curl -X POST http://localhost:3000/api/rooms/assign-manager \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "roomId": 1
  }'
```

### Remove Room Manager (Admin Only)

```bash
curl -X POST http://localhost:3000/api/rooms/remove-manager \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "roomId": 1
  }'
```

### Check if User Can Manage Room

```bash
curl -X GET http://localhost:3000/api/rooms/1/can-manage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User's Managed Rooms

```bash
curl -X GET http://localhost:3000/api/rooms/user/2/managed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security

- All sensitive endpoints are protected with JWT authentication
- Admin-only endpoints use `@Roles(UserRole.ADMIN)` decorator
- Room management endpoints use `@UseGuards(RoomManagerGuard)`
- Guards check both role and room assignment
- Admins bypass room assignment checks

## Database Schema

### users table
```sql
- id (INT, PRIMARY KEY)
- username (VARCHAR, UNIQUE)
- password (VARCHAR)
- role (ENUM: 'admin', 'user') -- NEW
```

### room_managers table (NEW)
```sql
- id (INT, PRIMARY KEY)
- userId (INT, FOREIGN KEY -> users.id)
- roomId (INT, FOREIGN KEY -> rooms.id)
- assignedAt (DATETIME)
- UNIQUE(userId, roomId)
```

## Testing

1. **Test as Admin:**
   - Login as user ID 1
   - Create a room
   - Assign another user to manage it
   - Verify admin can see controls in all rooms

2. **Test as Room Manager:**
   - Login as assigned user
   - Navigate to assigned room
   - Verify all game controls are visible
   - Try to access non-assigned room (should not see controls)

3. **Test as Regular User:**
   - Login as non-assigned user
   - Navigate to any room
   - Verify no game controls are visible
   - Can only view and play

## Future Enhancements

- Admin dashboard for user/room management
- Bulk room assignments
- Room manager activity logs
- Permission levels (view-only, game-control, full-management)
- Email notifications for room assignments
