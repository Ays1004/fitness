export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toString();
}

export function formatKm(n: number): string {
  return `${n.toFixed(1)} km`;
}

export function formatHours(n: number): string {
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatSignedPct(pct: number | null): string {
  if (pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}
