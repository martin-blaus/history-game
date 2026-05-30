export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  if (y < 1000) return `${y} d.C.`;
  return `${y}`;
}
