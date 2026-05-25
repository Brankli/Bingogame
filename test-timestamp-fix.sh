#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     User Timestamp Fix - Verification Test                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check database schema
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Database Schema Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Checking if createdAt and lastActive columns exist..."
SCHEMA=$(sqlite3 bingo.db ".schema users" | grep -E "createdAt|lastActive")
if [ -n "$SCHEMA" ]; then
    echo -e "${GREEN}✓ Columns exist in database${NC}"
    echo "$SCHEMA"
else
    echo -e "${RED}✗ Columns missing from database${NC}"
    exit 1
fi
echo ""

# Test 2: Check current user timestamps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Current User Timestamps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ID | Username | Created At          | Last Active"
echo "---+----------+---------------------+---------------------"
sqlite3 bingo.db "SELECT id, username, createdAt, lastActive FROM users;" | while IFS='|' read -r id username created active; do
    if [ -z "$created" ] || [ "$created" = "" ]; then
        echo -e "${RED}$id  | $username | NULL (NEEDS FIX)    | NULL (NEEDS FIX)${NC}"
    else
        echo -e "${GREEN}$id  | $username | $created | $active${NC}"
    fi
done
echo ""

# Test 3: Count users with NULL timestamps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: NULL Timestamp Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
NULL_COUNT=$(sqlite3 bingo.db "SELECT COUNT(*) FROM users WHERE createdAt IS NULL OR lastActive IS NULL;")
if [ "$NULL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ All users have timestamps set${NC}"
else
    echo -e "${YELLOW}⚠ $NULL_COUNT user(s) have NULL timestamps${NC}"
    echo ""
    echo "Run this command to fix:"
    echo "  sqlite3 bingo.db \"UPDATE users SET createdAt = datetime('now'), lastActive = datetime('now') WHERE createdAt IS NULL OR lastActive IS NULL;\""
fi
echo ""

# Test 4: Check backend build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Backend Code Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if BeforeUpdate exists in user entity
if grep -q "@BeforeUpdate()" src/user/entities/user.entity.ts; then
    echo -e "${GREEN}✓ @BeforeUpdate() hook found in user.entity.ts${NC}"
else
    echo -e "${RED}✗ @BeforeUpdate() hook missing in user.entity.ts${NC}"
fi

# Check if lastActive update exists in auth service
if grep -q "lastActive: new Date()" src/auth/auth.service.ts; then
    echo -e "${GREEN}✓ lastActive update found in auth.service.ts${NC}"
else
    echo -e "${RED}✗ lastActive update missing in auth.service.ts${NC}"
fi

# Check if dist folder exists (backend built)
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Backend is built (dist/ folder exists)${NC}"
else
    echo -e "${YELLOW}⚠ Backend not built yet. Run: npm run build${NC}"
fi
echo ""

# Test 5: Check if backend is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Backend Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 3000${NC}"
    HEALTH=$(curl -s http://localhost:3000/api/health | jq -r '.status')
    echo "  Status: $HEALTH"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Start with: npm run start:dev"
fi
echo ""

# Test 6: Frontend build check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Frontend Build Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ -d "client/dist" ]; then
    echo -e "${GREEN}✓ Frontend is built (client/dist/ folder exists)${NC}"
    LAST_BUILD=$(stat -c %y client/dist 2>/dev/null || stat -f "%Sm" client/dist 2>/dev/null)
    echo "  Last build: $LAST_BUILD"
else
    echo -e "${YELLOW}⚠ Frontend not built yet. Run: cd client && npm run build${NC}"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_USERS=$(sqlite3 bingo.db "SELECT COUNT(*) FROM users;")
USERS_WITH_TIMESTAMPS=$(sqlite3 bingo.db "SELECT COUNT(*) FROM users WHERE createdAt IS NOT NULL AND lastActive IS NOT NULL;")

echo "Total Users: $TOTAL_USERS"
echo "Users with Timestamps: $USERS_WITH_TIMESTAMPS"
echo ""

if [ "$TOTAL_USERS" -eq "$USERS_WITH_TIMESTAMPS" ]; then
    echo -e "${GREEN}✓ All tests passed! Timestamp fix is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart backend if it's running: npm run start:dev"
    echo "2. Refresh browser (Ctrl+F5)"
    echo "3. Login and check Admin Dashboard > Users tab"
    echo "4. Timestamps should display properly"
else
    echo -e "${YELLOW}⚠ Some users need timestamp fix${NC}"
    echo ""
    echo "Run this to fix:"
    echo "  ./apply-timestamp-fix.sh"
fi
echo ""
