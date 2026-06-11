import { Fragment, useReducer, useState, useRef, useEffect, useLayoutEffect } from "react";
import confetti from "canvas-confetti";
import type { Deck, HistoryEvent } from "../../data/index";
import { selectPuzzle, recordResult, recordDeckResult, type AppStats } from "../storage";
import { Card, InsertionIndicator, statusEmoji } from "./sort_card";
import { WikipediaSheet } from "./WikipediaSheet";
import { shuffle } from "../utils";
import { MAX_ATTEMPTS } from "../constants";
import { useTouchDrag } from "../hooks/use_touch_drag";

const REVEAL_INTERVAL_MS = 80;
const WRONG_FLASH_MS = 1200;
const COPIED_FEEDBACK_MS = 2000;

type Status = "correct" | "wrong";

function buildShareText(history: Status[][], deckName: string, won: boolean): string {
  const grid = history.map(row => row.map(statusEmoji).join("")).join("\n");
  const tries = won ? `${history.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  return `${deckName} (${tries})\n\n${grid}\n\nhttps://history-game-7a8e2.web.app`;
}

function gradeCards(puzzle: HistoryEvent[], cards: HistoryEvent[]): Status[] {
  const sorted = [...puzzle].sort((a, b) => a.year - b.year);
  return cards.map((c, i) => (c.event === sorted[i].event ? "correct" : "wrong"));
}

// ── Round state ───────────────────────────────────────────────────────────────

interface RoundState {
  puzzle: HistoryEvent[];
  cards: HistoryEvent[];
  statuses: Status[]; // transient per-card flash after a wrong attempt
  finalStatuses: Status[];
  submitted: boolean;
  revealedCount: number;
  hintCardId: string | null;
  attemptsLeft: number;
  attemptsHistory: Status[][];
}

type RoundAction =
  | { type: "load"; puzzle: HistoryEvent[]; shuffled: HistoryEvent[] }
  | { type: "move_card"; src: number; dst: number }
  | { type: "use_hint" }
  | { type: "submit"; graded: Status[]; final: boolean }
  | { type: "clear_flash" }
  | { type: "reveal_tick" };

function makeRound(puzzle: HistoryEvent[], shuffled: HistoryEvent[]): RoundState {
  return {
    puzzle,
    cards: shuffled,
    statuses: [],
    finalStatuses: [],
    submitted: false,
    revealedCount: 0,
    hintCardId: null,
    attemptsLeft: MAX_ATTEMPTS,
    attemptsHistory: [],
  };
}

