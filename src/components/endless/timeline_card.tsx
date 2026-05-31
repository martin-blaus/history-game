import type { HistoryEvent } from "../../../data/index";
import { formatYear, onImgError } from "../../utils";

export function EndlessTimelineCard({
  event,
  index,
  cardW,
  rot,
  isNew,
  onWikiClick,
}: {
  event: HistoryEvent;
  index: number;
  cardW: number;
  rot: number;
  isNew: boolean;
  onWikiClick?: () => void;
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
            onError={onImgError}
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
          <div className="flex items-center gap-1 mt-1">
            <span className="shrink-0 text-[10px] font-bold text-ar-blue bg-ar-blue/10 px-1.5 py-0.5 rounded whitespace-nowrap">
              {formatYear(event.year)}
            </span>
            {event.wikipediaUrl && onWikiClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWikiClick();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="shrink-0 text-[9px] font-semibold text-ar-blue/70 bg-ar-blue/10 border border-ar-blue/20 px-1 py-0.5 rounded hover:bg-ar-blue/20 transition-colors cursor-pointer leading-none"
              >
                W
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
