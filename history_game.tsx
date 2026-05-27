import {
  Fragment,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import confetti from "canvas-confetti";
import { DECKS } from "./data/index";
import type { Deck, HistoryEvent } from "./data/index";
import {
  loadStats,
  saveStats,
  selectPuzzle,
  recordResult,
  type AppStats,
} from "./src/storage";
import { AdminScreen } from "./src/admin";
import { formatYear } from "./src/utils";

type CardStatus = "correct" | "wrong" | null;

function statusEmoji(s: string): "🟩" | "🟥" {
  return s === "correct" ? "🟩" : "🟥";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShareText(statuses: string[], deckName: string): string {
  const emojis = statuses.map(statusEmoji).join("");
  return `${deckName}\n${emojis}\n${
    statuses.filter((s) => s === "correct").length
  }/6 correctos\nhistoria-ar.app`;
}

function Card({
  item,
  index,
  isDragSource,
  isHinted,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  status,
  revealed,
}: {
  item: HistoryEvent;
  index: number;
  isDragSource: boolean;
  isHinted: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (i: number, clientX: number, rect: DOMRect) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onTouchStart: (e: React.TouchEvent, i: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  status: CardStatus;
  revealed: boolean;
}) {
  const canDrag = !revealed && !isHinted;

  const ringClass =
    status === "correct"
      ? "ring-2 ring-success"
      : status === "wrong"
      ? "ring-2 ring-danger"
      : isHinted && !revealed
      ? "ring-2 ring-ar-gold"
      : "";

  const shakeClass = status === "wrong" ? "card-shake" : "";
  const sourceClass = isDragSource ? "opacity-40 scale-95" : "";

  return (
    <div
      className={`sort-card group flex-1 min-w-[150px] h-[340px] hover:h-auto flex flex-col rounded-xl overflow-hidden select-none bg-bg-card transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl hover:shadow-ar-blue/10 ${ringClass} ${shakeClass} ${sourceClass} ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      draggable={canDrag}
      onDragStart={() => canDrag && onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(index, e.clientX, e.currentTarget.getBoundingClientRect());
      }}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onTouchStart={canDrag ? (e) => onTouchStart(e, index) : undefined}
      onTouchMove={canDrag ? onTouchMove : undefined}
      onTouchEnd={canDrag ? onTouchEnd : undefined}
    >
      <div className="relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.event}
            className="w-full h-44 object-cover block"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-44 bg-bg-secondary flex items-center justify-center">
            <span className="text-5xl opacity-20">📅</span>
          </div>
        )}
        {revealed && (
          <div
            className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-md ${
              status === "correct"
                ? "bg-success text-white"
                : "bg-danger text-white"
            }`}
          >
            {formatYear(item.year)}
          </div>
        )}
        {isHinted && !revealed && (
          <div className="absolute top-2 right-2 bg-ar-gold text-black text-xs font-bold px-2 py-1 rounded-md">
            📌
          </div>
        )}
      </div>

      <div className="px-3 py-3 flex flex-col gap-1.5">
        <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2">
          {item.event}
        </p>
        {item.context && (
          <p className="text-xs text-text-secondary leading-relaxed m-0 line-clamp-3 group-hover:line-clamp-none transition-all duration-200">
            {item.context}
          </p>
        )}
      </div>
    </div>
  );
}

function InsertionIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className="shrink-0 self-stretch rounded-full bg-white transition-all duration-100"
      style={{ width: visible ? 3 : 0, opacity: visible ? 1 : 0 }}
    />
  );
}

