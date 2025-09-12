#!/bin/bash

# Script to remove sensitive data from git history
# WARNING: This will rewrite git history!

echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  Make sure you have a backup of your repository"
echo "⚠️  All collaborators will need to re-clone after this"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "📦 Creating backup branch..."
git branch backup-before-cleanup

echo "🔍 Removing .mcp.json from history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .mcp.json' \
  --prune-empty --tag-name-filter cat -- --all

echo "🧹 Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Done! Now you need to:"
echo "1. Force push to remote: git push --force --all"
echo "2. Force push tags: git push --force --tags"
echo "3. Have all collaborators re-clone the repository"
echo ""
echo "⚠️  The backup branch 'backup-before-cleanup' has been created"
echo "⚠️  Delete it after confirming everything works: git branch -D backup-before-cleanup"