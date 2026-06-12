import { DECKS, BIOGRAFIAS } from "../../data/index";
import type { AppStats } from "../storage";

export function StatsScreen({
  stats,
  onBack,
  onReset,
}: {
  stats: AppStats;
  onBack: () => void;
  onReset: () => void;
}) {
  const rows = Object.entries(stats.events)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.shown - a.shown);

  const allEvents = [
    ...DECKS.flatMap((d) => d.events),
    ...BIOGRAFIAS.characters.flatMap((c) => c.events),
  ];
  const eventMap = Object.fromEntries(allEvents.map((e) => [e.event, e]));

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[600px] mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-sm font-medium p-0 hover:text-text-primary transition-colors"
          >
            ← Volver
          </button>
          <h2 className="flex-1 text-center text-base font-bold text-text-primary m-0">
            Tus estadísticas
          </h2>
          <span className="w-14" />
        </div>

        {rows.length === 0 ? (
          <p className="text-text-tertiary text-sm text-center mt-16">
            Todavía no jugaste ninguna partida.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 text-xs font-bold text-text-tertiary uppercase tracking-wider">
              <span>Evento</span>
              <span className="text-center">Visto</span>
              <span className="text-center text-success">✓</span>
              <span className="text-center text-danger">✗</span>
            </div>
            {rows.map((row) => {
              const ev = eventMap[row.id];
              if (!ev) return null;
              const pct = row.shown > 0 ? row.correct / row.shown : 0;
              const rowColor =
                pct > 0.7
                  ? "text-success"
                  : pct < 0.4 && row.shown > 0
                    ? "text-danger"
                    : "text-text-secondary";
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2.5 rounded-lg bg-bg-card border border-border items-center"
                >
                  <span className={`text-xs leading-snug ${rowColor}`}>
                    {ev.event}
                  </span>
                  <span className="text-xs text-text-tertiary text-center">
                    {row.shown}
                  </span>
                  <span className="text-xs text-success text-center font-semibold">
                    {row.correct}
                  </span>
                  <span className="text-xs text-danger text-center font-semibold">
                    {row.wrong}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {rows.length > 0 && (
          <button
            onClick={onReset}
            className="btn-secondary w-full mt-8 hover:text-danger hover:border-danger"
          >
            Reiniciar estadísticas
          </button>
        )}
      </div>
    </div>
  );
}
