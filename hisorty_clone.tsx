import { useState, useRef } from "react";
import { deck } from "./data/argentina";
import type { HistoryEvent } from "./data/argentina";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDailyPuzzle() {
  const day = new Date().getDate();
  return deck.daily[day % deck.daily.length];
}

function getDailyPuzzleNum() {
  const origin = new Date("2026-05-18");
  const diff = Math.floor((new Date().getTime() - origin.getTime()) / 86400000);
  return 34 + diff;
}

function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  if (y < 1000) return `${y} d.C.`;
  return `${y}`;
}

function formatDateSpanish(): string {
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const d = new Date();
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function buildShareText(statuses: string[], mode: string, puzzleNum: number): string {
  const emojis = statuses.map(s => s === "correct" ? "🟩" : "🟥").join("");
  const correct = statuses.filter(s => s === "correct").length;
  const label = mode === "daily" ? `#${puzzleNum}` : "Sin fin";
  return `Historia AR ${label}\n${emojis}\n${correct}/6 correctos\nhistoria-ar.app`;
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
  item, index, dragging,
  onDragStart, onDragOver, onDrop,
  onTouchStart, onTouchMove, onTouchEnd,
  status, revealed,
}: {
  item: HistoryEvent;
  index: number;
  dragging: number | null;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDrop: () => void;
  onTouchStart: (e: React.TouchEvent, i: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  status: string | null;
  revealed: boolean;
}) {
  const isDragging = dragging === index;

  const statusClasses =
    status === "correct" ? "bg-success-bg border-success border-l-success" :
    status === "wrong"   ? "bg-danger-bg border-danger border-l-danger" :
                           "bg-bg-card border-border border-l-ar-blue";

  const dragClasses = isDragging
    ? "opacity-45 scale-[1.02] shadow-2xl cursor-grabbing"
    : "opacity-100 scale-100 cursor-grab";

  return (
    <div
      className={`sort-card flex items-center gap-3 px-4 py-3.5 rounded-xl border border-l-[3px] select-none touch-none transition-all duration-150 ${statusClasses} ${dragClasses}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
      onTouchStart={e => onTouchStart(e, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <span className="text-xs font-bold text-text-tertiary min-w-[18px] bg-bg rounded px-[5px] py-[2px] text-center shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 text-sm text-text-primary leading-[1.45]">
        {item.event}
      </span>
      {revealed ? (
        <span className={`text-xs font-semibold whitespace-nowrap px-2 py-[3px] rounded-md shrink-0 ${
          status === "correct"
            ? "text-success bg-[rgba(34,197,94,0.1)]"
            : "text-danger bg-[rgba(239,68,68,0.1)]"
        }`}>
          {formatYear(item.year)}
        </span>
      ) : (
        <GripIcon />
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [mode, setMode] = useState<"daily" | "endless">("daily");
  const [puzzle, setPuzzle] = useState<HistoryEvent[]>([]);
  const [cards, setCards] = useState<HistoryEvent[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [endlessPuzzleIdx, setEndlessPuzzleIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const touchRef = useRef<{ startIdx: number | null; currentIdx: number | null; startY: number }>({
    startIdx: null, currentIdx: null, startY: 0,
  });

  const puzzleNum = getDailyPuzzleNum();

  function startGame(m: "daily" | "endless") {
    setMode(m);
    const p = m === "daily"
      ? getDailyPuzzle()
      : deck.endless[endlessPuzzleIdx % deck.endless.length];
    setPuzzle(p);
    setCards(shuffle(p));
    setSubmitted(false);
    setStatuses([]);
    setScreen("game");
  }

  function nextEndless() {
    const nextIdx = (endlessPuzzleIdx + 1) % deck.endless.length;
    setEndlessPuzzleIdx(nextIdx);
    const p = deck.endless[nextIdx];
    setPuzzle(p);
    setCards(shuffle(p));
    setSubmitted(false);
    setStatuses([]);
  }

  function handleDragStart(i: number) { setDragging(i); }

  function handleDragOver(i: number) {
    if (dragging === null || dragging === i) return;
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
    const s = cards.map((c, i) => c.id === sorted[i].id ? "correct" : "wrong");
    setStatuses(s);
    setSubmitted(true);
  }

  function share() {
    const text = buildShareText(statuses, mode, puzzleNum);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const correctCount = statuses.filter(s => s === "correct").length;

  // ── Home Screen ──────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-[420px] px-6 py-12 text-center">

        {/* Argentine flag stripe */}
        <div className="flex h-[5px] rounded-full overflow-hidden gap-0.5 mb-8">
          <div className="flex-1 bg-ar-blue" />
          <div className="flex-1 bg-text-primary" />
          <div className="flex-1 bg-ar-blue" />
        </div>

        <div className="mb-2">
          <h1 className="text-[48px] font-extrabold tracking-[-2px] m-0 text-text-primary leading-none">
            Historia
          </h1>
          <h1 className="text-[48px] font-extrabold tracking-[-2px] m-0 text-ar-blue leading-none">
            Argentina
          </h1>
        </div>

        <div className="w-12 h-[3px] bg-ar-gold rounded-sm mx-auto my-3" />

        <p className="text-[15px] text-text-secondary mb-10 leading-relaxed">
          Ordená 6 eventos históricos de más antiguo a más reciente.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => startGame("daily")}
            className="w-full py-[15px] rounded-xl border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold transition-colors cursor-pointer"
          >
            Puzzle del día
          </button>
          <button
            onClick={() => startGame("endless")}
            className="w-full py-[15px] rounded-xl border border-border bg-bg-secondary text-text-secondary hover:border-ar-blue hover:text-text-primary text-[15px] font-medium transition-colors cursor-pointer"
          >
            Modo sin fin
          </button>
        </div>

        <p className="text-xs text-text-tertiary mt-10">
          {formatDateSpanish()} · Puzzle #{puzzleNum}
        </p>
      </div>
    </div>
  );

  // ── Game Screen ──────────────────────────────────────────────────────────
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
              {mode === "daily" ? `Puzzle #${puzzleNum}` : "Modo sin fin"}
            </span>
          </div>
          <span className="w-14" />
        </div>

        {!submitted && (
          <p className="text-xs text-text-tertiary text-center mb-4">
            Arrastrá para ordenar de más antiguo → más reciente
          </p>
        )}

        <div className="flex flex-col gap-2 mb-6">
          {cards.map((card, i) => (
            <Card
              key={card.id}
              item={card}
              index={i}
              dragging={dragging}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              status={submitted ? statuses[i] : null}
              revealed={submitted}
            />
          ))}
        </div>

        {!submitted ? (
          <button
            onClick={submit}
            className="w-full py-[15px] rounded-xl border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-base font-semibold cursor-pointer transition-colors"
          >
            Enviar
          </button>
        ) : (
          <div className="text-center bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-[36px] font-extrabold text-ar-gold mb-1">
              {correctCount}/6
            </div>
            <div className="text-sm text-text-secondary mb-4">
              correctos
            </div>
            <div className="text-[26px] tracking-[6px] mb-6">
              {statuses.map((s, i) => s === "correct" ? "🟩" : "🟥")}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={share}
                className={`py-2.5 px-5 rounded-[10px] border border-border bg-bg-secondary text-sm font-medium cursor-pointer transition-colors ${
                  copied ? "text-success" : "text-text-primary hover:text-text-primary"
                }`}
              >
                {copied ? "¡Copiado!" : "Compartir resultado"}
              </button>
              {mode === "endless" && (
                <button
                  onClick={nextEndless}
                  className="py-2.5 px-5 rounded-[10px] border-none bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-semibold cursor-pointer transition-colors"
                >
                  Siguiente →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
