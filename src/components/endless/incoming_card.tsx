import type { HistoryEvent } from "../../../data/index";
import { formatYear, onImgError } from "../../utils";
import type { Phase } from "./types";

export function EndlessIncomingCard({
  incoming,
  phase,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  incoming: HistoryEvent;
  phase: Phase;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
}) {
  return (
    <div
      draggable={phase === "placing"}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`w-64 mx-auto rounded-2xl border bg-bg-card overflow-hidden flex flex-col shadow-md select-none touch-none
        max-h-[280px] hover:max-h-[540px] transition-[max-height] duration-300 ease-in-out
        ${phase === "placing" ? "cursor-grab active:cursor-grabbing" : ""}
        ${
          phase === "correct"
            ? "card-exit border-success"
            : phase === "wrong"
              ? "border-danger"
              : "border-border"
        }`}
    >
      {incoming.image ? (
        <img
          src={incoming.image}
          alt={incoming.event}
          className="w-full h-32 object-cover block shrink-0"
          draggable={false}
          onError={onImgError}
        />
      ) : (
        <div className="w-full h-24 bg-bg-secondary flex items-center justify-center shrink-0">
          <span className="text-4xl opacity-20">📅</span>
        </div>
      )}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm font-bold text-text-primary leading-snug m-0">
          {incoming.event}
        </p>
        {incoming.context && (
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            {incoming.context}
          </p>
        )}
        <div className="pt-2 flex justify-end">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
              phase === "wrong"
                ? "bg-danger/20 text-danger border-danger"
                : "bg-bg-secondary text-text-tertiary border-border animate-pulse"
            }`}
          >
            {phase === "wrong" ? formatYear(incoming.year) : "???"}
          </span>
        </div>
      </div>
    </div>
  );
}
