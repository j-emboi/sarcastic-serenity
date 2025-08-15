#!/bin/bash

# Sarcastic Serenity - Enhanced Development Server Launcher
# Double-click this file to start the development server

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🧘‍♀️  Sarcastic Serenity - Enhanced Development Server${NC}"
echo -e "${CYAN}====================================================${NC}"

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

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version $(node --version) detected${NC}"
    echo "SvelteKit 2.0+ requires Node.js 18 or higher"
    echo "Consider updating Node.js for better performance"
    echo ""
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

# Check for outdated dependencies
echo -e "${BLUE}🔍 Checking for outdated dependencies...${NC}"
OUTDATED=$(npm outdated --depth=0 2>/dev/null | wc -l)
if [ "$OUTDATED" -gt 1 ]; then
    echo -e "${YELLOW}⚠️  Found $((OUTDATED-1)) outdated dependencies${NC}"
    echo "Consider running 'npm update' to update them"
    echo ""
fi

# Server mode selection
echo -e "${CYAN}🚀 Choose your server mode:${NC}"
echo "1) Standard dev server (localhost:5173)"
echo "2) Dev server with auto-open browser"
echo "3) Dev server accessible from network (for mobile testing)"
echo "4) Dev server with HTTPS (for PWA testing)"
echo "5) Full dev server (network + HTTPS + auto-open)"
echo "6) Build and preview production version"
echo ""

read -p "Enter your choice (1-6, default: 1): " choice
choice=${choice:-1}

echo ""
echo -e "${GREEN}🚀 Starting server in mode $choice...${NC}"
echo "You can stop the server anytime with Ctrl+C"
echo ""

# Start the appropriate server based on choice
case $choice in
    1)
        echo -e "${BLUE}📍 Local: http://localhost:5173${NC}"
        npm run dev
        ;;
    2)
        echo -e "${BLUE}📍 Local: http://localhost:5173 (browser will open automatically)${NC}"
        npm run dev:open
        ;;
    3)
        echo -e "${BLUE}📍 Network: Will show network URL when server starts${NC}"
        npm run dev:host
        ;;
    4)
        echo -e "${BLUE}📍 HTTPS: https://localhost:5173 (for PWA testing)${NC}"
        echo -e "${YELLOW}⚠️  You may need to accept the self-signed certificate${NC}"
        npm run dev:https
        ;;
    5)
        echo -e "${BLUE}📍 Full mode: Network + HTTPS + auto-open${NC}"
        echo -e "${YELLOW}⚠️  You may need to accept the self-signed certificate${NC}"
        npm run dev:full
        ;;
    6)
        echo -e "${BLUE}🔨 Building production version...${NC}"
        npm run build:preview
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Starting standard dev server...${NC}"
        npm run dev
        ;;
esac

# Keep terminal open if the server stops
echo ""
echo -e "${YELLOW}Server stopped.${NC}"
echo -e "${CYAN}💡 Tips:${NC}"
echo "  • Use 'npm run dev:host' to test on mobile devices"
echo "  • Use 'npm run dev:https' for PWA service worker testing"
echo "  • Use 'npm run test:build' to test production build"
echo "  • Use 'npm run clean:install' if you encounter dependency issues"
echo ""
read -p "Press Enter to close this window..."
