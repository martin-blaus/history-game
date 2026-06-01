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
}
