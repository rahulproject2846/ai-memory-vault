# The Vault - AI Native External Memory

## Overview
The Vault is an external memory bridge designed for AI. It features a Midnight Mode UI, recursive folder parsing, and a secure API for AI agents to retrieve raw code.

## Tech Stack
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS (Midnight Mode)
- **Database:** MongoDB
- **Icons:** Lucide React
- **Syntax Highlighting:** React Syntax Highlighter (Prism)

## Features

### 1. The Visual Shell (UI)
- **Midnight Mode:** Pure black (#000) background.
- **File Tree:** Nested folder structure in a resizable sidebar.
- **Code Viewer:** Syntax highlighting for TypeScript, JSX, JSON, etc.
- **Session Info:** Displays the unique Session ID and Secret Key.

### 2. The Brain (Upload Engine)
- **Folder Upload:** Recursively parses folders.
- **Chunked Processing:** Handles large file counts efficiently.
- **Secure Storage:** Files are stored in MongoDB with a unique session ID.

### 3. The API (AI Bridge)
- **Endpoint:** `GET /api/vault/raw`
- **Authentication:** Requires `filePath`, `passphrase`, and `sessionId`.
- **Performance:** Returns raw text directly, optimized for AI consumption.

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database:**
   Ensure MongoDB is running locally on `mongodb://localhost:27017` or set `MONGODB_URI` in `.env.local`.

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Usage:**
   - Open `http://localhost:3000`.
   - A new session is created automatically.
   - Click "Upload Folder" to select a directory.
   - Files will be parsed and stored.
   - Use the displayed API URL to fetch code programmatically.
