import { useState, useEffect } from "react";
import type { Deck, HistoryEvent } from "../../data/index";
import { extractWikiTitle, formatYear } from "../utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
}

interface RelatedPage {
  title: string;
  extract?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

interface PanelView {
  url: string;
  title: string;
}

type Tab = "summary" | "related" | "nearby";

// ── Module-level caches ───────────────────────────────────────────────────────

const summaryCache = new Map<string, WikiSummary | null>();
const relatedCache = new Map<string, RelatedPage[]>();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchSummary(url: string): Promise<WikiSummary | null> {
  const title = extractWikiTitle(url);
  if (!title) return null;
  if (summaryCache.has(title)) return summaryCache.get(title)!;
  try {
    const r = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    const data: WikiSummary = await r.json();
    summaryCache.set(title, data);
    return data;
  } catch {
    summaryCache.set(title, null);
    return null;
  }
}

async function fetchRelated(url: string): Promise<RelatedPage[]> {
  const title = extractWikiTitle(url);
  if (!title) return [];
  if (relatedCache.has(title)) return relatedCache.get(title)!;
  try {
    const r = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/related/${encodeURIComponent(title)}`,
    );
    const data: { pages: RelatedPage[] } = await r.json();
    const pages = (data.pages ?? []).slice(0, 5);
    relatedCache.set(title, pages);
    return pages;
  } catch {
    relatedCache.set(title, []);
    return [];
  }
}

// Returns up to 3 deck events chronologically before and 3 after the root event.
function nearbyEvents(deck: Deck, rootEvent: HistoryEvent): HistoryEvent[] {
  const others = deck.events
    .filter((e) => e.event !== rootEvent.event)
    .sort((a, b) => a.year - b.year);
  const before = others.filter((e) => e.year <= rootEvent.year).slice(-3);
  const after = others.filter((e) => e.year > rootEvent.year).slice(0, 3);
  return [...before, ...after];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-ar-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ArticleCard({
  thumbnail,
  title,
  extract,
  yearBadge,
  onClick,
}: {
  thumbnail?: string;
  title: string;
  extract?: string;
  yearBadge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-start gap-3 w-full text-left p-3 rounded-xl bg-bg-secondary border border-border transition-colors ${
        onClick
          ? "hover:border-ar-blue/50 cursor-pointer"
          : "cursor-default opacity-80"
      }`}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          className="w-12 h-12 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        {yearBadge !== undefined && (
          <span className="inline-block text-[10px] font-bold text-ar-blue bg-ar-blue/10 px-1.5 py-0.5 rounded mb-1">
            {formatYear(yearBadge)}
          </span>
        )}
        <p className="text-xs font-semibold text-text-primary m-0 leading-snug line-clamp-2">
          {title}
        </p>
        {extract && (
          <p className="text-[11px] text-text-tertiary m-0 mt-0.5 leading-relaxed line-clamp-3">
            {extract}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WikipediaSheet({
  event,
  deck,
  onClose,
}: {
  event: HistoryEvent;
  deck: Deck;
  onClose: () => void;
}) {
  const initial: PanelView = {
    url: event.wikipediaUrl ?? "",
    title: event.event,
  };

  const [stack, setStack] = useState<PanelView[]>([initial]);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const [summary, setSummary] = useState<WikiSummary | null | "loading">("loading");
  const [related, setRelated] = useState<RelatedPage[] | "loading" | null>(null);
  const [revealed, setRevealed] = useState(false);

  const current = stack[stack.length - 1];

  // Nearby events are computed from the deck — no fetch needed
  const nearby = nearbyEvents(deck, event);

  // Fetch summary whenever current URL changes
  useEffect(() => {
    setRevealed(false);
    setSummary("loading");
    setRelated(null);
    setActiveTab("summary");
    if (!current.url) { setSummary(null); return; }
    fetchSummary(current.url).then(setSummary);
  }, [current.url]);

  // Lazy fetch related when tab is opened
  useEffect(() => {
    if (activeTab !== "related" || related !== null || !current.url) return;
    setRelated("loading");
    fetchRelated(current.url).then(setRelated);
  }, [activeTab, current.url]);

  function navigate(url: string, title: string) {
    setStack((s) => [...s, { url, title }]);
  }

  function goBack() {
    if (stack.length <= 1) return;
    setStack((s) => s.slice(0, -1));
  }

  const thumbnail =
    summary !== "loading" && summary !== null
      ? (summary.thumbnail?.source ?? event.image)
      : event.image;

  const extract =
    summary !== "loading" && summary !== null ? summary.extract : null;

  const bodyText =
    extract ||
    (event.context
      ? event.context.length > 1000
        ? event.context.slice(0, 1000) + "…"
        : event.context
      : null);

  const isContextFallback = !extract && !!bodyText;

  const tabs: Tab[] = ["summary", "related", "nearby"];
  const tabLabels: Record<Tab, string> = {
    summary: "Resumen",
    related: "Relacionados",
    nearby: "En esa época",
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="wiki-panel fixed top-0 right-0 bottom-0 w-[380px] max-w-[92vw] z-50 bg-bg-card border-l border-border shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3 shrink-0 border-b border-border">
          {stack.length > 1 && (
            <button
              onClick={goBack}
              className="text-ar-blue text-sm font-semibold bg-transparent border-none cursor-pointer shrink-0 p-0 mt-0.5 hover:opacity-70 transition-opacity"
            >
              ← Volver
            </button>
          )}
          {thumbnail && (
            <img
              src={thumbnail}
              alt={current.title}
              className="w-14 h-14 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-ar-blue tracking-widest uppercase m-0 mb-0.5">
              Wikipedia
            </p>
            <h3 className="text-sm font-bold text-text-primary leading-snug m-0 line-clamp-3">
              {current.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-lg leading-none bg-transparent border-none cursor-pointer shrink-0 p-0 ml-1 mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-border px-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 ${
                activeTab === tab
                  ? "border-ar-blue text-ar-blue"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Tab bodies */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">

          {/* ── Resumen ── */}
          {activeTab === "summary" && (
            <>
              {summary === "loading" ? (
                <Spinner />
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

                  {current.url && (
                    <a
                      href={current.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-ar-blue/10 border border-ar-blue/30 text-ar-blue text-sm font-semibold hover:bg-ar-blue/20 transition-colors no-underline"
                    >
                      Abrir en Wikipedia ↗
                    </a>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Relacionados ── */}
          {activeTab === "related" && (
            <>
              {related === "loading" || related === null ? (
                <Spinner />
              ) : related.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No se encontraron artículos relacionados.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {related.map((page, i) => (
                    <ArticleCard
                      key={i}
                      thumbnail={page.thumbnail?.source}
                      title={page.title}
                      extract={page.extract}
                      onClick={() => {
                        const url = page.content_urls?.desktop.page ?? "";
                        if (url) navigate(url, page.title);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── En esa época ── */}
          {activeTab === "nearby" && (
            <>
              <p className="text-[11px] text-text-tertiary m-0 -mb-2">
                Otros eventos del {deck.name} cerca del año{" "}
                {formatYear(event.year)}
              </p>
              {nearby.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No hay otros eventos cercanos en este mazo.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {nearby.map((e, i) => (
                    <ArticleCard
                      key={i}
                      thumbnail={e.image}
                      title={e.event}
                      extract={e.context}
                      yearBadge={e.year}
                      onClick={
                        e.wikipediaUrl
                          ? () => navigate(e.wikipediaUrl!, e.event)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
