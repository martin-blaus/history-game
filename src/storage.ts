import type { Deck, HistoryEvent } from "../data/index";

const STORAGE_KEY = "historia-ar-stats";

export interface EventStat {
  shown: number;
  correct: number;
  wrong: number;
}

export interface AppStats {
  events: Record<string, EventStat>;
}

export function loadStats(): AppStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppStats;
  } catch {}
  return { events: {} };
}

export function saveStats(stats: AppStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function selectPuzzle(deck: Deck, stats: AppStats) {
  const scored = deck.puzzles.map((set, i) => ({
    i,
    score: set.reduce((sum, e) => sum + (stats.events[e.id]?.shown ?? 0), 0),
  }));
  const minScore = Math.min(...scored.map(s => s.score));
  const candidates = scored.filter(s => s.score === minScore);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return deck.puzzles[pick.i];
}

export function recordResult(
  stats: AppStats,
  results: { event: HistoryEvent; status: "correct" | "wrong" }[]
): AppStats {
  const next = { events: { ...stats.events } };
  for (const { event, status } of results) {
    const prev = next.events[event.id] ?? { shown: 0, correct: 0, wrong: 0 };
    next.events[event.id] = {
      shown: prev.shown + 1,
      correct: prev.correct + (status === "correct" ? 1 : 0),
      wrong: prev.wrong + (status === "wrong" ? 1 : 0),
    };
  }
  return next;
}
