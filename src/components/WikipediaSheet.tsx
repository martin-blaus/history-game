import { useState, useEffect } from "react";
import type { HistoryEvent } from "../../data/index";
import { extractWikiTitle } from "../utils";

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
}

const cache = new Map<string, WikiSummary | null>();

export function WikipediaSheet({
  event,
  onClose,
}: {
  event: HistoryEvent;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<WikiSummary | null | "loading">(
    "loading",
  );
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    if (!event.wikipediaUrl) {
      setSummary(null);
      return;
    }
    const title = extractWikiTitle(event.wikipediaUrl);
    if (!title) {
      setSummary(null);
      return;
    }
    if (cache.has(title)) {
      setSummary(cache.get(title)!);
      return;
    }
    setSummary("loading");
    fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    )
      .then((r) => r.json())
      .then((data: WikiSummary) => {
        cache.set(title, data);
        setSummary(data);
      })
      .catch(() => {
        cache.set(title, null);
        setSummary(null);
      });
  }, [event.wikipediaUrl]);

  const thumbnail =
    summary !== "loading" && summary !== null
      ? (summary.thumbnail?.source ?? event.image)
      : event.image;

  const extract =
    summary !== "loading" && summary !== null
      ? summary.extract
      : null;

  // Fall back to event context (capped at 1000 chars) when Wikipedia has no extract
  const bodyText =
    extract ||
    (event.context
      ? event.context.length > 1000
        ? event.context.slice(0, 1000) + "…"
        : event.context
      : null);

  const isContextFallback = !extract && !!bodyText;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="wiki-panel fixed top-0 right-0 bottom-0 w-[360px] max-w-[92vw] z-50 bg-bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header: small thumbnail + title + close */}
        <div className="flex items-start gap-3 p-4 pb-3 shrink-0 border-b border-border">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={event.event}
              className="w-16 h-16 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-ar-blue tracking-widest uppercase m-0 mb-1">
              Wikipedia
            </p>
            <h3 className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-4">
              {event.event}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-lg leading-none bg-transparent border-none cursor-pointer shrink-0 p-0 ml-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
          {summary === "loading" ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-ar-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {bodyText ? (
                <div className="relative">
                  {isContextFallback && (
                    <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-2 m-0">
                      Descripción del evento
                    </p>
                  )}
                  <div
                    className={`text-sm text-text-secondary leading-relaxed transition-[filter] duration-300 ${
                      revealed ? "" : "blur-[5px] select-none cursor-pointer"
                    }`}
                    onClick={() => !revealed && setRevealed(true)}
                  >
                    {bodyText}
                  </div>
                  {!revealed && (
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={() => setRevealed(true)}
                    >
                      <span className="bg-bg-card/90 border border-border text-text-secondary text-xs font-semibold px-3 py-1.5 rounded-full">
                        Toca para revelar
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">
                  No se encontró información disponible.
                </p>
              )}

              {event.wikipediaUrl && (
                <a
                  href={event.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-ar-blue/10 border border-ar-blue/30 text-ar-blue text-sm font-semibold hover:bg-ar-blue/20 transition-colors no-underline"
                >
                  Abrir en Wikipedia ↗
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
