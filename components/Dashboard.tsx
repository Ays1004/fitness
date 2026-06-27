"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AreaLineChart, BarChart, ProgressRing, Sparkline } from "@/components/charts";
import {
  ActivityIcon,
  CalendarIcon,
  FlameIcon,
  FootprintsIcon,
  GoogleIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MoonIcon,
  ScaleIcon,
  SparklesIcon,
  TimerIcon,
  TrendDownIcon,
  TrendUpIcon,
  TrophyIcon,
} from "@/components/icons";
import {
  formatCompact,
  formatHours,
  formatKm,
  formatNumber,
  formatSignedPct,
} from "@/lib/format";
import type { ConnectionStatus } from "@/lib/server-data";
import type { DailyMetrics, FitnessAnalytics, TrendStat } from "@/lib/types";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

type MetricKey =
  | "steps"
  | "calories"
  | "activeMinutes"
  | "distanceKm"
  | "sleepHours"
  | "heartRateResting"
  | "weightKg";

interface MetricDef {
  key: MetricKey;
  label: string;
  color: string;
  chart: "area" | "bar";
  get: (d: DailyMetrics) => number | null;
  format: (n: number) => string;
  goal?: (a: FitnessAnalytics) => number | undefined;
  goalLabel?: string;
}

const METRICS: MetricDef[] = [
  {
    key: "steps",
    label: "Steps",
    color: "#34d399",
    chart: "area",
    get: (d) => d.steps,
    format: formatNumber,
    goal: (a) => a.goals.steps,
    goalLabel: "Goal",
  },
  {
    key: "calories",
    label: "Calories",
    color: "#fb923c",
    chart: "bar",
    get: (d) => d.calories,
    format: (n) => `${formatNumber(n)} kcal`,
    goal: (a) => a.goals.calories,
    goalLabel: "Goal",
  },
  {
    key: "activeMinutes",
    label: "Active min",
    color: "#a78bfa",
    chart: "bar",
    get: (d) => d.activeMinutes,
    format: (n) => `${Math.round(n)} min`,
    goal: (a) => a.goals.activeMinutes,
    goalLabel: "Goal",
  },
  {
    key: "distanceKm",
    label: "Distance",
    color: "#38bdf8",
    chart: "area",
    get: (d) => d.distanceKm,
    format: formatKm,
    goal: (a) => a.goals.distanceKm,
    goalLabel: "Goal",
  },
  {
    key: "sleepHours",
    label: "Sleep",
    color: "#818cf8",
    chart: "area",
    get: (d) => d.sleepHours,
    format: formatHours,
    goal: (a) => a.goals.sleepHours,
    goalLabel: "Goal",
  },
  {
    key: "heartRateResting",
    label: "Resting HR",
    color: "#f43f5e",
    chart: "area",
    get: (d) => d.heartRateResting,
    format: (n) => `${Math.round(n)} bpm`,
  },
  {
    key: "weightKg",
    label: "Weight",
    color: "#22d3ee",
    chart: "area",
    get: (d) => d.weightKg,
    format: (n) => `${n.toFixed(1)} kg`,
  },
];

function toSeries(daily: DailyMetrics[], get: (d: DailyMetrics) => number | null) {
  return daily
    .map((d) => ({ date: d.date, value: get(d) }))
    .filter((p): p is { date: string; value: number } => p.value !== null);
}

function TrendChip({ stat, invert = false }: { stat: TrendStat; invert?: boolean }) {
  const pct = stat.changePct;
  if (pct === null) {
    return <span className="text-xs text-zinc-500">no change</span>;
  }
  const up = pct > 0;
  const good = invert ? !up : up;
  const Icon = up ? TrendUpIcon : TrendDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        good
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-rose-500/15 text-rose-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {formatSignedPct(pct)}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  unit,
  trend,
  invertTrend,
  spark,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  trend?: TrendStat;
  invertTrend?: boolean;
  spark: number[];
  color: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          {icon}
        </div>
        {trend && <TrendChip stat={trend} invert={invertTrend} />}
      </div>
      <div className="mt-4 text-sm text-zinc-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-white">
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      <div className="mt-3 opacity-80">
        <Sparkline values={spark} color={color} />
      </div>
    </Card>
  );
}

