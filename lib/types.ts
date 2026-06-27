export type MetricKey =
  | "steps"
  | "calories"
  | "distanceKm"
  | "activeMinutes"
  | "heartRateResting"
  | "sleepHours"
  | "weightKg";

export interface DailyMetrics {
  /** ISO date, e.g. "2026-06-27" */
  date: string;
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
  /** Average heart rate across the day, bpm. null when no data. */
  heartRateAvg: number | null;
  /** Resting heart rate, bpm. null when no data. */
  heartRateResting: number | null;
  /** Hours of sleep recorded for the night ending this date. */
  sleepHours: number | null;
  /** Body weight in kg, null on days without a measurement. */
  weightKg: number | null;
}

export interface Goals {
  steps: number;
  activeMinutes: number;
  calories: number;
  sleepHours: number;
  distanceKm: number;
}

export interface TrendStat {
  /** The value over the current period. */
  value: number;
  /** Percent change vs the immediately preceding period of equal length. */
  changePct: number | null;
}

export interface Insight {
  id: string;
  tone: "positive" | "neutral" | "warning";
  title: string;
  detail: string;
}

export interface AnalyticsSummary {
  totalSteps: number;
  avgSteps: TrendStat;
  totalDistanceKm: number;
  totalCalories: number;
  avgCalories: TrendStat;
  avgActiveMinutes: TrendStat;
  avgRestingHr: number | null;
  avgSleepHours: TrendStat;
  latestWeightKg: number | null;
  weightChangeKg: number | null;
  /** Highest-step day in the period. */
  bestDay: { date: string; steps: number } | null;
  /** Consecutive days (ending today) that met the step goal. */
  stepStreak: number;
  /** Share of days in period that hit the step goal (0..1). */
  goalHitRate: number;
  /** Total active minutes in the period. */
  totalActiveMinutes: number;
}

export interface WeekdayAverage {
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  label: string;
  avgSteps: number;
}

export interface FitnessAnalytics {
  source: "google-fit" | "demo";
  generatedAt: string;
  range: { days: number; start: string; end: string };
  goals: Goals;
  daily: DailyMetrics[];
  summary: AnalyticsSummary;
  weekdayAverages: WeekdayAverage[];
  insights: Insight[];
}

export const DEFAULT_GOALS: Goals = {
  steps: 10000,
  activeMinutes: 30,
  calories: 2400,
  sleepHours: 8,
  distanceKm: 7,
};
