import { useEffect, useState } from "react";
import { DECKS, BIOGRAFIAS, characterToDeck } from "../data/index";
import type { Deck } from "../data/index";
import { formatYear } from "./utils";
import { loadStats, saveStats, type AppStats } from "./storage";
import { AdminScreen } from "./admin";
import { YearGuessr } from "./year_guessr";
import { EndlessGame } from "./endless_game";
import { ContextDetective } from "./context_detective";
import { WhoWasThere } from "./who_was_there";
import { SortGame } from "./components/sort_game";
import { StatsScreen } from "./components/stats_screen";
import { DailyResultScreen } from "./components/daily_result";
import {
  loadDaily,
  todayStr,
  dayNumber,
  getDailyResult,
  getDailyStreak,
  recordDailyResult,
  type DailyState,
} from "./daily";

const TITLE_CLS =
  "text-4xl sm:text-5xl font-extrabold tracking-tighter m-0 leading-none";

// ── Hash routing ──────────────────────────────────────────────────────────────
// The URL hash is the source of truth for navigation (#/mode_select/argentina),
// so the browser back button walks screens instead of exiting the app, and
// any screen can be deep-linked or refreshed. No router library by design.

type Screen =
  | "home"
  | "mode_select"
  | "game"
  | "daily"
  | "year_guessr"
  | "endless"
  | "context_detective"
  | "who_was_there"
  | "biografias_select"
  | "stats"
  | "admin";

interface Route {
  screen: Screen;
  deck: Deck | null;
}

const DECK_SCREENS: Screen[] = [
  "mode_select",
  "game",
  "daily",
  "year_guessr",
  "endless",
  "context_detective",
  "who_was_there",
];
const PLAIN_SCREENS: Screen[] = ["biografias_select", "stats", "admin"];

// Resolves a deck id from the hash, including bio decks (bio-<characterId>).
function deckFromId(id: string): Deck | null {
  const deck = DECKS.find((d) => d.id === id);
  if (deck) return deck;
  if (id.startsWith("bio-")) {
    const character = BIOGRAFIAS.characters.find((c) => `bio-${c.id}` === id);
    if (character) return characterToDeck(character);
  }
  return null;
}

function parseHash(hash: string): Route {
  const [name, deckId] = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (name && (PLAIN_SCREENS as string[]).includes(name)) {
    return { screen: name as Screen, deck: null };
  }
  if (name && deckId && (DECK_SCREENS as string[]).includes(name)) {
    const deck = deckFromId(decodeURIComponent(deckId));
    if (deck) return { screen: name as Screen, deck };
  }
  // Unknown or invalid hash → home.
  return { screen: "home", deck: null };
}