function GoalRing({
  label,
  value,
  goal,
  color,
  display,
  icon,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  display: string;
  icon: React.ReactNode;
}) {
  const pct = Math.round((value / goal) * 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing value={value} max={goal} color={color} size={116} stroke={10}>
        <span style={{ color }}>{icon}</span>
        <span className="mt-1 text-lg font-semibold text-white">{display}</span>
        <span className="text-[11px] text-zinc-500">{pct}%</span>
      </ProgressRing>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-zinc-400">{icon}</span>}
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function MiniChartCard({
  title,
  subtitle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </Card>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured:
    "Google OAuth isn't configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to connect live data.",
  invalid_state: "The sign-in attempt expired or was invalid. Please try again.",
  access_denied: "Google access was denied. Connect again to view your live data.",
  token_exchange_failed: "Couldn't complete sign-in with Google. Please try again.",
};

export default function Dashboard({
  initial,
  connection,
  initialError,
}: {
  initial: FitnessAnalytics;
  connection: ConnectionStatus;
  initialError?: string | null;
}) {
  const [data, setData] = useState<FitnessAnalytics>(initial);
  const [days, setDays] = useState(initial.range.days);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<MetricKey>("steps");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [generatedLabel, setGeneratedLabel] = useState<string | null>(null);

  const fetchData = useCallback(async (nextDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fit?days=${nextDays}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the URL clean after reading the error / connected params.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Render the locale-formatted timestamp only on the client to avoid a
  // server/client hydration mismatch.
  useEffect(() => {
    setGeneratedLabel(new Date(data.generatedAt).toLocaleString());
  }, [data.generatedAt]);

  const onRange = (nextDays: number) => {
    setDays(nextDays);
    fetchData(nextDays);
  };

  const summary = data.summary;
  const today = data.daily[data.daily.length - 1];
  const isDemo = data.source === "demo";

  const activeMetric = useMemo(
    () => METRICS.find((m) => m.key === metric)!,
    [metric],
  );
  const mainSeries = useMemo(
    () => toSeries(data.daily, activeMetric.get),
    [data.daily, activeMetric],
  );
  const metricValues = mainSeries.map((p) => p.value);
  const metricAvg = metricValues.length
    ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length
    : 0;
  const metricTotal = metricValues.reduce((a, b) => a + b, 0);

  const stepsSpark = data.daily.map((d) => d.steps);
  const activeSpark = data.daily.map((d) => d.activeMinutes);
  const calSpark = data.daily.map((d) => d.calories);
  const sleepSpark = data.daily.map((d) => d.sleepHours ?? 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-zinc-950">
            <ActivityIcon className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Pulse
            </h1>
            <p className="text-xs text-zinc-500">Google Fit analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              isDemo
                ? "bg-amber-500/15 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDemo ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            {isDemo ? "Demo data" : "Live · Google Fit"}
          </span>
          {connection.connected ? (
            <a
              href="/api/auth/logout"
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
            >
              Disconnect
            </a>
          ) : (
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              <GoogleIcon />
              Connect Google Fit
            </a>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-300/70 hover:text-rose-200"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Data-source note */}
      {isDemo && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <span>
              You&apos;re viewing realistic{" "}
              <span className="font-medium text-zinc-200">demo data</span>. Google
              Fit needs OAuth consent (not just an API key) to read your personal
              metrics.{" "}
              {connection.oauthConfigured
                ? "Connect your account to see live data."
                : "Add OAuth credentials, then connect, to go live."}
            </span>
          </div>
        </div>
      )}

      {/* Range selector */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {data.range.start} → {data.range.end}
          </span>
          {loading && (
            <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          )}
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => onRange(r.days)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                days === r.days
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<FootprintsIcon className="h-5 w-5" />}
          label="Avg daily steps"
          value={formatNumber(summary.avgSteps.value)}
          trend={summary.avgSteps}
          spark={stepsSpark}
          color="#34d399"
        />
        <KpiCard
          icon={<TimerIcon className="h-5 w-5" />}
          label="Avg active minutes"
          value={formatNumber(summary.avgActiveMinutes.value)}
          unit="min"
          trend={summary.avgActiveMinutes}
          spark={activeSpark}
          color="#a78bfa"
        />
        <KpiCard
          icon={<FlameIcon className="h-5 w-5" />}
          label="Avg calories / day"
          value={formatNumber(summary.avgCalories.value)}
          unit="kcal"
          trend={summary.avgCalories}
          spark={calSpark}
          color="#fb923c"
        />
        <KpiCard
          icon={<MoonIcon className="h-5 w-5" />}
          label="Avg sleep / night"
          value={formatHours(summary.avgSleepHours.value)}
          trend={summary.avgSleepHours}
          spark={sleepSpark}
          color="#818cf8"
        />
      </div>

      {/* Goals + streak */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<TrophyIcon className="h-4 w-4" />}
            title="Today's goals"
            subtitle="Progress toward your daily targets"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <GoalRing
              label="Steps"
              value={today.steps}
              goal={data.goals.steps}
              color="#34d399"
              display={formatCompact(today.steps)}
              icon={<FootprintsIcon className="h-4 w-4" />}
            />
            <GoalRing
              label="Active min"
              value={today.activeMinutes}
              goal={data.goals.activeMinutes}
              color="#a78bfa"
              display={`${today.activeMinutes}`}
              icon={<TimerIcon className="h-4 w-4" />}
            />
            <GoalRing
              label="Calories"
              value={today.calories}
              goal={data.goals.calories}
              color="#fb923c"
              display={formatCompact(today.calories)}
              icon={<FlameIcon className="h-4 w-4" />}
            />
            <GoalRing
              label="Distance"
              value={today.distanceKm}
              goal={data.goals.distanceKm}
              color="#38bdf8"
              display={`${today.distanceKm}`}
              icon={<MapPinIcon className="h-4 w-4" />}
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <SparklesIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Current streak</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-white">
                {summary.stepStreak}
              </span>
              <span className="text-sm text-zinc-500">days</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              hitting your step goal in a row
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <TrophyIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Goal hit rate</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-white">
                {Math.round(summary.goalHitRate * 100)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              of days reached {formatCompact(data.goals.steps)} steps
            </p>
          </Card>
        </div>
      </div>

      {/* Main interactive chart */}
      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Trends</h2>
            <p className="text-xs text-zinc-500">
              {activeMetric.label} · avg {activeMetric.format(metricAvg)} ·{" "}
              {activeMetric.key === "weightKg" ||
              activeMetric.key === "heartRateResting" ||
              activeMetric.key === "sleepHours"
                ? `${mainSeries.length} readings`
                : `total ${activeMetric.format(metricTotal)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  metric === m.key
                    ? "text-zinc-900"
                    : "text-zinc-400 hover:text-white"
                }`}
                style={
                  metric === m.key ? { backgroundColor: m.color } : undefined
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-zinc-700">
          {activeMetric.chart === "bar" ? (
            <BarChart
              data={mainSeries}
              color={activeMetric.color}
              goal={activeMetric.goal?.(data)}
              formatValue={activeMetric.format}
            />
          ) : (
            <AreaLineChart
              data={mainSeries}
              color={activeMetric.color}
              goal={activeMetric.goal?.(data)}
              goalLabel={activeMetric.goalLabel}
              formatValue={activeMetric.format}
            />
          )}
        </div>
      </Card>

      {/* Secondary charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MiniChartCard
          title="Activity by weekday"
          subtitle="Average steps per day of week"
        >
          <div className="text-zinc-700">
            <BarChart
              data={data.weekdayAverages.map((w) => ({
                date: w.label,
                value: w.avgSteps,
              }))}
              color="#34d399"
              formatValue={formatNumber}
            />
          </div>
          <div className="mt-1 flex justify-between px-1 text-[11px] text-zinc-500">
            {data.weekdayAverages.map((w) => (
              <span key={w.weekday}>{w.label}</span>
            ))}
          </div>
        </MiniChartCard>

        <MiniChartCard
          title="Resting heart rate"
          subtitle="Lower is generally fitter"
          badge={
            summary.avgRestingHr !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">
                <HeartIcon className="h-3 w-3" />
                avg {summary.avgRestingHr} bpm
              </span>
            ) : undefined
          }
        >
          <div className="text-zinc-700">
            <AreaLineChart
              data={toSeries(data.daily, (d) => d.heartRateResting)}
              color="#f43f5e"
              formatValue={(n) => `${Math.round(n)} bpm`}
            />
          </div>
        </MiniChartCard>

        <MiniChartCard
          title="Weight trend"
          subtitle="Logged measurements"
          badge={
            summary.weightChangeKg !== null ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  summary.weightChangeKg <= 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                <ScaleIcon className="h-3 w-3" />
                {summary.weightChangeKg > 0 ? "+" : ""}
                {summary.weightChangeKg} kg
              </span>
            ) : undefined
          }
        >
          <div className="text-zinc-700">
            <AreaLineChart
              data={toSeries(data.daily, (d) => d.weightKg)}
              color="#22d3ee"
              formatValue={(n) => `${n.toFixed(1)} kg`}
            />
          </div>
        </MiniChartCard>

        <MiniChartCard
          title="Sleep duration"
          subtitle={`Target ${data.goals.sleepHours}h per night`}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300">
              <MoonIcon className="h-3 w-3" />
              avg {formatHours(summary.avgSleepHours.value)}
            </span>
          }
        >
          <div className="text-zinc-700">
            <BarChart
              data={toSeries(data.daily, (d) => d.sleepHours)}
              color="#818cf8"
              goal={data.goals.sleepHours}
              formatValue={formatHours}
            />
          </div>
        </MiniChartCard>
      </div>

      {/* Insights */}
      <div className="mt-4">
        <SectionTitle
          icon={<SparklesIcon className="h-4 w-4" />}
          title="Insights"
          subtitle="Automatically generated from your data"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.insights.map((insight) => (
            <Card key={insight.id}>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    insight.tone === "positive"
                      ? "bg-emerald-400"
                      : insight.tone === "warning"
                        ? "bg-amber-400"
                        : "bg-sky-400"
                  }`}
                />
                <h3 className="text-sm font-semibold text-white">
                  {insight.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {insight.detail}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Totals footer */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total steps", value: formatNumber(summary.totalSteps) },
          { label: "Total distance", value: formatKm(summary.totalDistanceKm) },
          {
            label: "Total active",
            value: `${formatNumber(summary.totalActiveMinutes)} min`,
          },
          {
            label: "Total calories",
            value: `${formatNumber(summary.totalCalories)} kcal`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"
          >
            <div className="text-lg font-semibold text-white">{stat.value}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <footer className="mt-10 flex flex-col items-center gap-2 border-t border-white/5 pt-6 text-center text-xs text-zinc-600">
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-zinc-400">
            Terms of Service
          </Link>
        </div>
        <div suppressHydrationWarning>
          Pulse · {isDemo ? "Demo dataset" : "Live Google Fit data"}
          {generatedLabel ? ` · Generated ${generatedLabel}` : ""}
        </div>
      </footer>
    </div>
  );
}
