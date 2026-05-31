import type { HistoryEvent } from "../../../data/index";
import { formatYear } from "../../utils";

export function EndlessTimelineCard({
  event,
  index,
  cardW,
  rot,
  isNew,
}: {
  event: HistoryEvent;
  index: number;
  cardW: number;
  rot: number;
  isNew: boolean;
}) {
  return (
    <div
      data-card={index}
      className="shrink-0"
      style={{
        width: cardW,
        height: isNew ? 336 : 212,
        transform: `rotate(${rot}deg)`,
        transformOrigin: "center center",
        transition: "transform 500ms ease, width 500ms ease, height 300ms ease",
        zIndex: isNew ? 50 : index + 1,
      }}
    >
      <div
        className={`h-full rounded-xl border flex flex-col overflow-hidden ${
          isNew
            ? "card-pop-in border-success bg-success/10 ring-1 ring-success shadow-xl"
            : "border-border bg-bg-card shadow-sm"
        }`}
      >
        {event.image ? (
          <img
            src={event.image}
            alt={event.event}
            className="w-full h-24 object-cover block shrink-0"
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        ) : (
          <div className="w-full h-[67px] bg-bg-secondary flex items-center justify-center shrink-0">
            <span className="text-2xl opacity-15">📅</span>
          </div>
        )}
        <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden min-h-0">
          <div>
            <p className="text-[11px] font-semibold text-text-primary m-0 leading-tight line-clamp-2">
              {event.event}
            </p>
            {isNew && event.context && (
              <p className="text-[10px] text-text-secondary m-0 leading-relaxed line-clamp-4 mt-1 context-reveal">
                {event.context}
              </p>
            )}
          </div>
          <span className="shrink-0 self-start text-[10px] font-bold text-ar-blue bg-ar-blue/10 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
            {formatYear(event.year)}
          </span>
        </div>
      </div>
    </div>
  );
}
