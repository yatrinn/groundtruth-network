// Live activity feed of recent tasks across the network. Mounted on the
// landing page and as a sidebar on /worker so the marketplace feels
// alive even when the visitor is the only person on the site.

"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats, satsToUsd, timeAgo } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface Props {
  limit?: number;
  className?: string;
}

export default function ActivityFeed({ limit = 6, className = "" }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tasks?status=verified&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTasks(d.tasks ?? []);
      });

    const channel = supabaseBrowser
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const next = payload.new as Task;
          // Demo auto-verifier tasks are excluded from the public feed —
          // only real human verifications drive network activity.
          if (
            next.status === "verified" &&
            next.worker_session_id !== "demo-auto-verifier"
          ) {
            setTasks((prev) => [next, ...prev.filter((t) => t.id !== next.id)].slice(0, limit));
          }
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabaseBrowser.removeChannel(channel);
    };
  }, [limit]);

  if (tasks.length === 0) {
    return (
      <div
        className={`rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center text-xs text-zinc-500 ${className}`}
      >
        No verifications yet. Be the first to post one.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/30 ${className}`}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Network activity
        </span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <ul className="divide-y divide-zinc-800/60">
        {tasks.map((t) => (
          <li key={t.id} className="px-4 py-3">
            <p className="line-clamp-1 text-sm text-zinc-200">{t.prompt}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Verified · {timeAgo(t.verified_at ?? t.created_at)}
              </span>
              <span className="text-orange-300">
                {formatSats(t.bounty_sats)} ({satsToUsd(t.bounty_sats)})
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
