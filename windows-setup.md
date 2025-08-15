# Windows Server Setup Guide

## Why Windows Might Be Better for WebGL

Windows desktops often have:
- **Better GPU drivers** for WebGL
- **More powerful graphics cards** (dedicated GPUs)
- **Better WebGL support** in browsers
- **Hardware acceleration** enabled by default

## Setup Instructions

### 1. Prerequisites
- **Node.js 18+** installed on Windows
- **Git** for cloning the repository
- **Chrome/Edge** browser (better WebGL support than Safari)

### 2. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd hackathon

# Install dependencies
cd app
npm install
```

### 3. Windows-Specific Optimizations

#### Enable Hardware Acceleration
1. Open Chrome/Edge
2. Go to `chrome://settings/`
3. Search for "hardware acceleration"
4. Enable "Use hardware acceleration when available"
5. Restart browser

#### Check WebGL Support
1. Go to `chrome://gpu/`
2. Look for "WebGL" - should show "Hardware accelerated"
3. If not, update your graphics drivers

### 4. Run the Server
```bash
# Start the optimized server
npm run dev:fast

# Or for network access (if connecting from Mac)
npm run dev:host
```

### 5. Performance Monitoring
The app now includes:
- **WebGL diagnostics** in browser console
- **FPS monitoring** with warnings
- **Performance logging**

### 6. Troubleshooting

#### If WebGL Still Doesn't Work:
1. **Update Graphics Drivers**
   - NVIDIA: Download from nvidia.com
   - AMD: Download from amd.com
   - Intel: Download from intel.com

2. **Enable WebGL in Browser**
   - Chrome: `chrome://flags/#enable-webgl`
   - Edge: `edge://flags/#enable-webgl`

3. **Check Browser Console**
   - Look for WebGL diagnostic messages
   - Check for shader compilation errors

#### If Animation Still Not Moving:
1. **Check Console Logs**
   - Look for "WaveScene update" messages
   - Check for uniform values being passed

2. **Test Different Scenes**
   - Try "Fireworks" scene first
   - Then try "Particles" scene
   - Finally try "Ocean Waves"

### 7. Network Access (Mac to Windows)

If running on Windows but accessing from Mac:

1. **On Windows:**
   ```bash
   npm run dev:host
   ```

2. **Find Windows IP:**
   ```bash
   ipconfig
   # Look for IPv4 Address (usually 192.168.x.x)
   ```

3. **On Mac:**
   - Open browser
   - Go to `http://[WINDOWS-IP]:5173`
   - Example: `http://192.168.1.100:5173`

### 8. Performance Comparison

**Mac (Current Issues):**
- Safari WebGL limitations
- Integrated graphics
- Possible driver issues

**Windows (Expected Benefits):**
- Better WebGL support
- Dedicated GPU access
- Hardware acceleration
- More consistent performance

## Quick Test Commands

```bash
# Test WebGL support
node -e "console.log('Node.js version:', process.version)"

# Check if port is available
netstat -an | findstr :5173

# Kill any existing processes
taskkill /f /im node.exe
```

## Expected Results

After Windows setup, you should see:
- ✅ WebGL diagnostics showing "WebGL2" or "WebGL1"
- ✅ No shader compilation errors
- ✅ Smooth 60fps animation
- ✅ Ocean waves moving properly
- ✅ Console logs showing "WaveScene update" with time values

## Fallback Options

If Windows doesn't work either:
1. **Try different browsers** (Chrome, Firefox, Edge)
2. **Use simpler animations** (particles instead of waves)
3. **Disable visual effects** and focus on audio
4. **Use a different device** (Android tablet, etc.)
