// Synthesized sound effects + haptics via the Web Audio API — no asset files.
// One mute toggle (persisted) governs both sound and vibration.

const MUTE_KEY = "historia-sound-muted";

let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {}

// Create/resume the AudioContext. Must first run inside a user gesture
// (browsers block audio until then) — see the pointerdown hook in main.tsx.
function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  durMs: number,
  type: OscillatorType = "sine",
  delayMs = 0,
  vol = 0.15,
): void {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const start = c.currentTime + delayMs / 1000;
  const dur = durMs / 1000;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // Exponential attack/decay avoids clicks.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function vibrate(pattern: number | number[]): void {
  if (muted) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

function playError(): void {
  tone(330, 120, "square", 0, 0.12);
  tone(220, 150, "square", 120, 0.12);
  vibrate([60, 40, 60]);
}

function playWin(): void {
  // C5–E5–G5–C6 arpeggio
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, 180, "triangle", i * 90, 0.16),
  );
  vibrate([30, 50, 30]);
}

export const sounds = {
  init(): void {
    ensureCtx();
  },
  isMuted(): boolean {
    return muted;
  },
  toggleMuted(): boolean {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {}
    if (!muted) ensureCtx();
    return muted;
  },
  drop(): void {
    tone(180, 60, "triangle");
  },
  tick(i = 0): void {
    tone(680 + i * 70, 45, "sine", 0, 0.12);
  },
  error: playError,
  win: playWin,
  lose(): void {
    [440, 349.23, 293.66].forEach((f, i) =>
      tone(f, 200, "sine", i * 120, 0.14),
    );
  },
  correct(): void {
    tone(880, 70, "sine", 0, 0.14);
    tone(1320, 90, "sine", 70, 0.12);
    vibrate(15);
  },
  wrong: playError,
  record(): void {
    playWin();
    [1046.5, 1318.5].forEach((f, i) =>
      tone(f, 120, "triangle", 380 + i * 110, 0.16),
    );
  },
};
