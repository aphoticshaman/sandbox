#!/bin/bash
echo "=== Testing Vercel Build Locally ==="
echo ""
echo "1. Installing dependencies..."
npm install --quiet

echo ""
echo "2. Running Expo build..."
npx expo export --platform web --clear

echo ""
echo "3. Checking output..."
if [ -d "dist" ]; then
  echo "✅ dist/ directory exists"
  ls -lh dist/
  echo ""
  echo "Files in dist:"
  find dist -type f | head -10
else
  echo "❌ dist/ directory NOT created!"
fi
