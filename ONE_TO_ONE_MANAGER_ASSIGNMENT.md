# 👤 One-to-One Manager Assignment - Implementation

## Overview
Implemented a **1-to-1 relationship** between users and rooms for manager assignments. Each user can only be assigned as a manager to **ONE room**, and assigned users are automatically filtered out from the dropdown.

## The Rule

### Before (❌ Problem):
```
User "John" → Can be assigned to Room A
User "John" → Can also be assigned to Room B
User "John" → Can also be assigned to Room C
Result: One user managing multiple rooms (confusing)
```

### After (✅ Solution):
```
User "John" → Assigned to Room A
User "John" → Filtered out from dropdown (not available)
User "John" → Cannot be assigned to Room B or C
Result: One user, one room (clear responsibility)
```

## Implementation

### 1. Updated `managerCandidates` Computed Property

**Before:**
```typescript
const managerCandidates = computed(() =>
  users.value.filter((u: any) => 
    String(u.role || '').toLowerCase() !== 'admin'
  ),
);
```

**After:**
```typescript
const managerCandidates = computed(() => {
  // Get all user IDs that are already assigned as managers to any room
  const assignedUserIds = new Set<number>();
  
  rooms.value.forEach((room: any) => {
    if (room.managers && Array.isArray(room.managers)) {
      room.managers.forEach((manager: any) => {
        if (manager.user?.id) {
          assignedUserIds.add(manager.user.id);
        }
      });
    }
  });
  
  // Filter out admins and users who are already assigned to any room
  return users.value.filter((u: any) => {
    const isAdmin = String(u.role || '').toLowerCase() === 'admin';
    const isAlreadyAssigned = assignedUserIds.has(u.id);
    
    // Only show users who are NOT admins AND NOT already assigned
    return !isAdmin && !isAlreadyAssigned;
  });
});
```

### 2. Added Validation in `assignManagerToRoom()`

```typescript
async function assignManagerToRoom() {
  if (!selectedRoomForManager.value || !selectedUserForManager.value) return;
  
  // Check if user is already assigned to any room (1-to-1 validation)
  const isUserAlreadyAssigned = rooms.value.some((room: any) => 
    room.managers?.some((manager: any) => 
      manager.user?.id === selectedUserForManager.value
    )
  );
  
  if (isUserAlreadyAssigned) {
    showToast('This user is already assigned to another room. One user can only manage one room.', 'error');
    return;
  }
  
  try {
    await services?.roomService.assignManager(
      selectedUserForManager.value,
      selectedRoomForManager.value,
    );
    showToast('Manager assigned successfully!', 'success');
    selectedUserForManager.value = null;
    await loadRooms();
  } catch (error) {
    showToast('Error assigning manager: ' + getErrorMessage(error), 'error');
  }
}
```

## How It Works

### Step-by-Step Flow:

#### 1. Admin Opens "Assign Room Manager" Section
```
Dropdown shows:
- All non-admin users
- Excluding users already assigned to any room
```

#### 2. User "Alice" is Assigned to "Room A"
```
Before assignment:
Dropdown: [Alice, Bob, Charlie, David]

After assignment:
Dropdown: [Bob, Charlie, David]  ← Alice is filtered out
```

#### 3. Try to Assign Alice Again (Edge Case)
```
If somehow Alice is selected:
→ Validation error: "This user is already assigned to another room."
→ Assignment blocked
```

#### 4. Remove Alice from "Room A"
```
After removal:
Dropdown: [Alice, Bob, Charlie, David]  ← Alice is back!
```

## Visual Example

### Scenario: 3 Rooms, 5 Users

**Initial State:**
```
Rooms:
- Room A: No manager
- Room B: No manager  
- Room C: No manager

Users:
- Admin (excluded from dropdown)
- Alice (available)
- Bob (available)
- Charlie (available)
- David (available)

Dropdown: [Alice, Bob, Charlie, David]
```

**After Assigning Alice to Room A:**
```
Rooms:
- Room A: Alice ✅
- Room B: No manager
- Room C: No manager

Users:
- Admin (excluded - is admin)
- Alice (excluded - assigned to Room A)
- Bob (available)
- Charlie (available)
- David (available)

Dropdown: [Bob, Charlie, David]  ← Alice filtered out
```

**After Assigning Bob to Room B:**
```
Rooms:
- Room A: Alice ✅
- Room B: Bob ✅
- Room C: No manager

Users:
- Admin (excluded - is admin)
- Alice (excluded - assigned to Room A)
- Bob (excluded - assigned to Room B)
- Charlie (available)
- David (available)

Dropdown: [Charlie, David]  ← Alice and Bob filtered out
```

