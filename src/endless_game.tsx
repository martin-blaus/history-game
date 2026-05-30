import { useState, useEffect, useRef } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear } from "./utils";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "placing" | "correct" | "wrong" | "gameover" | "complete";
type GapStyle = "idle" | "correct" | "wrong" | "good";

// stacking kicks in once this many cards are on the timeline
const STACK_AT = 6;
// deterministic organic rotations — alternating sign, varying magnitude
const ROTS = [-2, 1.5, -2.5, 2, -1.5, 3, -1, 2.5, -3, 1.5, -2, 2];

export function EndlessGame({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [init] = useState(() => {
    const s = shuffle(deck.events);
    return { timeline: [s[0]], incoming: s[1] ?? s[0], pool: s.slice(2) };
  });

  const [timeline, setTimeline] = useState<HistoryEvent[]>(init.timeline);
  const [incoming, setIncoming] = useState<HistoryEvent>(init.incoming);
  const [pool, setPool] = useState<HistoryEvent[]>(init.pool);
  const [lives, setLives] = useState(2);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("placing");
  const [chosenGap, setChosenGap] = useState<number | null>(null);
  const [goodGap, setGoodGap] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function isCorrectGap(event: HistoryEvent, g: number): boolean {
    const before = timeline[g - 1];
    const after = timeline[g];
    return (!before || event.year >= before.year) && (!after || event.year <= after.year);
  }

  function findCorrectGap(event: HistoryEvent): number {
    for (let i = 0; i <= timeline.length; i++) {
      if (isCorrectGap(event, i)) return i;
    }
    return timeline.length;
  }

  function handleGapClick(g: number) {
    if (phase !== "placing") return;
    setChosenGap(g);
    if (isCorrectGap(incoming, g)) {
      const newTl = [...timeline];
      newTl.splice(g, 0, incoming);
      setTimeline(newTl);
      setScore(s => s + 1);
      setPhase("correct");
    } else {
      const newLives = lives - 1;
      setGoodGap(findCorrectGap(incoming));
      setLives(newLives);
      setPhase("wrong");
    }
  }

  useEffect(() => {
    if (phase === "correct") {
      // scroll the newly-placed card into the center of the viewport
      if (scrollRef.current && chosenGap !== null) {
        const c = scrollRef.current;
        const cards = c.querySelectorAll<HTMLElement>("[data-card]");
        const target = cards[chosenGap];
        if (target) {
          c.scrollTo({
            left: target.offsetLeft - c.clientWidth / 2 + target.offsetWidth / 2,
            behavior: "smooth",
          });
        }
      }
      const tid = setTimeout(() => {
        if (pool.length === 0) { setPhase("complete"); return; }
        setIncoming(pool[0]);
        setPool(p => p.slice(1));
        setChosenGap(null);
        setPhase("placing");
      }, 900);
      return () => clearTimeout(tid);
    }
    if (phase === "wrong") {
      const tid = setTimeout(() => {
        if (lives <= 0) {
          setPhase("gameover");
        } else {
          setChosenGap(null);
          setGoodGap(null);
          setPhase("placing");
        }
      }, 1600);
      return () => clearTimeout(tid);
    }
  }, [phase, lives, pool]);

  function restart() {
    const s = shuffle(deck.events);
    setTimeline([s[0]]);
    setIncoming(s[1] ?? s[0]);
    setPool(s.slice(2));
    setLives(2);
    setScore(0);
    setPhase("placing");
    setChosenGap(null);
    setGoodGap(null);
  }

  const livesStr = [0, 1].map(i => i < lives ? "❤️" : "🩶").join("");
  const isStacking = timeline.length >= STACK_AT;

  function getGapStyle(g: number): GapStyle {
    if (phase === "correct" && g === chosenGap) return "correct";
    if (phase === "wrong" && g === chosenGap) return "wrong";
    if (phase === "wrong" && g === goodGap) return "good";
    return "idle";
  }

  const GAP: Record<GapStyle, { line: string; text: string; bg: string; label: string }> = {
    idle:    { line: "border-border group-hover:border-ar-blue", text: "text-text-tertiary group-hover:text-ar-blue", bg: "",             label: "+" },
    correct: { line: "border-success",  text: "text-success font-bold",  bg: "bg-success/10",  label: "✓" },
    wrong:   { line: "border-danger",   text: "text-danger font-bold",   bg: "bg-danger/10",   label: "✗" },
    good:    { line: "border-ar-gold",  text: "text-ar-gold font-bold",  bg: "bg-ar-gold/10",  label: "✓" },
  };

  function renderGap(g: number) {
    const gs = getGapStyle(g);
    const info = GAP[gs];
    const canClick = phase === "placing";
    return (
      <button
        key={`gap-${g}`}
        onClick={() => handleGapClick(g)}
        disabled={!canClick}
        className={`shrink-0 h-44 flex items-center justify-center relative transition-all duration-150 ${
          canClick ? "cursor-pointer group" : "cursor-default"
        } ${isStacking ? "w-3 hover:w-7" : "w-7 hover:w-11"} ${info.bg}`}
      >
        <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 border-l border-dashed ${info.line}`} />
        <span className={`relative text-[10px] bg-bg px-0.5 leading-none ${info.text}`}>
          {info.label}
        </span>
      </button>
    );
  }

  if (phase === "gameover" || phase === "complete") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-sm px-6 py-12 text-center">
          <div className="text-6xl mb-4">{phase === "complete" ? "🎉" : "💔"}</div>
          <h2 className="text-2xl font-extrabold text-text-primary mb-2">
            {phase === "complete" ? "¡Completado!" : "Fin del juego"}
          </h2>
          <p className="text-text-secondary mb-6">
            {phase === "complete"
              ? "Ubicaste todos los eventos correctamente"
              : "Se te acabaron las chances"}
          </p>
          <div className="bg-bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="text-5xl font-extrabold text-ar-blue">{score}</div>
            <div className="text-sm text-text-tertiary mt-1">eventos ubicados</div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={restart}
              className="w-full py-3 rounded-xl bg-ar-blue text-white font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
            >
              Jugar de nuevo
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-text-primary transition-colors cursor-pointer"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
        >
          ← Volver
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-bold text-ar-blue tracking-widest uppercase">Endless</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base leading-none">{livesStr}</span>
          <span className="text-sm font-bold text-text-primary">🏆 {score}</span>
        </div>
      </div>

      {/* Incoming card — compact horizontal layout */}
      <div className="px-4 pb-2 shrink-0">
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden flex">
          {incoming.image ? (
            <img
              src={incoming.image}
              alt={incoming.event}
              className="w-24 h-[88px] object-cover shrink-0"
              draggable={false}
            />
          ) : (
            <div className="w-14 h-[88px] bg-bg-secondary flex items-center justify-center shrink-0">
              <span className="text-2xl opacity-20">📅</span>
            </div>
          )}
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2">
              {incoming.event}
            </p>
            <div className="flex items-end justify-between gap-2 mt-1">
              {incoming.context && (
                <p className="text-xs text-text-secondary m-0 line-clamp-1 flex-1 min-w-0">
                  {incoming.context}
                </p>
              )}
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md bg-bg-secondary text-text-tertiary border border-border">
                ???
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt */}
      <p className="text-xs text-text-tertiary text-center pb-2 shrink-0">
        ¿Dónde va? Tocá entre los eventos
      </p>

      {/* Horizontal timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto pb-10 pt-6"
        style={{ overflowY: "visible" }}
      >
        {/* w-max so the row expands to fit all cards; items-center vertically centers rotated cards */}
        <div className="flex items-center h-44 px-4 w-max">
          {[
            renderGap(0),
            ...timeline.flatMap((event, i) => {
              const rot = isStacking ? ROTS[i % ROTS.length] : 0;
              const isNew = phase === "correct" && i === chosenGap;
              const cardW = isStacking ? 100 : 128;

              return [
                <div
                  key={`card-${i}`}
                  data-card="1"
                  style={{
                    width: cardW,
                    transform: `rotate(${rot}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 500ms ease, width 500ms ease",
                    zIndex: isNew ? 50 : i + 1,
                  }}
                  className={`shrink-0 h-44 rounded-xl border flex flex-col overflow-hidden transition-all duration-300 ${
                    isNew
                      ? "border-success bg-success/10 ring-1 ring-success shadow-xl"
                      : "border-border bg-bg-card shadow-sm"
                  }`}
                >
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.event}
                      className="w-full h-20 object-cover block shrink-0"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-14 bg-bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-2xl opacity-15">📅</span>
                    </div>
                  )}
                  <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden min-h-0">
                    <p className="text-[11px] font-semibold text-text-primary m-0 leading-tight line-clamp-3">
                      {event.event}
                    </p>
                    <span className="shrink-0 self-start text-[10px] font-bold text-ar-blue bg-ar-blue/10 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
                      {formatYear(event.year)}
                    </span>
                  </div>
                </div>,
                renderGap(i + 1),
              ];
            }),
          ]}
        </div>
      </div>
    </div>
  );
}
