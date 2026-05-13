# Deployment Checklist - Role-Based Access Control

## Pre-Deployment

- [ ] Backup your database
  ```bash
  mysqldump -u bingo -p bingo > backup_$(date +%Y%m%d).sql
  ```

- [ ] Review all changes in git
  ```bash
  git status
  git diff
  ```

## Database Migration

- [ ] Run the migration script
  ```bash
  mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql
  ```

- [ ] Verify migration success
  ```bash
  mysql -u bingo -p -e "DESCRIBE users" bingo
  mysql -u bingo -p -e "DESCRIBE room_managers" bingo
  ```

- [ ] Check that user ID 1 is now admin
  ```bash
  mysql -u bingo -p -e "SELECT id, username, role FROM users WHERE id=1" bingo
  ```

## Backend Deployment

- [ ] Stop current backend server (Ctrl+C)

- [ ] Install any new dependencies (if needed)
  ```bash
  npm install
  ```

- [ ] Build the project
  ```bash
  npm run build
  ```

- [ ] Start the backend
  ```bash
  npm run start:dev
  ```

- [ ] Verify backend is running
  ```bash
  curl http://localhost:3000/api/rooms
  ```

- [ ] Check for any startup errors in console

## Frontend Deployment

- [ ] Stop current frontend server (Ctrl+C)

- [ ] Navigate to client directory
  ```bash
  cd client
  ```

- [ ] Install any new dependencies (if needed)
  ```bash
  npm install
  ```

- [ ] Start the frontend
  ```bash
  npm run serve
  ```

- [ ] Verify frontend is running
  - Open http://localhost:8080 in browser
  - Check browser console for errors

## Testing

### Test 1: Admin Access
- [ ] Logout from current account
- [ ] Login as "abiy" (user ID 1)
- [ ] Navigate to any room
- [ ] Verify you see:
  - [ ] Start Game button
  - [ ] Pattern selector dropdown
  - [ ] Pattern preview grid (5x5)
  - [ ] User Management button (in left sidebar)

### Test 2: Room Assignment
- [ ] As admin, open browser console (F12)
- [ ] Run assignment command:
  ```javascript
  fetch('http://localhost:3000/api/rooms/assign-manager', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
    },
    body: JSON.stringify({ userId: 2, roomId: 1 })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify response shows success

### Test 3: Assigned User Access
- [ ] Logout
- [ ] Login as user ID 2 ("Ab")
- [ ] Navigate to room 1 (assigned room)
- [ ] Verify you see all game controls:
  - [ ] Start Game button
  - [ ] Pause button (when playing)
  - [ ] Verify input and button (when paused)
  - [ ] Reset button
  - [ ] Pattern selector
  - [ ] Pattern preview grid

### Test 4: Non-Assigned User
- [ ] Still logged in as user ID 2
- [ ] Navigate to a different room (not room 1)
- [ ] Verify you DON'T see any game controls
- [ ] Verify you can only view the game

### Test 5: Game Flow
- [ ] As room manager, select a pattern
- [ ] Verify pattern shows in preview grid
- [ ] Click Start Game
- [ ] Verify numbers start being called
- [ ] Click Pause
- [ ] Enter a card number in verify field
- [ ] Click Verify
- [ ] If valid, verify winning pattern displays on 5x5 grid

### Test 6: Pattern Display
- [ ] Select "Horizontal Line" pattern
- [ ] Verify first row is highlighted in preview
- [ ] Select "Diagonal" pattern
- [ ] Verify diagonal cells are highlighted
- [ ] Select "Four Corners" pattern
- [ ] Verify corner cells are highlighted

## Verification Commands

```bash
# Check all users and their roles
mysql -u bingo -p -e "SELECT id, username, role FROM users" bingo

# Check room assignments
mysql -u bingo -p -e "SELECT rm.id, u.username, r.name, rm.assignedAt FROM room_managers rm JOIN users u ON rm.userId = u.id JOIN rooms r ON rm.roomId = r.id" bingo

# Make another user admin (if needed)
mysql -u bingo -p -e "UPDATE users SET role='admin' WHERE username='USERNAME'" bingo
```

## Rollback Plan (If Needed)

If something goes wrong:

1. **Restore database from backup**
   ```bash
   mysql -u bingo -p bingo < backup_YYYYMMDD.sql
   ```

2. **Revert code changes**
   ```bash
   git checkout HEAD~1
   ```

3. **Restart servers**
   ```bash
   npm run start:dev
   cd client && npm run serve
   ```

## Post-Deployment

- [ ] Monitor backend logs for errors
- [ ] Monitor frontend console for errors
- [ ] Test with real users
- [ ] Document any issues
- [ ] Update team on new features

## Success Criteria

✅ Database migration completed without errors
✅ Backend starts without errors
✅ Frontend starts without errors
✅ Admin can see controls in all rooms
✅ Assigned users can see controls in their rooms
✅ Non-assigned users cannot see controls
✅ Pattern selection works
✅ Pattern preview displays correctly
✅ Game controls (start/pause/verify/reset) work
✅ Win verification shows winning pattern

## Common Issues & Solutions

### Issue: "Column 'role' doesn't exist"
**Solution:** Run migration again, check MySQL user permissions

### Issue: Admin controls not showing
**Solution:** 
- Clear browser localStorage
- Logout and login again to get new JWT token with role
- Check user role in database

### Issue: "Cannot read property 'managers' of undefined"
**Solution:**
- Refresh the page
- Check that room data includes managers in API response

### Issue: TypeScript errors in frontend
**Solution:**
- Run `npm install` in client directory
- Restart frontend dev server

## Documentation

- [ ] Read `ROLE_BASED_ACCESS_IMPLEMENTATION.md` for full details
- [ ] Read `QUICK_START_RBAC.md` for quick setup
- [ ] Keep `IMPLEMENTATION_SUMMARY.md` for reference

## Support

If you encounter issues not covered here:
1. Check browser console for errors
2. Check backend logs for errors
3. Verify database schema matches migration
4. Verify JWT token includes role field
5. Test API endpoints directly with curl/Postman

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** ⬜ Success  ⬜ Issues (describe below)

**Notes:**
