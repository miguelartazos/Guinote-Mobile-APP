#!/bin/bash

echo "Setting up Convex for Guiñote..."

# Check if Convex CLI is installed
if ! command -v convex &> /dev/null; then
    echo "Installing Convex CLI..."
    npm install -g convex
fi

echo ""
echo "IMPORTANT: Follow these steps to complete Convex setup:"
echo ""
echo "1. Run: npx convex login"
echo "   - This will open your browser to authenticate"
echo ""
echo "2. Run: npx convex init"
echo "   - Select 'Create a new project'"
echo "   - Choose a project name (e.g., 'guinote-game')"
echo "   - Select your team"
echo ""
echo "3. Run: npx convex dev"
echo "   - This will deploy your functions and give you the CONVEX_URL"
echo ""
echo "4. Update your .env file:"
echo "   - Replace EXPO_PUBLIC_CONVEX_URL with the URL from step 3"
echo ""
echo "5. Configure Clerk webhook (optional but recommended):"
echo "   - Go to your Clerk dashboard"
echo "   - Add a webhook endpoint: <CONVEX_URL>/clerk"
echo "   - Select user.created and user.updated events"
echo ""
echo "6. Start your app:"
echo "   - npm start"
echo ""

# Make the script executable
chmod +x scripts/setup-convex.sh