function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case "load":
      return makeRound(action.puzzle, action.shuffled);
    case "move_card": {
      const { src, dst } = action;
      if (src === dst || src + 1 === dst) return state;
      const next = [...state.cards];
      const [moved] = next.splice(src, 1);
      next.splice(dst > src ? dst - 1 : dst, 0, moved);
      return { ...state, cards: next };
    }
    case "use_hint": {
      if (state.hintCardId || state.submitted) return state;
      const sorted = [...state.puzzle].sort((a, b) => a.year - b.year);
      const middle = sorted[Math.floor(sorted.length / 2)];
      const correctIdx = sorted.indexOf(middle);
      const currentIdx = state.cards.findIndex(c => c.event === middle.event);
      let cards = state.cards;
      if (currentIdx !== correctIdx) {
        cards = [...state.cards];
        cards.splice(currentIdx, 1);
        cards.splice(correctIdx, 0, middle);
      }
      return { ...state, cards, hintCardId: middle.event };
    }
    case "submit":
      return {
        ...state,
        statuses: action.graded,
        attemptsLeft: state.attemptsLeft - 1,
        attemptsHistory: [...state.attemptsHistory, action.graded],
        submitted: action.final,
        finalStatuses: action.final ? action.graded : state.finalStatuses,
      };
    case "clear_flash":
      return state.submitted ? state : { ...state, statuses: [] };
    case "reveal_tick":
      return { ...state, revealedCount: state.revealedCount + 1 };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [state, dispatch] = useReducer(roundReducer, deck, (d) => {
    const p = selectPuzzle(d, stats);
    return makeRound(p, shuffle(p));
  });
  const { puzzle, cards, statuses, finalStatuses, submitted, revealedCount, hintCardId, attemptsLeft, attemptsHistory } = state;

  const [puzzleNum, setPuzzleNum] = useState(1);
  const [copied, setCopied] = useState(false);
  const [wikiEvent, setWikiEvent] = useState<HistoryEvent | null>(null);

  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFlipRef = useRef<Map<string, { left: number; top: number }> | null>(null);

  function nextPuzzle() {
    const p = selectPuzzle(deck, stats);
    dispatch({ type: "load", puzzle: p, shuffled: shuffle(p) });
    setPuzzleNum((n) => n + 1);
  }

  function useHint() {
    dispatch({ type: "use_hint" });
  }

  function commitDrop(src: number, dst: number) {
    if (src === dst || src + 1 === dst) return;
    // FLIP step 1: record each card's current position by id
    const els = document.querySelectorAll<HTMLElement>(".sort-card");
    const oldPositions = new Map<string, { left: number; top: number }>();
    els.forEach((el, i) => {
      const id = cards[i]?.event;
      if (id) {
        const r = el.getBoundingClientRect();
        oldPositions.set(id, { left: r.left, top: r.top });
      }
    });
    pendingFlipRef.current = oldPositions;
    dispatch({ type: "move_card", src, dst });
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
      const old = oldPositions.get(id);
      if (old === undefined) return;
      const rect = el.getBoundingClientRect();
      const dx = old.left - rect.left;
      const dy = old.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
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

  // ── Drag (mouse + touch share one state machine) ──────────────────────────────
  const drag = useTouchDrag<number, number>({
    resolveTarget: (x) => {
      const els = document.querySelectorAll<HTMLElement>(".sort-card");
      let target: number | null = null;
      els.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right) {
          target = x < rect.left + rect.width / 2 ? i : i + 1;
        }
      });
      return target;
    },
    canTarget: (t) => !(t < cards.length && cards[t]?.event === hintCardId),
    onDrop: commitDrop,
    retainTargetOnMiss: true,
  });

  function handleCardDragOver(i: number, clientX: number, _clientY: number, rect: DOMRect) {
    if (!drag.isDragging) return;
    const insertBefore = clientX < rect.left + rect.width / 2;
    drag.updateTarget(insertBefore ? i : i + 1);
  }

  function submit() {
    const s = gradeCards(puzzle, cards);
    const allCorrect = s.every((x) => x === "correct");
    const newAttemptsLeft = attemptsLeft - 1;
    const attemptsUsed = MAX_ATTEMPTS - newAttemptsLeft;
    const final = allCorrect || newAttemptsLeft === 0;

    dispatch({ type: "submit", graded: s, final });

    if (final) {
      let count = 0;
      revealIntervalRef.current = setInterval(() => {
        count++;
        dispatch({ type: "reveal_tick" });
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
      }, REVEAL_INTERVAL_MS);
    } else {
      setTimeout(() => dispatch({ type: "clear_flash" }), WRONG_FLASH_MS);
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
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    });
  }

  const isDragging = drag.isDragging;

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
            drag.updateTarget(cards.length);
          }}
        >
          {cards.map((card, i) => {
            const isNoOp = drag.dragSource === i || drag.dragSource === i - 1;
            const showBefore = isDragging && drag.dragTarget === i && !isNoOp;

            return (
              <Fragment key={card.event}>
                <InsertionIndicator visible={showBefore} />
                <Card
                  item={card}
                  index={i}
                  isDragSource={drag.dragSource === i}
                  isHinted={card.event === hintCardId}
                  onDragStart={(idx) => drag.startDrag(idx, idx)}
                  onDragOver={handleCardDragOver}
                  onDragEnd={drag.endDrag}
                  onDrop={drag.drop}
                  onTouchStart={(e, idx) => drag.onTouchStart(e, idx, idx)}
                  onTouchMove={drag.onTouchMove}
                  onTouchEnd={drag.onTouchEnd}
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
              drag.dragTarget === cards.length &&
              drag.dragSource !== cards.length - 1
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
                🏆 ¡Felicitaciones! Resuelto en {MAX_ATTEMPTS - attemptsLeft} {MAX_ATTEMPTS - attemptsLeft === 1 ? "intento" : "intentos"}
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
                attemptsDistribution: new Array(MAX_ATTEMPTS).fill(0),
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
        <WikipediaSheet event={wikiEvent} deck={deck} onClose={() => setWikiEvent(null)} />
      )}
    </div>
  );
}
