-- Fix User Timestamps Migration
-- This script updates all users with NULL createdAt/lastActive to current timestamp

-- Update existing users with NULL timestamps
UPDATE users 
SET createdAt = datetime('now'), 
    lastActive = datetime('now') 
WHERE createdAt IS NULL OR lastActive IS NULL;

-- Verify the update
SELECT 
    id, 
    username, 
    role,
    datetime(createdAt) as created_at,
    datetime(lastActive) as last_active
FROM users
ORDER BY id;