function StatsScreen({
  stats,
  onBack,
  onReset,
}: {
  stats: AppStats;
  onBack: () => void;
  onReset: () => void;
}) {
  const rows = Object.entries(stats.events)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.shown - a.shown);

  const allEvents = DECKS.flatMap((d) => d.events);
  const eventMap = Object.fromEntries(allEvents.map((e) => [e.event, e]));

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[600px] mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-sm font-medium p-0 hover:text-text-primary transition-colors"
          >
            ← Volver
          </button>
          <h2 className="flex-1 text-center text-base font-bold text-text-primary m-0">
            Tus estadísticas
          </h2>
          <span className="w-14" />
        </div>

        {rows.length === 0 ? (
          <p className="text-text-tertiary text-sm text-center mt-16">
            Todavía no jugaste ninguna partida.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 text-xs font-bold text-text-tertiary uppercase tracking-wider">
              <span>Evento</span>
              <span className="text-center">Visto</span>
              <span className="text-center text-success">✓</span>
              <span className="text-center text-danger">✗</span>
            </div>
            {rows.map((row) => {
              const ev = eventMap[row.id];
              if (!ev) return null;
              const pct = row.shown > 0 ? row.correct / row.shown : 0;
              const rowColor =
                pct > 0.7
                  ? "text-success"
                  : pct < 0.4 && row.shown > 0
                  ? "text-danger"
                  : "text-text-secondary";
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2.5 rounded-lg bg-bg-card border border-border items-center"
                >
                  <span className={`text-xs leading-snug ${rowColor}`}>
                    {ev.event}
                  </span>
                  <span className="text-xs text-text-tertiary text-center">
                    {row.shown}
                  </span>
                  <span className="text-xs text-success text-center font-semibold">
                    {row.correct}
                  </span>
                  <span className="text-xs text-danger text-center font-semibold">
                    {row.wrong}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {rows.length > 0 && (
          <button
            onClick={onReset}
            className="mt-8 w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-danger hover:border-danger transition-colors cursor-pointer"
          >
            Reiniciar estadísticas
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"home" | "game" | "stats" | "admin">(
    "home"
  );
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
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
  const [puzzleNum, setPuzzleNum] = useState(1);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AppStats>(() => loadStats());
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

  const titleCls = useMemo(
    () => "text-[48px] font-extrabold tracking-[-2px] m-0 leading-none",
    []
  );

  function loadPuzzle(p: HistoryEvent[]) {
    setPuzzle(p);
    setCards(shuffle(p));
    setStatuses([]);
    setFinalStatuses([]);
    setSubmitted(false);
    setRevealedCount(0);
    setHintCardId(null);
    setAttemptsLeft(5);
  }

  function startGame(deck: Deck) {
    setSelectedDeck(deck);
    loadPuzzle(selectPuzzle(deck, stats));
    setPuzzleNum(1);
    setScreen("game");
  }

  function nextPuzzle() {
    if (!selectedDeck) return;
    loadPuzzle(selectPuzzle(selectedDeck, stats));
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

    setStatuses(s);
    setAttemptsLeft(newAttemptsLeft);

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
          const newStats = recordResult(
            stats,
            cards.map((c, i) => ({ event: c, status: s[i] }))
          );
          setStats(newStats);
          saveStats(newStats);
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
    const text = buildShareText(
      finalStatuses,
      selectedDeck?.name ?? "Historia AR"
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetStats() {
    if (!window.confirm("¿Reiniciar todas las estadísticas?")) return;
    const empty: AppStats = { events: {} };
    setStats(empty);
    saveStats(empty);
  }

  if (screen === "admin")
    return <AdminScreen onBack={() => setScreen("home")} />;

  if (screen === "stats")
    return (
      <StatsScreen
        stats={stats}
        onBack={() => setScreen("home")}
        onReset={resetStats}
      />
    );

  if (screen === "home")
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-[420px] px-6 py-12 text-center">
          <div className="flex h-[5px] rounded-full overflow-hidden gap-0.5 mb-8">
            <div className="flex-1 bg-ar-blue" />
            <div className="flex-1 bg-text-primary" />
            <div className="flex-1 bg-ar-blue" />
          </div>

          <div className="mb-2">
            <h1 className={`${titleCls} text-text-primary`}>History</h1>
            <h1 className={`${titleCls} text-ar-blue`}>Game</h1>
          </div>

          <div className="w-12 h-[3px] bg-ar-gold rounded-sm mx-auto my-3" />

          <p className="text-[15px] text-text-secondary mb-8 leading-relaxed">
            Ordená eventos históricos de más antiguo a más reciente.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {DECKS.map((deck) => (
              <button
                key={deck.id}
                onClick={() => startGame(deck)}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-border bg-bg-card hover:border-ar-blue hover:bg-bg-secondary transition-all duration-150 cursor-pointer group"
              >
                <span className="text-4xl">{deck.emoji}</span>
                <span className="text-sm font-semibold text-text-primary group-hover:text-ar-blue transition-colors leading-tight">
                  {deck.name}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setScreen("stats")}
            className="w-full py-3 rounded-xl border border-border bg-transparent text-text-tertiary text-sm hover:text-text-primary hover:border-borderLight transition-colors cursor-pointer"
          >
            📊 Estadísticas
          </button>

          <button
            onClick={() => setScreen("admin")}
            className="mt-3 bg-transparent border-none cursor-pointer text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            ⚙ Admin
          </button>
        </div>
      </div>
    );

  const isDragging = dragSource !== null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="relative mb-8">
          {/* Back button en la esquina superior izquierda */}
          <div className="absolute left-0 top-0">
            <button
              onClick={() => setScreen("home")}
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
              {selectedDeck?.name} — Puzzle #{puzzleNum}
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
            // catch drags past the last card
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
                />
              </Fragment>
            );
          })}
          {/* Indicator for appending after the last card */}
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
          <div className="text-center bg-bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto">
            <div className="text-[36px] font-extrabold text-ar-gold mb-1">
              {finalStatuses.filter((s) => s === "correct").length}/6
            </div>
            <div className="text-sm text-text-secondary mb-1">correctos</div>
            {hintCardId && (
              <div className="text-xs text-ar-gold mb-3">★ con pista</div>
            )}
            <div className="text-[26px] tracking-[6px] mb-6">
              {finalStatuses.map(statusEmoji)}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={share}
                className={`py-2.5 px-5 rounded-[10px] border border-border bg-bg-secondary text-sm font-medium cursor-pointer transition-colors ${
                  copied ? "text-success" : "text-text-primary"
                }`}
              >
                {copied ? "¡Copiado!" : "Compartir resultado"}
              </button>
              <button
                onClick={nextPuzzle}
                className="py-2.5 px-5 rounded-[10px] border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
