#!/bin/bash

# Sarcastic Serenity - Build and Test Production Version
# Double-click this file to build and test the production version

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔨 Sarcastic Serenity - Build and Test Production Version${NC}"
echo -e "${CYAN}========================================================${NC}"

# Navigate to the app directory
cd "$(dirname "$0")/app"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Could not find package.json in the app directory${NC}"
    echo "Make sure this script is in the hackathon folder with the app subfolder"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    read -p "Press Enter to exit..."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: Failed to install dependencies${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
fi

# Clean previous build
echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
rm -rf build dist .svelte-kit
echo -e "${GREEN}✅ Clean completed${NC}"

# Run type checking
echo -e "${BLUE}🔍 Running type checks...${NC}"
npm run check
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Type check warnings found, but continuing with build...${NC}"
fi

# Build the production version
echo -e "${BLUE}🔨 Building production version...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please check the errors above.${NC}"
    read -p "Press Enter to exit..."
    exit 1
fi

echo -e "${GREEN}✅ Production build completed successfully!${NC}"

# Check build size
if [ -d "build" ]; then
    echo -e "${BLUE}📊 Build size information:${NC}"
    du -sh build/
    echo ""
fi

# Preview mode selection
echo -e "${CYAN}🚀 Choose preview mode:${NC}"
echo "1) Local preview (localhost:4173)"
echo "2) Network preview (accessible from other devices)"
echo "3) Local preview with auto-open browser"
echo ""

read -p "Enter your choice (1-3, default: 1): " choice
choice=${choice:-1}

echo ""
echo -e "${GREEN}🚀 Starting preview server in mode $choice...${NC}"
echo "You can stop the server anytime with Ctrl+C"
echo ""

# Start the appropriate preview server based on choice
case $choice in
    1)
        echo -e "${BLUE}📍 Local: http://localhost:4173${NC}"
        echo -e "${CYAN}💡 This is your production build running locally${NC}"
        npm run preview
        ;;
    2)
        echo -e "${BLUE}📍 Network: Will show network URL when server starts${NC}"
        echo -e "${CYAN}💡 This is your production build accessible from other devices${NC}"
        npm run preview:host
        ;;
    3)
        echo -e "${BLUE}📍 Local: http://localhost:4173 (browser will open automatically)${NC}"
        echo -e "${CYAN}💡 This is your production build running locally${NC}"
        # Note: Vite preview doesn't have --open flag, so we'll open manually
        npm run preview &
        sleep 3
        open http://localhost:4173
        wait
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Starting local preview...${NC}"
        npm run preview
        ;;
esac

# Keep terminal open if the server stops
echo ""
echo -e "${YELLOW}Preview server stopped.${NC}"
echo -e "${CYAN}💡 Production Testing Tips:${NC}"
echo "  • Test all features to ensure they work in production build"
echo "  • Check PWA installation and offline functionality"
echo "  • Test on different devices and browsers"
echo "  • Verify audio and visual features work correctly"
echo "  • Check that service worker is working properly"
echo ""
echo -e "${BLUE}📁 Build files are in the 'build' directory${NC}"
echo -e "${BLUE}📁 You can deploy these files to any static hosting service${NC}"
echo ""
read -p "Press Enter to close this window..."
