import type { Deck, HistoryEvent } from "../data/types";
import { MAX_ATTEMPTS } from "./constants";

const DAILY_KEY = "historia-ar-daily";
const MAX_YEAR_GAP = 50;
// Launch date = daily #1. Day numbers count forward from here in local time.
export const DAILY_EPOCH = "2026-06-11";

type Status = "correct" | "wrong";

// ── Seeded PRNG ─────────────────────────────────────────────────────────────
// xmur3 (string hash) seeds mulberry32. Both use only 32-bit integer ops + one
// float divide, so every device/engine produces the same sequence for a date.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailyRng(dateStr: string, deckId: string): () => number {
  return mulberry32(xmur3(`${dateStr}:${deckId}`)());
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Dates (local, Wordle-style) ───────────────────────────────────────────────
// Using the local date means a player gets a new puzzle at *their* midnight, and
// two players in different timezones can briefly see different "#N" — matching
// Wordle, and requiring no backend.

export function todayStr(): string {
  const override = new URLSearchParams(window.location.search).get("date");
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return formatLocal(new Date());
}

function formatLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Parse component-wise — never Date.parse("YYYY-MM-DD"), which is treated as UTC.
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayNumber(dateStr: string): number {
  const diff = parseLocal(dateStr).getTime() - parseLocal(DAILY_EPOCH).getTime();
  return Math.round(diff / 86400000) + 1;
}

function shiftDay(dateStr: string, delta: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + delta);
  return formatLocal(d);
}

export function msUntilNextMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

// ── Deterministic puzzle selection ────────────────────────────────────────────
// Mirrors selectPuzzle's candidate-window scan (unique years, year-gap balancing)
// but drops the per-player seen-count weighting — the daily must be identical for
// everyone, so the only randomness is the date-seeded RNG.

function isAscending(events: HistoryEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    if (events[i].year < events[i - 1].year) return false;
  }
  return true;
}

export function selectDailyPuzzle(
  deck: Deck,
  dateStr: string
): { puzzle: HistoryEvent[]; shuffled: HistoryEvent[] } {
  const n = deck.puzzleSize ?? 6;
  const rng = dailyRng(dateStr, deck.id);
  // Plain code-unit tiebreak (not localeCompare, which varies by ICU/locale).
  const sorted = [...deck.events].sort(
    (a, b) => a.year - b.year || (a.event < b.event ? -1 : a.event > b.event ? 1 : 0)
  );

  type Candidate = { events: HistoryEvent[]; maxGap: number };
  const candidates: Candidate[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const evs: HistoryEvent[] = [];
    const years = new Set<number>();
    let maxGap = 0;
    for (let j = i; j < sorted.length; j++) {
      const ev = sorted[j];
      if (years.has(ev.year)) continue;
      years.add(ev.year);
      evs.push(ev);
      if (evs.length > 1) {
        maxGap = Math.max(maxGap, ev.year - evs[evs.length - 2].year);
      }
      if (evs.length === n) break;
    }
    if (evs.length === n) candidates.push({ events: evs, maxGap });
  }

  let pool: HistoryEvent[][];
  if (candidates.length > 0) {
    const valid = candidates.filter((c) => c.maxGap <= MAX_YEAR_GAP);
    const minGap = Math.min(...candidates.map((c) => c.maxGap));
    const usable = valid.length > 0 ? valid : candidates.filter((c) => c.maxGap === minGap);
    pool = usable.map((c) => c.events);
  } else {
    pool = [sorted.slice(0, n)];
  }

  const puzzle = pool[Math.floor(rng() * pool.length)];

  let shuffled = seededShuffle(puzzle, rng);
  // Don't hand the player an already-solved board.
  let guard = 0;
  while (isAscending(shuffled) && guard++ < 10) {
    shuffled = seededShuffle(puzzle, rng);
  }
  return { puzzle, shuffled };
}

// ── Persistence ────────────────────────────────────────────────────────────────

export interface DailyResult {
  date: string;
  won: boolean;
  attemptsUsed: number;
  grid: Status[][];
  usedHint: boolean;
}

export interface DailyDeckState {
  results: Record<string, DailyResult>;
  lastWonDate: string | null;
  streak: number;
  maxStreak: number;
}

export interface DailyState {
  decks: Record<string, DailyDeckState>;
}

export function loadDaily(): DailyState {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyState;
      if (!parsed.decks) parsed.decks = {};
      return parsed;
    }
  } catch {}
  return { decks: {} };
}

function saveDaily(state: DailyState): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(state));
  } catch {}
}

export function getDailyResult(
  state: DailyState,
  deckId: string,
  date: string
): DailyResult | null {
  return state.decks[deckId]?.results[date] ?? null;
}

export function getDailyStreak(state: DailyState, deckId: string): number {
  return state.decks[deckId]?.streak ?? 0;
}

export function recordDailyResult(deckId: string, result: DailyResult): DailyState {
  const state = loadDaily();
  const prev =
    state.decks[deckId] ?? { results: {}, lastWonDate: null, streak: 0, maxStreak: 0 };

  let { streak, maxStreak, lastWonDate } = prev;
  // Update the streak only the first time a date is recorded (idempotent re-saves).
  if (!prev.results[result.date]) {
    if (result.won) {
      streak = lastWonDate === shiftDay(result.date, -1) ? streak + 1 : 1;
      lastWonDate = result.date;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  const next: DailyState = {
    decks: {
      ...state.decks,
      [deckId]: {
        results: { ...prev.results, [result.date]: result },
        lastWonDate,
        streak,
        maxStreak,
      },
    },
  };
  saveDaily(next);
  return next;
}

export function buildDailyShareText(
  result: DailyResult,
  deckName: string,
  dayNum: number
): string {
  const grid = result.grid
    .map((row) => row.map((s) => (s === "correct" ? "🟩" : "🟥")).join(""))
    .join("\n");
  const tries = result.won ? `${result.attemptsUsed}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  return `Historia Diaria #${dayNum} — ${deckName} (${tries})\n\n${grid}\n\nhttps://history-game-7a8e2.web.app`;
}
