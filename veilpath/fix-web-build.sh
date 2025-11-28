#!/bin/bash
# Fix the web build: ES modules + inject AAA styles

echo "Fixing index.html script tag for ES modules..."

# Fix script tag to use type="module"
sed -i 's/<script src="\/_expo\/static\/js\/web\/\(.*\)\.js" defer>/<script src="\/_expo\/static\/js\/web\/\1.js" type="module">/' dist/index.html

echo "✅ Fixed index.html"
grep "<script" dist/index.html

echo ""
echo "Injecting AAA web styles..."

# Inject CSS into head
sed -i 's|</head>|  <link rel="stylesheet" href="/web-styles.css">\n  </head>|' dist/index.html

# Copy CSS file to dist
if [ -f "src/web/web-styles.css" ]; then
  cp src/web/web-styles.css dist/web-styles.css
  echo "✅ Injected AAA web styles into build"
else
  echo "⚠️  Warning: web-styles.css not found, skipping"
fi
