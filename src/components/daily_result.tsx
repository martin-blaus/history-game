import { useState, useEffect } from "react";
import type { Deck } from "../../data/index";
import {
  buildDailyShareText,
  msUntilNextMidnight,
  type DailyResult,
} from "../daily";

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
  onBack,
}: {
  deck: Deck;
  result: DailyResult;
  dayNum: number;
  streak: number;
  onBack: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  function share() {
    const text = buildDailyShareText(result, deck.name, dayNum);
    navigator.clipboard.writeText(text).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
    setTimeout(() => setCopyState("idle"), COPIED_FEEDBACK_MS);
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
            🏆 ¡Resuelto en {result.attemptsUsed} {result.attemptsUsed === 1 ? "intento" : "intentos"}!
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
