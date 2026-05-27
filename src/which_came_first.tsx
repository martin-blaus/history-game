import { useState, useEffect } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear } from "./utils";

function pickPair(deck: Deck): [HistoryEvent, HistoryEvent] {
  const pool = [...deck.events].sort(() => Math.random() - 0.5);
  const a = pool[0];
  // ensure different years so there's a clear answer
  const b = pool.find(e => e.year !== a.year) ?? pool[1];
  return [a, b];
}

type Side = "left" | "right";

export function WhichCameFirst({ deck, onBack }: {
  deck: Deck;
  onBack: () => void;
}) {
  const [[left, right], setPair] = useState<[HistoryEvent, HistoryEvent]>(
    () => pickPair(deck)
  );
  const [picked, setPicked] = useState<Side | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [roundKey, setRoundKey] = useState(0);

  const correctSide: Side = left.year <= right.year ? "left" : "right";
  const wasCorrect = picked !== null && picked === correctSide;

  function pick(side: Side) {
    if (picked) return;
    const correct = side === correctSide;
    setPicked(side);
    setTotalPlayed(t => t + 1);
    if (correct) {
      setTotalCorrect(c => c + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  }

  // Auto-advance after showing feedback
  useEffect(() => {
    if (!picked) return;
    const t = setTimeout(() => {
      setPair(pickPair(deck));
      setPicked(null);
      setRoundKey(k => k + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [picked, deck]);

  function cardRingClass(side: Side) {
    if (!picked) return "border-border hover:border-ar-blue";
    if (side === correctSide) return "ring-2 ring-success border-success";
    if (side === picked) return "ring-2 ring-danger border-danger";
    return "border-border opacity-60";
  }

  function yearBadgeClass(side: Side) {
    if (side === correctSide) return "bg-success text-white";
    return "bg-danger text-white";
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
          >
            ← Volver
          </button>
          <div className="flex-1 text-center">
            <span className="text-xs font-bold text-ar-blue tracking-widest uppercase">
              ¿Cuál fue primero?
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="font-bold text-text-primary">
              🔥 {streak}
            </span>
            {bestStreak > 0 && (
              <span className="text-text-tertiary text-xs">
                mejor: {bestStreak}
              </span>
            )}
          </div>
        </div>

        {/* Prompt */}
        <p className="text-center text-lg font-semibold text-text-primary mb-6">
          ¿Cuál ocurrió primero?
        </p>

        {/* Cards */}
        <div key={roundKey} className="grid grid-cols-2 gap-4 mb-6">
          {(["left", "right"] as Side[]).map(side => {
            const event = side === "left" ? left : right;
            const canClick = !picked;
            return (
              <button
                key={side}
                onClick={() => pick(side)}
                disabled={!canClick}
                className={`flex flex-col rounded-2xl border overflow-hidden bg-bg-card text-left transition-all duration-200 ${cardRingClass(side)} ${canClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl" : "cursor-default"}`}
              >
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.event}
                    className="w-full h-44 object-cover block"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-44 bg-bg-secondary flex items-center justify-center">
                    <span className="text-5xl opacity-20">📅</span>
                  </div>
                )}

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2">
                    {event.event}
                  </p>
                  {event.context && (
                    <p className="text-xs text-text-secondary leading-relaxed m-0 line-clamp-3">
                      {event.context}
                    </p>
                  )}
                  {picked && (
                    <div className={`mt-auto pt-2 inline-block self-start text-xs font-bold px-2 py-1 rounded-md ${yearBadgeClass(side)}`}>
                      {formatYear(event.year)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback message */}
        <div className={`text-center text-base font-semibold transition-opacity duration-200 ${picked ? "opacity-100" : "opacity-0"}`}>
          {picked && (
            wasCorrect
              ? <span className="text-success">✓ ¡Correcto!</span>
              : <span className="text-danger">✗ Era {formatYear(correctSide === "left" ? left.year : right.year)}</span>
          )}
        </div>

        {/* Running stats */}
        {totalPlayed > 0 && (
          <p className="text-center text-xs text-text-tertiary mt-3">
            {totalCorrect}/{totalPlayed} correctos
          </p>
        )}
      </div>
    </div>
  );
}
