import { useState } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear } from "./utils";

const ROUNDS = 6;

function calcScore(guess: number, actual: number): number {
  return Math.max(0, Math.round(100 - Math.abs(guess - actual) * 2));
}

function pickEvents(deck: Deck): HistoryEvent[] {
  return [...deck.events].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
}

export function YearGuessr({ deck, onBack }: {
  deck: Deck;
  onBack: () => void;
}) {
  const minYear = Math.min(...deck.events.map(e => e.year));
  const maxYear = Math.max(...deck.events.map(e => e.year));
  const midYear = Math.round((minYear + maxYear) / 2);

  const [events, setEvents] = useState<HistoryEvent[]>(() => pickEvents(deck));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(midYear);
  const [confirmed, setConfirmed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const event = events[round];
  const roundScore = confirmed ? calcScore(guess, event.year) : null;

  function confirm() {
    setScores(prev => [...prev, calcScore(guess, event.year)]);
    setConfirmed(true);
  }

  function next() {
    if (round + 1 >= ROUNDS) {
      setGameOver(true);
    } else {
      setRound(r => r + 1);
      setGuess(midYear);
      setConfirmed(false);
    }
  }

  function restart() {
    setEvents(pickEvents(deck));
    setRound(0);
    setGuess(midYear);
    setConfirmed(false);
    setScores([]);
    setGameOver(false);
  }

  if (gameOver) {
    const total = scores.reduce((a, b) => a + b, 0);
    const pct = Math.round(total / (ROUNDS * 100) * 100);
    const color = pct >= 70 ? "text-success" : pct >= 40 ? "text-ar-gold" : "text-danger";
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-sm w-full px-6 py-12 text-center">
          <div className="text-xs font-bold text-ar-blue tracking-widest uppercase mb-6">Year Guessr</div>
          <div className={`text-6xl font-extrabold mb-1 ${color}`}>{pct}%</div>
          <div className="text-text-tertiary text-sm mb-8">{total} / {ROUNDS * 100} pts</div>

          <div className="flex flex-col gap-2 mb-8">
            {events.map((ev, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 bg-bg-card rounded-xl border border-border">
                <span className="text-text-secondary text-sm text-left leading-snug flex-1 mr-3 line-clamp-1">{ev.event}</span>
                <span className={`shrink-0 text-sm font-bold ${
                  scores[i] >= 70 ? "text-success" : scores[i] >= 40 ? "text-ar-gold" : "text-danger"
                }`}>
                  {scores[i]} pts
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-border bg-transparent text-text-secondary text-sm font-medium cursor-pointer hover:text-text-primary transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-xl bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-semibold cursor-pointer transition-colors"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const diff = confirmed ? Math.abs(guess - event.year) : null;
  const scoreColor = roundScore !== null
    ? roundScore >= 70 ? "text-success" : roundScore >= 40 ? "text-ar-gold" : "text-danger"
    : "";

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center mb-5">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
          >
            ← Volver
          </button>
          <div className="flex-1 text-center">
            <span className="text-xs font-bold text-ar-blue tracking-widest uppercase">
              Year Guessr
            </span>
          </div>
          <span className="text-xs text-text-tertiary w-10 text-right">
            {round + 1}/{ROUNDS}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
              i < round ? "bg-ar-blue" :
              i === round ? "bg-ar-blue opacity-60" :
              "bg-border"
            }`} />
          ))}
        </div>

        {/* Event card */}
        <div className="bg-bg-card rounded-2xl overflow-hidden mb-5 border border-border">
          <img
            src={event.image || "/placeholder.png"}
            alt={event.event}
            className="w-full h-52 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
          <div className="p-5">
            <h2 className="text-base font-bold text-text-primary mb-2 leading-snug">{event.event}</h2>
            {event.context && (
              <p className="text-sm text-text-secondary leading-relaxed m-0">{event.context}</p>
            )}
          </div>
        </div>

        {/* Guess / Result panel */}
        {!confirmed ? (
          <div className="bg-bg-card rounded-2xl border border-border p-6">
            <p className="text-xs text-text-tertiary text-center mb-4 uppercase tracking-widest">
              ¿En qué año ocurrió?
            </p>
            <div className="text-center mb-5">
              <span className="text-5xl font-extrabold text-text-primary tabular-nums">
                {formatYear(guess)}
              </span>
            </div>
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={guess}
              onChange={e => setGuess(Number(e.target.value))}
              className="w-full mb-2 accent-ar-blue cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-tertiary mb-6">
              <span>{formatYear(minYear)}</span>
              <span>{formatYear(maxYear)}</span>
            </div>
            <button
              onClick={confirm}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-gray-100 text-black text-base font-semibold cursor-pointer transition-colors border-none"
            >
              Confirmar
            </button>
          </div>
        ) : (
          <div className="bg-bg-card rounded-2xl border border-border p-6 text-center">
            <div className={`text-5xl font-extrabold mb-1 ${scoreColor}`}>
              {roundScore} pts
            </div>
            <div className={`text-sm font-semibold mb-4 ${scoreColor}`}>
              {diff === 0 ? "¡Perfecto!" :
               diff! <= 5 ? "¡Excelente!" :
               diff! <= 15 ? "¡Bien!" :
               diff! <= 30 ? "Cerca..." :
               "Lejos"}
            </div>

            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div>
                <div className="text-text-tertiary text-xs mb-0.5">Tu respuesta</div>
                <div className="font-semibold text-text-secondary">{formatYear(guess)}</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="text-text-tertiary text-xs mb-0.5">Año real</div>
                <div className="font-bold text-text-primary">{formatYear(event.year)}</div>
              </div>
              {diff! > 0 && (
                <>
                  <div className="w-px bg-border" />
                  <div>
                    <div className="text-text-tertiary text-xs mb-0.5">Diferencia</div>
                    <div className="font-semibold text-text-secondary">{diff} años</div>
                  </div>
                </>
              )}
            </div>

            {/* Running total */}
            <div className="text-xs text-text-tertiary mb-5">
              Total: {scores.reduce((a, b) => a + b, 0)} pts
            </div>

            <button
              onClick={next}
              className="w-full py-3.5 rounded-xl bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold cursor-pointer transition-colors border-none"
            >
              {round + 1 >= ROUNDS ? "Ver resultados" : "Siguiente →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
