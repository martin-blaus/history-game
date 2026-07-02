# Improvement Plan — History Game (All Tasks Completed)

All planned improvements from the 2026-06-11 repository audit have been fully completed.

## Decisions Made & Implemented

1. **`headroom-ai` preserved** in `package.json` as devDependency (decision #1).
2. **Daily replay-after-early-exit accepted** without changes to stats timing (decision #2).
3. **Keyboard accessibility for Sort Game** has been built (decision #3 / task M2.5).
4. **Year Guesser and Context Detective modes removed** to simplify the app.
5. **Biografías deck polished** and fully launched to production quality (decision #5 / task M3.5).

---

## Completion Status

### Milestone 0 — Safety Net (Completed)
*   **M0.1 — Untrack build artifacts, write a real `.gitignore`**
    *   Build directories (`dist/`, `node_modules/`, etc.) untracked and configured in `.gitignore`.
*   **M0.2 — Fix platform-locked dependencies**
    *   Removed `lightningcss` direct dependencies causing installation failures on different platforms.
*   **M0.3 — Add Vitest + tests for the pure core logic**
    *   Introduced Vitest and created pure unit tests for Daily puzzle, Storage, Sort Game, Biografías data, and Who Was There mode.
*   **M0.4 — CI on GitHub Actions**
    *   Implemented linting, typechecking, testing, and building workflow in `.github/workflows/ci.yml`.

### Milestone 1 — Correctness Fixes (Completed)
*   **M1.1 — Fix perfect-game confetti double-count in ¿Quién estuvo ahí?**
    *   Refactored round results tracking so perfect games properly trigger confetti.
*   **M1.2 — Context Detective real restart (Removed)**
    *   Mode has been removed in simplify-app phase.
*   **M1.3 — Clipboard error handling + best-score NaN guard**
    *   Added error state checks for clipboard copying and added NaN guards for endless best score.
*   **M1.4 — Hide Admin in production builds**
    *   Wrapped admin entry and dev middleware saves under `import.meta.env.DEV`.

### Milestone 2 — High-Leverage Improvements (Completed)
*   **M2.1 — Deduplicate puzzle-selection logic**
    *   Centralized candidate scanning logic in `puzzle_windows.ts`.
*   **M2.2 — Centralize shared constants**
    *   Moved `SHARE_URL` to `constants.ts`.
*   **M2.3 — Browser back button / screen history**
    *   Implemented robust URL hash-routing using native history hashchange listener.
*   **M2.4 — Native share on mobile**
    *   Integrated OS share sheet usage via `navigator.share` fallback to copy.
*   **M2.5 — Keyboard accessibility for the sort game**
    *   Added full keyboard support (Tab to focus, arrow keys to slide cards) with screen reader hints.
*   **M2.6 — Year Guesser scoring redesign (Removed)**
    *   Mode has been removed in simplify-app phase.

### Milestone 3 — Quality & Polish (Completed)
*   **M3.1 — ESLint + Prettier**
    *   Configured ESLint flat config and Prettier, integrated checks into CI pipeline.
*   **M3.2 — README + fix CLAUDE.md contradiction**
    *   Polished README and updated CLAUDE.md to correctly detail game modes.
*   **M3.3 — Replace `deck.id === "filosofia"` string-switch with a deck field**
    *   Added `wwtMode` parameter to `Deck` to generalise Ideas vs People layout.
*   **M3.4 — Remove root-level `check_images.js`**
    *   Superseeded by `scripts/find_wikipedia_images.js`.
*   **M3.5 — Biografías to production quality**
    *   Polished character events and validated dataset count in unit test suite.
