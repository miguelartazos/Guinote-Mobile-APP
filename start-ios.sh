#!/bin/bash

echo "🚀 Starting Guiñote iOS Development Environment"
echo "============================================="

echo "🧹 Cleaning up existing processes..."
pkill -f "metro" || true
# Ensure both common Metro ports are freed
lsof -ti:8081 | xargs kill -9 || true
lsof -ti:8083 | xargs kill -9 || true

# Clear caches
echo "🗑️  Clearing caches..."
watchman watch-del-all 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true

# Start Metro in a new terminal
echo "📦 Starting Metro bundler in a new terminal on port 8083..."
osascript -e 'tell app "Terminal" to do script "cd /Users/maiky/Documents/guinote2 && npx react-native start --port 8083"'

# Wait for Metro to start
echo "⏳ Waiting for Metro to start (10 seconds)..."
sleep 10

# Check if Metro is running
if lsof -Pi :8083 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Metro bundler is running on port 8083"
else
    echo "❌ Metro bundler failed to start. Please check the other terminal window."
    exit 1
fi

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📱 Your local IP address is: $LOCAL_IP"
echo "   (Use this if testing on a physical device)"

# Open the app in simulator
echo "📲 Building and launching app in iOS simulator..."
npx react-native run-ios

echo ""
echo "✅ Done! The app should now be running."
echo "📝 Tips:"
echo "   - Keep the Metro terminal window open"
echo "   - Press Cmd+D in simulator to open Dev Menu"
echo "   - Press Cmd+R in simulator to reload"