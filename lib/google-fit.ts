import "server-only";

import type { DailyMetrics } from "./types";

/**
 * Google Fit integration.
 *
 * IMPORTANT: Reading a person's Google Fit data requires OAuth 2.0 user
 * consent — an API key alone cannot access private fitness data. This module
 * implements the full OAuth flow and the Fitness REST `dataset:aggregate`
 * calls. It activates automatically once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 * are set and a user has connected their account.
 */

export const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
];

export const ACCESS_TOKEN_COOKIE = "gfit_access_token";
export const REFRESH_TOKEN_COOKIE = "gfit_refresh_token";

export function isOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getRedirectUri(origin: string): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || `${origin}/api/auth/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_FIT_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(
  code: string,
  origin: string,
): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface AggregatePoint {
  startTimeNanos?: string;
  endTimeNanos?: string;
  value: Array<{ intVal?: number; fpVal?: number }>;
}

interface AggregateBucket {
  startTimeMillis: string;
  endTimeMillis: string;
  dataset: Array<{ point: AggregatePoint[] }>;
}

interface AggregateResponse {
  bucket: AggregateBucket[];
}

async function aggregate(
  accessToken: string,
  dataTypeName: string,
  startMs: number,
  endMs: number,
): Promise<AggregateBucket[]> {
  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName }],
        bucketByTime: { durationMillis: DAY_MS },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Fit aggregate (${dataTypeName}) failed: ${res.status}`);
  }
  const data: AggregateResponse = await res.json();
  return data.bucket ?? [];
}

function isoDateFromMillis(millis: string): string {
  return new Date(Number(millis)).toISOString().slice(0, 10);
}

function firstValue(bucket: AggregateBucket): number | null {
  const point = bucket.dataset?.[0]?.point?.[0];
  const v = point?.value?.[0];
  if (!v) return null;
  return v.fpVal ?? v.intVal ?? null;
}

function sumValues(bucket: AggregateBucket): number {
  let total = 0;
  for (const point of bucket.dataset?.[0]?.point ?? []) {
    for (const v of point.value ?? []) {
      total += v.fpVal ?? v.intVal ?? 0;
    }
  }
  return total;
}

/**
 * Pull a daily fitness series from Google Fit for the last `days` days and map
 * it into the app's DailyMetrics shape.
 */
export async function fetchGoogleFitSeries(
  accessToken: string,
  days: number,
): Promise<DailyMetrics[]> {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const [steps, calories, distance, active, heart, weight] = await Promise.all([
    aggregate(accessToken, "com.google.step_count.delta", startMs, endMs),
    aggregate(accessToken, "com.google.calories.expended", startMs, endMs),
    aggregate(accessToken, "com.google.distance.delta", startMs, endMs),
    aggregate(accessToken, "com.google.active_minutes", startMs, endMs),
    aggregate(accessToken, "com.google.heart_rate.bpm", startMs, endMs),
    aggregate(accessToken, "com.google.weight", startMs, endMs),
  ]);

  const byDate = new Map<string, DailyMetrics>();
  const ensure = (date: string): DailyMetrics => {
    let row = byDate.get(date);
    if (!row) {
      row = {
        date,
        steps: 0,
        calories: 0,
        distanceKm: 0,
        activeMinutes: 0,
        heartRateAvg: null,
        heartRateResting: null,
        sleepHours: null,
        weightKg: null,
      };
      byDate.set(date, row);
    }
    return row;
  };

  for (const b of steps) ensure(isoDateFromMillis(b.startTimeMillis)).steps = Math.round(sumValues(b));
  for (const b of calories)
    ensure(isoDateFromMillis(b.startTimeMillis)).calories = Math.round(sumValues(b));
  for (const b of distance)
    ensure(isoDateFromMillis(b.startTimeMillis)).distanceKm =
      Math.round((sumValues(b) / 1000) * 100) / 100;
  for (const b of active)
    ensure(isoDateFromMillis(b.startTimeMillis)).activeMinutes = Math.round(sumValues(b));
  for (const b of heart) {
    const row = ensure(isoDateFromMillis(b.startTimeMillis));
    const point = b.dataset?.[0]?.point?.[0];
    // Heart rate aggregation returns avg/max/min values.
    const vals = point?.value ?? [];
    if (vals.length) {
      row.heartRateAvg = vals[0]?.fpVal ? Math.round(vals[0].fpVal) : null;
      const minVal = vals[2]?.fpVal ?? vals[0]?.fpVal;
      row.heartRateResting = minVal ? Math.round(minVal) : row.heartRateAvg;
    }
  }
  for (const b of weight) {
    const v = firstValue(b);
    if (v !== null) ensure(isoDateFromMillis(b.startTimeMillis)).weightKg = Math.round(v * 100) / 100;
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
