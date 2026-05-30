import { useState, useMemo } from "react";
import { DECKS } from "../data/index";
import type { Deck } from "../data/index";
import { loadStats, saveStats, type AppStats } from "./storage";
import { AdminScreen } from "./admin";
import { YearGuessr } from "./year_guessr";
import { EndlessGame } from "./endless_game";
import { ContextDetective } from "./context_detective";
import { WhoWasThere } from "./who_was_there";
import { SortGame } from "./components/sort_game";
import { StatsScreen } from "./components/stats_screen";

export default function App() {
  const [screen, setScreen] = useState<
    | "home"
    | "mode_select"
    | "game"
    | "year_guessr"
    | "endless"
    | "context_detective"
    | "who_was_there"
    | "stats"
    | "admin"
  >("home");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState<AppStats>(() => loadStats());

  const titleCls = useMemo(
    () => "text-[48px] font-extrabold tracking-[-2px] m-0 leading-none",
    [],
  );

  function selectDeck(deck: Deck) {
    setSelectedDeck(deck);
    setScreen("mode_select");
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

  if (screen === "admin")
    return <AdminScreen onBack={() => setScreen("home")} />;

  if (screen === "stats")
    return (
      <StatsScreen
        stats={stats}
        onBack={() => setScreen("home")}
        onReset={resetStats}
      />
    );

  if (screen === "year_guessr" && selectedDeck)
    return (
      <YearGuessr deck={selectedDeck} onBack={() => setScreen("mode_select")} />
    );

  if (screen === "endless" && selectedDeck)
    return (
      <EndlessGame
        deck={selectedDeck}
        onBack={() => setScreen("mode_select")}
      />
    );

  if (screen === "context_detective" && selectedDeck)
    return (
      <ContextDetective
        deck={selectedDeck}
        onBack={() => setScreen("mode_select")}
      />
    );

  if (screen === "who_was_there" && selectedDeck)
    return (
      <WhoWasThere
        deck={selectedDeck}
        onBack={() => setScreen("mode_select")}
      />
    );

  if (screen === "game" && selectedDeck)
    return (
      <SortGame
        deck={selectedDeck}
        stats={stats}
        onUpdateStats={handleUpdateStats}
        onBack={() => setScreen("mode_select")}
      />
    );

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
        emoji: selectedDeck.id === "filosofia" ? "💡" : "👥",
        title:
          selectedDeck.id === "filosofia"
            ? "¿Quién lo pensó?"
            : "¿Quién estuvo ahí?",
        desc:
          selectedDeck.id === "filosofia"
            ? "Asociá filósofos con sus ideas correspondientes"
            : "Asociá figuras históricas con sus eventos correspondientes",
      },
    ] as const;

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-sm px-6 py-12">
          <button
            onClick={() => setScreen("home")}
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

          <div className="flex flex-col gap-3">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setScreen(mode.id)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-bg-card hover:border-ar-blue hover:bg-bg-secondary transition-all duration-150 cursor-pointer text-left group"
              >
                <span className="text-3xl shrink-0">{mode.emoji}</span>
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-ar-blue transition-colors">
                    {mode.title}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {mode.desc}
                  </div>
                </div>
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
          <h1 className={`${titleCls} text-text-primary`}>History</h1>
          <h1 className={`${titleCls} text-ar-blue`}>Game</h1>
        </div>

        <div className="w-12 h-[3px] bg-ar-gold rounded-sm mx-auto my-3" />

        <p className="text-[15px] text-text-secondary mb-8 leading-relaxed">
          Ordená eventos históricos de más antiguo a más reciente.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {DECKS.map((deck) => (
            <button
              key={deck.id}
              onClick={() => selectDeck(deck)}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-border bg-bg-card hover:border-ar-blue hover:bg-bg-secondary transition-all duration-150 cursor-pointer group"
            >
              <span className="text-4xl">{deck.emoji}</span>
              <span className="text-sm font-semibold text-text-primary group-hover:text-ar-blue transition-colors leading-tight">
                {deck.name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setScreen("stats")}
          className="w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-text-primary hover:border-borderLight transition-colors cursor-pointer"
        >
          📊 Estadísticas
        </button>

        <button
          onClick={() => setScreen("admin")}
          className="mt-3 bg-transparent border-none cursor-pointer text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ⚙ Admin
        </button>
      </div>
    </div>
  );
}
