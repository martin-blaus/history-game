export interface HistoryEvent {
  event: string;
  year: number;
  month?: number;
  day?: number;
  context: string;
  image?: string;
  people?: string[];
  ideas?: string[];
  wikipediaUrl?: string;
}

export interface Deck {
  id: string;
  name: string;
  emoji: string;
  events: HistoryEvent[];
  puzzleSize?: number;
  // Which label field drives "¿Quién estuvo ahí?": historical figures
  // (`people`, the default) or idea names with definitions (`ideas`,
  // "¿Quién lo pensó?").
  wwtMode?: "ideas" | "people";
}

export interface Character {
  id: string;
  name: string;
  shortName?: string;
  emoji: string;
  image?: string;
  birthYear: number;
  deathYear: number;
  description: string;
  events: HistoryEvent[];
}

export interface BiographyDeck {
  id: string;
  name: string;
  emoji: string;
  characters: Character[];
  puzzleSize?: number;
}
