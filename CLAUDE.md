# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Type-check + build to dist/
npm run preview   # Preview the production build
```

No test suite exists. Type-check with `npx tsc --noEmit`.

## Architecture

This is a single-page React app — a Wordle-style history quiz where players drag-sort 6 historical events chronologically.

**Entry point:** `src/main.tsx` → mounts `history_game.tsx` (the root `App` component).

**Data layer (`data/`):**
- `types.ts` defines the `HistoryEvent` and `Deck` TypeScript interfaces (the source of truth for types).
- Each deck is a plain JSON file (`argentina.json`, `mundo.json`, `filosofia.json`).
- `data/index.ts` imports the JSON files, casts them as `Deck`, and assembles the `DECKS` array — this is what the app imports.
- To add a new topic: create `data/<topic>.json` matching the `Deck` shape, then add it to `DECKS` in `data/index.ts`.

**Core types (`data/types.ts`):**
```ts
interface HistoryEvent { id: string; event: string; year: number; context: string; image?: string; }
interface Deck { id: string; name: string; emoji: string; events: HistoryEvent[]; puzzleSize?: number; }
```
`puzzleSize` (default 6) controls how many events are drawn per round.

**Puzzle selection (`src/storage.ts`):** `selectPuzzle` prioritizes least-seen events (weighted random), so players encounter all events over time. Stats are persisted to `localStorage` under key `historia-ar-stats`.

**Admin screen (`src/admin.tsx`):** In-browser deck editor reachable via the "⚙ Admin" button. The "Guardar en archivo" button POSTs generated TypeScript source to `/api/save-deck`, which is a Vite dev-server middleware in `vite.config.ts` that writes directly to `data/<deckId>.ts`. This write-back API only runs during `npm run dev`; it does not exist in the production build.

**Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`). Custom design tokens (colors like `ar-blue`, `bg-card`, `text-primary`, etc.) are defined in `src/index.css`.

**Touch drag-and-drop:** Implemented manually in `history_game.tsx` using `onTouchStart/Move/End` handlers that track positions against `.sort-card` element bounding rects. The hint feature pins the chronological middle card in place and locks it from dragging.

## Deployment Rules

- **Do not deploy automatically**: Do not run deployment commands (like Firebase Hosting deploy) on every change. Only deploy the application when explicitly requested or instructed by the user.
