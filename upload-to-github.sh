#!/bin/bash

echo "🚀 AI Outfit Picker - GitHub Upload Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ai-outfit-picker directory"
    exit 1
fi

echo "📁 Checking files..."
echo "✅ Frontend: $(ls -la frontend/src/ | wc -l) files"
echo "✅ Netlify Functions: $(ls -la netlify/functions/ | wc -l) files"
echo "✅ Config: $(ls -la *.toml *.json *.md 2>/dev/null | wc -l) files"
echo ""

echo "🔧 Git Status:"
git status
echo ""

echo "📤 Ready to upload to GitHub!"
echo ""
echo "To complete the upload:"
echo "1. Go to https://github.com/simplifaisoul/ai-outfit-picker"
echo "2. Click 'Add file' → 'Upload files'"
echo "3. Drag and drop all files from this directory"
echo "4. Or use GitHub Desktop/CLI to push this repository"
echo ""

echo "📋 Files to upload:"
echo "• frontend/ (entire folder)"
echo "• netlify/ (entire folder)"
echo "• package.json"
echo "• netlify.toml"
echo "• README.md"
echo "• .gitignore"
echo ""

echo "🎯 After uploading to GitHub:"
echo "1. Go to Netlify.com"
echo "2. Connect your GitHub repository"
echo "3. Deploy with auto-configured settings"
echo ""

echo "✨ Your AI Outfit Picker will be live! 🚀"