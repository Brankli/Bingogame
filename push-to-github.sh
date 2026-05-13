#!/bin/bash

echo "🚀 Push to GitHub Script"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Target repository
TARGET_REPO="https://github.com/Brankli/Bingogame.git"

echo "Target Repository: $TARGET_REPO"
echo ""

# Step 1: Check current remote
echo "📍 Step 1: Checking current remote..."
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)
echo "Current remote: $CURRENT_REMOTE"
echo ""

# Step 2: Update remote
echo "🔄 Step 2: Updating remote URL..."
git remote set-url origin "$TARGET_REPO"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Remote URL updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update remote URL${NC}"
    exit 1
fi
echo ""

# Step 3: Verify remote
echo "✓ Step 3: Verifying remote..."
git remote -v
echo ""

# Step 4: Check for sensitive files
echo "🔒 Step 4: Checking for sensitive files..."
if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}⚠️  WARNING: .env file is tracked by git!${NC}"
    echo "Consider removing it: git rm --cached .env"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ No .env file in git${NC}"
fi
echo ""

# Step 5: Stage all changes
echo "📦 Step 5: Staging all changes..."
git add .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All changes staged${NC}"
else
    echo -e "${RED}❌ Failed to stage changes${NC}"
    exit 1
fi
echo ""

# Step 6: Show status
echo "📊 Step 6: Git status..."
git status --short | head -20
TOTAL_FILES=$(git status --short | wc -l)
echo "Total files to commit: $TOTAL_FILES"
echo ""

# Step 7: Commit
echo "💾 Step 7: Committing changes..."
COMMIT_MESSAGE="feat: Complete bingo game implementation with all features

- Added role-based access control (RBAC)
- Implemented Amharic audio support
- Added multiple winners feature
- Implemented unlucky winner rule (zero marks after 12 calls)
- Added any line pattern (horizontal, vertical, or diagonal)
- Implemented one-to-one manager assignment
- Added card registration validation
- Implemented refresh functions for instant feedback
- Added comprehensive documentation"

git commit -m "$COMMIT_MESSAGE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠️  Nothing to commit or commit failed${NC}"
fi
echo ""

# Step 8: Push
echo "🚀 Step 8: Pushing to GitHub..."
echo "Pushing to: $TARGET_REPO"
echo ""

read -p "Ready to push? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
        echo ""
        echo "🎉 Your project is now on GitHub!"
        echo "Visit: https://github.com/Brankli/Bingogame"
    else
        echo ""
        echo -e "${RED}❌ Push failed${NC}"
        echo ""
        echo "Common solutions:"
        echo "1. Repository doesn't exist - Create it on GitHub first"
        echo "2. Permission denied - Set up authentication"
        echo "3. Updates rejected - Try: git pull origin main --allow-unrelated-histories"
        echo "4. Force push (overwrites remote): git push -u origin main --force"
        exit 1
    fi
else
    echo "Push cancelled. You can push manually later with:"
    echo "  git push -u origin main"
fi

echo ""
echo "Done! 🎉"
