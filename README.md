# ClipSuit

ClipSuit is a Chrome extension for capturing, storing, and quickly reusing code snippets directly from the browser. It supports automatic snippet capture on copy events and manual saving through a context menu, with a lightweight React popup for search and snippet management.

## Core Features

- Automatic snippet capture on browser copy events.
- Manual snippet save from page context menu (`Save to ClipSuit`).
- Local-first storage using IndexedDB (via Dexie) with no backend dependency.
- Search snippets by content in real time.
- One-click snippet copy from the extension popup.
- Snippet deletion with a 5-second undo window.
- Storage cap management with clear limit warnings (20 snippets max).

## Tech Stack

### Application

- React 19
- TypeScript 5
- Chrome Extension Manifest V3
- IndexedDB with Dexie

### Build and Tooling

- Vite 7
- `@crxjs/vite-plugin` for Chrome extension bundling
- Tailwind CSS 3 + PostCSS + Autoprefixer
- ESLint 9 with TypeScript and React Hooks rules

## Project Structure

- `src/App.tsx`: Popup UI for viewing, searching, copying, deleting, and undoing snippet deletion.
- `src/background.ts`: Service worker for context menu setup and snippet persistence.
- `src/content.ts`: Content script that listens to copy events and sends save messages.
- `src/db.ts`: Dexie database schema and snippet model.
- `manifest.json`: Extension permissions, popup entry, service worker, and content script registration.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Google Chrome (or Chromium-based browser supporting Manifest V3)

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

The production output is generated in the `dist` directory.

## Load the Extension in Chrome

1. Build the project with `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `dist` folder from this project.

## Available Scripts

- `npm run dev`: Start Vite development workflow.
- `npm run build`: Type-check and build extension assets.
- `npm run lint`: Run ESLint checks.
- `npm run preview`: Preview the built popup app.

## Notes

- Snippets are stored locally in IndexedDB (`ClipSuitDB`) on the user’s machine.
- The current storage limit is defined in `src/db.ts` (`MAX_SNIPPETS = 20`).
