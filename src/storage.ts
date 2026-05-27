import type { Deck, HistoryEvent } from "../data/types";

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
  const sorted = [...deck.events].sort((a, b) => a.year - b.year);

  if (sorted.length <= n) return sorted;

  const shownOf = (ev: HistoryEvent) => stats.events[ev.event]?.shown ?? 0;

  type Window = { start: number; totalShown: number; maxGap: number; r: number };
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

  const valid = windows.filter(w => w.maxGap <= 50);
  let pool = valid;
  if (pool.length === 0) {
    const minGap = Math.min(...windows.map(w => w.maxGap));
    pool = windows.filter(w => w.maxGap === minGap);
  }
  pool.sort((a, b) => a.totalShown - b.totalShown || a.r - b.r);
  return sorted.slice(pool[0].start, pool[0].start + n);
}

export function recordResult(
  stats: AppStats,
  results: { event: HistoryEvent; status: "correct" | "wrong" }[]
): AppStats {
  const next = { events: { ...stats.events } };
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
