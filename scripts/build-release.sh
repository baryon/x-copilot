#!/bin/bash
set -e

# Build Release Package for Chrome Extension
# This script builds the extension and creates a zip file ready for GitHub Release

echo "🔨 Building extension..."
pnpm run build

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
RELEASE_NAME="x-copilot-v${VERSION}"
RELEASE_DIR="releases"
ZIP_FILE="${RELEASE_DIR}/${RELEASE_NAME}.zip"

echo "📦 Creating release package: ${RELEASE_NAME}"

# Create releases directory if it doesn't exist
mkdir -p "${RELEASE_DIR}"

# Remove old zip if exists
rm -f "${ZIP_FILE}"

# Create zip file from dist directory
cd dist
zip -r "../${ZIP_FILE}" . -x "*.DS_Store" -x ".vite/*"
cd ..

echo "✅ Release package created: ${ZIP_FILE}"
echo ""
echo "📋 Next steps:"
echo "1. Test the extension by loading ${ZIP_FILE} in Chrome"
echo "2. Create a GitHub Release at: https://github.com/baryon/x-copilot/releases/new"
echo "3. Tag version: v${VERSION}"
echo "4. Upload ${ZIP_FILE} as a release asset"
echo "5. Write release notes describing changes"
