# Quick Start Guide - Role-Based Access Control

## Step 1: Run Database Migration

```bash
mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql
```

Enter your database password when prompted.

## Step 2: Restart Backend

```bash
# Stop the current backend (Ctrl+C)
npm run start:dev
```

## Step 3: Restart Frontend

```bash
cd client
# Stop the current frontend (Ctrl+C)
npm run serve
```

## Step 4: Test the System

### Test as Admin

1. **Logout** from current account
2. **Login** as user "abiy" (user ID 1 - now an admin)
3. **Navigate** to any room
4. **Verify** you see all admin controls:
   - Start Game
   - Pause
   - Verify
   - Reset
   - Pattern selector
   - User Management

### Test Room Assignment

1. **As admin**, open browser console (F12)
2. **Run this command** to assign user ID 2 to room ID 1:

```javascript
fetch('http://localhost:3000/api/rooms/assign-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  body: JSON.stringify({
    userId: 2,
    roomId: 1
  })
}).then(r => r.json()).then(console.log)
```

3. **Logout** and **login** as user ID 2 ("Ab")
4. **Navigate** to room 1
5. **Verify** you now see all game controls for that room

### Test Non-Assigned User

1. **Login** as user ID 2
2. **Navigate** to a room you're NOT assigned to
3. **Verify** you don't see any game controls
4. You can only view and play

## Step 5: Use Admin Panel (Optional)

Add a route to access the admin panel:

**client/src/router/index.ts:**

```typescript
{
  path: '/admin',
  name: 'admin',
  component: () => import('../components/AdminPanel.vue'),
  meta: { requiresAuth: true }
}
```

Then navigate to `http://localhost:8080/admin` as an admin user.

## Troubleshooting

### "Column 'role' doesn't exist"
- Run the migration again
- Check if migration was successful: `mysql -u bingo -p -e "DESCRIBE users" bingo`

### "Table 'room_managers' doesn't exist"
- Run the migration again
- Check: `mysql -u bingo -p -e "SHOW TABLES" bingo`

### Admin controls not showing
- Check browser console for `canManageRoom` value
- Verify user role: `SELECT id, username, role FROM users;`
- Verify room assignment: `SELECT * FROM room_managers;`

### JWT token doesn't include role
- Logout and login again to get new token with role
- Clear localStorage: `localStorage.clear()`

## Verification Commands

```bash
# Check user roles
mysql -u bingo -p -e "SELECT id, username, role FROM users" bingo

# Check room assignments
mysql -u bingo -p -e "SELECT * FROM room_managers" bingo

# Make user an admin
mysql -u bingo -p -e "UPDATE users SET role='admin' WHERE id=1" bingo
```

## Success Criteria

✅ Admin user can see controls in all rooms
✅ Assigned user can see controls in their assigned room only
✅ Non-assigned user cannot see any game controls
✅ Pattern selector shows for managers
✅ Verify button works for managers
✅ Start/Pause/Reset buttons work for managers

## Next Steps

- Create admin dashboard UI
- Add bulk room assignments
- Add activity logging
- Add email notifications for assignments
