# Database migrations

The app uses **TypeORM `synchronize`** in development only (`NODE_ENV !== production`).

`001_add_role_based_access.sql` is a legacy **MySQL** script. For PostgreSQL, equivalent changes are applied automatically via entity sync in dev, or run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
-- room_managers table is created by TypeORM from RoomManager entity
```

For production, prefer TypeORM migrations with `synchronize: false`.
