import type { HistoryEvent } from "../data/types";

// Prefer puzzles whose consecutive events are at most this many years apart.
export const MAX_YEAR_GAP = 50;

export interface CandidateWindow {
  events: HistoryEvent[];
  maxGap: number;
}

// Scans `sortedEvents` (already sorted by year — the sort, including any
// tiebreak, stays in the caller) and returns every window of `n` events with
// pairwise-distinct years, starting at each index and skipping duplicate
// years. Shared by free-play (selectPuzzle) and the daily (selectDailyPuzzle)
// so their semantics can't drift; only the final pick differs per caller
// (seen-count weighting + Math.random vs. the date-seeded RNG).
export function buildCandidateWindows(
  sortedEvents: HistoryEvent[],
  n: number,
): CandidateWindow[] {
  const candidates: CandidateWindow[] = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const events: HistoryEvent[] = [];
    const years = new Set<number>();
    let maxGap = 0;
    for (let j = i; j < sortedEvents.length; j++) {
      const ev = sortedEvents[j];
      if (years.has(ev.year)) continue;
      years.add(ev.year);
      events.push(ev);
      if (events.length > 1) {
        maxGap = Math.max(maxGap, ev.year - events[events.length - 2].year);
      }
      if (events.length === n) break;
    }
    if (events.length === n) candidates.push({ events, maxGap });
  }
  return candidates;
}

// Windows within MAX_YEAR_GAP; if none qualify, the windows with the smallest
// max gap.
export function filterUsableWindows(
  candidates: CandidateWindow[],
): CandidateWindow[] {
  const valid = candidates.filter((c) => c.maxGap <= MAX_YEAR_GAP);
  if (valid.length > 0) return valid;
  const minGap = Math.min(...candidates.map((c) => c.maxGap));
  return candidates.filter((c) => c.maxGap === minGap);
}
