import type { Phase } from "./types";

export function EndlessHeader({
  onBack,
  streak,
  multiplier,
  lives,
  maxLives,
  score,
  phase,
}: {
  onBack: () => void;
  streak: number;
  multiplier: number;
  lives: number;
  maxLives: number;
  score: number;
  phase: Phase;
}) {
  return (
    <div className="flex items-center px-4 pt-5 pb-4 shrink-0">
      <button
        onClick={onBack}
        className="bg-transparent border-none cursor-pointer text-text-tertiary text-sm hover:text-text-secondary transition-colors"
      >
        ← Volver
      </button>
      <div className="flex-1 flex items-center justify-center gap-2">
        <span className="text-xs font-bold text-ar-blue tracking-widest uppercase">
          Endless
        </span>
        {streak > 0 && (
          <span className="text-sm font-bold text-ar-gold">
            {"🔥".repeat(Math.min(streak, 3))}
            {multiplier > 1 ? ` ×${multiplier}` : ""}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-2xl leading-none ${
            phase === "wrong" ? "heart-break" : ""
          }`}
        >
          {Array.from({ length: maxLives }, (_, i) =>
            i < lives ? "❤️" : "🩶",
          ).join("")}
        </span>
        <span
          key={score}
          className="text-xl font-extrabold text-text-primary score-pop"
        >
          🏆 {score}
        </span>
      </div>
    </div>
  );
}
