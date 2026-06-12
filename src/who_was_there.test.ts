import { describe, it, expect } from "vitest";
import { buildRounds, shouldCelebrate, ROUNDS } from "./who_was_there";
import { ev, makeDeck } from "./test_helpers";

// P1 appears in 3 events (the Type A candidate); P2-P4 give 4 labels total;
// 6 tagged events satisfy the ROUNDS minimum; e7/e8 pad the distractor pool.
const peopleDeck = makeDeck([
  ev("e1", 1900, { people: ["P1"] }),
  ev("e2", 1910, { people: ["P1"] }),
  ev("e3", 1920, { people: ["P1"] }),
  ev("e4", 1930, { people: ["P2"] }),
  ev("e5", 1940, { people: ["P3"] }),
  ev("e6", 1950, { people: ["P4"] }),
  ev("e7", 1960),
  ev("e8", 1970),
]);

describe("buildRounds", () => {
  it("returns [] for a deck with no people/ideas labels", () => {
    const deck = makeDeck([ev("e1", 1900), ev("e2", 1910), ev("e3", 1920)]);
    expect(buildRounds(deck)).toEqual([]);
  });

  it("builds ROUNDS rounds for a sufficiently labeled deck", () => {
    expect(buildRounds(peopleDeck)).toHaveLength(ROUNDS);
  });

  it("Type A rounds have 6 choices with exactly the 3 correct ones flagged", () => {
    for (let run = 0; run < 10; run++) {
      for (const round of buildRounds(peopleDeck)) {
        if (round.type !== "A") continue;
        expect(round.choices).toHaveLength(6);
        expect(round.correctEvents).toHaveLength(3);
        const flagged = round.choices.filter((c) =>
          round.correctEvents.includes(c.event),
        );
        expect(flagged).toHaveLength(3);
        // Every flagged event really involves the asked-about label.
        for (const c of flagged) {
          expect(c.people).toContain(round.person);
        }
      }
    }
  });

  it("Type B rounds have 4 choices including exactly one correct label", () => {
    for (let run = 0; run < 10; run++) {
      for (const round of buildRounds(peopleDeck)) {
        if (round.type !== "B") continue;
        expect(round.choices).toHaveLength(4);
        const correct = round.choices.filter((c) =>
          (round.event.people ?? []).includes(c),
        );
        expect(correct).toEqual([round.correctPerson]);
      }
    }
  });

  it('uses ideas labels ("Name: definition") when wwtMode is "ideas"', () => {
    const ideasDeck = makeDeck(
      [
        ev("f1", -400, { ideas: ["Idea1: la primera definición"] }),
        ev("f2", -350, { ideas: ["Idea1: la primera definición"] }),
        ev("f3", -300, { ideas: ["Idea1: la primera definición"] }),
        ev("f4", -250, { ideas: ["Idea2: otra"] }),
        ev("f5", -200, { ideas: ["Idea3: otra"] }),
        ev("f6", -150, { ideas: ["Idea4: otra"] }),
      ],
      { wwtMode: "ideas" },
    );
    const rounds = buildRounds(ideasDeck);
    expect(rounds.length).toBe(ROUNDS);
    const typeA = rounds.find((r) => r.type === "A");
    expect(typeA).toBeDefined();
    if (typeA?.type === "A") {
      expect(typeA.person).toBe("Idea1");
      expect(typeA.definition).toBe("la primera definición");
    }
  });
});

describe("perfect-game celebration (bug captured by the 2026-06-11 audit, fixed in M1.1)", () => {
  it("fires the celebration on a perfect game", () => {
    expect(shouldCelebrate(Array(ROUNDS).fill(true))).toBe(true);
  });

  it("does not fire the celebration on 5/6 with a correct last round", () => {
    expect(shouldCelebrate([false, ...Array(ROUNDS - 1).fill(true)])).toBe(
      false,
    );
  });

  it("does not fire with an incomplete results array", () => {
    expect(shouldCelebrate(Array(ROUNDS - 1).fill(true))).toBe(false);
  });
});
