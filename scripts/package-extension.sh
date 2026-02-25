#!/bin/bash

# Package JSON Spark extension for Chrome Web Store

set -e

echo "🔨 Building extension..."
npm run build:ext

echo ""
echo "📦 Packaging extension..."
cd dist
zip -r ../json-spark-extension.zip . -x "*.DS_Store" -x "*.svg"

cd ..
echo ""
echo "✅ Package created: json-spark-extension.zip"
echo ""
echo "📊 Package contents:"
unzip -l json-spark-extension.zip | head -20
echo ""
echo "📦 Package size:"
ls -lh json-spark-extension.zip | awk '{print $5}'
echo ""
echo "🚀 Ready to upload to Chrome Web Store!"
