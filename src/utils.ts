export function extractWikiTitle(url: string): string {
  return url.split("/wiki/")[1] ?? "";
}

export const PLACEHOLDER = "/placeholder.svg";

export function onImgError(e: { currentTarget: HTMLImageElement }): void {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PLACEHOLDER;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Share via the OS share sheet when available (mobile), falling back to the
// clipboard. "shared" also covers the user canceling the sheet (AbortError) —
// that's a choice, not a failure, and deserves no error feedback.
export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "shared";
      // Share failed for another reason (e.g. permission) — try the clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  if (y < 1000) return `${y} d.C.`;
  return `${y}`;
}
