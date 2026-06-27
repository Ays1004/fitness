import Dashboard from "@/components/Dashboard";
import { getAnalytics, getConnectionStatus } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const params = await searchParams;
  const [analytics, connection] = await Promise.all([
    getAnalytics(30),
    getConnectionStatus(),
  ]);

  return (
    <Dashboard
      initial={analytics}
      connection={connection}
      initialError={params.error ?? null}
    />
  );
}
