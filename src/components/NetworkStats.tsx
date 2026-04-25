// Aggregate stats for the network — total verifications, total sats
// paid, and number of unique workers. Updates in realtime so the
// numbers tick during the live demo.

"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats } from "@/lib/utils";

interface Stats {
  verifications: number;
  sats_paid: number;
  workers: number;
}

export default function NetworkStats({ className = "" }: { className?: string }) {
  const [stats, setStats] = useState<Stats>({ verifications: 0, sats_paid: 0, workers: 0 });

  async function refresh() {
    const [verifiedRes, workerRes] = await Promise.all([
      supabaseBrowser
        .from("tasks")
        .select("bounty_sats", { count: "exact" })
        .eq("status", "verified")
        .neq("worker_session_id", "demo-auto-verifier"),
      supabaseBrowser
        .from("workers")
        .select("session_id", { count: "exact", head: true })
        .neq("session_id", "demo-auto-verifier"),
    ]);

    const sats = (verifiedRes.data ?? []).reduce(
      (sum: number, row: { bounty_sats: number }) => sum + (row.bounty_sats ?? 0),
      0
    );
    setStats({
      verifications: verifiedRes.count ?? 0,
      sats_paid: sats,
      workers: workerRes.count ?? 0,
    });
  }

  useEffect(() => {
    refresh();
    const channel = supabaseBrowser
      .channel("network-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className={`grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30 ${className}`}
    >
      <Stat label="Verifications" value={stats.verifications.toLocaleString("en-US")} />
      <Stat label="Sats paid" value={formatSats(stats.sats_paid)} />
      <Stat label="Active workers" value={stats.workers.toLocaleString("en-US")} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-xl font-semibold text-zinc-100 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}
