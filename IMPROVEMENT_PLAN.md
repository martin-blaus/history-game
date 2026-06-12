# Improvement Plan — History Game

Execution plan derived from the 2026-06-11 repository audit. Tasks are ordered by milestone;
within a milestone, follow the listed order unless a dependency says otherwise. Each task has
acceptance criteria — do not mark a task done until they pass.

## Ground rules for the executor

- Work on a branch per milestone (`m0-safety-net`, `m1-correctness`, …); commit per task with a descriptive message.
- **Never deploy.** Deployment is manual and owner-triggered only (see CLAUDE.md).
- After every task run: `npx tsc --noEmit && npm run build`. After M0.3 exists, also `npm test`.
- Don't reimplement helpers that exist in `src/utils.ts` (`shuffle`, `formatYear`, `onImgError`, `extractWikiTitle`).
- `HistoryEvent.event` (the name string) is the identity key everywhere — never introduce an `id` field on events.

## Decisions already made by the owner (do not relitigate)

1. **`headroom-ai` stays** in `package.json` — it is intentional tooling (token saving). Do NOT remove it. It is not imported by app code; moving it to `devDependencies` is allowed, removing it is not.
2. **Daily replay-after-early-exit is accepted.** Do NOT refactor when stats/daily results are recorded (they record at reveal-end; leaving mid-reveal loses the result — that's fine).
3. **Keyboard accessibility for the sort game: yes**, build it (task M2.5).
4. **Year Guesser scoring must be redesigned** — current flat 2 pts/year is bad UX on wide-span decks (task M2.6).
5. **Biografías is a launched feature**, not WIP. Bring it to production quality and fix the docs that call it WIP (task M3.5).

---

## M0 — Safety net (do first)

### M0.1 — Untrack build artifacts, write a real `.gitignore`
`node_modules/` (2,650 files), `dist/`, and `.DS_Store` are tracked in git. `.gitignore` currently contains only `.firebase/`.

**Steps**
1. Replace `.gitignore` with: `node_modules/`, `dist/`, `.DS_Store`, `.firebase/`, `*.log`.
2. `git rm -r --cached node_modules dist .DS_Store` (cached only — files stay on disk). Commit.
3. Do NOT rewrite git history (`filter-repo` etc.) — out of scope.

**Accept:** `git ls-files | grep -cE '^(node_modules|dist)/'` → 0; `npm run build` still works; `git status` clean after a build.
**Effort:** S. **Risk:** Low.

### M0.2 — Fix platform-locked dependencies
`lightningcss` and `lightningcss-darwin-arm64` are direct `dependencies` (`package.json:14-15`). The darwin-arm64 binary makes `npm install` fail with `EBADPLATFORM` on any other platform, blocking CI. lightningcss is already a transitive dep of Tailwind v4.

**Steps**
1. Remove both `lightningcss` entries from `dependencies`. Leave `headroom-ai` alone (decision #1); optionally move it to `devDependencies`.
2. `rm -rf node_modules package-lock.json && npm install && npm run build`. If the build fails on a lightningcss native-binding error, re-add **only** `lightningcss` (not the platform package) as a devDependency and document why in package.json via a `//` comment key or in README.

**Accept:** `npm run build` succeeds locally; `package.json` has no platform-specific package as a direct dependency; CI (M0.4) installs successfully on `ubuntu-latest`.
**Effort:** S. **Risk:** Medium (build tooling) — the build command is the verification.

### M0.3 — Add Vitest + tests for the pure core logic
Zero tests exist. The most valuable and cheapest targets are pure functions.

**Steps**
1. `npm i -D vitest`; add `"test": "vitest run"` script. No jsdom needed — test pure functions only; for the few functions touching `localStorage`, test around them or stub `globalThis.localStorage`.
2. Write tests (colocated `src/*.test.ts` or `src/__tests__/`):
   - `src/daily.ts`:
     - **Golden determinism test:** for a fixed `(dateStr, deck)` (use the real argentina deck import), assert the exact ordered event names returned by `selectDailyPuzzle`. This is the regression tripwire for M2.1 — write it first.
     - `dailyRng` returns identical sequences for identical seeds, different for different dates/decks.
     - `dayNumber`/`shiftDay` across a DST boundary and across month/year edges.
     - `recordDailyResult` idempotency: recording the same date twice does not change streak; win after consecutive-day win increments streak; loss resets it. (Stub `localStorage`.)
     - `selectDailyPuzzle` result has unique years and length `puzzleSize`; the `shuffled` board is never already in ascending order.
   - `src/storage.ts` — `selectPuzzle`: unique years in result, `maxGap ≤ 50` when such a window exists, least-seen events preferred (construct a stats object where one window is clearly less seen). `recordDeckResult`: streak/maxStreak/attemptsDistribution math.
   - `src/components/sort_game.tsx` — export `gradeCards` if needed; test grading + `roundReducer` (`move_card` semantics incl. the `src+1 === dst` no-op, `use_hint` pins the chronological middle, `submit` history append).
   - `src/who_was_there.tsx` — `buildRounds`: returns `[]` for an unlabeled deck; Type A rounds have 6 choices / 3 correct; Type B has 4 choices incl. exactly one correct. Add a test capturing the perfect-game scoring expectation (it should FAIL until M1.1 fixes the bug — write it, mark `.todo`/`.fails` style, flip it in M1.1).

**Accept:** `npm test` passes (except the deliberately-failing M1.1 marker); golden daily test exists; tests assert behavior (values), not just "doesn't throw".
**Effort:** M. **Risk:** Low. **Depends:** M0.2.

### M0.4 — CI on GitHub Actions
**Steps:** `.github/workflows/ci.yml` on push + PR: checkout, setup-node 20 with npm cache, `npm ci`, `npx tsc --noEmit`, `npm test`, `npm run build`.
**Accept:** workflow file exists and is green on `ubuntu-latest` (proves M0.2 worked).
**Effort:** S. **Risk:** Low. **Depends:** M0.2, M0.3.

---

## M1 — Correctness fixes (player-visible bugs)

### M1.1 — Fix perfect-game confetti double-count in ¿Quién estuvo ahí?
`src/who_was_there.tsx:171-186`: `handleNext` computes `finalScore = score + (last round correct ? 1 : 0)`, but `score` was already incremented for that round in `verifyA` (line ~159) / `handleSelectPerson` (line ~167) on the previous click. A 6/6 game computes 7 ≠ 6 → confetti **never** fires on perfect games; a 5/6 game with a correct last round fires it wrongly.

**Steps:** Track per-round results explicitly: `const [results, setResults] = useState<boolean[]>([])`, append in `verifyA`/`handleSelectPerson`; derive `score = results.filter(Boolean).length`; confetti condition becomes `results.length === ROUNDS && results.every(Boolean)` checked in `handleNext` (state is committed by then). Remove the recomputation. Reset `results` in `restart`.
**Accept:** the M0.3 failing test now passes: perfect game fires confetti; 5/6-with-correct-last does not. Manual play-through confirms score display unchanged.
**Effort:** S. **Risk:** Low. **Depends:** M0.3.

### M1.2 — Context Detective: real restart + per-round results
`src/context_detective.tsx:29` — `const [rounds] = useState(...)` has no setter; the restart button (lines ~99-104) resets indices only, so "Jugar de nuevo" replays identical questions. Line ~89 has a placeholder for per-round ✓/✗ that was never implemented.

**Steps:** Add the setter, rebuild via `buildRounds(deck)` on restart (mirror `who_was_there.tsx` `restart`). Track `results: boolean[]` per round (set in `pick`) and render ✓/✗ in the game-over list where the placeholder span sits.
**Accept:** restart produces a different question set (with high probability — verify manually twice); game-over list shows per-round correct/incorrect.
**Effort:** S. **Risk:** Low.

### M1.3 — Clipboard error handling + best-score NaN guard
- `src/components/sort_game.tsx:323` and `src/components/daily_result.tsx:50`: `navigator.clipboard.writeText(...).then(...)` with no `.catch` — on denied permission/insecure context the button silently no-ops with an unhandled rejection. Add `.catch`: show a brief "No se pudo copiar" state on the button (reuse the `copied` state pattern with a third value, e.g. `"idle" | "copied" | "failed"`).
- `src/endless_game.tsx:54-56`: `parseInt(localStorage.getItem(BEST_KEY) ?? "0")` → guard with `Number.isFinite(n) ? n : 0`.

**Accept:** simulate clipboard failure (override `navigator.clipboard.writeText` to reject in devtools) → button shows failure text, no console unhandled rejection. Corrupt `endless-best-score` to `"abc"` → game treats best as 0 and can set a new record.
**Effort:** S. **Risk:** Low.

### M1.4 — Hide Admin in production builds
`src/history_game.tsx:360-365`: the "⚙ Admin" button ships to production where `/api/save-deck` doesn't exist (dev-server middleware only), so the editor renders but saving always fails.

**Steps:** Wrap the button (and the `screen === "admin"` branch) in `import.meta.env.DEV`.
**Accept:** `npm run build && npm run preview` → no Admin button; `npm run dev` → Admin works as before.
**Effort:** S. **Risk:** Low.

---

## M2 — High-leverage improvements

### M2.1 — Deduplicate puzzle-selection logic (daily must not drift from free-play)
`src/storage.ts:45-121` (`selectPuzzle`) and `src/daily.ts:104-153` (`selectDailyPuzzle`) duplicate the same ~50-line candidate-window scan (unique years, `MAX_YEAR_GAP` filtering). Drift between them would desynchronize free-play and daily semantics.

**Steps**
1. Create `src/puzzle_windows.ts` exporting `buildCandidateWindows(events, n): { events: HistoryEvent[]; maxGap: number }[]` plus the valid/min-gap pool filtering, parameterized so both callers keep their exact current semantics (free-play adds seen-count weighting + `Math.random` tiebreaks; daily uses the seeded RNG and the deterministic sort with code-unit tiebreak — the *sorting of input events stays in each caller*).
2. Refactor both callers. Move the shared `MAX_YEAR_GAP = 50` constant into the new module (it's currently defined in both files).
3. **Critical:** the golden daily test from M0.3 must pass unchanged — the daily sequence for a given date must be byte-identical before/after. If it changes, the refactor is wrong; fix the refactor, never the golden test.

**Accept:** golden test unchanged and green; `selectPuzzle` tests green; no duplicated window-scan code remains.
**Effort:** M. **Risk:** Medium (determinism). **Depends:** M0.3.

### M2.2 — Centralize shared constants
`https://history-game-7a8e2.web.app` is hardcoded at `src/components/sort_game.tsx:23` and `src/daily.ts:247`. Add `SHARE_URL` to `src/constants.ts` and use it in both. (`MAX_YEAR_GAP` is handled in M2.1.)
**Accept:** `grep -rn "history-game-7a8e2" src/` → exactly one hit, in `constants.ts`.
**Effort:** S. **Risk:** Low.

### M2.3 — Browser back button / screen history
All navigation is `useState` in `src/history_game.tsx:27-39`; the hardware/browser back button exits the app — the worst UX offender on mobile.

**Steps:** Minimal hash-based integration, no router library. On screen change, `history.pushState` (or set `location.hash`) with the screen name + deck id; listen for `popstate` and map back to `setScreen`/`setSelectedDeck`. Screens: `home`, `mode_select/<deckId>`, `game/<deckId>`, `daily/<deckId>`, `endless/<deckId>`, `year_guessr/<deckId>`, `context_detective/<deckId>`, `who_was_there/<deckId>`, `biografias_select`, `stats`, `admin`. Bio decks (`bio-<id>`) must resolve via `characterToDeck` on deep-link. Unknown/invalid hash → home.
**Accept:** back from a game → mode select → home → (exits app); refresh on `#/mode_select/argentina` lands on that deck's mode select; deep link to a bio game works; daily completion still swaps to the result screen correctly.
**Effort:** M. **Risk:** Medium (state/URL sync edge cases — test daily flow and bio flow manually).

### M2.4 — Native share on mobile
**Steps:** In the two share handlers (`sort_game.tsx` `share()`, `daily_result.tsx` `share()`), use `navigator.share({ text })` when available, falling back to the existing clipboard path (with M1.3's error handling). Extract a tiny `shareText(text): Promise<"shared"|"copied"|"failed">` helper in `src/utils.ts`.
**Accept:** on a phone (or devtools emulation with `navigator.share` present) the OS share sheet opens; on desktop the copy behavior is unchanged. `AbortError` from the user canceling the sheet is NOT treated as failure.
**Effort:** S. **Risk:** Low. **Depends:** M1.3.

### M2.5 — Keyboard accessibility for the sort game (owner-approved)
Ordering is drag-only (`src/components/sort_card.tsx:60-71`); keyboard users cannot play the flagship mode.

**Steps**
1. Make each card focusable: `tabIndex={0}`, `role="listitem"` inside a `role="list"` container, `aria-label` = event name + position.
2. Interaction model: focus a card → Arrow keys move it one position (Left/Right in row layout, Up/Down in vertical layout — reuse `useIsVertical`); the move dispatches the existing `move_card` action so FLIP animation and sounds work unchanged. Keep focus on the moved card after re-render (track by event name, refocus in an effect).
3. Hinted (pinned) card: not movable (same rule as drag), and arrow moves of other cards must respect `canTarget` semantics — simplest is to skip over the pinned index.
4. Enter on the focused board or a visible keyboard hint is NOT needed — Verificar is already a button.
5. Add a one-line visually-hidden instructions element (`aria-describedby`).

**Accept:** with keyboard only: Tab reaches cards, arrows reorder them (animation plays), pinned card never moves, submit works, full round playable. No regression to mouse/touch drag.
**Effort:** M. **Risk:** Medium (focus management across FLIP re-renders).

### M2.6 — Year Guesser scoring scaled to deck span (owner: "very bad UX")
`src/year_guessr.tsx:7-9`: flat `100 - diff*2` means decks spanning centuries (filosofía: ~2,500 years) give 0 points for any guess off by ≥50 years.

**Steps**
1. Replace with span-relative scoring: `calcScore(guess, actual, span)` where `tolerance = max(25, span * 0.10)` (full-credit-to-zero ramp), `score = round(100 * max(0, 1 - |guess-actual| / tolerance))`. Exact year stays 100; an error of 10% of the deck's span scores 0. Compute `span = maxYear - minYear` once (already available at `year_guessr.tsx:22-27`).
2. Keep the feedback thresholds ("¡Excelente!", "Cerca…", lines ~217-225) but base them on score, not raw years, so they stay meaningful per deck.
3. Unit-test `calcScore` (narrow deck ≈ old behavior; filosofía: 100-years-off on a 2,500-year span ≈ 60 pts).

**Accept:** tests pass; manual play on filosofía yields non-zero scores for reasonable guesses; argentina (~200-year span) doesn't become trivially easy (tolerance floor of 25 years guards this).
**Effort:** S. **Risk:** Low. **Depends:** M0.3.

---

## M3 — Quality & polish

### M3.1 — ESLint + Prettier
**Steps:** Flat-config ESLint with `typescript-eslint` + `eslint-plugin-react-hooks` (the intentionally-narrow deps arrays at `src/endless_game.tsx:140,152` will need `eslint-disable` comments with the existing explanatory comments kept). Prettier with defaults; format the repo in a dedicated commit (no logic changes mixed in). Add `lint` script and wire it into CI (extend M0.4).
**Accept:** `npm run lint` → 0 errors; CI fails on lint errors; formatting commit contains no semantic diff.
**Effort:** M. **Risk:** Low. **Depends:** M0.4.

### M3.2 — README + fix CLAUDE.md contradiction
- Write a short human `README.md`: what the game is, screenshot, `npm install && npm run dev`, `npm test`, build, manual Firebase deploy command, note that decks live in `data/*.json` and the admin editor is dev-only.
- Fix `CLAUDE.md`: it claims `Character`/`BiographyDeck` are "WIP … not yet wired into the UI", but biografías is fully wired (`src/history_game.tsx:149-195,342-351`). Rewrite that sentence to describe the live feature (decision #5). Also mention the new test suite and lint commands in the Commands section.

**Accept:** README renders correctly; no statement in CLAUDE.md contradicts the code.
**Effort:** S. **Risk:** Low.

### M3.3 — Replace `deck.id === "filosofia"` string-switch with a deck field
The ideas-vs-people mode switch is scattered: `src/who_was_there.tsx:40,123`, `src/context_detective.tsx:151`, `src/history_game.tsx:225-233`.

**Steps:** Add optional `wwtMode?: "ideas" | "people"` to `Deck` in `data/types.ts`; set `"ideas"` in `data/filosofia.json`; default `"people"`. Replace all id comparisons. Keep the admin middleware validation unaffected.
**Accept:** `grep -rn '"filosofia"' src/` → 0 hits in mode logic; both modes play identically to before.
**Effort:** S. **Risk:** Low.

### M3.4 — Remove root-level `check_images.js`
One-off script superseded by `scripts/find_wikipedia_images.js` (it also hardcodes `filosofia.json` and embeds a personal email). Delete it.
**Accept:** file gone; `scripts/find_wikipedia_images.js --deck filosofia` still covers the use case (dry run executes without error).
**Effort:** S. **Risk:** Low.

### M3.5 — Biografías to production quality (owner decision #5)
Biografías is launched but got less polish than the main decks.

**Steps**
1. Data quality: extend `scripts/find_wikipedia_images.js` and `find_wikipedia_links.js` to support `--deck biografias` (the `BiographyDeck` shape nests events under `characters[]` — the scripts must iterate per character). Run both with `--fix`; review the diff before committing.
2. Verify every character has enough events for the sort game (`puzzleSize` default 6; current counts: san-martin 19, alberdi 15, sarmiento 17 — OK today; add a validation to the M0.3 test suite asserting every character has ≥ `puzzleSize` events with ≥ `puzzleSize` distinct years).
3. UX parity check: bio decks skip mode select and go straight to the sort game (`history_game.tsx:173-177`) — keep that, but confirm back navigation (`bio-` prefix check at `history_game.tsx:109-113`) survives the M2.3 routing change.

**Accept:** all bio events have `image` + `wikipediaUrl`; new data-validation test green; bio flow works end-to-end after M2.3.
**Effort:** M. **Risk:** Low-Medium (script changes touch data — review diffs). **Depends:** M2.3 (step 3 only).

---

## Explicitly out of scope (do not do)

- No e2e/browser test suite, no state-management library, no router dependency, no backend for the daily puzzle, no git history rewrite, no i18n framework, no splitting of `history_game.tsx`.
- Do not remove `headroom-ai` (decision #1).
- Do not change when stats/daily results are recorded (decision #2).
- Never run a deploy command.

## Verification cheat-sheet

```bash
npx tsc --noEmit            # must stay clean after every task
npm test                    # after M0.3
npm run build               # must stay green
npm run lint                # after M3.1
git ls-files | grep -cE '^(node_modules|dist)/'   # must be 0 after M0.1
grep -rn "history-game-7a8e2" src/                # 1 hit after M2.2
```

## Quick-win batch (one sitting, ~half a day)

M0.1 → M0.2 → M1.2 → M1.3 → M1.4 → M3.4 (none depend on the test suite).
