// Faro's display ranges describe magnitude, never local intensity or risk.
// Match the one-decimal value shown throughout the UI.
export const magnitudeRanges = [
  { id: 'under4', label: '< 4.0' },
  { id: '4', label: '4.0–4.9' },
  { id: '5', label: '5.0–5.9' },
  { id: '6', label: '6.0–6.9' },
  { id: '7plus', label: '≥ 7.0' },
] as const;
export function magnitudeBand(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'unknown';
  const displayed = Number(value.toFixed(1));
  return displayed < 4
    ? 'under4'
    : displayed < 5
      ? '4'
      : displayed < 6
        ? '5'
        : displayed < 7
          ? '6'
          : '7plus';
}
