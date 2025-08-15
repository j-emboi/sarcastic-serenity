# Sarcastic Serenity - Server Scripts Guide

## Overview
This guide explains all the server scripts available for developing and testing your Sarcastic Serenity app. These scripts provide enhanced functionality for different development and testing scenarios.

## Quick Start
1. **Double-click** any `.command` file to run it
2. **Follow the prompts** to choose your preferred server mode
3. **Use Ctrl+C** to stop any running server

## Available Scripts

### 🚀 `start-server.command` - Enhanced Development Server
**Purpose**: Start the development server with multiple options

**Features**:
- ✅ Automatic dependency installation
- ✅ Node.js version checking
- ✅ Outdated dependency detection
- ✅ Multiple server modes
- ✅ Colored output for better UX

**Server Modes**:
1. **Standard** - Local development server (localhost:5173)
2. **Auto-open** - Opens browser automatically
3. **Network** - Accessible from other devices (mobile testing)
4. **HTTPS** - Secure connection (required for PWA testing)
5. **Full** - Network + HTTPS + auto-open
6. **Production** - Build and preview production version

**Best for**: Daily development work

---

### 🛑 `stop-server.command` - Stop Development Servers
**Purpose**: Gracefully stop any running development servers

**Features**:
- ✅ Finds and stops processes on common dev ports (5173, 4173, 3000)
- ✅ Graceful termination with force kill fallback
- ✅ Interactive confirmation for additional processes
- ✅ Comprehensive cleanup

**Best for**: When you need to stop servers quickly

---

### 🔄 `restart-server.command` - Restart Development Server
**Purpose**: Stop any running servers and start a fresh one

**Features**:
- ✅ Stops all running development servers
- ✅ Waits 3 seconds before starting new server
- ✅ Same server mode options as start-server
- ✅ Clean restart process

**Best for**: When you need a fresh server instance

---

### 🔨 `build-and-test.command` - Production Build & Test
**Purpose**: Build production version and test it locally

**Features**:
- ✅ Cleans previous builds
- ✅ Runs type checking
- ✅ Builds production version
- ✅ Shows build size information
- ✅ Multiple preview modes
- ✅ Production testing tips

**Best for**: Testing production builds before deployment

---

## NPM Scripts (in app/package.json)

### Development Scripts
```bash
npm run dev              # Standard development server
npm run dev:open         # Dev server with auto-open browser
npm run dev:host         # Dev server accessible from network
npm run dev:https        # Dev server with HTTPS
npm run dev:full         # Full dev server (network + HTTPS + open)
```

### Build & Preview Scripts
```bash
npm run build           # Build production version
npm run build:preview   # Build and preview production
npm run preview         # Preview production build
npm run preview:host    # Preview with network access
```

### Utility Scripts
```bash
npm run check           # Type checking
npm run check:watch     # Type checking in watch mode
npm run lint            # Run linting checks
npm run clean           # Clean build artifacts
npm run clean:install   # Clean and reinstall dependencies
npm run test:build      # Build and test production
npm run test:build:host # Build and test with network access
```

## Testing Scenarios

### 🧪 Development Testing
```bash
# Start development server
./start-server.command
# Choose mode 1 (Standard) or 2 (Auto-open)
```

### 📱 Mobile Testing
```bash
# Start server with network access
./start-server.command
# Choose mode 3 (Network)
# Use the network URL shown on your mobile device
```

### 🔒 PWA Testing
```bash
# Start server with HTTPS
./start-server.command
# Choose mode 4 (HTTPS) or 5 (Full)
# Accept the self-signed certificate in your browser
```

### 🚀 Production Testing
```bash
# Build and test production version
./build-and-test.command
# Choose your preferred preview mode
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Use stop-server.command to kill processes
./stop-server.command
# Then restart with start-server.command
```

**Dependencies Issues**
```bash
# Clean and reinstall
npm run clean:install
```

**HTTPS Certificate Issues**
- Accept the self-signed certificate in your browser
- Or use standard HTTP mode for development

**Build Failures**
```bash
# Check for type errors
npm run check
# Clean and rebuild
npm run clean
npm run build
```

### Performance Tips

**For Development**
- Use standard mode for fastest startup
- Use auto-open mode for convenience

**For Testing**
- Use network mode for mobile testing
- Use HTTPS mode for PWA features
- Use production build for final testing

**For Performance**
- Monitor build sizes with `build-and-test.command`
- Use `npm run clean` to free up space
- Check for outdated dependencies regularly

## File Structure
```
hackathon/
├── app/                    # SvelteKit application
│   ├── package.json       # Enhanced with new scripts
│   └── ...
├── start-server.command   # Enhanced development server
├── stop-server.command    # Stop development servers
├── restart-server.command # Restart development server
├── build-and-test.command # Production build & test
└── SERVER-SCRIPTS-README.md # This file
```

## Next Steps
1. **Test all scripts** to ensure they work on your system
2. **Try different server modes** for various testing scenarios
3. **Use production build** to test PWA features
4. **Deploy your app** when ready using the build files

---

**Happy coding! 🧘‍♀️✨**
