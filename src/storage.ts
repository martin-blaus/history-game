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

export function selectPuzzle(deck: Deck, stats: AppStats): HistoryEvent[] {
  const n = deck.puzzleSize ?? 6;
  const tagged = deck.events.map(ev => ({
    ev,
    shown: stats.events[ev.id]?.shown ?? 0,
    r: Math.random(),
  }));
  tagged.sort((a, b) => a.shown - b.shown || a.r - b.r);
  return tagged.slice(0, n).map(t => t.ev);
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
