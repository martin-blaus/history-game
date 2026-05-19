export type { HistoryEvent, Deck } from "./types";
import type { Deck } from "./types";

import argentinaData from "./argentina.json";
import mundoData from "./mundo.json";
import filosofiaData from "./filosofia.json";

export const DECKS: Deck[] = [
  argentinaData as Deck,
  mundoData as Deck,
  filosofiaData as Deck,
];
