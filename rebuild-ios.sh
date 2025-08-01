#!/bin/bash

echo "🔧 Rebuilding iOS app with orientation support..."

# Stop any running Metro bundler
echo "Stopping Metro bundler..."
pkill -f "react-native.*metro" || true

# Clean build artifacts
echo "Cleaning build artifacts..."
cd ios
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall pods
echo "Reinstalling CocoaPods..."
pod deintegrate
pod install --repo-update

# Return to project root
cd ..

echo "✅ iOS rebuild complete!"
echo ""
echo "To run the app, use: npx react-native run-ios"
echo ""
echo "Note: The app will now lock to landscape mode when entering the game screen."