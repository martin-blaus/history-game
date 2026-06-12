import type { Deck, HistoryEvent } from "../data/types";
import { MAX_ATTEMPTS } from "./constants";
import {
  buildCandidateWindows,
  filterUsableWindows,
  MAX_YEAR_GAP,
} from "./puzzle_windows";

const STORAGE_KEY = "historia-ar-stats";

export interface EventStat {
  shown: number;
  correct: number;
  wrong: number;
}

export interface DeckStats {
  played: number;
  won: number;
  streak: number;
  maxStreak: number;
  attemptsDistribution: number[];
}

export interface AppStats {
  events: Record<string, EventStat>;
  decks?: Record<string, DeckStats>;
}

export function loadStats(): AppStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStats;
      if (!parsed.decks) parsed.decks = {};
      return parsed;
    }
  } catch {}
  return { events: {}, decks: {} };
}

export function saveStats(stats: AppStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function selectPuzzle(deck: Deck, stats: AppStats): HistoryEvent[] {
  const n = deck.puzzleSize ?? 6;
  const sorted = [...deck.events].sort((a, b) => a.year - b.year);

  const shownOf = (ev: HistoryEvent) => stats.events[ev.event]?.shown ?? 0;

  // Candidate windows with unique years (shared with the daily puzzle), then
  // free-play-specific weighting: least-seen first, random tiebreak.
  const candidates = buildCandidateWindows(sorted, n);
  if (candidates.length > 0) {
    const pool = filterUsableWindows(candidates).map((c) => ({
      events: c.events,
      totalShown: c.events.reduce((sum, ev) => sum + shownOf(ev), 0),
      r: Math.random(),
    }));
    pool.sort((a, b) => a.totalShown - b.totalShown || a.r - b.r);
    return pool[0].events;
  }

  // Fallback: original selection algorithm if no candidate with unique years could be formed
  if (sorted.length <= n) return sorted;

  type Window = {
    start: number;
    totalShown: number;
    maxGap: number;
    r: number;
  };
  const windows: Window[] = [];
  for (let i = 0; i <= sorted.length - n; i++) {
    let maxGap = 0;
    let totalShown = 0;
    for (let j = i; j < i + n; j++) {
      totalShown += shownOf(sorted[j]);
      if (j > i) maxGap = Math.max(maxGap, sorted[j].year - sorted[j - 1].year);
    }
    windows.push({ start: i, totalShown, maxGap, r: Math.random() });
  }

  const valid = windows.filter((w) => w.maxGap <= MAX_YEAR_GAP);
  let pool = valid;
  if (pool.length === 0) {
    const minGap = Math.min(...windows.map((w) => w.maxGap));
    pool = windows.filter((w) => w.maxGap === minGap);
  }
  pool.sort((a, b) => a.totalShown - b.totalShown || a.r - b.r);
  return sorted.slice(pool[0].start, pool[0].start + n);
}

export function recordResult(
  stats: AppStats,
  results: { event: HistoryEvent; status: "correct" | "wrong" }[],
): AppStats {
  const next = {
    events: { ...stats.events },
    decks: { ...stats.decks },
  };
  for (const { event, status } of results) {
    const prev = next.events[event.event] ?? { shown: 0, correct: 0, wrong: 0 };
    next.events[event.event] = {
      shown: prev.shown + 1,
      correct: prev.correct + (status === "correct" ? 1 : 0),
      wrong: prev.wrong + (status === "wrong" ? 1 : 0),
    };
  }
  return next;
}

export function recordDeckResult(
  stats: AppStats,
  deckId: string,
  won: boolean,
  attemptsUsed: number,
): AppStats {
  const nextEvents = { ...stats.events };
  const nextDecks = stats.decks ? { ...stats.decks } : {};

  const prev = nextDecks[deckId] ?? {
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
    attemptsDistribution: new Array(MAX_ATTEMPTS).fill(0),
  };

  const nextStreak = won ? prev.streak + 1 : 0;
  const nextMaxStreak = Math.max(prev.maxStreak, nextStreak);
  const nextDistribution = [...prev.attemptsDistribution];
  if (won && attemptsUsed >= 1 && attemptsUsed <= MAX_ATTEMPTS) {
    nextDistribution[attemptsUsed - 1] += 1;
  }

  nextDecks[deckId] = {
    played: prev.played + 1,
    won: prev.won + (won ? 1 : 0),
    streak: nextStreak,
    maxStreak: nextMaxStreak,
    attemptsDistribution: nextDistribution,
  };

  return {
    events: nextEvents,
    decks: nextDecks,
  };
}
