#!/bin/bash

echo "🌊 Preparing Sarcastic Serenity for deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the app directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Create deployment directory
echo "📁 Preparing deployment files..."
mkdir -p deploy
cp -r .svelte-kit/output/client/* deploy/

# Create a simple index.html redirect for SPA
cat > deploy/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sarcastic Serenity</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        // Redirect to the main app
        window.location.href = '/session';
    </script>
</head>
<body>
    <p>Redirecting to Sarcastic Serenity...</p>
</body>
</html>
EOF

echo "✅ Deployment files ready in 'deploy' folder!"
echo ""
echo "🚀 Deployment Options:"
echo ""
echo "1. Netlify Drop (Easiest):"
echo "   - Go to https://netlify.com/drop"
echo "   - Drag and drop the 'deploy' folder"
echo "   - Get instant URL!"
echo ""
echo "2. GitHub Pages:"
echo "   - Copy 'deploy' folder contents to your repo"
echo "   - Enable GitHub Pages in settings"
echo ""
echo "3. Any Static Hosting:"
echo "   - Upload 'deploy' folder contents"
echo ""
echo "📊 Test URLs after deployment:"
echo "   - Main App: https://your-domain.com/session"
echo "   - WebGL Test: https://your-domain.com/webgl-test"
echo ""
echo "🎯 Expected Results:"
echo "   ✅ Better WebGL performance (server GPUs)"
echo "   ✅ Faster loading (CDN)"
echo "   ✅ Consistent experience across devices"
echo "   ✅ Ocean waves moving smoothly"
