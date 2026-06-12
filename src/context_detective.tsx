import { useState } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear, onImgError, shuffle, PLACEHOLDER } from "./utils";

const ROUNDS = 6;

type Round = {
  event: HistoryEvent;
  choices: HistoryEvent[];
};

function buildRounds(deck: Deck): Round[] {
  const eligible = deck.events.filter(e => e.context.trim().length > 20);
  const questions = shuffle(eligible).slice(0, ROUNDS);

  return questions.map(event => {
    const distractors = shuffle(
      eligible.filter(e => e.event !== event.event)
    ).slice(0, 3);
    const choices = shuffle([...distractors, event]);
    return { event, choices };
  });
}

export function ContextDetective({ deck, onBack }: {
  deck: Deck;
  onBack: () => void;
}) {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(deck));
  const [roundIdx, setRoundIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  // One entry per answered round; the score is derived from it.
  const [results, setResults] = useState<boolean[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const score = results.filter(Boolean).length;

  const round = rounds[roundIdx];
  const isCorrect = picked === round?.event.event;

  function pick(eventName: string) {
    if (picked) return;
    setPicked(eventName);
    setResults(r => [...r, eventName === round.event.event]);
  }

  function next() {
    if (roundIdx + 1 >= ROUNDS) {
      setGameOver(true);
    } else {
      setRoundIdx(i => i + 1);
      setPicked(null);
    }
  }

  if (rounds.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-text-secondary text-sm mb-4">
            Este mazo no tiene suficiente contexto para jugar.
          </p>
          <button onClick={onBack} className="text-ar-blue text-sm">← Volver</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const pct = Math.round(score / ROUNDS * 100);
    const color = pct >= 70 ? "text-success" : pct >= 40 ? "text-ar-gold" : "text-danger";
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-sm w-full px-6 py-12 text-center">
          <div className="text-xs font-bold text-ar-blue tracking-widest uppercase mb-6">
            Context Detective
          </div>
          <div className={`text-6xl font-extrabold mb-1 ${color}`}>
            {score}/{ROUNDS}
          </div>
          <div className="text-text-tertiary text-sm mb-8">{pct}% correctos</div>

          <div className="flex flex-col gap-2 mb-8">
            {rounds.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-xl border border-border text-left">
                <img
                  src={r.event.image || PLACEHOLDER}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  onError={onImgError}
                />
                <span className="text-text-secondary text-xs leading-snug flex-1 line-clamp-2">{r.event.event}</span>
                <span className="shrink-0 text-sm">{results[i] ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={onBack} className="btn-secondary flex-1">
              ← Volver
            </button>
            <button
              onClick={() => {
                setRounds(buildRounds(deck));
                setRoundIdx(0);
                setPicked(null);
                setResults([]);
                setGameOver(false);
              }}
              className="btn-primary flex-1"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Context Detective
            </span>
          </div>
          <span className="text-xs text-text-tertiary w-10 text-right">
            {roundIdx + 1}/{ROUNDS}
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
              i < roundIdx ? "bg-ar-blue" :
              i === roundIdx ? "bg-ar-blue opacity-60" :
              "bg-border"
            }`} />
          ))}
        </div>

        {/* Context clue */}
        <div className="bg-bg-card rounded-2xl border border-border p-5 mb-5">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
            {deck.id === "filosofia" ? "¿De quién es esta descripción?" : "¿De qué evento es este contexto?"}
          </p>

          {/* Reveal image after answering */}
          {picked && (
            <img
              src={round.event.image || PLACEHOLDER}
              alt={round.event.event}
              className="w-full h-40 object-cover rounded-xl mb-4 block"
              onError={onImgError}
            />
          )}

          <p className="text-sm text-text-primary leading-relaxed m-0">
            {round.event.context}
          </p>

          {/* Reveal title + year after answering */}
          {picked && (
            <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${isCorrect ? "text-success" : "text-danger"}`}>
              <span>{isCorrect ? "✓" : "✗"}</span>
              <span>{round.event.event}</span>
              <span className="text-text-tertiary font-normal">— {formatYear(round.event.year)}</span>
            </div>
          )}
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2 mb-5">
          {round.choices.map(choice => {
            const isThis = choice.event === round.event.event;
            const wasSelected = picked === choice.event;

            let cls = "border-border text-text-primary bg-bg-card hover:border-ar-blue hover:bg-bg-secondary";
            if (picked) {
              if (isThis) cls = "border-success bg-[rgba(34,197,94,0.08)] text-success";
              else if (wasSelected) cls = "border-danger bg-[rgba(239,68,68,0.08)] text-danger";
              else cls = "border-border text-text-tertiary bg-bg-card opacity-50";
            }

            return (
              <button
                key={choice.event}
                onClick={() => pick(choice.event)}
                disabled={!!picked}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer ${cls} ${!picked ? "cursor-pointer" : "cursor-default"}`}
              >
                {choice.event}
              </button>
            );
          })}
        </div>

        {picked && (
          <button onClick={next} className="btn-primary w-full text-base">
            {roundIdx + 1 >= ROUNDS ? "Ver resultados" : "Siguiente →"}
          </button>
        )}
      </div>
    </div>
  );
}