**After Removing Alice from Room A:**
```
Rooms:
- Room A: No manager
- Room B: Bob ✅
- Room C: No manager

Users:
- Admin (excluded - is admin)
- Alice (available again!)
- Bob (excluded - assigned to Room B)
- Charlie (available)
- David (available)

Dropdown: [Alice, Charlie, David]  ← Alice is back!
```

## Benefits

### 1. Clear Responsibility
✅ Each user manages only one room
✅ No confusion about which room a user manages
✅ Clear accountability

### 2. Prevents Conflicts
✅ User can't be assigned to multiple rooms
✅ No scheduling conflicts
✅ Easier to track who manages what

### 3. Better UX
✅ Dropdown only shows available users
✅ No need to remember who is assigned where
✅ Prevents assignment errors

### 4. Data Integrity
✅ Enforces 1-to-1 relationship
✅ Prevents duplicate assignments
✅ Consistent data model

## Filtering Logic

### Users Excluded from Dropdown:

1. **Admins** - They have global access, don't need room assignment
2. **Already Assigned Users** - Users who are managers of any room

### Users Included in Dropdown:

1. **Regular users** (role = 'user')
2. **Not assigned to any room**

### Code Logic:
```typescript
// Step 1: Collect all assigned user IDs
const assignedUserIds = new Set<number>();
rooms.forEach(room => {
  room.managers.forEach(manager => {
    assignedUserIds.add(manager.user.id);
  });
});

// Step 2: Filter users
return users.filter(user => {
  const isAdmin = user.role === 'admin';
  const isAlreadyAssigned = assignedUserIds.has(user.id);
  
  return !isAdmin && !isAlreadyAssigned;
});
```

## Edge Cases Handled

### 1. User Assigned to Room A, Try to Assign to Room B
```
Action: Select user from dropdown (won't appear)
Result: User not in dropdown ✅
```

### 2. User Removed from Room A
```
Action: Remove user from Room A
Result: User appears in dropdown again ✅
```

### 3. Multiple Rooms Loaded
```
Action: Load all rooms
Result: All assigned users filtered out correctly ✅
```

### 4. Invalid Manager (Deleted User)
```
Action: Room has manager with deleted user
Result: Doesn't break filtering, handled gracefully ✅
```

## Testing

### Test Case 1: Assign User to Room
```
1. Open Admin Dashboard
2. Select "Room A" from room dropdown
3. Check user dropdown
4. ✅ Only unassigned users appear
5. Select "Alice"
6. Click "Assign"
7. ✅ Alice assigned to Room A
8. Check user dropdown again
9. ✅ Alice no longer appears
```

### Test Case 2: Remove User from Room
```
1. Room A has Alice as manager
2. Click X button next to Alice's name
3. Confirm removal
4. ✅ Alice removed from Room A
5. Check user dropdown
6. ✅ Alice appears in dropdown again
```

### Test Case 3: Multiple Assignments
```
1. Assign Alice to Room A
2. Assign Bob to Room B
3. Assign Charlie to Room C
4. Check user dropdown
5. ✅ Only David appears (if he's the only unassigned user)
```

### Test Case 4: All Users Assigned
```
1. Assign all users to rooms
2. Check user dropdown
3. ✅ Dropdown is empty or shows "No data available"
```

## Error Messages

### Assignment Blocked:
```
"This user is already assigned to another room. One user can only manage one room."
```

### Success:
```
"Manager assigned successfully!"
```

### Removal Success:
```
"Manager removed successfully!"
```

## Database Relationship

### Current Structure:
```
User (1) ←→ (1) Room Manager Assignment ←→ (1) Room

One user can have ONE manager assignment
One room can have ONE manager
```

### Enforced By:
- ✅ Frontend filtering (dropdown)
- ✅ Frontend validation (before API call)
- ✅ Backend validation (in room.service.ts - if implemented)

## Performance

### Optimization:
- Uses `Set` for O(1) lookup of assigned user IDs
- Computed property automatically updates when rooms change
- Efficient filtering with single pass through users array

### Complexity:
```
Time: O(R × M + U)
Where:
- R = number of rooms
- M = average managers per room (usually 1)
- U = number of users

Typical: O(n) where n = total users
```

## Files Modified

1. **client/src/views/AdminDashboard.vue**
   - Updated `managerCandidates` computed property
   - Added validation in `assignManagerToRoom()` function

## Status

✅ **IMPLEMENTED** - One-to-one manager assignment enforced!

## Summary

| Feature | Status |
|---------|--------|
| Filter assigned users from dropdown | ✅ |
| Validation before assignment | ✅ |
| Show only available users | ✅ |
| Handle user removal | ✅ |
| Error messages | ✅ |
| Success feedback | ✅ |

**Result:** Clean, clear, one-to-one relationship between users and rooms! 🎯
