import { useState } from "react";
import { sounds } from "../sounds";

export function MuteButton({ className = "" }: { className?: string }) {
  const [muted, setMuted] = useState(() => sounds.isMuted());
  return (
    <button
      onClick={() => setMuted(sounds.toggleMuted())}
      aria-label={muted ? "Activar sonido" : "Silenciar"}
      title={muted ? "Activar sonido" : "Silenciar"}
      className={`bg-transparent border-none cursor-pointer text-lg leading-none hover:opacity-80 transition-opacity ${className}`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
