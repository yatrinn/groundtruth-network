// Agent demo page.
// A judge types a question. An honest AI travel concierge tries to answer
// it with web search + reasoning. If the question requires real-time
// ground truth (open / closed, current wait, current availability), the
// agent admits it and posts a Lightning-funded task to GroundTruth.
// The page then watches the task in realtime until a worker submits.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats, satsToUsd, timeAgo } from "@/lib/utils";
import type { Task } from "@/lib/types";

type Stage =
  | { kind: "idle" }
  | { kind: "thinking" }
  | { kind: "answered_directly"; answer: string; reasoning: string; sources: { title: string; url: string }[] }
  | { kind: "needs_human"; task: Task; draft: string; reasoning: string }
  | { kind: "verified"; task: Task; draft: string };

const SAMPLE_QUESTIONS = [
  "How long is the line at Berghain right now?",
  "Is Cafe Einstein in Berlin open today, or closed for renovation?",
  "What's the current wait time at Pho 2000 in San Francisco?",
  "Is the Apple Store on Kurfuerstendamm still selling iPhone 17 Pro Max in space black today?",
];

export default function AgentPage() {
  const [question, setQuestion] = useState("");
  const [bounty, setBounty] = useState(500);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  // Subscribe to changes on the active task so we can flip into the
  // verified state without polling.
  useEffect(() => {
    if (stage.kind !== "needs_human") return;
    const id = stage.task.id;
    const channel = supabaseBrowser
      .channel(`task-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as Task;
          if (next.status === "verified") {
            setStage((prev) =>
              prev.kind === "needs_human"
                ? { kind: "verified", task: next, draft: prev.draft }
                : prev
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [stage]);

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setQuestion(text);
    setStage({ kind: "thinking" });

    const res = await fetch("/api/agent/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, bounty_sats: bounty }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStage({
        kind: "answered_directly",
        answer: `Error: ${data.error ?? "unknown"}`,
        reasoning: "",
        sources: [],
      });
      return;
    }

    if (data.verdict === "answered_directly") {
      setStage({
        kind: "answered_directly",
        answer: data.answer,
        reasoning: data.reasoning,
        sources: data.sources ?? [],
      });
    } else {
      setStage({
        kind: "needs_human",
        task: data.task,
        draft: data.draft,
        reasoning: data.reasoning,
      });
    }
  }

  function reset() {
    setQuestion("");
    setStage({ kind: "idle" });
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Demo · AI travel concierge
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Ask anything. The agent will only answer what it can actually verify.
          </h1>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Try: How long is the line at Berghain right now?"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-orange-500/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") ask();
              }}
              disabled={stage.kind === "thinking"}
            />
            <button
              onClick={() => ask()}
              disabled={stage.kind === "thinking" || !question.trim()}
              className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400 disabled:opacity-50"
            >
              Ask
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
            <label htmlFor="bounty" className="uppercase tracking-wider">
              Verification bounty
            </label>
            <input
              id="bounty"
              type="range"
              min={100}
              max={5000}
              step={100}
              value={bounty}
              onChange={(e) => setBounty(parseInt(e.target.value, 10))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-zinc-300">
              {formatSats(bounty)} ({satsToUsd(bounty)})
            </span>
          </div>

          {stage.kind === "idle" && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-left text-xs text-zinc-300 transition hover:border-zinc-600"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {stage.kind !== "idle" && (
          <div className="mt-8 space-y-4">
            <Bubble role="user" body={question} />
            <ConversationStage stage={stage} />
            <button
              onClick={reset}
              className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
            >
              Ask another question
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-zinc-900 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          GroundTruth
        </Link>
        <div className="flex gap-4 text-xs">
          <Link href="/agent" className="text-orange-300">
            Agent
          </Link>
          <Link href="/worker" className="text-zinc-400 hover:text-zinc-200">
            Worker
          </Link>
        </div>
      </div>
    </header>
  );
}

function Bubble({ role, body }: { role: "user" | "agent"; body: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-orange-500 text-zinc-950"
            : "border border-zinc-800 bg-zinc-900 text-zinc-100"
        }`}
      >
        {body}
      </div>
    </div>
  );
}

function ConversationStage({ stage }: { stage: Stage }) {
  switch (stage.kind) {
    case "idle":
      return null;
    case "thinking":
      return (
        <Bubble role="agent" body="Thinking… searching the web and judging confidence." />
      );
    case "answered_directly":
      return (
        <div className="space-y-3">
          <Bubble role="agent" body={stage.answer} />
          {stage.sources.length > 0 && (
            <p className="text-xs text-zinc-500">
              Sources:{" "}
              {stage.sources.map((s, i) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-zinc-300 hover:underline"
                >
                  {s.title}
                  {i < stage.sources.length - 1 ? ", " : ""}
                </a>
              ))}
            </p>
          )}
        </div>
      );
    case "needs_human":
      return (
        <div className="space-y-3">
          <Bubble
            role="agent"
            body={`I cannot answer this with confidence — ${stage.reasoning} Posting a verification task to a human worker now.`}
          />
          <TaskCard task={stage.task} pending />
        </div>
      );
    case "verified":
      return (
        <div className="space-y-3">
          <Bubble
            role="agent"
            body={`Verified by a human worker: ${stage.task.submitted_answer}`}
          />
          <TaskCard task={stage.task} />
        </div>
      );
  }
}

function TaskCard({ task, pending }: { task: Task; pending?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-zinc-500">
          task_{task.id.slice(0, 8)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            pending
              ? "bg-orange-500/10 text-orange-300"
              : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {pending ? "Awaiting human" : "Verified"}
        </span>
      </div>
      <p className="mt-2 text-zinc-300">{task.prompt}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-zinc-500">
        <div>
          Bounty:{" "}
          <span className="text-zinc-200">{formatSats(task.bounty_sats)}</span>{" "}
          <span className="text-zinc-500">({satsToUsd(task.bounty_sats)})</span>
        </div>
        <div className="text-right">{timeAgo(task.created_at)}</div>
      </div>
      {task.payout_payment_hash && (
        <p className="mt-3 truncate font-mono text-[10px] text-emerald-400">
          payout: {task.payout_payment_hash.slice(0, 32)}…
        </p>
      )}
    </div>
  );
}
