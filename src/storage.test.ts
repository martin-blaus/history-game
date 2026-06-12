import { describe, it, expect } from "vitest";
import { selectPuzzle, recordDeckResult, type AppStats } from "./storage";
import { MAX_ATTEMPTS } from "./constants";
import { ev, makeDeck } from "./test_helpers";

const emptyStats: AppStats = { events: {}, decks: {} };

describe("selectPuzzle", () => {
  it("returns puzzleSize events with unique years even when the deck has duplicates", () => {
    const deck = makeDeck(
      [
        ev("a", 1900),
        ev("a-dup", 1900),
        ev("b", 1901),
        ev("c", 1902),
        ev("d", 1903),
        ev("e", 1904),
        ev("f", 1905),
        ev("g", 1905),
      ],
      { puzzleSize: 6 },
    );
    for (let i = 0; i < 20; i++) {
      const puzzle = selectPuzzle(deck, emptyStats);
      expect(puzzle).toHaveLength(6);
      expect(new Set(puzzle.map((e) => e.year)).size).toBe(6);
    }
  });

  it("respects MAX_YEAR_GAP (50) when a tight window exists", () => {
    // One tight cluster (gap 1) and one outlier 500 years away: every valid
    // selection must avoid spanning the outlier.
    const deck = makeDeck(
      [
        ev("outlier", 1400),
        ...Array.from({ length: 8 }, (_, i) => ev(`e${i}`, 1900 + i)),
      ],
      { puzzleSize: 6 },
    );
    for (let i = 0; i < 20; i++) {
      const puzzle = selectPuzzle(deck, emptyStats);
      const years = puzzle.map((e) => e.year).sort((a, b) => a - b);
      const maxGap = Math.max(...years.slice(1).map((y, i) => y - years[i]));
      expect(maxGap).toBeLessThanOrEqual(50);
    }
  });

  it("prefers the least-seen window", () => {
    // 12 consecutive years; the last 6 have never been shown, all others have.
    const events = Array.from({ length: 12 }, (_, i) => ev(`e${i}`, 1900 + i));
    const stats: AppStats = { events: {}, decks: {} };
    for (let i = 0; i < 6; i++) {
      stats.events[`e${i}`] = { shown: 5, correct: 3, wrong: 2 };
    }
    const deck = makeDeck(events, { puzzleSize: 6 });
    const puzzle = selectPuzzle(deck, stats);
    expect(puzzle.map((e) => e.event)).toEqual([
      "e6",
      "e7",
      "e8",
      "e9",
      "e10",
      "e11",
    ]);
  });

  it("falls back to the whole (sorted) deck when it is smaller than puzzleSize", () => {
    const deck = makeDeck([ev("b", 1950), ev("a", 1900)], { puzzleSize: 6 });
    expect(selectPuzzle(deck, emptyStats).map((e) => e.event)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("recordDeckResult", () => {
  it("a win increments played/won/streak and the attempts bucket", () => {
    const next = recordDeckResult(emptyStats, "argentina", true, 3);
    const d = next.decks!["argentina"];
    expect(d.played).toBe(1);
    expect(d.won).toBe(1);
    expect(d.streak).toBe(1);
    expect(d.maxStreak).toBe(1);
    expect(d.attemptsDistribution).toHaveLength(MAX_ATTEMPTS);
    expect(d.attemptsDistribution[2]).toBe(1);
    expect(d.attemptsDistribution.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("a loss resets the streak but keeps maxStreak and counts played", () => {
    let stats = recordDeckResult(emptyStats, "argentina", true, 1);
    stats = recordDeckResult(stats, "argentina", true, 2);
    stats = recordDeckResult(stats, "argentina", false, MAX_ATTEMPTS);
    const d = stats.decks!["argentina"];
    expect(d.played).toBe(3);
    expect(d.won).toBe(2);
    expect(d.streak).toBe(0);
    expect(d.maxStreak).toBe(2);
    // Losses don't land in the attempts distribution.
    expect(d.attemptsDistribution.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("streaks accumulate across consecutive wins", () => {
    let stats = emptyStats;
    for (let i = 0; i < 4; i++)
      stats = recordDeckResult(stats, "mundo", true, 1);
    expect(stats.decks!["mundo"].streak).toBe(4);
    expect(stats.decks!["mundo"].attemptsDistribution[0]).toBe(4);
  });
});
