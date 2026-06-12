import { describe, it, expect, beforeEach } from "vitest";
import {
  dailyRng,
  dayNumber,
  shiftDay,
  selectDailyPuzzle,
  recordDailyResult,
  getDailyStreak,
  loadDaily,
  DAILY_EPOCH,
  type DailyResult,
} from "./daily";
import { DECKS } from "../data/index";
import type { Deck } from "../data/types";
import { stubLocalStorage } from "./test_helpers";

const argentina = DECKS.find((d) => d.id === "argentina")!;

describe("golden determinism (regression tripwire for the M2.1 refactor)", () => {
  // These exact sequences were captured from the live algorithm. If a refactor
  // changes them, the refactor is wrong — every player's daily would change.
  // Fix the refactor, never this test.
  it("argentina @ 2026-06-11 selects the exact known puzzle and board", () => {
    const { puzzle, shuffled } = selectDailyPuzzle(argentina, "2026-06-11");
    expect(puzzle.map((e) => e.event)).toEqual([
      "Golpe de Estado de Uriburu — primera dictadura militar",
      "Premio Nobel de la Paz para Carlos Saavedra Lamas",
      "Revolución del 43 — golpe militar y fin de la Década Infame",
      "Masiva movilización del 17 de octubre",
      "Primera presidencia de Juan Domingo Perón",
      "Declaración de la Independencia Económica",
    ]);
    expect(shuffled.map((e) => e.event)).toEqual([
      "Primera presidencia de Juan Domingo Perón",
      "Golpe de Estado de Uriburu — primera dictadura militar",
      "Revolución del 43 — golpe militar y fin de la Década Infame",
      "Declaración de la Independencia Económica",
      "Premio Nobel de la Paz para Carlos Saavedra Lamas",
      "Masiva movilización del 17 de octubre",
    ]);
  });

  it("argentina @ 2026-07-01 selects the exact known puzzle", () => {
    const { puzzle } = selectDailyPuzzle(argentina, "2026-07-01");
    expect(puzzle.map((e) => e.event)).toEqual([
      "La Noche de los Lápices",
      "Primera ronda de las Madres de Plaza de Mayo",
      "Argentina campeona del mundo — Argentina 1978",
      "Guerra de las Malvinas",
      "Retorno de la democracia — asume Raúl Alfonsín",
      "Juicio a las Juntas Militares",
    ]);
  });
});

describe("dailyRng", () => {
  it("returns identical sequences for identical seeds", () => {
    const a = dailyRng("2026-06-11", "argentina");
    const b = dailyRng("2026-06-11", "argentina");
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("returns different sequences for different dates and different decks", () => {
    const base = dailyRng("2026-06-11", "argentina");
    const otherDate = dailyRng("2026-06-12", "argentina");
    const otherDeck = dailyRng("2026-06-11", "mundo");
    const seq = (rng: () => number) => Array.from({ length: 10 }, () => rng());
    const baseSeq = seq(base);
    expect(seq(otherDate)).not.toEqual(baseSeq);
    expect(seq(otherDeck)).not.toEqual(baseSeq);
  });
});

describe("dayNumber / shiftDay (TZ pinned to America/New_York by vitest config)", () => {
  it("epoch is day 1 and counts forward", () => {
    expect(dayNumber(DAILY_EPOCH)).toBe(1);
    expect(dayNumber("2026-06-12")).toBe(2);
    expect(dayNumber("2026-07-11")).toBe(31);
  });

  it("is consistent across the spring-forward DST boundary (2026-03-08, a 23h day)", () => {
    expect(dayNumber("2026-03-09") - dayNumber("2026-03-08")).toBe(1);
    expect(dayNumber("2026-03-08") - dayNumber("2026-03-07")).toBe(1);
  });

  it("is consistent across the fall-back DST boundary (2026-11-01, a 25h day)", () => {
    expect(dayNumber("2026-11-01") - dayNumber("2026-10-31")).toBe(1);
    expect(dayNumber("2026-11-02") - dayNumber("2026-11-01")).toBe(1);
  });

  it("shiftDay crosses DST, month and year edges", () => {
    expect(shiftDay("2026-03-08", 1)).toBe("2026-03-09");
    expect(shiftDay("2026-03-09", -1)).toBe("2026-03-08");
    expect(shiftDay("2026-11-01", 1)).toBe("2026-11-02");
    expect(shiftDay("2026-02-28", 1)).toBe("2026-03-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("selectDailyPuzzle properties", () => {
  const dates = Array.from({ length: 30 }, (_, i) => shiftDay(DAILY_EPOCH, i));

  it.each(DECKS.map((d) => [d.id, d] as [string, Deck]))(
    "%s: unique years, correct size, board never pre-solved",
    (_id, deck) => {
      const n = deck.puzzleSize ?? 6;
      for (const date of dates) {
        const { puzzle, shuffled } = selectDailyPuzzle(deck, date);
        expect(puzzle).toHaveLength(n);
        expect(new Set(puzzle.map((e) => e.year)).size).toBe(n);
        // Same multiset of events on the board.
        expect([...shuffled].sort((a, b) => a.year - b.year)).toEqual(
          [...puzzle].sort((a, b) => a.year - b.year)
        );
        // The shuffled board must not already be the solution.
        const ascending = shuffled.every(
          (e, i) => i === 0 || e.year >= shuffled[i - 1].year
        );
        expect(ascending).toBe(false);
      }
    }
  );
});

describe("recordDailyResult", () => {
  beforeEach(() => stubLocalStorage());

  const result = (date: string, won: boolean): DailyResult => ({
    date,
    won,
    attemptsUsed: won ? 2 : 5,
    grid: [],
    usedHint: false,
  });

  it("win starts a streak; consecutive-day win increments it", () => {
    recordDailyResult("argentina", result("2026-06-11", true));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(1);
    recordDailyResult("argentina", result("2026-06-12", true));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(2);
  });

  it("streak survives the spring-forward DST boundary", () => {
    recordDailyResult("argentina", result("2026-03-07", true));
    recordDailyResult("argentina", result("2026-03-08", true));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(2);
  });

  it("a gap resets the streak to 1 on the next win", () => {
    recordDailyResult("argentina", result("2026-06-11", true));
    recordDailyResult("argentina", result("2026-06-14", true));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(1);
  });

  it("a loss resets the streak to 0 and maxStreak is kept", () => {
    recordDailyResult("argentina", result("2026-06-11", true));
    recordDailyResult("argentina", result("2026-06-12", true));
    recordDailyResult("argentina", result("2026-06-13", false));
    const state = loadDaily();
    expect(getDailyStreak(state, "argentina")).toBe(0);
    expect(state.decks["argentina"].maxStreak).toBe(2);
  });

  it("recording the same date twice does not change the streak (idempotent)", () => {
    recordDailyResult("argentina", result("2026-06-11", true));
    recordDailyResult("argentina", result("2026-06-11", true));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(1);
    recordDailyResult("argentina", result("2026-06-11", false));
    expect(getDailyStreak(loadDaily(), "argentina")).toBe(1);
  });

  it("streaks are tracked per deck", () => {
    recordDailyResult("argentina", result("2026-06-11", true));
    recordDailyResult("mundo", result("2026-06-11", false));
    const state = loadDaily();
    expect(getDailyStreak(state, "argentina")).toBe(1);
    expect(getDailyStreak(state, "mundo")).toBe(0);
  });
});
