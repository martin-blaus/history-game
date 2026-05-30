import { useState, useEffect, useRef } from "react";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear, shuffle } from "./utils";

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_LIVES        = 3;
const STACK_AT         = 6;   // timeline length at which cards start tilting
const CORRECT_DELAY_MS = 650; // animation fills the pause
const WRONG_DELAY_MS   = 1400;
// Deterministic organic tilts — alternating sign, varying magnitude
const ROTS = [-2, 1.5, -2.5, 2, -1.5, 3, -1, 2.5, -3, 1.5, -2, 2];

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase    = "placing" | "correct" | "wrong" | "gameover" | "complete";
type GapStyle = "idle" | "dragover" | "correct" | "wrong" | "good";

// Static gap style lookup — lives outside the component so it's never recreated
const GAP_STYLES: Record<GapStyle, { line: string; text: string; bg: string; label: string }> = {
  idle:    { line: "border-border group-hover:border-ar-blue", text: "text-text-tertiary group-hover:text-ar-blue", bg: "",             label: "+" },
  dragover:{ line: "border-ar-blue", text: "text-ar-blue font-bold", bg: "bg-ar-blue/15", label: "↓" },
  correct: { line: "border-success", text: "text-success font-bold", bg: "bg-success/10", label: "✓" },
  wrong:   { line: "border-danger",  text: "text-danger font-bold",  bg: "bg-danger/10",  label: "✗" },
  good:    { line: "border-ar-gold", text: "text-ar-gold font-bold", bg: "bg-ar-gold/10", label: "✓" },
};

