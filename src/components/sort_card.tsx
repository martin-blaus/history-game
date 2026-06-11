import type { HistoryEvent } from "../../data/index";
import { formatYear, onImgError } from "../utils";

export type CardStatus = "correct" | "wrong" | null;

export function statusEmoji(s: string): "🟩" | "🟥" {
  return s === "correct" ? "🟩" : "🟥";
}

export function Card({
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
  onWikiClick,
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
  onWikiClick?: () => void;
}) {
  const canDrag = !revealed && !isHinted;

  const borderClass =
    status === "correct"
      ? "border-2 border-success bg-[#0f2a1a]/40"
      : status === "wrong"
      ? "border-2 border-danger bg-[#2a0f0f]/40"
      : isHinted && !revealed
      ? "border-2 border-ar-gold"
      : "border border-border";

  const shakeClass = status === "wrong" ? "card-shake" : "";
  const sourceClass = isDragSource ? "opacity-40 scale-95" : "";

  return (
    <div
      className={`sort-card group flex-1 min-w-[170px] max-w-[210px] h-[380px] flex flex-col rounded-xl overflow-hidden select-none bg-bg-card transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl hover:shadow-ar-blue/10 ${borderClass} ${shakeClass} ${sourceClass} ${
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
      <div className="relative shrink-0">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.event}
          className="w-full h-36 object-cover block"
          loading="lazy"
          draggable={false}
          onError={onImgError}
        />
        {isHinted && !revealed && (
          <div className="absolute top-2 right-2 bg-ar-gold text-black text-xs font-bold px-2 py-1 rounded-md">
            📌
          </div>
        )}
      </div>

      <div className="px-3 py-3 flex-1 flex flex-col justify-between min-h-0">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2">
            {item.event}
          </p>
          {item.context && (
            <p className="text-xs text-text-secondary leading-relaxed m-0 line-clamp-4 group-hover:line-clamp-none transition-all duration-200 overflow-y-auto">
              {item.context}
            </p>
          )}
          {item.wikipediaUrl && onWikiClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWikiClick();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="mt-1 self-start text-[10px] font-semibold text-ar-blue bg-ar-blue/10 border border-ar-blue/20 px-2 py-0.5 rounded-full hover:bg-ar-blue/20 transition-colors cursor-pointer"
            >
              W Wikipedia
            </button>
          )}
        </div>

        {revealed && (
          <div className={`pt-2 mt-auto border-t border-border/30 text-xs font-bold tracking-wide uppercase ${
            status === "correct" ? "text-success" : "text-danger"
          }`}>
            {formatYear(item.year)}
          </div>
        )}
      </div>
    </div>
  );
}

export function InsertionIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className="shrink-0 self-stretch rounded-full bg-white transition-all duration-100"
      style={{ width: visible ? 3 : 0, opacity: visible ? 1 : 0 }}
    />
  );
}
