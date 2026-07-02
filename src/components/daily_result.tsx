import { useState, useEffect, useMemo } from "react";
import type { Deck } from "../../data/index";
import {
  buildDailyShareText,
  msUntilNextMidnight,
  computeDailyStats,
  selectDailyPuzzle,
  type DailyResult,
  type DailyState,
} from "../daily";
import { shareText, formatYear } from "../utils";
import { MAX_ATTEMPTS } from "../constants";

const COPIED_FEEDBACK_MS = 2000;

export function DailyCountdown() {
  const [ms, setMs] = useState(() => msUntilNextMidnight());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <div className="text-center">
      <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
        Próximo puzzle en
      </p>
      <p className="text-2xl font-extrabold text-text-primary tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </p>
    </div>
  );
}

export function DailyResultScreen({
  deck,
  result,
  dayNum,
  streak,
  dailyState,
  onBack,
}: {
  deck: Deck;
  result: DailyResult;
  dayNum: number;
  streak: number;
  dailyState: DailyState;
  onBack: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const stats = useMemo(
    () => computeDailyStats(dailyState, deck.id),
    [dailyState, deck.id],
  );
  const maxDistribution = Math.max(1, ...stats.distribution);

  // The daily is deterministic, so today's answer can be recomputed to show
  // the correct chronological order after the round.
  const correctOrder = useMemo(
    () =>
      [...selectDailyPuzzle(deck, result.date).puzzle].sort(
        (a, b) => a.year - b.year,
      ),
    [deck, result.date],
  );

  function share() {
    const text = buildDailyShareText(result, deck.name, dayNum);
    void shareText(text).then((outcome) => {
      if (outcome === "shared") return;
      setCopyState(outcome);
      setTimeout(() => setCopyState("idle"), COPIED_FEEDBACK_MS);
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute left-0 top-0">
            <button
              onClick={onBack}
              className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
            >
              ← Volver
            </button>
          </div>
          <div className="text-center mt-7 sm:mt-0">
            <span className="text-5xl block mb-2">{deck.emoji}</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
              {deck.name} — Diario #{dayNum}
            </h1>
          </div>
        </div>

        {/* Banner */}
        {result.won ? (
          <div className="bg-[#0f2a1a]/80 border border-success/30 text-success px-6 py-4 rounded-xl text-center font-bold text-base mb-6">
            🏆 ¡Resuelto en {result.attemptsUsed}{" "}
            {result.attemptsUsed === 1 ? "intento" : "intentos"}!
          </div>
        ) : (
          <div className="bg-[#2a0f0f]/80 border border-danger/30 text-danger px-6 py-4 rounded-xl text-center font-bold text-base mb-6">
            💀 Hoy no salió — volvé mañana
          </div>
        )}

        {/* Streak */}
        {streak > 0 && (
          <div className="text-center text-ar-gold font-bold mb-6">
            🔥 Racha diaria: {streak} {streak === 1 ? "día" : "días"}
          </div>
        )}

        {/* Emoji grid */}
        <div className="flex flex-col gap-1.5 justify-center items-center mb-8">
          {result.grid.map((attempt, attemptIdx) => (
            <div key={attemptIdx} className="flex gap-1.5">
              {attempt.map((stat, cardIdx) => (
                <div
                  key={cardIdx}
                  className={`w-6 h-6 rounded-md shadow-sm ${
                    stat === "correct"
                      ? "bg-success border border-success/30"
                      : "bg-danger border border-danger/30"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 bg-bg-card border border-border rounded-xl divide-x divide-border overflow-hidden py-4 text-center mb-6 shadow-sm">
          <div>
            <div className="text-xl font-black text-text-primary tabular-nums">
              {stats.played}
            </div>
            <div className="text-2xs text-text-secondary uppercase tracking-wider font-bold mt-1">
              Jugadas
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-text-primary tabular-nums">
              {stats.winRate}%
            </div>
            <div className="text-2xs text-text-secondary uppercase tracking-wider font-bold mt-1">
              Victorias
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-text-primary tabular-nums">
              {streak}
            </div>
            <div className="text-2xs text-text-secondary uppercase tracking-wider font-bold mt-1">
              Racha
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-text-primary tabular-nums">
              {stats.maxStreak}
            </div>
            <div className="text-2xs text-text-secondary uppercase tracking-wider font-bold mt-1">
              Máx racha
            </div>
          </div>
        </div>

        {/* Attempts distribution */}
        <div className="mb-8">
          <h3 className="text-xs text-text-secondary uppercase tracking-widest font-semibold text-center mb-3">
            Distribución de intentos
          </h3>
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
              const count = stats.distribution[i] ?? 0;
              const isToday = result.won && result.attemptsUsed === i + 1;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-xs font-bold text-text-secondary text-right tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-5 rounded flex items-center justify-end px-2 text-xs font-bold text-white transition-all ${
                        isToday ? "bg-success" : "bg-bg-secondary"
                      }`}
                      style={{
                        width: `${Math.max(8, (count / maxDistribution) * 100)}%`,
                      }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Correct order */}
        <div className="mb-8">
          <h3 className="text-xs text-text-secondary uppercase tracking-widest font-semibold text-center mb-3">
            El orden correcto
          </h3>
          <ol className="flex flex-col gap-1.5">
            {correctOrder.map((e, i) => (
              <li
                key={e.event}
                className="flex items-center gap-3 bg-bg-card border border-border rounded-lg px-3 py-2"
              >
                <span className="text-xs font-bold text-text-tertiary tabular-nums shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-text-primary flex-1 min-w-0">
                  {e.event}
                </span>
                <span className="text-xs font-bold text-ar-gold tabular-nums shrink-0">
                  {formatYear(e.year)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-8">
          <DailyCountdown />
        </div>

        <button
          onClick={share}
          className={`btn-secondary w-full max-w-sm mx-auto ${
            copyState === "copied"
              ? "border-success text-success"
              : copyState === "failed"
                ? "border-danger text-danger"
                : ""
          }`}
        >
          {copyState === "copied"
            ? "¡Copiado!"
            : copyState === "failed"
              ? "No se pudo copiar"
              : "Compartir resultado"}
        </button>
      </div>
    </div>
  );
}
