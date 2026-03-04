#!/bin/bash

# Git Helper Script - Short Commands for Project Management
# Usage: ./git-helper.sh "commit message"

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Please provide a commit message"
    echo "Usage: ./git-helper.sh \"your commit message\""
    exit 1
fi

echo "🔄 Adding all files..."
git add .

echo "📝 Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo "🚀 Pushing to main branch..."
git push origin main

echo "✅ Done! Your project is uploaded to GitHub"
