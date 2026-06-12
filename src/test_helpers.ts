import type { Deck, HistoryEvent } from "../data/types";

export function ev(
  name: string,
  year: number,
  extra: Partial<HistoryEvent> = {},
): HistoryEvent {
  return { event: name, year, context: `Contexto de ${name}`, ...extra };
}

export function makeDeck(
  events: HistoryEvent[],
  overrides: Partial<Deck> = {},
): Deck {
  return { id: "test", name: "Test", emoji: "🧪", events, ...overrides };
}

// Minimal in-memory localStorage for node tests (daily.ts / storage.ts touch it).
export function stubLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
}
