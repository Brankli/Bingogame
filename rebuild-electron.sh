#!/bin/bash

echo "🔧 Rebuilding Electron App"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check environment variable
echo "📋 Step 1: Checking environment variables..."
if grep -q "VUE_APP_API_URL" client/.env; then
    echo -e "${GREEN}✅ VUE_APP_API_URL is set${NC}"
    grep "VUE_APP_API_URL" client/.env
else
    echo -e "${YELLOW}⚠️  VUE_APP_API_URL not found, adding it...${NC}"
    echo "VUE_APP_API_URL=http://localhost:3000" >> client/.env
    echo -e "${GREEN}✅ Added VUE_APP_API_URL${NC}"
fi
echo ""

# Step 2: Build backend
echo "🔨 Step 2: Building backend..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Build frontend
echo "🎨 Step 3: Building frontend..."
cd client
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 4: Build Electron
echo "⚡ Step 4: Building Electron app..."
npm run electron:build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Electron app built successfully${NC}"
else
    echo -e "${RED}❌ Electron build failed${NC}"
    exit 1
fi
echo ""

echo "=========================="
echo -e "${GREEN}🎉 Build complete!${NC}"
echo ""
echo "📦 Built files location:"
echo "   - Backend: dist/"
echo "   - Frontend: client/dist/"
echo "   - Electron: dist/ (executable)"
echo ""
echo "🚀 To run the app:"
echo "   Linux: ./dist/bingo-game-1.0.0.AppImage"
echo "   Windows: dist/bingo-game Setup 1.0.0.exe"
echo ""
