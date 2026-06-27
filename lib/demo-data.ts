import type { DailyMetrics } from "./types";

/**
 * Deterministic demo data. Values are derived from a hash of each calendar
 * date so the same day always produces the same numbers. This keeps charts
 * stable across refetches while still looking organic.
 */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0, 1)
  return ((h >>> 0) % 100000) / 100000;
}

/** Stable pseudo-random in [0,1) for a given date + channel. */
function rand(date: string, channel: string): number {
  return hashString(`${date}::${channel}`);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Generate a continuous daily series ending today and going back `days` days.
 * Models weekly rhythm (weekends differ), a gentle long-term fitness trend,
 * occasional rest days, and correlated metrics (steps -> distance -> calories).
 */
export function generateDemoSeries(days: number): DailyMetrics[] {
  const series: DailyMetrics[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Carry weight forward so it forms a smooth, slightly downward trend.
  let weight = 78.5;
  let lastWeightLogged = weight;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = toISODate(d);
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    // Progress factor: more recent days trend slightly fitter (0 -> 1).
    const progress = (days - 1 - i) / Math.max(1, days - 1);

    // Rest day roughly 1 in 9 days, more likely on Mondays.
    const restRoll = rand(date, "rest");
    const isRestDay = restRoll < (weekday === 1 ? 0.22 : 0.1);

    // --- Steps ---
    const baseSteps = isWeekend ? 7600 : 9400;
    const trendBoost = 900 * progress;
    const noise = (rand(date, "steps") - 0.5) * 4200;
    let steps = baseSteps + trendBoost + noise;
    if (isRestDay) steps *= 0.45;
    steps = Math.max(900, Math.round(steps));

    // --- Distance (km) ~ steps with a variable stride. ---
    const stride = 0.00072 + rand(date, "stride") * 0.00006; // km per step
    const distanceKm = round(steps * stride, 2);

    // --- Active minutes correlate with steps. ---
    let activeMinutes = Math.round(steps / 240 + (rand(date, "active") - 0.5) * 14);
    if (isRestDay) activeMinutes = Math.round(activeMinutes * 0.5);
    activeMinutes = Math.max(0, activeMinutes);

    // --- Calories: base metabolic + activity. ---
    const calories = Math.round(
      1850 + steps * 0.045 + activeMinutes * 6 + (rand(date, "cal") - 0.5) * 120,
    );

    // --- Heart rate ---
    const heartRateResting = Math.round(
      62 - progress * 4 + (rand(date, "rhr") - 0.5) * 4,
    );
    const heartRateAvg = Math.round(
      heartRateResting + 14 + activeMinutes * 0.25 + (rand(date, "hr") - 0.5) * 6,
    );

    // --- Sleep (hours for the night ending this date) ---
    const sleepBase = isWeekend ? 7.8 : 6.9;
    const sleepHours = round(
      Math.min(9.5, Math.max(4.5, sleepBase + (rand(date, "sleep") - 0.5) * 1.8)),
      1,
    );

    // --- Weight: random walk with slight downward bias, logged ~every other day ---
    weight += (rand(date, "weightDelta") - 0.55) * 0.18;
    weight = round(Math.min(82, Math.max(74, weight)), 2);
    const logsWeight = rand(date, "weightLog") > 0.4;
    let weightKg: number | null = null;
    if (logsWeight) {
      weightKg = weight;
      lastWeightLogged = weight;
    }

    series.push({
      date,
      steps,
      distanceKm,
      activeMinutes,
      calories,
      heartRateAvg,
      heartRateResting,
      sleepHours,
      weightKg,
    });
  }

  // Guarantee the most recent day has a weight reading for the KPI card.
  const last = series[series.length - 1];
  if (last && last.weightKg === null) last.weightKg = round(lastWeightLogged, 2);

  return series;
}
