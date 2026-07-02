# History Game

A history quiz game in Spanish, live at <https://history-game-7a8e2.web.app>.

The flagship mode is Wordle-style: drag historical events into chronological
order in at most 5 attempts, with a deterministic **daily puzzle** per deck
(same puzzle for everyone, streaks, emoji-grid sharing). Around it there are
three more modes — Endless timeline placement, ¿Quién estuvo ahí? / ¿Quién lo pensó? — plus **Biografías**: per-character
timelines (San Martín, Alberdi, Sarmiento) played through the sort game.

Decks: Historia Argentina, Historia Mundial, Filosofía. Built with React 19,
TypeScript and Tailwind CSS v4 on Vite. Dark mode only, mobile-first
(touch drag, native share sheet), keyboard accessible.

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest unit tests
npm run lint       # ESLint
npx tsc --noEmit   # type-check
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

## Content

Decks are plain JSON files in `data/` (`argentina.json`, `mundo.json`,
`filosofia.json`, `biografias.json`); `data/index.ts` assembles them. To add a
topic, create `data/<topic>.json` matching the `Deck` shape in `data/types.ts`
and register it in `DECKS`.

During `npm run dev` an in-browser deck editor is available via the
"⚙ Admin" button on the home screen; it saves back to `data/*.json` through a
dev-server middleware. The admin is excluded from production builds.

`scripts/find_wikipedia_images.js` and `scripts/find_wikipedia_links.js` fill
in event images and article links from Spanish Wikipedia (see `CLAUDE.md` for
usage).

## Deploy

Deployment is manual and owner-triggered only:

```bash
npm run build && npx firebase deploy --only hosting
```
