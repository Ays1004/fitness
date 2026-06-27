import type {
  AnalyticsSummary,
  DailyMetrics,
  FitnessAnalytics,
  Goals,
  Insight,
  TrendStat,
  WeekdayAverage,
} from "./types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function avg(values: number[]): number {
  return values.length ? sum(values) / values.length : 0;
}

function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return round(((current - previous) / previous) * 100, 1);
}

/**
 * Build a trend stat for the average of a metric, comparing the latter half of
 * the period to the earlier half (a simple momentum signal).
 */
function avgTrend(daily: DailyMetrics[], pick: (d: DailyMetrics) => number): TrendStat {
  const mid = Math.floor(daily.length / 2);
  const earlier = daily.slice(0, mid).map(pick);
  const recent = daily.slice(mid).map(pick);
  const value = round(avg(daily.map(pick)), 1);
  return { value, changePct: pctChange(avg(recent), avg(earlier)) };
}

function nonNull(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null);
}

function computeStepStreak(daily: DailyMetrics[], goal: number): number {
  let streak = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].steps >= goal) streak++;
    else break;
  }
  return streak;
}

function computeSummary(daily: DailyMetrics[], goals: Goals): AnalyticsSummary {
  const steps = daily.map((d) => d.steps);
  const totalSteps = sum(steps);
  const restingHrs = nonNull(daily.map((d) => d.heartRateResting));
  const sleepValues = daily.filter((d) => d.sleepHours !== null);
  const weights = daily.filter((d) => d.weightKg !== null);

  const bestDay = daily.reduce<{ date: string; steps: number } | null>((best, d) => {
    if (!best || d.steps > best.steps) return { date: d.date, steps: d.steps };
    return best;
  }, null);

  const latestWeightKg = weights.length ? weights[weights.length - 1].weightKg! : null;
  const firstWeightKg = weights.length ? weights[0].weightKg! : null;
  const weightChangeKg =
    latestWeightKg !== null && firstWeightKg !== null
      ? round(latestWeightKg - firstWeightKg, 1)
      : null;

  const goalHits = steps.filter((s) => s >= goals.steps).length;

  return {
    totalSteps,
    avgSteps: avgTrend(daily, (d) => d.steps),
    totalDistanceKm: round(sum(daily.map((d) => d.distanceKm)), 1),
    totalCalories: sum(daily.map((d) => d.calories)),
    avgCalories: avgTrend(daily, (d) => d.calories),
    avgActiveMinutes: avgTrend(daily, (d) => d.activeMinutes),
    avgRestingHr: restingHrs.length ? round(avg(restingHrs)) : null,
    avgSleepHours: avgTrend(
      sleepValues.length ? sleepValues : daily,
      (d) => d.sleepHours ?? 0,
    ),
    latestWeightKg,
    weightChangeKg,
    bestDay,
    stepStreak: computeStepStreak(daily, goals.steps),
    goalHitRate: daily.length ? goalHits / daily.length : 0,
    totalActiveMinutes: sum(daily.map((d) => d.activeMinutes)),
  };
}

function computeWeekdayAverages(daily: DailyMetrics[]): WeekdayAverage[] {
  const buckets: number[][] = Array.from({ length: 7 }, () => []);
  for (const d of daily) {
    const weekday = new Date(`${d.date}T00:00:00`).getDay();
    buckets[weekday].push(d.steps);
  }
  return buckets.map((values, weekday) => ({
    weekday,
    label: WEEKDAY_LABELS[weekday],
    avgSteps: Math.round(avg(values)),
  }));
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function computeInsights(
  daily: DailyMetrics[],
  goals: Goals,
  summary: AnalyticsSummary,
  weekdays: WeekdayAverage[],
): Insight[] {
  const insights: Insight[] = [];

  // Step streak.
  if (summary.stepStreak >= 2) {
    insights.push({
      id: "streak",
      tone: "positive",
      title: `${summary.stepStreak}-day step streak`,
      detail: `You've hit your ${goals.steps.toLocaleString()}-step goal ${summary.stepStreak} days in a row. Keep the momentum going.`,
    });
  } else {
    insights.push({
      id: "streak",
      tone: "neutral",
      title: "Restart your streak",
      detail: `A short walk today gets you back above ${goals.steps.toLocaleString()} steps and starts a new streak.`,
    });
  }

  // Step trend.
  const stepChange = summary.avgSteps.changePct;
  if (stepChange !== null) {
    insights.push({
      id: "step-trend",
      tone: stepChange >= 0 ? "positive" : "warning",
      title: stepChange >= 0 ? "Activity trending up" : "Activity dipping",
      detail: `Your average daily steps are ${stepChange >= 0 ? "up" : "down"} ${Math.abs(
        stepChange,
      )}% in the second half of this period.`,
    });
  }

  // Best weekday.
  const bestWeekday = [...weekdays].sort((a, b) => b.avgSteps - a.avgSteps)[0];
  const worstWeekday = [...weekdays].sort((a, b) => a.avgSteps - b.avgSteps)[0];
  if (bestWeekday && worstWeekday && bestWeekday.avgSteps > 0) {
    insights.push({
      id: "weekday",
      tone: "neutral",
      title: `${bestWeekday.label} is your most active day`,
      detail: `You average ${bestWeekday.avgSteps.toLocaleString()} steps on ${bestWeekday.label}s and only ${worstWeekday.avgSteps.toLocaleString()} on ${worstWeekday.label}s.`,
    });
  }

  // Sleep.
  const sleepAvg = summary.avgSleepHours.value;
  if (sleepAvg > 0) {
    const meetsSleep = sleepAvg >= goals.sleepHours - 0.5;
    insights.push({
      id: "sleep",
      tone: meetsSleep ? "positive" : "warning",
      title: meetsSleep ? "Well rested" : "Running a sleep deficit",
      detail: `You average ${sleepAvg.toFixed(1)}h of sleep versus a ${goals.sleepHours}h target.`,
    });
  }

  // Resting heart rate.
  if (summary.avgRestingHr !== null) {
    const good = summary.avgRestingHr <= 65;
    insights.push({
      id: "rhr",
      tone: good ? "positive" : "neutral",
      title: `Resting HR ${summary.avgRestingHr} bpm`,
      detail: good
        ? "A lower resting heart rate is a strong sign of improving cardiovascular fitness."
        : "Consistent aerobic activity and better sleep can help bring this down over time.",
    });
  }

  // Best day highlight.
  if (summary.bestDay) {
    insights.push({
      id: "best-day",
      tone: "positive",
      title: `Peak day: ${summary.bestDay.steps.toLocaleString()} steps`,
      detail: `Your strongest day this period was ${formatDate(summary.bestDay.date)}.`,
    });
  }

  return insights;
}

/**
 * Turn a raw daily series into the full analytics payload consumed by the UI.
 */
export function buildAnalytics(
  daily: DailyMetrics[],
  goals: Goals,
  source: "google-fit" | "demo",
): FitnessAnalytics {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const summary = computeSummary(sorted, goals);
  const weekdayAverages = computeWeekdayAverages(sorted);
  const insights = computeInsights(sorted, goals, summary, weekdayAverages);

  return {
    source,
    generatedAt: new Date().toISOString(),
    range: {
      days: sorted.length,
      start: sorted[0]?.date ?? "",
      end: sorted[sorted.length - 1]?.date ?? "",
    },
    goals,
    daily: sorted,
    summary,
    weekdayAverages,
    insights,
  };
}
