export type { HistoryEvent, Deck, Character, BiographyDeck } from "./types";
import type { Deck, Character, BiographyDeck } from "./types";

import argentinaData from "./argentina.json";
import mundoData from "./mundo.json";
import filosofiaData from "./filosofia.json";
import biografiasData from "./biografias.json";

export const DECKS: Deck[] = [
  argentinaData as Deck,
  mundoData as Deck,
  filosofiaData as Deck,
];

export const BIOGRAFIAS = biografiasData as BiographyDeck;

export function characterToDeck(c: Character): Deck {
  return {
    id: `bio-${c.id}`,
    name: c.shortName ?? c.name,
    emoji: c.emoji,
    events: c.events,
    puzzleSize: BIOGRAFIAS.puzzleSize ?? 6,
  };
}
