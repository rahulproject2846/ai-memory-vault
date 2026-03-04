# Git Helper - Short Commands for Project Management

## Quick Usage (Windows)
```bash
git-helper.bat "your commit message"
```

## Quick Usage (Linux/Mac)
```bash
./git-helper.sh "your commit message"
```

## What it does:
1. `git add .` - Adds all files
2. `git commit -m "your message"` - Commits with your message  
3. `git push origin main` - Pushes to GitHub

## Examples:
```bash
git-helper.bat "Add multi-project support"
git-helper.bat "Fix UI bugs"
git-helper.bat "Update database schema"
```

## One-liner alternative:
```bash
git add . && git commit -m "your message" && git push origin main
```
