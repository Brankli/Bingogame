#!/bin/bash

echo "=== User Tracking Fields Test ==="
echo ""

echo "1. Checking database schema..."
mysql -u root -p1234 bingo -e "DESCRIBE users;" 2>&1 | grep -E "(houseFee|totalEarnings|createdAt|lastActive)"

echo ""
echo "2. Checking current user data..."
mysql -u root -p1234 bingo -e "SELECT id, username, houseFee, totalEarnings, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') as created, DATE_FORMAT(lastActive, '%Y-%m-%d %H:%i') as active FROM users LIMIT 5;"

echo ""
echo "3. Testing backend API (requires server to be running)..."
echo "   Run this command manually after starting the server:"
echo "   curl http://localhost:3000/api/user | jq '.[] | {username, houseFee, totalEarnings, createdAt, lastActive}'"

echo ""
echo "=== Instructions ==="
echo "1. Restart the backend server: npm run start:dev"
echo "2. Wait for server to start (watch for 'Nest application successfully started')"
echo "3. Refresh the admin dashboard in your browser (Ctrl+Shift+R)"
echo "4. Navigate to User Management tab"
echo "5. Verify all columns show data (not N/A)"
echo ""
echo "If data still shows N/A:"
echo "- Check browser console for errors (F12)"
echo "- Verify API response: curl http://localhost:3000/api/user"
echo "- Check backend logs for errors"
