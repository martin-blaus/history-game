import type { HistoryEvent } from "../../data/index";
import { formatYear, onImgError, PLACEHOLDER } from "../utils";

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
  onDragOver: (i: number, clientX: number, clientY: number, rect: DOMRect) => void;
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
      className={`sort-card group flex w-full flex-row min-h-[68px] sm:w-auto sm:flex-1 sm:flex-col sm:min-w-[150px] md:min-w-[170px] sm:max-w-[210px] sm:min-h-0 sm:h-[380px] rounded-xl overflow-hidden select-none bg-bg-card transition-all duration-200 sm:hover:scale-[1.03] sm:hover:-translate-y-1 hover:shadow-2xl hover:shadow-ar-blue/10 ${borderClass} ${shakeClass} ${sourceClass} ${
        canDrag ? "cursor-grab active:cursor-grabbing touch-none" : ""
      }`}
      draggable={canDrag}
      onDragStart={() => canDrag && onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(index, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onTouchStart={canDrag ? (e) => onTouchStart(e, index) : undefined}
      onTouchMove={canDrag ? onTouchMove : undefined}
      onTouchEnd={canDrag ? onTouchEnd : undefined}
    >
      <div className="relative shrink-0 w-20 sm:w-full">
        <img
          src={item.image || PLACEHOLDER}
          alt={item.event}
          className="w-full h-full sm:h-36 group-hover:sm:h-14 object-cover block bg-bg-secondary transition-all duration-300"
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

      <div className="px-3 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0 min-w-0">
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden min-h-0">
          <p className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-2 shrink-0">
            {item.event}
          </p>
          {item.context && (
            <p className="max-sm:hidden text-xs text-text-secondary leading-relaxed m-0 line-clamp-4 group-hover:line-clamp-none transition-all duration-200 overflow-hidden group-hover:overflow-y-auto flex-1 min-h-0">
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
              className="mt-1 self-start inline-flex items-center min-h-7 text-2xs font-semibold text-ar-blue bg-ar-blue/10 border border-ar-blue/20 px-2 py-0.5 rounded-full hover:bg-ar-blue/20 transition-colors cursor-pointer shrink-0"
            >
              W Wikipedia
            </button>
          )}
        </div>

        {revealed && (
          <div className={`pt-2 mt-auto border-t border-border/30 text-xs font-bold tracking-wide uppercase shrink-0 ${
            status === "correct" ? "text-success" : "text-danger"
          }`}>
            {formatYear(item.year)}
          </div>
        )}
      </div>
    </div>
  );
}

export function InsertionIndicator({
  visible,
  vertical,
}: {
  visible: boolean;
  vertical?: boolean;
}) {
  const size = visible ? 3 : 0;
  return (
    <div
      className="shrink-0 self-stretch rounded-full bg-white transition-all duration-100"
      style={
        vertical
          ? { height: size, opacity: visible ? 1 : 0 }
          : { width: size, opacity: visible ? 1 : 0 }
      }
    />
  );
}
