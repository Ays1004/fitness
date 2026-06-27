# Pulse — Google Fit Analytics

A modern fitness analytics dashboard built with **Next.js 16**, **React 19** and
**Tailwind CSS v4**. It visualizes steps, calories, distance, active minutes,
resting heart rate, sleep and weight, with trends, goal tracking, streaks and
auto-generated insights.

The app works out of the box with realistic **demo data**, and pulls **live
Google Fit data** the moment you connect a Google account.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll immediately see the dashboard populated with
demo data.

## About the Google Fit API key

> [!IMPORTANT]
> A Google **API key cannot read your personal fitness data.** Google Fit
> exposes private metrics only through **OAuth 2.0 user consent** — the user has
> to authorize the app and the app receives a short-lived access token. API keys
> are only for public/unauthenticated endpoints.
>
> Additionally, Google has been winding down the legacy Fit REST API in favor of
> Health Connect on Android. Keep this in mind for long-term use.

Because of this, the app is designed so the dashboard is fully functional with
demo data, while the **real Google Fit integration is wired up and ready** — it
activates as soon as you provide OAuth credentials and connect.

## Enabling live data

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Fitness API** for your project.
3. Configure the OAuth consent screen and add yourself as a test user.
4. Create an **OAuth client ID** of type **Web application** and add this
   authorized redirect URI:
   - `http://localhost:3000/api/auth/callback`
5. Put the credentials in `.env`:

   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

6. Restart `npm run dev`, click **Connect Google Fit**, and approve access.

The app requests these read-only scopes: activity, location (distance), body
(weight), heart rate and sleep.

## How it works

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Server component; resolves analytics + connection status |
| `app/api/fit/route.ts` | Returns analytics JSON for a date range (live or demo) |
| `app/api/auth/google/route.ts` | Starts the Google OAuth flow |
| `app/api/auth/callback/route.ts` | Exchanges the code, stores tokens in httpOnly cookies |
| `app/api/auth/logout/route.ts` | Clears the session |
| `lib/google-fit.ts` | OAuth helpers + Fitness REST `dataset:aggregate` calls |
| `lib/demo-data.ts` | Deterministic, realistic demo series |
| `lib/analytics.ts` | Summaries, trends, weekday breakdown, streaks, insights |
| `components/Dashboard.tsx` | The interactive dashboard UI |
| `components/charts.tsx` | Dependency-free SVG charts (area, bar, ring, sparkline) |

Tokens are stored in **httpOnly cookies** and the Google client secret never
reaches the browser (all Google calls happen in server route handlers).

## Notes

- Charts are hand-built with SVG — no charting dependencies.
- Demo values are deterministic per calendar date, so they stay stable across
  refreshes.
