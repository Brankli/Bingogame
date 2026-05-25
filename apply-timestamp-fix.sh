#!/bin/bash

echo "=== Applying User Timestamp Fix ==="
echo ""

# Step 1: Check current state
echo "1. Checking current user timestamps..."
sqlite3 bingo.db "SELECT id, username, createdAt, lastActive FROM users;" | head -10
echo ""

# Step 2: Apply migration
echo "2. Applying timestamp migration..."
sqlite3 bingo.db "UPDATE users SET createdAt = datetime('now'), lastActive = datetime('now') WHERE createdAt IS NULL OR lastActive IS NULL;"
echo "✓ Migration applied"
echo ""

# Step 3: Verify fix
echo "3. Verifying timestamps are now set..."
sqlite3 bingo.db "SELECT id, username, datetime(createdAt) as created, datetime(lastActive) as active FROM users;"
echo ""

# Step 4: Restart backend
echo "4. Restarting backend to apply code changes..."
echo "   (You may need to manually restart if using pm2 or systemd)"
echo ""

echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Refresh the Admin Dashboard in your browser"
echo "3. Navigate to Users tab"
echo "4. Timestamps should now display properly"
echo ""
echo "To test login tracking:"
echo "1. Logout and login again"
echo "2. Check that 'Last Active' updates to current time"
