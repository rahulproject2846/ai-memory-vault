@echo off
REM Git Helper Script - Short Commands for Project Management (Windows)
REM Usage: git-helper.bat "commit message"

if "%~1"=="" (
    echo ❌ Please provide a commit message
    echo Usage: git-helper.bat "your commit message"
    exit /b 1
)

echo 🔄 Adding all files...
git add .

echo 📝 Committing with message: %~1
git commit -m "%~1"

echo 🚀 Pushing to main branch...
git push origin main

echo ✅ Done! Your project is uploaded to GitHub
