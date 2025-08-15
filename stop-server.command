#!/bin/bash

# Sarcastic Serenity - Stop Development Server
# Double-click this file to stop any running development servers

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🛑 Sarcastic Serenity - Stop Development Server${NC}"
echo -e "${CYAN}================================================${NC}"

# Function to find and kill processes
kill_dev_server() {
    local port=$1
    local process_name=$2
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${BLUE}🔍 Found $process_name process(es) on port $port${NC}"
        echo -e "${YELLOW}🔄 Stopping process(es): $pids${NC}"
        
        # Kill the processes
        echo $pids | xargs kill -TERM 2>/dev/null
        
        # Wait a moment and force kill if still running
        sleep 2
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}⚠️  Force stopping remaining process(es): $remaining_pids${NC}"
            echo $remaining_pids | xargs kill -KILL 2>/dev/null
        fi
        
        echo -e "${GREEN}✅ Stopped $process_name on port $port${NC}"
        return 0
    else
        echo -e "${BLUE}ℹ️  No $process_name process found on port $port${NC}"
        return 1
    fi
}

# Stop common development server ports
echo -e "${BLUE}🔍 Looking for running development servers...${NC}"
echo ""

stopped_any=false

# Vite dev server (default port)
if kill_dev_server 5173 "Vite dev server"; then
    stopped_any=true
fi

# Vite preview server (default port)
if kill_dev_server 4173 "Vite preview server"; then
    stopped_any=true
fi

# SvelteKit dev server (alternative port)
if kill_dev_server 3000 "SvelteKit dev server"; then
    stopped_any=true
fi

# Check for any Node.js processes that might be dev servers
echo -e "${BLUE}🔍 Checking for other Node.js development processes...${NC}"
node_pids=$(ps aux | grep -E "node.*(vite|svelte|dev)" | grep -v grep | awk '{print $2}' | tr '\n' ' ')

if [ -n "$node_pids" ]; then
    echo -e "${YELLOW}⚠️  Found potential development processes: $node_pids${NC}"
    read -p "Do you want to stop these processes? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo $node_pids | xargs kill -TERM 2>/dev/null
        echo -e "${GREEN}✅ Stopped additional Node.js processes${NC}"
        stopped_any=true
    fi
fi

echo ""
if [ "$stopped_any" = true ]; then
    echo -e "${GREEN}✅ Server cleanup completed!${NC}"
else
    echo -e "${BLUE}ℹ️  No development servers were running${NC}"
fi

echo ""
echo -e "${CYAN}💡 Tips:${NC}"
echo "  • Use 'start-server.command' to start a new development server"
echo "  • Use 'restart-server.command' to restart the server"
echo "  • Check Activity Monitor for any remaining Node.js processes"
echo ""
read -p "Press Enter to close this window..."
