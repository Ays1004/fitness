import "server-only";

import { cookies } from "next/headers";
import { buildAnalytics } from "./analytics";
import { generateDemoSeries } from "./demo-data";
import {
  ACCESS_TOKEN_COOKIE,
  fetchGoogleFitSeries,
  isOAuthConfigured,
} from "./google-fit";
import { DEFAULT_GOALS, type FitnessAnalytics } from "./types";

export const MIN_DAYS = 7;
export const MAX_DAYS = 365;

export function clampDays(input: number | string | null | undefined): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 30;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(n)));
}

export interface ConnectionStatus {
  oauthConfigured: boolean;
  connected: boolean;
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  return {
    oauthConfigured: isOAuthConfigured(),
    connected: Boolean(token),
  };
}

/**
 * Resolve analytics for the requested window. Uses live Google Fit data when a
 * user is connected and the OAuth app is configured; otherwise returns a
 * realistic demo dataset so the dashboard is always fully populated.
 */
export async function getAnalytics(days: number): Promise<FitnessAnalytics> {
  const safeDays = clampDays(days);
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;

  if (isOAuthConfigured() && token) {
    try {
      const series = await fetchGoogleFitSeries(token, safeDays);
      if (series.length > 0) {
        return buildAnalytics(series, DEFAULT_GOALS, "google-fit");
      }
    } catch (error) {
      console.error("Google Fit fetch failed, falling back to demo data:", error);
    }
  }

  return buildAnalytics(generateDemoSeries(safeDays), DEFAULT_GOALS, "demo");
}
