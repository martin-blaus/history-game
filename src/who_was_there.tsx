import { useState } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear, onImgError, shuffle } from "./utils";
import confetti from "canvas-confetti";

const ROUNDS = 6;

type RoundTypeA = {
  type: "A";
  person: string; // Underneath, can be figure (People mode) or idea name (Ideas mode)
  definition?: string; // For Ideas mode
  choices: HistoryEvent[]; // 6 options
  correctEvents: string[]; // correct choices' names
};

type RoundTypeB = {
  type: "B";
  event: HistoryEvent; // Card clue
  choices: string[]; // 4 text options
  correctPerson: string; // correct choice
};

type Round = RoundTypeA | RoundTypeB;

// Both modes are the same game over different "labels": historical figures
// (people mode) or idea names with a definition (ideas mode, "Name: definition").
type Label = { name: string; definition?: string };

function extractLabels(e: HistoryEvent, isIdeasMode: boolean): Label[] {
  if (isIdeasMode) {
    return (e.ideas ?? []).map((ideaStr) => {
      const [name, ...rest] = ideaStr.split(": ");
      return { name, definition: rest.join(": ") };
    });
  }
  return (e.people ?? []).map((name) => ({ name }));
}

function buildRounds(deck: Deck): Round[] {
  const isIdeasMode = deck.id === "filosofia";

  const labelToEvents: Record<string, HistoryEvent[]> = {};
  const definitions: Record<string, string> = {};
  const taggedEvents: HistoryEvent[] = [];

  deck.events.forEach((e) => {
    const labels = extractLabels(e, isIdeasMode);
    if (labels.length === 0) return;
    taggedEvents.push(e);
    labels.forEach(({ name, definition }) => {
      if (definition) definitions[name] = definition;
      (labelToEvents[name] ??= []).push(e);
    });
  });

  const allLabels = Object.keys(labelToEvents);
  // Type A rounds need 3 correct choices for a single label.
  const typeACandidates = allLabels.filter(
    (name) => labelToEvents[name].length >= 3
  );

  if (typeACandidates.length < 1 || allLabels.length < 4 || taggedEvents.length < ROUNDS) {
    return [];
  }

  const rounds: Round[] = [];
  const shuffledLabels = shuffle(typeACandidates);
  const shuffledEvents = shuffle(taggedEvents);

  let labelIdx = 0;
  let eventIdx = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const wantTypeA = i % 2 === 0;

    if (wantTypeA && labelIdx < shuffledLabels.length) {
      const label = shuffledLabels[labelIdx++];
      const correctChoices = shuffle(labelToEvents[label]).slice(0, 3);
      const distractors = shuffle(
        deck.events.filter(
          (e) => !extractLabels(e, isIdeasMode).some((l) => l.name === label)
        )
      ).slice(0, 3);

      rounds.push({
        type: "A",
        person: label,
        definition: definitions[label],
        choices: shuffle([...correctChoices, ...distractors]),
        correctEvents: correctChoices.map((c) => c.event),
      });
    } else {
      const event =
        eventIdx < shuffledEvents.length
          ? shuffledEvents[eventIdx++]
          : shuffledEvents[Math.floor(Math.random() * shuffledEvents.length)];

      const myLabels = extractLabels(event, isIdeasMode).map((l) => l.name);
      const correctLabel = myLabels[Math.floor(Math.random() * myLabels.length)];
      const distractors = shuffle(
        allLabels.filter((name) => !myLabels.includes(name))
      ).slice(0, 3);

      rounds.push({
        type: "B",
        event,
        choices: shuffle([correctLabel, ...distractors]),
        correctPerson: correctLabel,
      });
    }
  }

  return rounds;
}

