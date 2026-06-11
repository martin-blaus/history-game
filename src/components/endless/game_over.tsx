import type { HistoryEvent } from "../../../data/index";
import { formatYear } from "../../utils";

export function EndlessGameOver({
  phase,
  score,
  bestScore,
  isNewRecord,
  timeline,
  onRestart,
  onBack,
}: {
  phase: "gameover" | "complete";
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  timeline: HistoryEvent[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const reviewEvents = timeline.slice(-8);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">
          {phase === "complete" ? "🎉" : "💔"}
        </div>
        <h2 className="text-2xl font-extrabold text-text-primary mb-2">
          {phase === "complete" ? "¡Completado!" : "Fin del juego"}
        </h2>
        <p className="text-text-secondary mb-4">
          {phase === "complete"
            ? "Ubicaste todos los eventos"
            : "Se te acabaron las chances"}
        </p>

        {/* Score */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-3">
          <div className="text-5xl font-extrabold text-ar-blue">{score}</div>
          <div className="text-sm text-text-tertiary mt-1">
            eventos ubicados
          </div>
          {isNewRecord ? (
            <div className="mt-2 text-sm font-bold text-ar-gold">
              ¡Nuevo récord! 🎉
            </div>
          ) : bestScore > 0 ? (
            <div className="mt-2 text-xs text-text-tertiary">
              Mejor: {bestScore}
            </div>
          ) : null}
        </div>

        {/* Mini timeline review */}
        {reviewEvents.length > 1 && (
          <div className="mb-6 text-left">
            <p className="text-2xs font-semibold text-text-tertiary tracking-widest uppercase mb-2 px-1">
              Últimos eventos
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-3 w-max pb-1">
                {reviewEvents.map((event, i) => (
                  <div
                    key={i}
                    className="w-36 shrink-0 bg-bg-secondary rounded-xl border border-border overflow-hidden"
                  >
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.event}
                        className="w-full h-20 object-cover block"
                        draggable={false}
                      />
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-text-primary leading-tight line-clamp-2 m-0 mb-1">
                        {event.event}
                      </p>
                      <span className="text-xs font-bold text-ar-blue">
                        {formatYear(event.year)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={onRestart} className="btn-primary w-full">
            Jugar de nuevo
          </button>
          <button onClick={onBack} className="btn-secondary w-full">
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}
