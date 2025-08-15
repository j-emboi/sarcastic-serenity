# Online Server Deployment Guide

## Why Online Servers Are Better for WebGL

Online servers often provide:
- **Better GPU drivers** and hardware acceleration
- **Consistent performance** across devices
- **No local hardware limitations**
- **Better browser compatibility**
- **CDN optimization** for faster loading

## Quick Deploy Options

### 1. Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd app
vercel --prod
```

**Benefits:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Free tier available
- ✅ Automatic deployments

### 2. Netlify

```bash
# Build the project
cd app
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=build
```

**Benefits:**
- ✅ Great for static sites
- ✅ Form handling
- ✅ Free tier
- ✅ Easy custom domains

### 3. Render

1. **Connect your GitHub repository** at [render.com](https://render.com)
2. **Create a new Static Site**
3. **Build Command:** `cd app && npm install && npm run build`
4. **Publish Directory:** `app/build`

**Benefits:**
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ Good WebGL support

### 4. GitHub Pages

```bash
# Add to package.json scripts
"deploy": "cd app && npm run build && gh-pages -d build"

# Deploy
npm run deploy
```

**Benefits:**
- ✅ Free hosting
- ✅ Direct from GitHub
- ✅ Custom domains
- ✅ Version control integration

## Advanced Deployment Options

### 5. Railway

1. **Connect GitHub** at [railway.app](https://railway.app)
2. **Select repository**
3. **Auto-deploy** on push

### 6. Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### 7. DigitalOcean App Platform

1. **Connect repository** at DigitalOcean
2. **Select Node.js** environment
3. **Build command:** `cd app && npm install && npm run build`
4. **Output directory:** `app/build`

## Performance Optimizations for WebGL

### 1. Build Optimizations

```javascript
// vite.config.ts optimizations
export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          ogl: ['ogl'],
          vendor: ['svelte']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false // Keep console logs for debugging
      }
    }
  }
});
```

### 2. CDN Configuration

```javascript
// Add to app.html
<script>
  // Preload critical resources
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = '/src/lib/visuals/engine.ts';
  link.as = 'script';
  document.head.appendChild(link);
</script>
```

### 3. Service Worker for Caching

```javascript
// public/sw.js
const CACHE_NAME = 'serenity-v1';
const urlsToCache = [
  '/',
  '/session',
  '/webgl-test'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

## Testing Your Deployment

### 1. WebGL Test Page
Visit: `https://your-domain.com/webgl-test`

**Expected Results:**
- ✅ Animated rainbow pattern
- ✅ WebGL diagnostics showing "WebGL2" or "WebGL1"
- ✅ No shader compilation errors
- ✅ Smooth 60fps animation

### 2. Main App Test
Visit: `https://your-domain.com/session`

**Expected Results:**
- ✅ Ocean waves moving smoothly
- ✅ All visual scenes working
- ✅ Audio functionality intact
- ✅ Console logs showing performance

## Troubleshooting

### If WebGL Still Doesn't Work Online:

1. **Check Browser Console**
   - Look for WebGL diagnostic messages
   - Check for CORS errors
   - Verify shader compilation

2. **Test Different Browsers**
   - Chrome (best WebGL support)
   - Firefox (good WebGL support)
   - Edge (good WebGL support)
   - Safari (limited WebGL support)

3. **Check Server Logs**
   - Look for build errors
   - Check for missing files
   - Verify static file serving

### Common Issues:

1. **CORS Errors**
   ```javascript
   // Add to vite.config.ts
   server: {
     headers: {
       'Cross-Origin-Embedder-Policy': 'require-corp',
       'Cross-Origin-Opener-Policy': 'same-origin'
     }
   }
   ```

2. **Missing Dependencies**
   ```bash
   # Ensure all dependencies are installed
   npm install
   npm run build
   ```

3. **Build Failures**
   ```bash
   # Clean and rebuild
   rm -rf node_modules
   npm install
   npm run build
   ```

## Recommended Deployment Flow

1. **Start with Vercel** (easiest)
2. **Test WebGL functionality**
3. **If issues persist, try Netlify**
4. **For production, consider Render or DigitalOcean**

## Expected Performance Improvements

After online deployment, you should see:
- 🚀 **Faster loading** (CDN)
- 🎮 **Better WebGL performance** (server GPUs)
- 📱 **Consistent experience** across devices
- 🔧 **Easier debugging** (no local hardware issues)
- 🌐 **Global accessibility**

## Quick Deploy Commands

```bash
# Vercel (fastest)
npm install -g vercel && cd app && vercel --prod

# Netlify
cd app && npm run build && npx netlify-cli deploy --prod --dir=build

# GitHub Pages
npm install -g gh-pages && npm run deploy
```

Choose the option that works best for you, Icarus! Online deployment should give you much better WebGL performance than local development. 🌊✨
