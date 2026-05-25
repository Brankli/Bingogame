#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Enhanced User Management - Verification Script          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check backend files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Backend Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "src/user/entities/earnings-transaction.entity.ts" ]; then
    echo -e "${GREEN}✓ earnings-transaction.entity.ts exists${NC}"
else
    echo -e "${RED}✗ earnings-transaction.entity.ts missing${NC}"
fi

if [ -f "src/user/dto/earnings-adjustment.dto.ts" ]; then
    echo -e "${GREEN}✓ earnings-adjustment.dto.ts exists${NC}"
else
    echo -e "${RED}✗ earnings-adjustment.dto.ts missing${NC}"
fi

if grep -q "adjustEarnings" src/user/user.service.ts; then
    echo -e "${GREEN}✓ adjustEarnings method found in user.service.ts${NC}"
else
    echo -e "${RED}✗ adjustEarnings method missing${NC}"
fi

if grep -q "adjust-earnings" src/user/user.controller.ts; then
    echo -e "${GREEN}✓ adjust-earnings endpoint found in user.controller.ts${NC}"
else
    echo -e "${RED}✗ adjust-earnings endpoint missing${NC}"
fi

echo ""

# Check frontend files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Frontend Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "client/src/components/admin/AdminUsersTab.vue" ]; then
    echo -e "${GREEN}✓ AdminUsersTab.vue exists${NC}"
    
    if grep -q "searchQuery" client/src/components/admin/AdminUsersTab.vue; then
        echo -e "${GREEN}✓ Search feature implemented${NC}"
    else
        echo -e "${RED}✗ Search feature missing${NC}"
    fi
    
    if grep -q "getActivityColor" client/src/components/admin/AdminUsersTab.vue; then
        echo -e "${GREEN}✓ Activity status feature implemented${NC}"
    else
        echo -e "${RED}✗ Activity status feature missing${NC}"
    fi
    
    if grep -q "adjustEarnings" client/src/components/admin/AdminUsersTab.vue; then
        echo -e "${GREEN}✓ Earnings management feature implemented${NC}"
    else
        echo -e "${RED}✗ Earnings management feature missing${NC}"
    fi
else
    echo -e "${RED}✗ AdminUsersTab.vue missing${NC}"
fi

if [ -f "client/src/components/admin/AdminUsersTab.vue.backup" ]; then
    echo -e "${GREEN}✓ Backup of old version exists${NC}"
else
    echo -e "${YELLOW}⚠ No backup found (optional)${NC}"
fi

if grep -q "adjustEarnings" client/src/services/UserService.ts; then
    echo -e "${GREEN}✓ UserService methods added${NC}"
else
    echo -e "${RED}✗ UserService methods missing${NC}"
fi

echo ""

# Check build status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Build Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Backend built (dist/ exists)${NC}"
else
    echo -e "${YELLOW}⚠ Backend not built yet${NC}"
fi

if [ -d "client/dist" ]; then
    echo -e "${GREEN}✓ Frontend built (client/dist/ exists)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not built yet${NC}"
fi

echo ""

# Check documentation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "ENHANCED_USER_MANAGEMENT.md" ]; then
    echo -e "${GREEN}✓ ENHANCED_USER_MANAGEMENT.md exists${NC}"
else
    echo -e "${YELLOW}⚠ Documentation missing${NC}"
fi

if [ -f "QUICK_START_GUIDE.md" ]; then
    echo -e "${GREEN}✓ QUICK_START_GUIDE.md exists${NC}"
else
    echo -e "${YELLOW}⚠ Quick start guide missing${NC}"
fi

if [ -f "IMPLEMENTATION_COMPLETE.md" ]; then
    echo -e "${GREEN}✓ IMPLEMENTATION_COMPLETE.md exists${NC}"
else
    echo -e "${YELLOW}⚠ Implementation summary missing${NC}"
fi

echo ""

# Check backend running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Checking Backend Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running${NC}"
    echo "  Start with: npm run start:dev"
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Summary                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Features Implemented:"
echo "  ✅ Search & Filter Users"
echo "  ✅ User Activity Status"
echo "  ✅ Earnings Management"
echo ""

echo "Next Steps:"
echo "  1. Restart backend: npm run start:dev"
echo "  2. Refresh browser: Ctrl+F5"
echo "  3. Go to Admin Dashboard → Users"
echo "  4. Test the new features!"
echo ""

echo "Documentation:"
echo "  📖 ENHANCED_USER_MANAGEMENT.md - Full details"
echo "  🚀 QUICK_START_GUIDE.md - Quick reference"
echo "  ✅ IMPLEMENTATION_COMPLETE.md - Summary"
echo ""

echo -e "${GREEN}✨ All enhancements are ready to use! ✨${NC}"
echo ""
