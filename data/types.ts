export interface HistoryEvent {
  event: string;
  year: number;
  context: string;
  image?: string;
}

export interface Deck {
  id: string;
  name: string;
  emoji: string;
  events: HistoryEvent[];
  puzzleSize?: number;
}
