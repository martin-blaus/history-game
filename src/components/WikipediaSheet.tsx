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

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="wiki-sheet fixed bottom-0 left-0 right-0 z-50 bg-bg-card rounded-t-2xl max-h-[65vh] flex flex-col border-t border-border shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="flex items-start justify-between px-5 pt-2 pb-3 shrink-0">
          <h3 className="text-base font-bold text-text-primary leading-snug flex-1 mr-3 m-0">
            {event.event}
          </h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-xl leading-none bg-transparent border-none cursor-pointer shrink-0 p-0"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {summary === "loading" ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-ar-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt={event.event}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}

              {summary?.extract ? (
                <div className="relative mb-4">
                  <div
                    className={`text-sm text-text-secondary leading-relaxed transition-[filter] duration-300 ${
                      revealed ? "" : "blur-[5px] select-none cursor-pointer"
                    }`}
                    onClick={() => !revealed && setRevealed(true)}
                  >
                    {summary.extract}
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
                <p className="text-sm text-text-tertiary mb-4">
                  No se encontró un resumen disponible.
                </p>
              )}

              {event.wikipediaUrl && (
                <a
                  href={event.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-ar-blue/10 border border-ar-blue/30 text-ar-blue text-sm font-semibold hover:bg-ar-blue/20 transition-colors no-underline"
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
