import type { HistoryEvent } from "../../data/index";
import { formatYear } from "../utils";

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
        <img
          src={item.image || "/placeholder.png"}
          alt={item.event}
          className="w-full h-44 object-cover block"
          loading="lazy"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.png";
          }}
        />
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

export function InsertionIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className="shrink-0 self-stretch rounded-full bg-white transition-all duration-100"
      style={{ width: visible ? 3 : 0, opacity: visible ? 1 : 0 }}
    />
  );
}
