import Link from "next/link";
import { ActivityIcon } from "@/components/icons";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-cyan-500 text-zinc-950">
            <ActivityIcon className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-white">
              Pulse
            </div>
            <div className="text-xs text-zinc-500">Google Fit analytics</div>
          </div>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          ← Back to dashboard
        </Link>
      </header>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/3 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">Last updated: {updated}</p>
        <div className="legal-content mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
          {children}
        </div>
      </div>

      <footer className="mt-8 flex items-center justify-center gap-4 text-xs text-zinc-600">
        <Link href="/privacy" className="hover:text-zinc-400">
          Privacy Policy
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-zinc-400">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}