export function WhoWasThere({
  deck,
  onBack,
}: {
  deck: Deck;
  onBack: () => void;
}) {
  const isIdeasMode = deck.id === "filosofia";
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(deck));
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Type A states
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [submittedA, setSubmittedA] = useState(false);

  // Type B states
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const round = rounds[roundIdx];

  function handleSelectEvent(eventName: string) {
    if (submittedA) return;
    setSelectedEvents((prev) => {
      if (prev.includes(eventName)) {
        return prev.filter((name) => name !== eventName);
      }
      if (prev.length < 3) {
        return [...prev, eventName];
      }
      return prev;
    });
  }

  function verifyA() {
    if (selectedEvents.length !== 3 || submittedA) return;
    setSubmittedA(true);
    const correctCount = selectedEvents.filter((name) =>
      (round as RoundTypeA).correctEvents.includes(name)
    ).length;

    if (correctCount === 3) {
      setScore((s) => s + 1);
    }
  }

  function handleSelectPerson(person: string) {
    if (selectedPerson) return;
    setSelectedPerson(person);
    if (person === (round as RoundTypeB).correctPerson) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (roundIdx + 1 >= ROUNDS) {
      setGameOver(true);
      const finalScore = score + (round.type === "A"
        ? (selectedEvents.filter((name) => (round as RoundTypeA).correctEvents.includes(name)).length === 3 ? 1 : 0)
        : (selectedPerson === (round as RoundTypeB).correctPerson ? 1 : 0));
      
      if (finalScore === ROUNDS) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
        }, 150);
      }
    } else {
      setRoundIdx((i) => i + 1);
      setSelectedEvents([]);
      setSubmittedA(false);
      setSelectedPerson(null);
    }
  }

  function restart() {
    setRounds(buildRounds(deck));
    setRoundIdx(0);
    setScore(0);
    setGameOver(false);
    setSelectedEvents([]);
    setSubmittedA(false);
    setSelectedPerson(null);
  }

  if (rounds.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-text-secondary text-sm mb-4">
            Este mazo no tiene suficiente información para jugar a este modo.
          </p>
          <button onClick={onBack} className="text-ar-blue text-sm border-none bg-transparent cursor-pointer font-semibold">
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const pct = Math.round((score / ROUNDS) * 100);
    const color =
      pct >= 70
        ? "text-success"
        : pct >= 40
        ? "text-ar-gold"
        : "text-danger";

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-md w-full px-6 py-12 text-center">
          <div className="text-xs font-bold text-ar-blue tracking-widest uppercase mb-6">
            {isIdeasMode ? "¿Quién lo pensó?" : "¿Quién estuvo ahí?"}
          </div>
          <div className={`text-6xl font-extrabold mb-1 ${color}`}>
            {score}/{ROUNDS}
          </div>
          <div className="text-text-tertiary text-sm mb-8">{pct}% correctos</div>

          <div className="flex flex-col gap-2.5 mb-8">
            {rounds.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-xl border border-border text-left"
              >
                <span className="text-sm">
                  {isIdeasMode
                    ? r.type === "A" ? "💡" : "👤"
                    : r.type === "A" ? "👥" : "📅"
                  }
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-bold m-0 truncate">
                    {r.type === "A" ? r.person : r.event.event}
                  </p>
                  <p className="text-text-tertiary text-[10px] m-0 truncate">
                    {isIdeasMode
                      ? r.type === "A"
                        ? `Defendida por: ${r.correctEvents.join(", ")}`
                        : `Idea: ${r.correctPerson}`
                      : r.type === "A"
                        ? `Involucrado en: ${r.correctEvents.join(", ")}`
                        : `Involucrado: ${r.correctPerson}`
                    }
                  </p>
                </div>
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
              className="flex-1 py-3 rounded-xl bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-semibold cursor-pointer transition-colors border-none"
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              {isIdeasMode ? "¿Quién lo pensó?" : "¿Quién estuvo ahí?"}
            </span>
          </div>
          <span className="text-xs text-text-tertiary w-10 text-right">
            {roundIdx + 1}/{ROUNDS}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                i < roundIdx
                  ? "bg-ar-blue"
                  : i === roundIdx
                  ? "bg-ar-blue opacity-60"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Round content */}
        {round.type === "A" ? (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                {isIdeasMode ? "Pregunta de Doctrina / Idea" : "Pregunta de Personaje"}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-primary mt-1 mb-2">
                {isIdeasMode ? (
                  <>
                    ¿Cuáles de estos 3 filósofos sostuvieron la idea <span className="text-ar-gold">{round.person}</span>?
                  </>
                ) : (
                  <>
                    ¿Cuáles de estos 3 eventos involucraron a <span className="text-ar-gold">{round.person}</span>?
                  </>
                )}
              </h2>
              {isIdeasMode && round.definition && (
                <p className="text-sm text-text-secondary max-w-2xl mx-auto italic mt-0 mb-3 leading-relaxed">
                  "{round.definition}"
                </p>
              )}
              <p className="text-xs text-text-tertiary m-0">
                Seleccioná exactamente 3 opciones y luego verificá.
              </p>
            </div>

            {/* Choices grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {round.choices.map((choice) => {
                const isSelected = selectedEvents.includes(choice.event);
                const isCorrect = round.correctEvents.includes(choice.event);

                let cardClass =
                  "border-border bg-bg-card hover:border-ar-blue hover:scale-[1.01]";
                if (isSelected && !submittedA) {
                  cardClass = "border-ar-blue bg-bg-secondary ring-1 ring-ar-blue scale-[1.01]";
                } else if (submittedA) {
                  if (isCorrect) {
                    cardClass =
                      "border-success bg-[rgba(34,197,94,0.08)] ring-1 ring-success";
                  } else if (isSelected) {
                    cardClass =
                      "border-danger bg-[rgba(239,68,68,0.08)] ring-1 ring-danger";
                  } else {
                    cardClass = "border-border bg-bg-card opacity-50";
                  }
                }

                return (
                  <div
                    key={choice.event}
                    onClick={() => handleSelectEvent(choice.event)}
                    className={`flex flex-col rounded-xl overflow-hidden border transition-all duration-200 select-none ${
                      submittedA ? "cursor-default" : "cursor-pointer"
                    } ${cardClass}`}
                  >
                    <img
                      src={choice.image || "/placeholder.png"}
                      alt={choice.event}
                      className="w-full h-32 object-cover object-top"
                      loading="lazy"
                      onError={onImgError}
                    />
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-bold text-text-primary m-0 line-clamp-2">
                          {choice.event}
                        </p>
                        {submittedA && (
                          <span className="text-xs">
                            {isCorrect ? "✅" : isSelected ? "❌" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary m-0 line-clamp-3">
                        {choice.context}
                      </p>
                      {submittedA && (
                        <p className="text-[9px] text-text-tertiary mt-auto pt-1 font-semibold">
                          {isIdeasMode ? "Año de nacimiento/activo:" : "Año:"} {formatYear(choice.year)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              {!submittedA ? (
                <button
                  onClick={verifyA}
                  disabled={selectedEvents.length !== 3}
                  className={`w-full max-w-xs py-3.5 rounded-xl text-base font-semibold transition-colors border-none ${
                    selectedEvents.length === 3
                      ? "bg-ar-blue hover:bg-ar-blue-dark text-white cursor-pointer"
                      : "bg-border text-text-tertiary cursor-not-allowed"
                  }`}
                >
                  Verificar ({selectedEvents.length}/3)
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full max-w-xs py-3.5 rounded-xl bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold cursor-pointer transition-colors border-none animate-pulse"
                >
                  {roundIdx + 1 >= ROUNDS ? "Ver resultados" : "Siguiente →"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                {isIdeasMode ? "Pregunta de Filósofo" : "Pregunta de Evento"}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-primary mt-1 mb-2">
                {isIdeasMode ? (
                  <>¿Qué idea o concepto fue propuesto por <span className="text-ar-gold">{round.event.event}</span>?</>
                ) : (
                  <>¿Qué figura histórica estuvo involucrada en este evento?</>
                )}
              </h2>
            </div>

            {/* Event/Philosopher Display */}
            <div className="bg-bg-card rounded-2xl border border-border p-5 mb-5 shadow-sm">
              <img
                src={round.event.image || "/placeholder.png"}
                alt={round.event.event}
                className="w-full h-44 object-cover rounded-xl mb-4 block"
                onError={onImgError}
              />
              <h3 className="text-base font-bold text-text-primary m-0 mb-2">
                {round.event.event}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed m-0">
                {round.event.context}
              </p>
              {selectedPerson && (
                <div className="mt-3 text-xs text-text-tertiary font-semibold">
                  {isIdeasMode ? "Año de nacimiento/activo:" : "Año del evento:"} {formatYear(round.event.year)}
                </div>
              )}
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-2.5 mb-6">
              {round.choices.map((choice) => {
                const isThis = choice === round.correctPerson;
                const wasSelected = selectedPerson === choice;

                let btnClass =
                  "border-border text-text-primary bg-bg-card hover:border-ar-blue hover:bg-bg-secondary";
                if (selectedPerson) {
                  if (isThis) {
                    btnClass =
                      "border-success bg-[rgba(34,197,94,0.08)] text-success font-semibold";
                  } else if (wasSelected) {
                    btnClass =
                      "border-danger bg-[rgba(239,68,68,0.08)] text-danger";
                  } else {
                    btnClass = "border-border text-text-tertiary bg-bg-card opacity-50";
                  }
                }

                return (
                  <button
                    key={choice}
                    onClick={() => handleSelectPerson(choice)}
                    disabled={!!selectedPerson}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${btnClass} ${
                      !selectedPerson ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{choice}</span>
                      {selectedPerson && isThis && <span>✓</span>}
                      {selectedPerson && wasSelected && !isThis && <span>✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {selectedPerson && (
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-xl bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold cursor-pointer transition-colors border-none"
              >
                {roundIdx + 1 >= ROUNDS ? "Ver resultados" : "Siguiente →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
