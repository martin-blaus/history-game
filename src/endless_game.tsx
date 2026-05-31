import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { Deck, HistoryEvent } from "../data/index";
import { formatYear, shuffle } from "./utils";

// Subcomponents & Types
import { EndlessHeader } from "./components/endless/header";
import { EndlessGameOver } from "./components/endless/game_over";
import { EndlessIncomingCard } from "./components/endless/incoming_card";
import { EndlessTimelineCard } from "./components/endless/timeline_card";
import { EndlessGap } from "./components/endless/gap";
import { GAP_STYLES } from "./components/endless/types";
import type { Phase, GapStyle } from "./components/endless/types";

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_LIVES = 3;
const STACK_AT = 6;
const CORRECT_DELAY_MS = 650;
const WRONG_DELAY_MS = 1400;
const BEST_KEY = "endless-best-score";
const ROTS = [-2, 1.5, -2.5, 2, -1.5, 3, -1, 2.5, -3, 1.5, -2, 2];

function calcMultiplier(streak: number): number {
  return streak >= 6 ? 3 : streak >= 3 ? 2 : 1;
}

// ── Init helper ───────────────────────────────────────────────────────────────
function makeInitState(deck: Deck) {
  const s = shuffle(deck.events);
  return { timeline: [s[0]], incoming: s[1] ?? s[0], pool: s.slice(2) };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EndlessGame({
  deck,
  onBack,
}: {
  deck: Deck;
  onBack: () => void;
}) {
  const [init] = useState(() => makeInitState(deck));

  const [timeline, setTimeline] = useState<HistoryEvent[]>(init.timeline);
  const [incoming, setIncoming] = useState<HistoryEvent>(init.incoming);
  const [pool, setPool] = useState<HistoryEvent[]>(init.pool);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem(BEST_KEY) ?? "0"),
  );
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [phase, setPhase] = useState<Phase>("placing");
  const [chosenGap, setChosenGap] = useState<number | null>(null);
  const [goodGap, setGoodGap] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Game logic ───────────────────────────────────────────────────────────────
  function isCorrectGap(event: HistoryEvent, g: number): boolean {
    const before = timeline[g - 1];
    const after = timeline[g];
    return (
      (!before || event.year >= before.year) &&
      (!after || event.year <= after.year)
    );
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
      setScore((s) => s + calcMultiplier(streak));
      setStreak((s) => s + 1);
      setPhase("correct");
    } else {
      setGoodGap(findCorrectGap(incoming));
      setLives((l) => l - 1);
      setStreak(0);
      setPhase("wrong");
    }
  }

  // Transition effects
  useEffect(() => {
    if (phase === "correct") {
      if (scrollRef.current && chosenGap !== null) {
        const c = scrollRef.current;
        const cards = c.querySelectorAll<HTMLElement>("[data-card]");
        const target = cards[chosenGap];
        if (target) {
          c.scrollTo({
            left:
              target.offsetLeft - c.clientWidth / 2 + target.offsetWidth / 2,
            behavior: "smooth",
          });
        }
      }
      const tid = setTimeout(() => {
        if (pool.length === 0) {
          setPhase("complete");
          return;
        }
        setIncoming(pool[0]);
        setPool((p) => p.slice(1));
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

  // Personal best detection — fires once when game ends
  useEffect(() => {
    if (phase !== "gameover" && phase !== "complete") return;
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem(BEST_KEY, String(score));
      setIsNewRecord(true);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 } });
    }
  }, [phase]); // score is final when phase changes to gameover/complete

  function restart() {
    const { timeline: tl, incoming: inc, pool: p } = makeInitState(deck);
    setTimeline(tl);
    setIncoming(inc);
    setPool(p);
    setLives(MAX_LIVES);
    setScore(0);
    setStreak(0);
    setIsNewRecord(false);
    setPhase("placing");
    setChosenGap(null);
    setGoodGap(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function clearDrag() {
    setIsDragging(false);
    setDragOverGap(null);
  }

  function howClose(): string {
    if (goodGap === null) return "";
    const before = timeline[goodGap - 1];
    const after = timeline[goodGap];
    if (!before) return `Debe ir antes de ${formatYear(after!.year)}`;
    if (!after) return `Debe ir después de ${formatYear(before.year)}`;
    return `Debe ir entre ${formatYear(before.year)} y ${formatYear(after.year)}`;
  }

  // ── Touch drag ───────────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    if (phase !== "placing") return;
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const gapEls =
      scrollRef.current?.querySelectorAll<HTMLElement>("[data-gap-idx]");
    if (!gapEls) return;
    let bestGap: number | null = null;
    let bestDist = Infinity;
    gapEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (touch.clientY < rect.top - 50 || touch.clientY > rect.bottom + 50)
        return;
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
  const multiplier = calcMultiplier(streak);

  function getGapInfo(g: number) {
    let gs: GapStyle = "idle";
    if (phase === "correct" && g === chosenGap) gs = "correct";
    else if (phase === "wrong" && g === chosenGap) gs = "wrong";
    else if (phase === "wrong" && g === goodGap) gs = "good";
    else if (isDragging && g === dragOverGap) gs = "dragover";

    const width =
      gs === "dragover"
        ? isStacking
          ? "w-[43px]"
          : "w-[58px]"
        : gs !== "idle"
          ? isStacking
            ? "w-[14px]"
            : "w-[34px]"
          : isStacking
            ? "w-[14px] hover:w-[34px]"
            : "w-[34px] hover:w-[53px]";

    return { ...GAP_STYLES[gs], gs, width };
  }

  function renderGap(g: number) {
    const { line, text, bg, label, width } = getGapInfo(g);
    const canClick = phase === "placing";
    return (
      <EndlessGap
        key={`gap-${g}`}
        gapIdx={g}
        canClick={canClick}
        line={line}
        text={text}
        bg={bg}
        label={label}
        width={width}
        onClick={() => handleGapClick(g)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverGap(g);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setDragOverGap(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          clearDrag();
          handleGapClick(g);
        }}
      />
    );
  }

  // ── Game over / complete ──────────────────────────────────────────────────────
  if (phase === "gameover" || phase === "complete") {
    return (
      <EndlessGameOver
        phase={phase}
        score={score}
        bestScore={bestScore}
        isNewRecord={isNewRecord}
        timeline={timeline}
        onRestart={restart}
        onBack={onBack}
      />
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <EndlessHeader
        onBack={onBack}
        streak={streak}
        multiplier={multiplier}
        lives={lives}
        maxLives={MAX_LIVES}
        score={score}
        phase={phase}
      />

      {/* Main content — vertically centered; shakes on wrong */}
      <div
        className={`flex-1 flex flex-col justify-center gap-4 pb-8 ${
          phase === "wrong" ? "card-shake" : ""
        }`}
      >
        <EndlessIncomingCard
          incoming={incoming}
          phase={phase}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "incoming");
            setIsDragging(true);
          }}
          onDragEnd={clearDrag}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Prompt / wrong feedback */}
        <div className="text-center px-4">
          {phase === "wrong" ? (
            <p className="text-xs font-semibold text-danger m-0">
              {howClose()}
            </p>
          ) : (
            <p className="text-xs text-text-tertiary m-0">
              {isDragging
                ? "Soltá sobre una posición"
                : "Arrastrá o tocá entre los eventos"}
            </p>
          )}
          {pool.length > 0 && phase !== "wrong" && (
            <p className="text-xs text-text-tertiary opacity-40 mt-0.5 m-0">
              {pool.length} por colocar
            </p>
          )}
        </div>

        {/* Timeline row */}
        <div className="flex items-center gap-2 px-4">
          <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase shrink-0">
            Antes
          </span>

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto"
            style={{ overflowY: "visible" }}
          >
            <div className="flex items-center h-[212px] w-max py-2 px-1">
              {[
                renderGap(0),
                ...timeline.flatMap((event, i) => {
                  const rot = isStacking ? ROTS[i % ROTS.length] : 0;
                  const isNew = phase === "correct" && i === chosenGap;
                  const cardW = isStacking ? 120 : 154;

                  return [
                    <EndlessTimelineCard
                      key={`card-${i}`}
                      event={event}
                      index={i}
                      cardW={cardW}
                      rot={rot}
                      isNew={isNew}
                    />,
                    renderGap(i + 1),
                  ];
                }),
              ]}
            </div>
          </div>

          <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase shrink-0">
            Después
          </span>
        </div>
      </div>
    </div>
  );
}
