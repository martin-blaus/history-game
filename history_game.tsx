import { useMemo, useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { DECKS } from "./data/index";
import type { Deck, HistoryEvent } from "./data/index";
import {
  loadStats, saveStats, selectPuzzle, recordResult,
  type AppStats,
} from "./src/storage";
import { AdminScreen } from "./src/admin";
import { formatYear } from "./src/utils";

type CardStatus = "correct" | "wrong" | null;

const STATUS_CARD_CLASSES: Record<"correct" | "wrong", string> = {
  correct: "bg-success-bg border-success border-l-success",
  wrong:   "bg-danger-bg border-danger border-l-danger",
};

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
  return `${deckName}\n${emojis}\n${statuses.filter(s => s === "correct").length}/6 correctos\nhistoria-ar.app`;
}

function GripIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="shrink-0">
      {[2, 7, 12].flatMap(x =>
        [3, 9, 15].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#475569" />
        ))
      )}
    </svg>
  );
}


function Card({
  item, index, dragging, isHinted,
  onDragStart, onDragOver, onDrop,
  onTouchStart, onTouchMove, onTouchEnd,
  status, revealedCount,
}: {
  item: HistoryEvent;
  index: number;
  dragging: number | null;
  isHinted: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDrop: () => void;
  onTouchStart: (e: React.TouchEvent, i: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  status: CardStatus;
  revealedCount: number;
}) {
  const [descExpanded, setDescExpanded] = useState(false);

  const isDragging = dragging === index;
  const isRevealed = revealedCount > index;
  const statusClasses = status ? STATUS_CARD_CLASSES[status] : "bg-bg-card border-border border-l-ar-blue";
  const dragClasses = isDragging
    ? "opacity-45 scale-[1.02] shadow-2xl cursor-grabbing"
    : "opacity-100 scale-100 cursor-grab";
  const shakeClass = isRevealed && status === "wrong" ? "card-shake" : "";

  return (
    <div
      className={`sort-card flex flex-col rounded-xl border border-l-[3px] overflow-hidden select-none touch-none transition-all duration-150 ${statusClasses} ${isHinted && !isRevealed ? "border-l-ar-gold border-ar-gold" : ""} ${dragClasses} ${shakeClass}`}
      draggable={!isRevealed && !isHinted}
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
      onTouchStart={e => onTouchStart(e, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.event}
          className="w-full h-20 object-cover shrink-0"
          loading="lazy"
          draggable={false}
        />
      )}

      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-text-tertiary min-w-[18px] bg-bg rounded px-[5px] py-[2px] text-center shrink-0">
            {index + 1}
          </span>
          <span className="flex-1 text-sm text-text-primary leading-[1.45]">
            {item.event}
          </span>
          {isRevealed ? (
            <span className={`text-xs font-semibold whitespace-nowrap px-2 py-[3px] rounded-md shrink-0 ${
              status === "correct"
                ? "text-success bg-[rgba(34,197,94,0.1)]"
                : "text-danger bg-[rgba(239,68,68,0.1)]"
            }`}>
              {formatYear(item.year)}
            </span>
          ) : isHinted ? (
            <span className="text-xs font-semibold text-ar-gold bg-[rgba(245,197,24,0.1)] px-2 py-[3px] rounded-md shrink-0">
              📌
            </span>
          ) : (
            <GripIcon />
          )}
        </div>

        {item.context && (
          <div className="flex items-start gap-1">
            <p className={`text-xs text-text-secondary leading-relaxed m-0 flex-1 overflow-hidden transition-[max-height] duration-300 ${
              isRevealed || descExpanded ? "max-h-40" : "max-h-[2.8em] hover:max-h-40"
            }`}>
              {item.context}
            </p>
            {!isRevealed && (
              <button
                onClick={e => { e.stopPropagation(); setDescExpanded(v => !v); }}
                className="text-text-tertiary hover:text-text-secondary text-xs shrink-0 mt-0.5 leading-none bg-transparent border-none cursor-pointer p-0"
                aria-label={descExpanded ? "Colapsar" : "Expandir"}
              >
                {descExpanded ? "⌃" : "⌄"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsScreen({ stats, onBack, onReset }: {
  stats: AppStats;
  onBack: () => void;
  onReset: () => void;
}) {
  const rows = Object.entries(stats.events)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.shown - a.shown);

  const allEvents = DECKS.flatMap(d => d.events);
  const eventMap = Object.fromEntries(allEvents.map(e => [e.id, e]));

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
            {rows.map(row => {
              const ev = eventMap[row.id];
              if (!ev) return null;
              const pct = row.shown > 0 ? row.correct / row.shown : 0;
              const rowColor = pct > 0.7 ? "text-success" : pct < 0.4 && row.shown > 0 ? "text-danger" : "text-text-secondary";
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2.5 rounded-lg bg-bg-card border border-border items-center"
                >
                  <span className={`text-xs leading-snug ${rowColor}`}>{ev.event}</span>
                  <span className="text-xs text-text-tertiary text-center">{row.shown}</span>
                  <span className="text-xs text-success text-center font-semibold">{row.correct}</span>
                  <span className="text-xs text-danger text-center font-semibold">{row.wrong}</span>
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
  const [screen, setScreen] = useState<"home" | "game" | "stats" | "admin">("home");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [puzzle, setPuzzle] = useState<HistoryEvent[]>([]);
  const [cards, setCards] = useState<HistoryEvent[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<("correct" | "wrong")[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [hintCardId, setHintCardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AppStats>(() => loadStats());
  const touchRef = useRef<{ startIdx: number | null; currentIdx: number | null; startY: number }>({
    startIdx: null, currentIdx: null, startY: 0,
  });
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submitted = statuses.length > 0;

  const titleCls = useMemo(() => "text-[48px] font-extrabold tracking-[-2px] m-0 leading-none", []);

  function loadPuzzle(p: HistoryEvent[]) {
    setPuzzle(p);
    setCards(shuffle(p));
    setStatuses([]);
    setRevealedCount(0);
    setHintCardId(null);
  }

  function startGame(deck: Deck) {
    setSelectedDeck(deck);
    loadPuzzle(selectPuzzle(deck, stats));
    setScreen("game");
  }

  function nextPuzzle() {
    if (!selectedDeck) return;
    loadPuzzle(selectPuzzle(selectedDeck, stats));
  }

  function useHint() {
    if (hintCardId || submitted) return;
    const sorted = [...puzzle].sort((a, b) => a.year - b.year);
    const middle = sorted[Math.floor(sorted.length / 2)];
    const correctIdx = sorted.indexOf(middle);
    setCards(prev => {
      const next = [...prev];
      const currentIdx = next.findIndex(c => c.id === middle.id);
      if (currentIdx === correctIdx) return prev;
      next.splice(currentIdx, 1);
      next.splice(correctIdx, 0, middle);
      return next;
    });
    setHintCardId(middle.id);
  }

  function handleDragStart(i: number) { setDragging(i); }

  function handleDragOver(i: number) {
    if (dragging === null || dragging === i) return;
    if (cards[i]?.id === hintCardId) return;
    setCards(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragging, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragging(i);
  }

  function handleDrop() { setDragging(null); }

  function handleTouchStart(e: React.TouchEvent, i: number) {
    touchRef.current = { startIdx: i, currentIdx: i, startY: e.touches[0].clientY };
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const y = e.touches[0].clientY;
    const els = document.querySelectorAll(".sort-card");
    let newIdx = touchRef.current.currentIdx!;
    els.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) newIdx = i;
    });
    if (newIdx !== touchRef.current.currentIdx) {
      const from = touchRef.current.currentIdx!;
      setCards(prev => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(newIdx, 0, moved);
        return next;
      });
      touchRef.current.currentIdx = newIdx;
    }
  }

  function handleTouchEnd() {
    touchRef.current = { startIdx: null, currentIdx: null, startY: 0 };
  }

  function submit() {
    const sorted = [...puzzle].sort((a, b) => a.year - b.year);
    const s: ("correct" | "wrong")[] = cards.map((c, i) =>
      c.id === sorted[i].id ? "correct" : "wrong"
    );
    setStatuses(s);

    let count = 0;
    revealIntervalRef.current = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= cards.length) {
        clearInterval(revealIntervalRef.current!);
        if (s.every(x => x === "correct")) {
          setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } }), 100);
        }
        const newStats = recordResult(stats, cards.map((c, i) => ({ event: c, status: s[i] })));
        setStats(newStats);
        saveStats(newStats);
      }
    }, 80);
  }

  useEffect(() => () => {
    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
  }, []);

  function share() {
    const text = buildShareText(statuses, selectedDeck?.name ?? "Historia AR");
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

  if (screen === "admin") return (
    <AdminScreen onBack={() => setScreen("home")} />
  );

  if (screen === "stats") return (
    <StatsScreen
      stats={stats}
      onBack={() => setScreen("home")}
      onReset={resetStats}
    />
  );

  if (screen === "home") return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-[420px] px-6 py-12 text-center">

        <div className="flex h-[5px] rounded-full overflow-hidden gap-0.5 mb-8">
          <div className="flex-1 bg-ar-blue" />
          <div className="flex-1 bg-text-primary" />
          <div className="flex-1 bg-ar-blue" />
        </div>

        <div className="mb-2">
          <h1 className={`${titleCls} text-text-primary`}>Historia</h1>
          <h1 className={`${titleCls} text-ar-blue`}>Argentina</h1>
        </div>

        <div className="w-12 h-[3px] bg-ar-gold rounded-sm mx-auto my-3" />

        <p className="text-[15px] text-text-secondary mb-8 leading-relaxed">
          Ordená 6 eventos históricos de más antiguo a más reciente.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {DECKS.map(deck => (
            <button
              key={deck.id}
              onClick={() => startGame(deck)}
              className="flex flex-col items-center gap-2 py-6 px-4 rounded-2xl border border-border bg-bg-card hover:border-ar-blue hover:bg-bg-secondary transition-all duration-150 cursor-pointer group"
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

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[500px] mx-auto px-4 py-6">

        <div className="flex items-center mb-6">
          <button
            onClick={() => setScreen("home")}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-sm font-medium p-0 hover:text-text-primary transition-colors"
          >
            ← Volver
          </button>
          <div className="flex-1 text-center">
            <span className="text-xs text-ar-blue font-bold tracking-widest uppercase">
              {selectedDeck?.name}
            </span>
          </div>
          <span className="w-14" />
        </div>

        {!submitted && (
          <p className="text-xs text-text-tertiary text-center mb-4">
            Arrastrá para ordenar de más antiguo → más reciente
          </p>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {cards.map((card, i) => (
            <Card
              key={card.id}
              item={card}
              index={i}
              dragging={submitted ? null : dragging}
              isHinted={card.id === hintCardId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              status={statuses[i] ?? null}
              revealedCount={revealedCount}
            />
          ))}
        </div>

        {!submitted ? (
          <div className="flex gap-2">
            <button
              onClick={useHint}
              disabled={!!hintCardId}
              className={`px-4 py-[15px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                hintCardId
                  ? "border-border text-text-tertiary bg-transparent cursor-not-allowed"
                  : "border-ar-gold text-ar-gold bg-[rgba(245,197,24,0.08)] hover:bg-[rgba(245,197,24,0.15)]"
              }`}
            >
              💡 Pista
            </button>
            <button
              onClick={submit}
              className="flex-1 py-[15px] rounded-xl border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold cursor-pointer transition-colors"
            >
              Enviar
            </button>
          </div>
        ) : (
          <div className="text-center bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-[36px] font-extrabold text-ar-gold mb-1">
              {statuses.filter(s => s === "correct").length}/6
            </div>
            <div className="text-sm text-text-secondary mb-1">correctos</div>
            {hintCardId && (
              <div className="text-xs text-ar-gold mb-3">★ con pista</div>
            )}
            <div className="text-[26px] tracking-[6px] mb-6">
              {statuses.map(statusEmoji)}
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
