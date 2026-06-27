"use client";

import { useId, useMemo, useState } from "react";
import { formatLongDate } from "@/lib/format";

export interface SeriesPoint {
  date: string;
  value: number;
}

const VIEW_W = 720;
const VIEW_H = 240;
const PAD = { top: 16, right: 12, bottom: 24, left: 12 };

function niceBounds(values: number[], goal?: number) {
  const all = goal !== undefined ? [...values, goal] : values;
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) {
    max = max + 1;
    min = min - 1;
  }
  const span = max - min;
  min = Math.max(0, min - span * 0.12);
  max = max + span * 0.15;
  return { min, max };
}

interface AxisChartProps {
  data: SeriesPoint[];
  color: string;
  goal?: number;
  formatValue: (n: number) => string;
  goalLabel?: string;
}

function useHover(length: number) {
  const [active, setActive] = useState<number | null>(null);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(frac * (length - 1));
    setActive(Math.min(length - 1, Math.max(0, idx)));
  };
  return { active, onMove, onLeave: () => setActive(null) };
}

function Tooltip({
  point,
  leftPct,
  color,
  formatValue,
}: {
  point: SeriesPoint;
  leftPct: number;
  color: string;
  formatValue: (n: number) => string;
}) {
  const clamped = Math.min(88, Math.max(12, leftPct));
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
      style={{ left: `${clamped}%` }}
    >
      <div className="font-medium text-white" style={{ color }}>
        {formatValue(point.value)}
      </div>
      <div className="mt-0.5 text-[11px] text-zinc-400">
        {formatLongDate(point.date)}
      </div>
    </div>
  );
}

export function AreaLineChart({
  data,
  color,
  goal,
  formatValue,
  goalLabel,
}: AxisChartProps) {
  const gradId = useId();
  const { active, onMove, onLeave } = useHover(data.length);
  const { min, max } = useMemo(
    () => niceBounds(data.map((d) => d.value), goal),
    [data, goal],
  );

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${x(data.length - 1).toFixed(1)} ${PAD.top + innerH} ` +
    `L ${x(0).toFixed(1)} ${PAD.top + innerH} Z`;

  const goalY = goal !== undefined ? y(goal) : null;
  const activePoint = active !== null ? data[active] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        style={{ height: "auto" }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={PAD.top + innerH * g}
            y2={PAD.top + innerH * g}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}

        {goalY !== null && (
          <g>
            <line
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={goalY}
              y2={goalY}
              stroke={color}
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            {goalLabel && (
              <text
                x={VIEW_W - PAD.right}
                y={goalY - 5}
                textAnchor="end"
                className="fill-current text-[11px]"
                opacity={0.55}
              >
                {goalLabel}
              </text>
            )}
          </g>
        )}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {activePoint && active !== null && (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke={color}
              strokeOpacity={0.4}
              strokeWidth={1}
            />
            <circle cx={x(active)} cy={y(activePoint.value)} r={5} fill={color} />
            <circle
              cx={x(active)}
              cy={y(activePoint.value)}
              r={9}
              fill={color}
              opacity={0.2}
            />
          </g>
        )}
      </svg>
      {activePoint && active !== null && (
        <Tooltip
          point={activePoint}
          leftPct={(x(active) / VIEW_W) * 100}
          color={color}
          formatValue={formatValue}
        />
      )}
    </div>
  );
}

export function BarChart({
  data,
  color,
  goal,
  formatValue,
}: AxisChartProps) {
  const { active, onMove, onLeave } = useHover(data.length);
  const max = useMemo(() => {
    const m = Math.max(...data.map((d) => d.value), goal ?? 0);
    return m * 1.12 || 1;
  }, [data, goal]);

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.max(2, Math.min(slot * 0.62, 26));
  const goalY =
    goal !== undefined ? PAD.top + innerH - (goal / max) * innerH : null;
  const activePoint = active !== null ? data[active] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        style={{ height: "auto" }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={PAD.top + innerH * g}
            y2={PAD.top + innerH * g}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}

        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const cx = PAD.left + slot * i + slot / 2;
          const isActive = i === active;
          return (
            <rect
              key={d.date}
              x={cx - barW / 2}
              y={PAD.top + innerH - h}
              width={barW}
              height={Math.max(1, h)}
              rx={Math.min(barW / 2, 4)}
              fill={color}
              opacity={isActive ? 1 : 0.78}
            />
          );
        })}

        {goalY !== null && (
          <line
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={goalY}
            y2={goalY}
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        )}
      </svg>
      {activePoint && active !== null && (
        <Tooltip
          point={activePoint}
          leftPct={((PAD.left + slot * active + slot / 2) / VIEW_W) * 100}
          color={color}
          formatValue={formatValue}
        />
      )}
    </div>
  );
}

export function ProgressRing({
  value,
  max,
  color,
  size = 132,
  stroke = 12,
  children,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  color,
  height = 40,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  const w = 120;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="h-10 w-full"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
