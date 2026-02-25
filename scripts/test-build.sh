#!/bin/bash

echo "🧹 Cleaning dist..."
rm -rf dist

echo "🔨 Building extension..."
tsc -b && node scripts/build-ext.js

echo ""
echo "📋 Final check..."
echo "Files that should exist:"
test -f dist/manifest.json && echo "  ✅ manifest.json" || echo "  ❌ manifest.json"
test -f dist/viewer/index.html && echo "  ✅ viewer/index.html" || echo "  ❌ viewer/index.html"
test -f dist/viewer/init.js && echo "  ✅ viewer/init.js" || echo "  ❌ viewer/init.js"
test -f dist/options/options.html && echo "  ✅ options/options.html" || echo "  ❌ options/options.html"
test -d dist/icons && echo "  ✅ icons/" || echo "  ❌ icons/"

echo ""
echo "✨ Done!"
