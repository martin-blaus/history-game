import { Fragment, useState, useRef, useEffect, useLayoutEffect } from "react";
import confetti from "canvas-confetti";
import type { Deck, HistoryEvent } from "../../data/index";
import { selectPuzzle, recordResult, recordDeckResult, type AppStats } from "../storage";
import { Card, InsertionIndicator, statusEmoji } from "./sort_card";
import { WikipediaSheet } from "./WikipediaSheet";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShareText(history: ("correct" | "wrong")[][], deckName: string, won: boolean): string {
  const grid = history.map(row => row.map(statusEmoji).join("")).join("\n");
  const tries = won ? `${history.length}/5` : "X/5";
  return `${deckName} (${tries})\n\n${grid}\n\nhttps://history-game-7a8e2.web.app`;
}

export function SortGame({
  deck,
  stats,
  onUpdateStats,
  onBack,
}: {
  deck: Deck;
  stats: AppStats;
  onUpdateStats: (newStats: AppStats) => void;
  onBack: () => void;
}) {
  const [puzzle, setPuzzle] = useState<HistoryEvent[]>([]);
  const [cards, setCards] = useState<HistoryEvent[]>([]);
  const [dragSource, setDragSource] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<("correct" | "wrong")[]>([]);
  const [finalStatuses, setFinalStatuses] = useState<("correct" | "wrong")[]>(
    []
  );
  const [submitted, setSubmitted] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [hintCardId, setHintCardId] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [attemptsHistory, setAttemptsHistory] = useState<("correct" | "wrong")[][]>([]);
  const [puzzleNum, setPuzzleNum] = useState(1);
  const [copied, setCopied] = useState(false);
  const [wikiEvent, setWikiEvent] = useState<HistoryEvent | null>(null);

  const touchRef = useRef<{
    startIdx: number | null;
    dropTarget: number | null;
    startX: number;
  }>({
    startIdx: null,
    dropTarget: null,
    startX: 0,
  });
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFlipRef = useRef<Map<string, number> | null>(null);

  // Initialize first puzzle on mount
  useEffect(() => {
    loadPuzzle(selectPuzzle(deck, stats));
  }, [deck]);

  function loadPuzzle(p: HistoryEvent[]) {
    setPuzzle(p);
    setCards(shuffle(p));
    setStatuses([]);
    setFinalStatuses([]);
    setSubmitted(false);
    setRevealedCount(0);
    setHintCardId(null);
    setAttemptsLeft(5);
    setAttemptsHistory([]);
  }

  function nextPuzzle() {
    loadPuzzle(selectPuzzle(deck, stats));
    setPuzzleNum((n) => n + 1);
  }

  function useHint() {
    if (hintCardId || submitted) return;
    const sorted = [...puzzle].sort((a, b) => a.year - b.year);
    const middle = sorted[Math.floor(sorted.length / 2)];
    const correctIdx = sorted.indexOf(middle);
    setCards((prev) => {
      const next = [...prev];
      const currentIdx = next.findIndex((c) => c.event === middle.event);
      if (currentIdx === correctIdx) return prev;
      next.splice(currentIdx, 1);
      next.splice(correctIdx, 0, middle);
      return next;
    });
    setHintCardId(middle.event);
  }

  function commitDrop(src: number, dst: number) {
    if (src === dst || src + 1 === dst) return;
    // FLIP step 1: record each card's current left position by id
    const els = document.querySelectorAll<HTMLElement>(".sort-card");
    const oldPositions = new Map<string, number>();
    els.forEach((el, i) => {
      const id = cards[i]?.event;
      if (id) oldPositions.set(id, el.getBoundingClientRect().left);
    });
    pendingFlipRef.current = oldPositions;

    setCards((prev) => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      const adj = dst > src ? dst - 1 : dst;
      next.splice(adj, 0, moved);
      return next;
    });
  }

  // FLIP steps 2-4: after DOM updates, invert and play
  useLayoutEffect(() => {
    const oldPositions = pendingFlipRef.current;
    if (!oldPositions) return;
    pendingFlipRef.current = null;

    const els = document.querySelectorAll<HTMLElement>(".sort-card");
    els.forEach((el, i) => {
      const id = cards[i]?.event;
      if (!id) return;
      const oldLeft = oldPositions.get(id);
      if (oldLeft === undefined) return;
      const dx = oldLeft - el.getBoundingClientRect().left;
      if (Math.abs(dx) < 1) return;

      el.style.transition = "none";
      el.style.transform = `translateX(${dx}px)`;
      void el.offsetWidth; // force reflow so the browser registers the start position
      el.style.transition = "transform 300ms ease-out";
      el.style.transform = "";
      el.addEventListener(
        "transitionend",
        () => {
          el.style.transition = "";
        },
        { once: true }
      );
    });
  }, [cards]);

  function handleDragStart(i: number) {
    setDragSource(i);
    setDropTarget(i);
  }

  function handleDragOver(i: number, clientX: number, rect: DOMRect) {
    if (dragSource === null) return;
    if (cards[i]?.event === hintCardId) return;
    const insertBefore = clientX < rect.left + rect.width / 2;
    setDropTarget(insertBefore ? i : i + 1);
  }

  function handleDragEnd() {
    setDragSource(null);
    setDropTarget(null);
  }

  function handleDrop() {
    if (dragSource !== null && dropTarget !== null) {
      commitDrop(dragSource, dropTarget);
    }
    setDragSource(null);
    setDropTarget(null);
  }

  function handleTouchStart(e: React.TouchEvent, i: number) {
    touchRef.current = {
      startIdx: i,
      dropTarget: i,
      startX: e.touches[0].clientX,
    };
    setDragSource(i);
    setDropTarget(i);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchRef.current.startIdx === null) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    const els = document.querySelectorAll<HTMLElement>(".sort-card");
    let newTarget: number | null = null;

    els.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) {
        newTarget = x < rect.left + rect.width / 2 ? i : i + 1;
      }
    });

    if (newTarget === null) return;
    if (newTarget < cards.length && cards[newTarget]?.event === hintCardId)
      return;
    touchRef.current.dropTarget = newTarget;
    setDropTarget(newTarget);
  }

  function handleTouchEnd() {
    const src = touchRef.current.startIdx;
    const dst = touchRef.current.dropTarget;
    if (src !== null && dst !== null) {
      commitDrop(src, dst);
    }
    touchRef.current = { startIdx: null, dropTarget: null, startX: 0 };
    setDragSource(null);
    setDropTarget(null);
  }

  function submit() {
    const sorted = [...puzzle].sort((a, b) => a.year - b.year);
    const s: ("correct" | "wrong")[] = cards.map((c, i) =>
      c.event === sorted[i].event ? "correct" : "wrong"
    );

    const allCorrect = s.every((x) => x === "correct");
    const newAttemptsLeft = attemptsLeft - 1;
    const attemptsUsed = 5 - newAttemptsLeft;

    setStatuses(s);
    setAttemptsLeft(newAttemptsLeft);
    setAttemptsHistory((prev) => [...prev, s]);

    if (allCorrect || newAttemptsLeft === 0) {
      setSubmitted(true);
      setFinalStatuses(s);

      let count = 0;
      revealIntervalRef.current = setInterval(() => {
        count++;
        setRevealedCount(count);
        if (count >= cards.length) {
          clearInterval(revealIntervalRef.current!);
          if (allCorrect) {
            setTimeout(
              () =>
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.5 },
                }),
              100
            );
          }
          let newStats = recordResult(
            stats,
            cards.map((c, i) => ({ event: c, status: s[i] }))
          );
          newStats = recordDeckResult(
            newStats,
            deck.id,
            allCorrect,
            attemptsUsed
          );
          onUpdateStats(newStats);
        }
      }, 80);
    } else {
      setTimeout(() => setStatuses([]), 1200);
    }
  }

  useEffect(
    () => () => {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    },
    []
  );

  function share() {
    const allCorrect = finalStatuses.every((x) => x === "correct");
    const text = buildShareText(attemptsHistory, deck.name, allCorrect);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isDragging = dragSource !== null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="relative mb-8">
          {/* Back button en la esquina superior izquierda */}
          <div className="absolute left-0 top-0">
            <button
              onClick={onBack}
              className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
            >
              ← Volver
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-text-primary mb-1">
              ¿Cuánto sabés de historia?
            </h1>
            <p className="text-xl font-semibold text-text-secondary mb-1">
              Poné los eventos en orden.
            </p>
            <p className="text-sm text-text-tertiary mb-3">
              Arrastrá para ordenar los eventos cronológicamente
            </p>
            <span className="inline-block text-xs bg-bg-secondary border border-border px-3 py-1.5 rounded-full text-text-tertiary">
              {deck.name} — Puzzle #{puzzleNum}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-text-tertiary tracking-widest uppercase shrink-0">
            Antes
          </span>
          <div className="flex-1 flex items-center gap-1">
            <span className="text-text-tertiary text-sm leading-none">←</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-tertiary text-sm leading-none">→</span>
          </div>
          <span className="text-xs font-semibold text-text-tertiary tracking-widest uppercase shrink-0">
            Despues
          </span>
        </div>

        {/* Cards — horizontal row with insertion indicators */}
        <div
          className="flex items-start gap-3 mb-6 overflow-x-auto overflow-y-hidden py-2 px-1 h-[430px]"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragSource !== null) setDropTarget(cards.length);
          }}
        >
          {cards.map((card, i) => {
            const isNoOp = dragSource === i || dragSource === i - 1;
            const showBefore = isDragging && dropTarget === i && !isNoOp;

            return (
              <Fragment key={card.event}>
                <InsertionIndicator visible={showBefore} />
                <Card
                  item={card}
                  index={i}
                  isDragSource={dragSource === i}
                  isHinted={card.event === hintCardId}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  status={submitted ? null : statuses[i] ?? null}
                  revealed={submitted && revealedCount > i}
                  onWikiClick={card.wikipediaUrl ? () => setWikiEvent(card) : undefined}
                />
              </Fragment>
            );
          })}
          <InsertionIndicator
            visible={
              isDragging &&
              dropTarget === cards.length &&
              dragSource !== cards.length - 1
            }
          />
        </div>

        {/* Controls */}
        {!submitted ? (
          <div className="flex flex-col items-center gap-3 mt-6">
            <p className="text-sm text-text-secondary">
              Intentos restantes: {attemptsLeft}
            </p>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={useHint}
                disabled={!!hintCardId}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer shrink-0 ${
                  hintCardId
                    ? "border-border text-text-tertiary bg-transparent cursor-not-allowed"
                    : "border-ar-gold text-ar-gold bg-[rgba(245,197,24,0.08)] hover:bg-[rgba(245,197,24,0.15)]"
                }`}
              >
                💡 Pista
              </button>
              <button
                onClick={submit}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-100 text-black text-base font-semibold cursor-pointer transition-colors border-none"
              >
                Verificar
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg mx-auto">
            {/* Solve / Failure Banner */}
            {finalStatuses.every((s) => s === "correct") ? (
              <div className="bg-[#0f2a1a]/80 border border-success/30 text-success px-6 py-4 rounded-xl text-center font-bold text-base mb-6 shadow-lg shadow-success/5">
                🏆 ¡Felicitaciones! Resuelto en {5 - attemptsLeft} {5 - attemptsLeft === 1 ? "intento" : "intentos"}
              </div>
            ) : (
              <div className="bg-[#2a0f0f]/80 border border-danger/30 text-danger px-6 py-4 rounded-xl text-center font-bold text-base mb-6 shadow-lg shadow-danger/5">
                💀 ¡Fin de la partida! No te quedan intentos
              </div>
            )}

            {/* Statistics Dashboard Card */}
            {(() => {
              const deckStats = stats.decks?.[deck.id] ?? {
                played: 0,
                won: 0,
                streak: 0,
                maxStreak: 0,
                attemptsDistribution: [0, 0, 0, 0, 0],
              };
              const winRate = deckStats.played > 0 ? Math.round((deckStats.won / deckStats.played) * 100) : 0;
              let totalAttempts = 0;
              for (let i = 0; i < deckStats.attemptsDistribution.length; i++) {
                totalAttempts += deckStats.attemptsDistribution[i] * (i + 1);
              }
              const avgTries = deckStats.won > 0 ? totalAttempts / deckStats.won : 0;

              return (
                <div className="grid grid-cols-4 bg-bg-card border border-border rounded-xl divide-x divide-border overflow-hidden py-4 text-center my-6 shadow-sm">
                  <div>
                    <div className="text-xl font-black text-text-primary">{deckStats.played}</div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider font-bold mt-1">Partidas</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-text-primary">{winRate}%</div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider font-bold mt-1">Victorias</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-text-primary">{deckStats.streak}</div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider font-bold mt-1">Racha</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-text-primary">{avgTries > 0 ? avgTries.toFixed(1) : "-"}</div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider font-bold mt-1">Prom. Intentos</div>
                  </div>
                </div>
              );
            })()}

            {/* Attempts History Grid */}
            <div className="text-center my-6">
              <h3 className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-3">Tus Resultados</h3>
              <div className="flex flex-col gap-1.5 justify-center items-center">
                {attemptsHistory.map((attempt, attemptIdx) => (
                  <div key={attemptIdx} className="flex gap-1.5">
                    {attempt.map((stat, cardIdx) => (
                      <div
                        key={cardIdx}
                        className={`w-6 h-6 rounded-md shadow-sm transition-all duration-300 ${
                          stat === "correct"
                            ? "bg-success border border-success/30"
                            : "bg-danger border border-danger/30"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Badge (if used) */}
            {hintCardId && (
              <div className="text-xs text-ar-gold text-center mb-4">★ Resuelto con ayuda de pista</div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-6 w-full max-w-sm mx-auto">
              <button
                onClick={share}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                  copied
                    ? "border-success text-success bg-success/5"
                    : "border-border bg-bg-secondary text-text-primary hover:bg-bg-card hover:border-text-secondary"
                }`}
              >
                {copied ? "¡Copiado!" : "Compartir resultado"}
              </button>
              <button
                onClick={nextPuzzle}
                className="flex-1 py-3 px-4 rounded-xl border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-semibold cursor-pointer transition-colors shadow-lg shadow-ar-blue/20"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {wikiEvent && (
        <WikipediaSheet event={wikiEvent} onClose={() => setWikiEvent(null)} />
      )}
    </div>
  );
}
