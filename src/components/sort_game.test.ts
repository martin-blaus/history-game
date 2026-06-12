import { describe, it, expect } from "vitest";
import {
  gradeCards,
  makeRound,
  roundReducer,
  type RoundState,
} from "./sort_game";
import { MAX_ATTEMPTS } from "../constants";
import { ev } from "../test_helpers";

const puzzle = [
  ev("a", 1900),
  ev("b", 1910),
  ev("c", 1920),
  ev("d", 1930),
  ev("e", 1940),
  ev("f", 1950),
];
// Board order ≠ chronological order.
const shuffled = [
  puzzle[2],
  puzzle[0],
  puzzle[4],
  puzzle[1],
  puzzle[5],
  puzzle[3],
];

const names = (s: RoundState) => s.cards.map((c) => c.event);

describe("gradeCards", () => {
  it("marks each position against the chronological order", () => {
    expect(gradeCards(puzzle, puzzle)).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
    // Swap two cards: only those two positions are wrong.
    const cards = [puzzle[1], puzzle[0], ...puzzle.slice(2)];
    expect(gradeCards(puzzle, cards)).toEqual([
      "wrong",
      "wrong",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });
});

describe("roundReducer", () => {
  const initial = makeRound(puzzle, shuffled);

  it("makeRound starts with a full attempt budget and no submissions", () => {
    expect(initial.attemptsLeft).toBe(MAX_ATTEMPTS);
    expect(initial.attemptsHistory).toEqual([]);
    expect(initial.submitted).toBe(false);
    expect(initial.hintCardId).toBeNull();
  });

  it("move_card moves forward (dst counts insertion slots)", () => {
    const next = roundReducer(initial, { type: "move_card", src: 0, dst: 3 });
    expect(names(next)).toEqual(["a", "e", "c", "b", "f", "d"]);
  });

  it("move_card moves backward", () => {
    const next = roundReducer(initial, { type: "move_card", src: 3, dst: 0 });
    expect(names(next)).toEqual(["b", "c", "a", "e", "f", "d"]);
  });

  it("move_card is a no-op when dropping onto the same slot (src or src+1)", () => {
    expect(roundReducer(initial, { type: "move_card", src: 2, dst: 2 })).toBe(
      initial,
    );
    expect(roundReducer(initial, { type: "move_card", src: 2, dst: 3 })).toBe(
      initial,
    );
  });

  it("use_hint pins the chronological middle card in its correct slot", () => {
    const next = roundReducer(initial, { type: "use_hint" });
    // sorted[floor(6/2)] = sorted[3] = "d" (1930), correct index 3.
    expect(next.hintCardId).toBe("d");
    expect(names(next)[3]).toBe("d");
    // The other cards keep their relative order.
    expect(names(next)).toEqual(["c", "a", "e", "d", "b", "f"]);
  });

  it("use_hint is a no-op when a hint was already used", () => {
    const hinted = roundReducer(initial, { type: "use_hint" });
    expect(roundReducer(hinted, { type: "use_hint" })).toBe(hinted);
  });

  it("submit decrements attempts and appends to history; final submit locks the round", () => {
    const graded = gradeCards(puzzle, initial.cards);
    const afterFirst = roundReducer(initial, {
      type: "submit",
      graded,
      final: false,
    });
    expect(afterFirst.attemptsLeft).toBe(MAX_ATTEMPTS - 1);
    expect(afterFirst.attemptsHistory).toEqual([graded]);
    expect(afterFirst.submitted).toBe(false);
    expect(afterFirst.finalStatuses).toEqual([]);

    const allCorrect = gradeCards(puzzle, puzzle);
    const afterFinal = roundReducer(afterFirst, {
      type: "submit",
      graded: allCorrect,
      final: true,
    });
    expect(afterFinal.attemptsLeft).toBe(MAX_ATTEMPTS - 2);
    expect(afterFinal.attemptsHistory).toEqual([graded, allCorrect]);
    expect(afterFinal.submitted).toBe(true);
    expect(afterFinal.finalStatuses).toEqual(allCorrect);
  });

  it("clear_flash clears statuses only while the round is still open", () => {
    const graded = gradeCards(puzzle, initial.cards);
    const open = roundReducer(initial, {
      type: "submit",
      graded,
      final: false,
    });
    expect(roundReducer(open, { type: "clear_flash" }).statuses).toEqual([]);
    const closed = roundReducer(initial, {
      type: "submit",
      graded,
      final: true,
    });
    expect(roundReducer(closed, { type: "clear_flash" }).statuses).toEqual(
      graded,
    );
  });
});
