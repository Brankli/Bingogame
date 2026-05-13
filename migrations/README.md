# Database Migrations

## Running Migrations

To apply the role-based access control migration, run:

```bash
mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql
```

Or if using docker:

```bash
docker-compose exec db mysql -u bingo -p bingo < migrations/001_add_role_based_access.sql
```

## What This Migration Does

1. **Adds `role` column to `users` table**
   - Enum type: 'admin' or 'user'
   - Default: 'user'

2. **Creates `room_managers` table**
   - Links users to rooms they can manage
   - Allows admins to assign room management privileges

3. **Sets first user as admin**
   - User with ID 1 becomes an admin
   - Adjust this in the SQL file if needed

## After Migration

1. Restart the backend server
2. Login as the admin user (user ID 1)
3. You'll have full access to all rooms
4. You can assign other users to manage specific rooms
