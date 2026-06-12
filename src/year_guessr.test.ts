import { describe, it, expect } from "vitest";
import { calcScore } from "./year_guessr";

describe("calcScore (span-relative)", () => {
  it("exact year scores 100 on any span", () => {
    expect(calcScore(1950, 1950, 200)).toBe(100);
    expect(calcScore(-400, -400, 2500)).toBe(100);
  });

  it("narrow decks keep the 25-year tolerance floor (≈ old 2pts/year feel)", () => {
    // span 200 → tolerance max(25, 20) = 25: 4 points per year off.
    expect(calcScore(1960, 1950, 200)).toBe(60);
    expect(calcScore(1975, 1950, 200)).toBe(0);
    expect(calcScore(1900, 1950, 200)).toBe(0);
  });

  it("filosofía-scale span: 100 years off on a 2,500-year span scores 60", () => {
    // tolerance = 250 → 1 - 100/250 = 0.6.
    expect(calcScore(-300, -400, 2500)).toBe(60);
    expect(calcScore(-400, -300, 2500)).toBe(60);
  });

  it("score reaches 0 at 10% of the span and never goes negative", () => {
    expect(calcScore(0, 250, 2500)).toBe(0);
    expect(calcScore(0, 2000, 2500)).toBe(0);
  });

  it("is symmetric around the actual year", () => {
    expect(calcScore(1940, 1950, 500)).toBe(calcScore(1960, 1950, 500));
  });
});