// ── Init helper ───────────────────────────────────────────────────────────────
function makeInitState(deck: Deck) {
  const s = shuffle(deck.events);
  return { timeline: [s[0]], incoming: s[1] ?? s[0], pool: s.slice(2) };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EndlessGame({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [init] = useState(() => makeInitState(deck));

  const [timeline, setTimeline]       = useState<HistoryEvent[]>(init.timeline);
  const [incoming, setIncoming]       = useState<HistoryEvent>(init.incoming);
  const [pool, setPool]               = useState<HistoryEvent[]>(init.pool);
  const [lives, setLives]             = useState(MAX_LIVES);
  const [score, setScore]             = useState(0);
  const [phase, setPhase]             = useState<Phase>("placing");
  const [chosenGap, setChosenGap]     = useState<number | null>(null);
  const [goodGap, setGoodGap]         = useState<number | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Game logic ───────────────────────────────────────────────────────────────
  function isCorrectGap(event: HistoryEvent, g: number): boolean {
    const before = timeline[g - 1];
    const after  = timeline[g];
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
      setGoodGap(findCorrectGap(incoming));
      setLives(l => l - 1);
      setPhase("wrong");
    }
  }

  useEffect(() => {
    if (phase === "correct") {
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
      }, CORRECT_DELAY_MS);
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
      }, WRONG_DELAY_MS);
      return () => clearTimeout(tid);
    }
  }, [phase, lives, pool]);

  function restart() {
    const { timeline: tl, incoming: inc, pool: p } = makeInitState(deck);
    setTimeline(tl);
    setIncoming(inc);
    setPool(p);
    setLives(MAX_LIVES);
    setScore(0);
    setPhase("placing");
    setChosenGap(null);
    setGoodGap(null);
  }

  // ── Drag helpers ──────────────────────────────────────────────────────────────
  function clearDrag() {
    setIsDragging(false);
    setDragOverGap(null);
  }

  // ── Touch drag ───────────────────────────────────────────────────────────────
  // Scans gap bounding rects instead of elementFromPoint — no pointer-events change needed.
  function handleTouchStart(e: React.TouchEvent) {
    if (phase !== "placing") return;
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;
    const touch = e.touches[0];
    // Query within the scroll container only — faster than document-wide
    const gapEls = scrollRef.current?.querySelectorAll<HTMLElement>("[data-gap-idx]");
    if (!gapEls) return;
    let bestGap: number | null = null;
    let bestDist = Infinity;
    gapEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (touch.clientY < rect.top - 50 || touch.clientY > rect.bottom + 50) return;
      const centerX = (rect.left + rect.right) / 2;
      const dist = Math.abs(touch.clientX - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        bestGap = parseInt(el.dataset.gapIdx ?? "");
      }
    });
    setDragOverGap(Number.isFinite(bestGap) ? bestGap : null);
  }

  function handleTouchEnd() {
    if (!isDragging) return;
    const target = dragOverGap;
    clearDrag();
    if (target !== null) handleGapClick(target);
  }

  // ── Gap rendering ─────────────────────────────────────────────────────────────
  const isStacking = timeline.length >= STACK_AT;

  function getGapInfo(g: number) {
    let gs: GapStyle = "idle";
    if      (phase === "correct" && g === chosenGap)  gs = "correct";
    else if (phase === "wrong"   && g === chosenGap)  gs = "wrong";
    else if (phase === "wrong"   && g === goodGap)    gs = "good";
    else if (isDragging          && g === dragOverGap) gs = "dragover";

    const width = gs === "dragover" ? (isStacking ? "w-9"            : "w-12")
                : gs !== "idle"     ? (isStacking ? "w-3"            : "w-7")
                :                     (isStacking ? "w-3 hover:w-7"  : "w-7 hover:w-11");

    return { ...GAP_STYLES[gs], gs, width };
  }

  function renderGap(g: number) {
    const { line, text, bg, label, width } = getGapInfo(g);
    const canClick = phase === "placing";
    return (
      <button
        key={`gap-${g}`}
        data-gap-idx={g}
        onClick={() => handleGapClick(g)}
        disabled={!canClick}
        onDragOver={(e) => { e.preventDefault(); setDragOverGap(g); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverGap(null);
        }}
        onDrop={(e) => { e.preventDefault(); clearDrag(); handleGapClick(g); }}
        className={`shrink-0 h-44 flex items-center justify-center relative transition-all duration-150 ${
          canClick ? "cursor-pointer group" : "cursor-default"
        } ${width} ${bg}`}
      >
        <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 border-l border-dashed transition-colors duration-150 ${line}`} />
        <span className={`relative text-[10px] bg-bg px-0.5 leading-none ${text}`}>
          {label}
        </span>
      </button>
    );
  }

  // ── Game over / complete ──────────────────────────────────────────────────────
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
            <button onClick={restart} className="w-full py-3 rounded-xl bg-ar-blue text-white font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity">
              Jugar de nuevo
            </button>
            <button onClick={onBack} className="w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-text-primary transition-colors cursor-pointer">
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-4 shrink-0">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors">
          ← Volver
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-bold text-ar-blue tracking-widest uppercase">Endless</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl leading-none">
            {Array.from({ length: MAX_LIVES }, (_, i) => i < lives ? "❤️" : "🩶").join("")}
          </span>
          <span className="text-xl font-extrabold text-text-primary">🏆 {score}</span>
        </div>
      </div>

      {/* Main content — vertically centered; shakes on wrong placement */}
      <div className={`flex-1 flex flex-col justify-center gap-5 pb-8 ${phase === "wrong" ? "card-shake" : ""}`}>

        {/* Incoming card — draggable; key includes year to handle same-name events */}
        <div
          key={`${incoming.event}-${incoming.year}`}
          draggable={phase === "placing"}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "incoming"); // required for Firefox
            setIsDragging(true);
          }}
          onDragEnd={clearDrag}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-52 mx-auto rounded-2xl border bg-bg-card overflow-hidden flex flex-col shadow-md select-none touch-none ${
            phase === "placing" ? "cursor-grab active:cursor-grabbing" : ""
          } ${phase === "correct" ? "card-exit border-success" : "border-border"}`}
        >
          {incoming.image ? (
            <img src={incoming.image} alt={incoming.event} className="w-full h-28 object-cover block shrink-0" draggable={false} />
          ) : (
            <div className="w-full h-20 bg-bg-secondary flex items-center justify-center shrink-0">
              <span className="text-3xl opacity-20">📅</span>
            </div>
          )}
          <div className="flex-1 p-3 flex flex-col gap-1">
            <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2">
              {incoming.event}
            </p>
            {incoming.context && (
              <p className="text-xs text-text-secondary m-0 line-clamp-3 leading-relaxed">
                {incoming.context}
              </p>
            )}
            <div className="mt-auto pt-2 flex justify-end">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-bg-secondary text-text-tertiary border border-border animate-pulse">
                ???
              </span>
            </div>
          </div>
        </div>

        {/* Prompt + pool count */}
        <div className="text-center">
          <p className="text-xs text-text-tertiary m-0">
            {isDragging ? "Soltá sobre una posición" : "Arrastrá o tocá entre los eventos"}
          </p>
          {pool.length > 0 && (
            <p className="text-xs text-text-tertiary opacity-40 mt-0.5 m-0">{pool.length} por colocar</p>
          )}
        </div>

        {/* Timeline row */}
        <div className="flex items-center gap-2 px-4">
          <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase shrink-0">Antes</span>

          <div ref={scrollRef} className="flex-1 overflow-x-auto" style={{ overflowY: "visible" }}>
            <div className="flex items-center h-44 w-max py-2 px-1">
              {[
                renderGap(0),
                ...timeline.flatMap((event, i) => {
                  const rot   = isStacking ? ROTS[i % ROTS.length] : 0;
                  const isNew = phase === "correct" && i === chosenGap;
                  const cardW = isStacking ? 100 : 128;

                  return [
                    // Outer: rotation + sizing (separate transform context prevents pop-in conflict)
                    <div
                      key={`card-${i}`}
                      data-card={i}
                      className="shrink-0 h-44"
                      style={{
                        width: cardW,
                        transform: `rotate(${rot}deg)`,
                        transformOrigin: "center center",
                        transition: "transform 500ms ease, width 500ms ease",
                        zIndex: isNew ? 50 : i + 1,
                      }}
                    >
                      {/* Inner: pop-in animation (no transform, so it doesn't conflict with outer rotation) */}
                      <div
                        className={`h-full rounded-xl border flex flex-col overflow-hidden ${
                          isNew
                            ? "card-pop-in border-success bg-success/10 ring-1 ring-success shadow-xl"
                            : "border-border bg-bg-card shadow-sm"
                        }`}
                      >
                        {event.image ? (
                          <img src={event.image} alt={event.event} className="w-full h-20 object-cover block shrink-0" draggable={false} />
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
                      </div>
                    </div>,
                    renderGap(i + 1),
                  ];
                }),
              ]}
            </div>
          </div>

          <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase shrink-0">Después</span>
        </div>

      </div>
    </div>
  );
}
