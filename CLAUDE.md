# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Type-check + build to dist/
npm run preview   # Preview the production build
```

No test suite exists. Type-check with `npx tsc --noEmit`.

## Wikipedia Utilities

### Image Finder and Fixer

A Node.js utility `scripts/find_wikipedia_images.js` is available to automatically scan decks, identify missing/broken images, query Spanish Wikipedia, and fetch high-quality 500px thumbnails.

```bash
# Dry run: preview proposed image updates for all decks
node scripts/find_wikipedia_images.js

# Fix: write verified Wikipedia image URLs to all deck files
node scripts/find_wikipedia_images.js --fix

# Target a specific deck (options: argentina, filosofia, mundo)
node scripts/find_wikipedia_images.js --deck argentina --fix

# Force checking all images, even existing valid URLs
node scripts/find_wikipedia_images.js --verify-all --fix
```

### Link Finder and Fixer

A Node.js utility `scripts/find_wikipedia_links.js` is available to automatically scan decks, search for matching Wikipedia articles, validate the URL resolution, and populate the `wikipediaUrl` field on each event.

```bash
# Dry run: preview proposed Wikipedia links for all decks
node scripts/find_wikipedia_links.js

# Fix: write verified Wikipedia links to all deck files
node scripts/find_wikipedia_links.js --fix

# Force checking/overwriting existing Wikipedia links
node scripts/find_wikipedia_links.js --force --fix
```

## Architecture

This is a single-page React app — a multi-mode history quiz. The flagship mode is Wordle-style: drag-sort historical events into chronological order.

**Entry point:** `src/main.tsx` → mounts `history_game.tsx` (the root `App` component, which is a screen router). `main.tsx` also unlocks audio on the first `pointerdown`.

**Data layer (`data/`):**

- `types.ts` defines the `HistoryEvent` and `Deck` interfaces (the source of truth for types).
- Each deck is a plain JSON file (`argentina.json`, `mundo.json`, `filosofia.json`).
- `data/index.ts` imports the JSON files, casts them as `Deck`, and assembles the `DECKS` array — this is what the app imports.
- To add a new topic: create `data/<topic>.json` matching the `Deck` shape, then add it to `DECKS` in `data/index.ts`.

**Core types (`data/types.ts`):**

```ts
interface HistoryEvent {
  event: string; // name; also used as the unique key (in stats, React keys)
  year: number; // negative = BCE
  context: string;
  month?: number;
  day?: number;
  image?: string;
  wikipediaUrl?: string;
  people?: string[]; // figures involved — drives "¿Quién estuvo ahí?"
  ideas?: string[]; // "Name: definition" strings — drives "¿Quién lo pensó?"
}
interface Deck {
  id: string;
  name: string;
  emoji: string;
  events: HistoryEvent[];
  puzzleSize?: number;
}
```

`puzzleSize` (default 6) controls how many events are drawn per round. Note there is **no `id` field** on `HistoryEvent` — `event` is the identity, so deck names must be unique (the admin validates this). `data/types.ts` also declares `Character`/`BiographyDeck` for a WIP biographies feature not yet wired into the UI.

**Game modes** (each selected from the per-deck mode-select screen in `history_game.tsx`):

- **Ordenar eventos** (`src/components/sort_game.tsx`) — the core drag-sort game. Round state is a `useReducer`; `selectPuzzle` picks the events; FLIP animation + a shared drag hook handle reordering; 5 attempts; hint pins the chronological middle card; emoji-grid share.
- **Daily** (`src/daily.ts` + `DailyResultScreen`) — Wordle-style date-seeded puzzle, the same for everyone, played through a parameterized `SortGame` (`daily` prop). Separate per-deck streak in `localStorage` key `historia-ar-daily`.
- **Endless** (`src/endless_game.tsx` + `src/components/endless/*`) — place events into a growing timeline; 3 lives; best score in `localStorage` key `endless-best-score`.
- **Year Guesser** (`src/year_guessr.tsx`) — slider to guess each event's year.
- **Context Detective** (`src/context_detective.tsx`) — read a description, pick the matching event.
- **¿Quién estuvo ahí? / ¿Quién lo pensó?** (`src/who_was_there.tsx`) — match figures/ideas to events; mode switches on `deck.id === "filosofia"` (`ideas` vs `people` fields).

`src/components/WikipediaSheet.tsx` is the slide-in article panel used across modes; it caches only successful fetches and shows a retry on error.

**Shared helpers:**

- `src/utils.ts` — canonical `shuffle` (Fisher–Yates), `onImgError`/`PLACEHOLDER`, `formatYear`, `extractWikiTitle`. Don't reimplement these.
- `src/constants.ts` — `MAX_ATTEMPTS`.
- `src/hooks/use_touch_drag.ts` — shared drag state machine (mouse + touch) consumed by the sort and endless games; geometry stays game-specific via a `resolveTarget` callback.
- `src/sounds.ts` — Web Audio synthesized effects + `navigator.vibrate` haptics, one mute toggle persisted to `historia-sound-muted` (`MuteButton` in game headers).

**Puzzle selection (`src/storage.ts`):** `selectPuzzle` prioritizes least-seen events (weighted random) with year-gap balancing, so players encounter all events over time. Free-play stats are persisted to `localStorage` under key `historia-ar-stats`. `src/daily.ts` reuses the same candidate-window logic deterministically (date-seeded, no per-player weighting).

**Admin screen (`src/admin.tsx`):** In-browser deck editor reachable via the "⚙ Admin" button. The "Guardar en archivo" button POSTs deck JSON to `/api/save-deck`, a Vite dev-server middleware in `vite.config.ts` that writes `data/<deckId>.json`. Both the client (`validateDeck`) and the middleware reject empty/duplicate/invalid events before writing. This write-back API only runs during `npm run dev`; it does not exist in the production build.

**Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`). Design tokens (colors like `ar-blue`, `bg-card`, `text-primary`; the `text-2xs` size; `.btn-*` button classes; global focus ring) live in `src/index.css`. The UI is dark-mode-only by design. Responsive: the sort board switches to a vertical list below the `sm` (640px) breakpoint, kept in sync with the `useIsVertical` hook in `sort_game.tsx`.

**Touch drag-and-drop:** Implemented in `src/hooks/use_touch_drag.ts` (used by `sort_game.tsx` and `endless_game.tsx`) via `onTouchStart/Move/End` handlers that track positions against element bounding rects; draggable sort cards carry `touch-none` to suppress page scroll while dragging. The hint feature pins the chronological middle card in place and locks it from dragging.

## Deployment Rules

- **Do not deploy automatically**: Do not run deployment commands (like Firebase Hosting deploy) on every change. Only deploy the application when explicitly requested or instructed by the user.
