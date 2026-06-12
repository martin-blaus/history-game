import { describe, it, expect } from "vitest";
import { BIOGRAFIAS, characterToDeck } from "../data/index";

// Data-quality gate for the Biografías deck (M3.5): every character must be
// playable in the sort game and carry full image/link metadata.
describe("biografías data quality", () => {
  const puzzleSize = BIOGRAFIAS.puzzleSize ?? 6;

  it("has at least one character", () => {
    expect(BIOGRAFIAS.characters.length).toBeGreaterThan(0);
  });

  it.each(BIOGRAFIAS.characters.map((c) => [c.id, c] as const))(
    "%s has enough events and distinct years for the sort game",
    (_id, character) => {
      expect(character.events.length).toBeGreaterThanOrEqual(puzzleSize);
      const distinctYears = new Set(character.events.map((e) => e.year));
      expect(distinctYears.size).toBeGreaterThanOrEqual(puzzleSize);
    },
  );

  it.each(BIOGRAFIAS.characters.map((c) => [c.id, c] as const))(
    "%s events all have an image and a Wikipedia link",
    (_id, character) => {
      for (const e of character.events) {
        expect(e.image, `${e.event} image`).toMatch(/^https:\/\//);
        expect(e.wikipediaUrl, `${e.event} wikipediaUrl`).toMatch(
          /^https:\/\/es\.wikipedia\.org\//,
        );
      }
    },
  );

  it("characterToDeck produces unique bio- deck ids", () => {
    const ids = BIOGRAFIAS.characters.map((c) => characterToDeck(c).id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^bio-/);
  });
});
