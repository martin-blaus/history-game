export function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  if (y < 1000) return `${y} d.C.`;
  return `${y}`;
}
