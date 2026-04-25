// Worker page.
// Shows a live feed of open verification tasks. A worker enters a
// Lightning Address once (cached in localStorage), claims a task,
// answers it, and receives the bounty in their wallet seconds later.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats, satsToUsd, timeAgo, isValidLightningAddress, generateRandomHex } from "@/lib/utils";
import type { Task } from "@/lib/types";

const LN_ADDRESS_KEY = "gt_ln_address";
const SESSION_KEY = "gt_session_id";

export default function WorkerPage() {
  const [lnAddress, setLnAddress] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [active, setActive] = useState<Task | null>(null);
  const [answer, setAnswer] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate identity from localStorage; mint a session id on first visit.
  useEffect(() => {
    const storedAddr = localStorage.getItem(LN_ADDRESS_KEY) ?? "";
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = generateRandomHex(16);
      localStorage.setItem(SESSION_KEY, sid);
    }
    setLnAddress(storedAddr);
    setSessionId(sid);
  }, []);

  // Initial task list + realtime subscription for inserts and updates.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks?status=open")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTasks(d.tasks ?? []);
      });

    const channel = supabaseBrowser
      .channel("worker-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          const next = (payload.new ?? payload.old) as Task;
          setTasks((prev) => {
            const without = prev.filter((t) => t.id !== next.id);
            if (next.status === "open") {
              return [next, ...without].slice(0, 30);
            }
            return without;
          });
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  function persistLnAddress(addr: string) {
    setLnAddress(addr);
    if (isValidLightningAddress(addr)) {
      localStorage.setItem(LN_ADDRESS_KEY, addr);
    }
  }

  async function claim(task: Task) {
    if (!isValidLightningAddress(lnAddress)) {
      setToast("Add your Lightning Address first.");
      return;
    }
    const res = await fetch(`/api/tasks/${task.id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worker_session_id: sessionId,
        worker_lightning_address: lnAddress,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToast(data.error ?? "Could not claim task");
      return;
    }
    setActive(data.task as Task);
    setAnswer("");
    setProofUrl("");
  }

  async function submit() {
    if (!active) return;
    if (answer.trim().length < 2) {
      setToast("Answer is too short.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/tasks/${active.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worker_session_id: sessionId,
        answer: answer.trim(),
        proof_url: proofUrl.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setToast(data.error ?? "Submission failed");
      return;
    }
    setToast(
      `Paid ${formatSats(active.bounty_sats)} to ${lnAddress}.`
    );
    setActive(null);
  }

  const validAddress = isValidLightningAddress(lnAddress);

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.status === "open"),
    [tasks]
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Earn sats by verifying for AI agents</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pick an open task, answer truthfully, and get paid in seconds.
        </p>

        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
          <p className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
            <span>
              <strong className="font-semibold text-amber-200">Demo mode.</strong>{" "}
              Worker payouts are simulated in this public deployment — the
              server-side Lightning sender is intentionally not wired up. The
              BOLT11 invoices the agent pays are real Mainnet invoices,
              everything after that is mocked. See{" "}
              <Link href="/docs" className="underline decoration-amber-400/40 underline-offset-4 hover:decoration-amber-300">
                docs
              </Link>{" "}
              for the full split.
            </span>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <label className="text-xs uppercase tracking-wider text-zinc-500">
            Your Lightning Address (LUD-16)
          </label>
          <input
            value={lnAddress}
            onChange={(e) => persistLnAddress(e.target.value)}
            placeholder="you@walletofsatoshi.com"
            className={`mt-2 w-full rounded-lg border bg-zinc-950 px-4 py-2 text-sm outline-none ${
              !lnAddress || validAddress
                ? "border-zinc-700 focus:border-orange-500/60"
                : "border-red-500/40"
            }`}
          />
          <p className="mt-2 text-xs text-zinc-500">
            We pay you here when your answer is verified. We never store your
            wallet, just the address.
          </p>
        </div>

        {active ? (
          <ActivePanel
            task={active}
            answer={answer}
            setAnswer={setAnswer}
            proofUrl={proofUrl}
            setProofUrl={setProofUrl}
            onSubmit={submit}
            onCancel={() => setActive(null)}
            submitting={submitting}
          />
        ) : (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Live tasks</h2>
              <span className="text-xs text-zinc-500">
                {visibleTasks.length} open
              </span>
            </div>
            {visibleTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center text-sm text-zinc-500">
                No open tasks right now. Pop over to{" "}
                <Link href="/agent" className="text-orange-300 hover:underline">
                  the agent demo
                </Link>{" "}
                and post one.
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleTasks.map((t) => (
                  <li key={t.id}>
                    <TaskRow task={t} onClaim={() => claim(t)} canClaim={validAddress} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {toast && (
          <div className="fixed inset-x-0 bottom-6 mx-auto w-fit max-w-md rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur">
            {toast}{" "}
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-xs text-zinc-500 hover:text-zinc-200"
            >
              dismiss
            </button>
          </div>
        )}
      </section>
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
          <Link href="/agent" className="hover:text-zinc-100">
            Agent demo
          </Link>
          <Link href="/worker" className="text-orange-300">
            Worker app
          </Link>
          <Link href="/leaderboard" className="hover:text-zinc-100">
            Leaderboard
          </Link>
          <Link href="/docs" className="hover:text-zinc-100">
            Docs
          </Link>
          <Link href="/pricing" className="hover:text-zinc-100">
            Pricing
          </Link>
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

function TaskRow({
  task,
  onClaim,
  canClaim,
}: {
  task: Task;
  onClaim: () => void;
  canClaim: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-100">{task.prompt}</p>
        <p className="mt-1 text-xs text-zinc-500">{timeAgo(task.created_at)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-orange-300">
          {formatSats(task.bounty_sats)}
        </p>
        <p className="text-[10px] text-zinc-500">{satsToUsd(task.bounty_sats)}</p>
      </div>
      <button
        onClick={onClaim}
        disabled={!canClaim}
        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-orange-400 disabled:opacity-40"
      >
        Claim
      </button>
    </div>
  );
}

function ActivePanel({
  task,
  answer,
  setAnswer,
  proofUrl,
  setProofUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  task: Task;
  answer: string;
  setAnswer: (s: string) => void;
  proofUrl: string;
  setProofUrl: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
      <p className="text-xs uppercase tracking-wider text-orange-300">
        Active task · {formatSats(task.bounty_sats)} bounty
      </p>
      <h2 className="mt-2 text-lg font-semibold">{task.prompt}</h2>

      <label className="mt-6 block text-xs uppercase tracking-wider text-zinc-500">
        Your answer
      </label>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Type the verified answer. Be specific."
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-orange-500/60"
      />

      <label className="mt-4 block text-xs uppercase tracking-wider text-zinc-500">
        Proof URL (optional)
      </label>
      <input
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        placeholder="https://photo.example.com/proof.jpg"
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm placeholder-zinc-500 outline-none focus:border-orange-500/60"
      />

      <div className="mt-6 flex gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit & get paid"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-300 transition hover:border-zinc-500"
        >
          Release task
        </button>
      </div>
    </div>
  );
}
