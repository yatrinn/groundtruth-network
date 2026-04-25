// Worker leaderboard.
//
// Public-facing reputation surface. Real workers ranked by total
// earned sats. Demo auto-verifier is excluded so the page only ever
// reflects actual human verifications. Realtime subscription keeps
// the table live during the demo.
//
// Why this matters: a marketplace without a visible reputation graph
// reads as a hackathon toy. With one, it reads as the skeleton of a
// real two-sided network — exactly what investors look for.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats, satsToUsd } from "@/lib/utils";
import type { Worker } from "@/lib/types";

export default function LeaderboardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabaseBrowser
        .from("workers")
        .select("*")
        .neq("session_id", "demo-auto-verifier")
        .order("total_earned_sats", { ascending: false })
        .limit(25);
      if (cancelled) return;
      setWorkers((data ?? []) as Worker[]);
      setLoading(false);
    }
    load();
    const channel = supabaseBrowser
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workers" },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const totals = workers.reduce(
    (acc, w) => {
      acc.sats += w.total_earned_sats;
      acc.tasks += w.completed_count;
      return acc;
    },
    { sats: 0, tasks: 0 }
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      <Header />

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Worker leaderboard
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          The humans behind every verified answer.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          Ranked by satoshis earned across verified tasks. The reputation graph
          updates the moment a Lightning payout settles. No KYC, no signup —
          just a Lightning Address and an answer.
        </p>
      </section>

      <section className="mx-auto max-w-4xl border-t border-zinc-900 px-6 py-10">
        <div className="grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <Stat label="Active workers" value={workers.length.toLocaleString("en-US")} />
          <Stat label="Sats earned" value={formatSats(totals.sats)} />
          <Stat label="Tasks verified" value={totals.tasks.toLocaleString("en-US")} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-10 text-center text-sm text-zinc-500">
            Loading leaderboard…
          </div>
        ) : workers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center text-sm text-zinc-500">
            No verifications yet. Be the first by claiming a task at{" "}
            <Link href="/worker" className="text-orange-300 hover:underline">
              /worker
            </Link>
            .
          </div>
        ) : (
          <ol className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
            {workers.map((w, i) => (
              <Row key={w.session_id} worker={w} rank={i + 1} />
            ))}
          </ol>
        )}
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          GroundTruth<span className="text-orange-400">.</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/agent" className="hover:text-zinc-100">Agent demo</Link>
          <Link href="/worker" className="hover:text-zinc-100">Worker app</Link>
          <Link href="/leaderboard" className="text-orange-300">Leaderboard</Link>
          <Link href="/docs" className="hover:text-zinc-100">Docs</Link>
          <Link href="/pricing" className="hover:text-zinc-100">Pricing</Link>
          <a
            href="https://github.com/yatrinn/groundtruth-network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-100"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function Row({ worker, rank }: { worker: Worker; rank: number }) {
  const masked = maskLightningAddress(worker.lightning_address);
  const isPodium = rank <= 3;
  return (
    <li
      className={`flex items-center gap-4 border-b border-zinc-800/60 px-5 py-4 last:border-b-0 ${
        isPodium ? "bg-zinc-900/40" : ""
      }`}
    >
      <span
        className={`inline-flex h-8 w-10 flex-shrink-0 items-center justify-center rounded-md text-sm font-mono ${
          rank === 1
            ? "bg-amber-400/15 text-amber-300"
            : rank === 2
              ? "bg-zinc-300/10 text-zinc-200"
              : rank === 3
                ? "bg-orange-700/20 text-orange-300"
                : "text-zinc-500"
        }`}
      >
        {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm text-zinc-200">{masked}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {worker.completed_count}{" "}
          {worker.completed_count === 1 ? "task verified" : "tasks verified"} · joined{" "}
          {formatJoined(worker.created_at)}
        </p>
      </div>

      <div className="text-right">
        <p className="text-base font-semibold text-orange-300">
          {formatSats(worker.total_earned_sats)}
        </p>
        <p className="text-[10px] text-zinc-500">{satsToUsd(worker.total_earned_sats)}</p>
      </div>
    </li>
  );
}

// Privacy: show enough of the Lightning Address that the worker can
// recognise themselves, redact the rest. averagevehicle485@walletofsatoshi.com
// becomes "averag…fi.com".
function maskLightningAddress(addr: string): string {
  if (!addr || !addr.includes("@")) return addr || "anonymous";
  const [name, domain] = addr.split("@");
  const visibleName = (name ?? "").slice(0, 6);
  const visibleDomain = (domain ?? "").slice(-6);
  return `${visibleName}…${visibleDomain}`;
}

function formatJoined(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          GroundTruth Network · MIT licensed · Lightning Mainnet
        </p>
        <div className="flex gap-5">
          <Link href="/agent" className="hover:text-zinc-300">Agent demo</Link>
          <Link href="/worker" className="hover:text-zinc-300">Worker</Link>
          <Link href="/docs" className="hover:text-zinc-300">Docs</Link>
        </div>
      </div>
    </footer>
  );
}