function hashFor(screen: Screen, deck: Deck | null): string {
  if (screen === "home") return "#/";
  if ((DECK_SCREENS as string[]).includes(screen) && deck) {
    return `#/${screen}/${encodeURIComponent(deck.id)}`;
  }
  return `#/${screen}`;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash),
  );
  const { screen, deck: selectedDeck } = route;
  const [stats, setStats] = useState<AppStats>(() => loadStats());
  const [daily, setDaily] = useState<DailyState>(() => loadDaily());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Setting location.hash pushes a history entry and fires hashchange, which
  // updates `route`. Same-hash navigations update state directly (no entry).
  function navigate(screen: Screen, deck: Deck | null = route.deck) {
    const target = hashFor(screen, deck);
    if (window.location.hash === target) {
      setRoute({ screen, deck });
    } else {
      window.location.hash = target;
    }
  }

  function selectDeck(deck: Deck) {
    navigate("mode_select", deck);
  }

  function handleUpdateStats(newStats: AppStats) {
    setStats(newStats);
    saveStats(newStats);
  }

  function resetStats() {
    if (!window.confirm("¿Reiniciar todas las estadísticas?")) return;
    const empty: AppStats = { events: {} };
    setStats(empty);
    saveStats(empty);
  }

  // The admin editor saves through a dev-server-only middleware
  // (/api/save-deck in vite.config.ts), so it's dev-only by design.
  if (screen === "admin" && import.meta.env.DEV)
    return <AdminScreen onBack={() => navigate("home")} />;

  if (screen === "stats")
    return (
      <StatsScreen
        stats={stats}
        onBack={() => navigate("home")}
        onReset={resetStats}
      />
    );

  if (screen === "year_guessr" && selectedDeck)
    return (
      <YearGuessr deck={selectedDeck} onBack={() => navigate("mode_select")} />
    );

  if (screen === "endless" && selectedDeck)
    return (
      <EndlessGame deck={selectedDeck} onBack={() => navigate("mode_select")} />
    );

  if (screen === "context_detective" && selectedDeck)
    return (
      <ContextDetective
        deck={selectedDeck}
        onBack={() => navigate("mode_select")}
      />
    );

  if (screen === "who_was_there" && selectedDeck)
    return (
      <WhoWasThere deck={selectedDeck} onBack={() => navigate("mode_select")} />
    );

  if (screen === "game" && selectedDeck)
    return (
      <SortGame
        key={selectedDeck.id}
        deck={selectedDeck}
        stats={stats}
        onUpdateStats={handleUpdateStats}
        onBack={() =>
          navigate(
            selectedDeck.id.startsWith("bio-")
              ? "biografias_select"
              : "mode_select",
          )
        }
      />
    );

  if (screen === "daily" && selectedDeck) {
    const date = todayStr();
    const num = dayNumber(date);
    const streak = getDailyStreak(daily, selectedDeck.id);
    const result = getDailyResult(daily, selectedDeck.id, date);
    if (result)
      return (
        <DailyResultScreen
          deck={selectedDeck}
          result={result}
          dayNum={num}
          streak={streak}
          dailyState={daily}
          onBack={() => navigate("mode_select")}
        />
      );
    return (
      <SortGame
        key={`daily-${selectedDeck.id}-${date}`}
        deck={selectedDeck}
        stats={stats}
        onUpdateStats={handleUpdateStats}
        onBack={() => navigate("mode_select")}
        daily={{
          date,
          num,
          streak,
          onComplete: (r) => setDaily(recordDailyResult(selectedDeck.id, r)),
        }}
      />
    );
  }

  if (screen === "biografias_select") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-sm px-6 py-12">
          <button
            onClick={() => navigate("home")}
            className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors mb-8 block"
          >
            ← Volver
          </button>

          <div className="text-center mb-8">
            <span className="text-6xl block mb-3">{BIOGRAFIAS.emoji}</span>
            <h2 className="text-2xl font-extrabold text-text-primary m-0">
              {BIOGRAFIAS.name}
            </h2>
            <p className="text-sm text-text-tertiary mt-2">
              Elegí un personaje
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {BIOGRAFIAS.characters.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  navigate("game", characterToDeck(c));
                }}
                className="tile flex items-center gap-4 px-5 py-4 text-left group"
              >
                <span className="text-3xl shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary group-hover:text-ar-blue transition-colors">
                    {c.name}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {formatYear(c.birthYear)} – {formatYear(c.deathYear)} ·{" "}
                    {c.description}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="text-text-tertiary group-hover:text-ar-blue group-hover:translate-x-0.5 transition-all shrink-0"
                >
                  ›
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "mode_select" && selectedDeck) {
    const modes = [
      {
        id: "game",
        emoji: "📅",
        title: "Ordenar eventos",
        desc: "Arrastrá para ordenar cronológicamente",
      },
      {
        id: "endless",
        emoji: "♾️",
        title: "Endless",
        desc: "Ubicá eventos en la línea de tiempo — sin límite",
      },
      {
        id: "year_guessr",
        emoji: "🎯",
        title: "Year Guesser",
        desc: "Adiviná en qué año ocurrió cada evento",
      },
      {
        id: "context_detective",
        emoji: "🔍",
        title: "Context Detective",
        desc: "Leé la descripción y adiviná el evento",
      },
      {
        id: "who_was_there",
        emoji: selectedDeck.wwtMode === "ideas" ? "💡" : "👥",
        title:
          selectedDeck.wwtMode === "ideas"
            ? "¿Quién lo pensó?"
            : "¿Quién estuvo ahí?",
        desc:
          selectedDeck.wwtMode === "ideas"
            ? "Asociá filósofos con sus ideas correspondientes"
            : "Asociá figuras históricas con sus eventos correspondientes",
      },
    ] as const;

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-sm px-6 py-12">
          <button
            onClick={() => navigate("home")}
            className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors mb-8 block"
          >
            ← Volver
          </button>

          <div className="text-center mb-8">
            <span className="text-6xl block mb-3">{selectedDeck.emoji}</span>
            <h2 className="text-2xl font-extrabold text-text-primary m-0">
              {selectedDeck.name}
            </h2>
          </div>

          {/* Featured daily puzzle — same puzzle for everyone, per deck */}
          {(() => {
            const date = todayStr();
            const num = dayNumber(date);
            const streak = getDailyStreak(daily, selectedDeck.id);
            const played = !!getDailyResult(daily, selectedDeck.id, date);
            return (
              <button
                onClick={() => navigate("daily")}
                className="flex items-center gap-4 px-5 py-4 mb-3 rounded-2xl border border-ar-gold/40 bg-ar-gold/5 hover:border-ar-gold hover:bg-ar-gold/10 active:scale-[0.98] transition-all duration-150 cursor-pointer text-left w-full"
              >
                <span className="text-3xl shrink-0">📆</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary">
                    Puzzle Diario #{num}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {played
                      ? "✅ Completado — volvé mañana"
                      : "El mismo puzzle para todos"}
                  </div>
                </div>
                {streak > 0 && (
                  <span className="text-sm font-bold text-ar-gold shrink-0">
                    🔥 {streak}
                  </span>
                )}
              </button>
            );
          })()}

          <div className="flex flex-col gap-3">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => navigate(mode.id)}
                className="tile flex items-center gap-4 px-5 py-4 text-left group"
              >
                <span className="text-3xl shrink-0">{mode.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary group-hover:text-ar-blue transition-colors">
                    {mode.title}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {mode.desc}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="text-text-tertiary group-hover:text-ar-blue group-hover:translate-x-0.5 transition-all shrink-0"
                >
                  ›
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-[420px] px-6 py-12 text-center">
        <div className="flex h-[5px] rounded-full overflow-hidden gap-0.5 mb-8">
          <div className="flex-1 bg-ar-blue" />
          <div className="flex-1 bg-text-primary" />
          <div className="flex-1 bg-ar-blue" />
        </div>

        <div className="mb-2">
          <h1 className={`${TITLE_CLS} text-text-primary`}>History</h1>
          <h1 className={`${TITLE_CLS} text-ar-blue`}>Game</h1>
        </div>

        <div className="w-12 h-[3px] bg-ar-gold rounded-sm mx-auto my-3" />

        <p className="text-base text-text-secondary mb-8 leading-relaxed">
          Ordená eventos históricos de más antiguo a más reciente.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {DECKS.map((deck) => (
            <button
              key={deck.id}
              onClick={() => selectDeck(deck)}
              className="tile flex flex-col items-center gap-2 py-4 px-2 group"
            >
              <span className="text-4xl">{deck.emoji}</span>
              <span className="text-sm font-semibold text-text-primary group-hover:text-ar-blue transition-colors leading-tight">
                {deck.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => navigate("biografias_select")}
            className="tile flex flex-col items-center gap-2 py-4 px-2 group"
          >
            <span className="text-4xl">{BIOGRAFIAS.emoji}</span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-ar-blue transition-colors leading-tight">
              {BIOGRAFIAS.name}
            </span>
          </button>
        </div>

        <button
          onClick={() => navigate("stats")}
          className="w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-text-primary hover:border-text-tertiary transition-colors cursor-pointer"
        >
          📊 Estadísticas
        </button>

        {import.meta.env.DEV && (
          <button
            onClick={() => navigate("admin")}
            className="mt-3 bg-transparent border-none cursor-pointer text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            ⚙ Admin
          </button>
        )}
      </div>
    </div>
  );
}
