// Agent demo page.
//
// A judge picks a persona (AI travel concierge, shopping agent, sales
// tool, trading bot), types or picks a sample question, and watches an
// honest agent decide whether it can answer or whether it needs to pay
// a human via GroundTruth.
//
// The thinking pipeline is shown as explicit phases so judges can see
// the system reason about its own confidence: search the web, draft an
// answer, judge confidence, and either return the answer or post a
// Lightning-funded verification task to a human worker.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabaseBrowser } from "@/lib/supabase";
import { formatSats, satsToUsd, timeAgo } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface LightningInvoice {
  bolt11: string;
  amount_sats: number;
  payment_hash: string;
  expires_at: string;
}

// ---------------------------------------------------------------
// Personas
// Distinct agent profiles so judges can see this isn't a one-trick
// demo. Every persona has questions that *will* trigger the human
// verification path because they require real-time ground truth.
// ---------------------------------------------------------------
interface Persona {
  id: string;
  label: string;
  emoji: string;
  description: string;
  questions: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "travel",
    label: "AI Travel Concierge",
    emoji: "✈",
    description: "Books trips and answers about restaurants, hotels, and live wait times.",
    questions: [
      "How long is the line at Berghain in Berlin right now?",
      "Is Cafe Einstein on Kurfuerstenstrasse open today, or closed for renovation?",
      "What is the current wait time at Pho 2000 in San Francisco's Tenderloin?",
    ],
  },
  {
    id: "shopping",
    label: "AI Shopping Assistant",
    emoji: "🛒",
    description: "Verifies local product availability and pricing in real time.",
    questions: [
      "Is the Apple Store on Kurfuerstendamm in Berlin selling iPhone 17 Pro Max in space black today?",
      "Does the Nike flagship in Tokyo Shibuya have Air Jordan 1 Mid in size US 10 in stock right now?",
      "What is the actual checkout price for organic milk at Lidl in Munich today?",
    ],
  },
  {
    id: "sales",
    label: "AI Sales Researcher",
    emoji: "📈",
    description: "Verifies decision-makers, company status, and live business signals.",
    questions: [
      "Is the office of Acme GmbH at Friedrichstrasse 100 actually still operating, or is the building empty?",
      "Confirm whether the CEO of a target startup is at the SaaStr Annual conference today.",
      "Has the construction crane on the Mercedes-Benz factory in Sindelfingen moved this week?",
    ],
  },
  {
    id: "trading",
    label: "AI Trading Agent",
    emoji: "📊",
    description: "Cross-checks satellite, supply chain, and on-the-ground signals.",
    questions: [
      "Is the BYD Shenzhen factory parking lot full or empty as of this morning?",
      "Are queues at the Costco Mexico City fuel station longer than yesterday?",
      "Is the Volkswagen plant in Wolfsburg currently running a night shift?",
    ],
  },
];

// ---------------------------------------------------------------
// Stage state machine
// ---------------------------------------------------------------
type ThinkingPhase = "search" | "draft" | "judge" | "post" | "wait" | "verify";

type Stage =
  | { kind: "idle" }
  | { kind: "thinking"; phases: ThinkingPhase[]; current: number }
  | { kind: "answered_directly"; answer: string; reasoning: string; sources: { title: string; url: string }[] }
  | { kind: "needs_human"; task: Task; invoice: LightningInvoice; draft: string; reasoning: string }
  | { kind: "verified"; task: Task; draft: string };

const PHASE_META: Record<ThinkingPhase, { icon: string; label: string }> = {
  search: { icon: "🔍", label: "Searching the web for evidence" },
  draft: { icon: "✍", label: "Drafting candidate answer" },
  judge: { icon: "⚖", label: "Judging confidence against ground-truth requirements" },
  post: { icon: "⚡", label: "Posting Lightning-funded task to GroundTruth" },
  wait: { icon: "👁", label: "Waiting for a human worker to verify" },
  verify: { icon: "✅", label: "Verified by a human" },
};

export default function AgentPage() {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [question, setQuestion] = useState("");
  const [bounty, setBounty] = useState(500);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run a small client-side pipeline of "thinking" phases while the
  // /api/agent/ask request is in flight. Visual only — the real
  // decision happens on the server. We freeze the pipeline at the
  // last server-bound phase until the response lands.
  useEffect(() => {
    if (stage.kind !== "thinking") return;
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    phaseTimer.current = setInterval(() => {
      setStage((prev) => {
        if (prev.kind !== "thinking") return prev;
        if (prev.current >= prev.phases.length - 1) return prev;
        return { ...prev, current: prev.current + 1 };
      });
    }, 750);
    return () => {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    };
  }, [stage.kind]);

  // While the user is in needs_human, watch the task for the worker's
  // submission and flip into verified.
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

  // Demo-mode auto-verifier. If a single-tab visitor asks a question
  // and no real worker claims within 30 seconds, fire the simulated
  // worker so the loop completes. The verified card renders a clear
  // "Simulated demo answer" badge — judges always know what they are
  // looking at.
  useEffect(() => {
    if (stage.kind !== "needs_human") return;
    const taskId = stage.task.id;
    const timer = setTimeout(async () => {
      // If the user has already moved off needs_human, do nothing.
      try {
        await fetch(`/api/tasks/${taskId}/auto-verify`, { method: "POST" });
      } catch {
        // Realtime subscription will ignore this; ok.
      }
    }, 30_000);
    return () => clearTimeout(timer);
  }, [stage]);

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setQuestion(text);
    setStage({ kind: "thinking", phases: ["search", "draft", "judge"], current: 0 });

    const res = await fetch("/api/agent/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        bounty_sats: bounty,
        agent_id: `${persona.id}-demo`,
      }),
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
        invoice: data.invoice,
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
        <PersonaSelector value={persona} onChange={setPersona} />

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Demo · {persona.label}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Ask anything. The agent only answers what it can actually verify.
          </h1>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Try: ${persona.questions[0]}`}
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
            <div className="mt-6 grid gap-2 sm:grid-cols-1">
              {persona.questions.map((q) => (
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
    <header className="border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          GroundTruth<span className="text-orange-400">.</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/agent" className="text-orange-300">
            Agent demo
          </Link>
          <Link href="/worker" className="hover:text-zinc-100">
            Worker app
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

function PersonaSelector({
  value,
  onChange,
}: {
  value: Persona;
  onChange: (p: Persona) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PERSONAS.map((p) => {
        const active = value.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p)}
            className={`rounded-lg border px-3 py-3 text-left text-xs transition ${
              active
                ? "border-orange-500/60 bg-orange-500/10 text-zinc-100"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            <span className="mr-1.5">{p.emoji}</span>
            <span className="font-semibold">{p.label}</span>
            <p className="mt-1 text-[11px] text-zinc-500">{p.description}</p>
          </button>
        );
      })}
    </div>
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
      return <ThinkingPipeline phases={stage.phases} current={stage.current} />;
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
        <NeedsHumanState
          task={stage.task}
          invoice={stage.invoice}
          reasoning={stage.reasoning}
        />
      );
    case "verified": {
      const isAuto = stage.task.worker_session_id === "demo-auto-verifier";
      return (
        <div className="space-y-3">
          <ThinkingPipeline phases={["search", "draft", "judge", "post", "wait", "verify"]} current={5} />
          <Bubble
            role="agent"
            body={
              isAuto
                ? stage.task.submitted_answer ?? ""
                : `Verified by a human worker: ${stage.task.submitted_answer}`
            }
          />
          {isAuto && <SimulatedBadge />}
          <TaskCard task={stage.task} />
        </div>
      );
    }
  }
}

function SimulatedBadge() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
      <p className="flex items-center gap-2 font-medium">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        Simulated demo answer · no human worker available right now
      </p>
      <p className="mt-1.5 text-amber-100/70">
        In production this slot is filled by a real worker on the ground who
        scans the task feed, verifies in person, and claims the Lightning
        bounty. For this hackathon demo we fall back to a web-grounded
        simulation after 30 seconds so single-tab visitors still see a
        complete flow.
      </p>
    </div>
  );
}

function NeedsHumanState({
  task,
  invoice,
  reasoning,
}: {
  task: Task;
  invoice: LightningInvoice;
  reasoning: string;
}) {
  // While we are waiting for a worker, animate through "post" -> "wait".
  const phases: ThinkingPhase[] = ["search", "draft", "judge", "post", "wait"];
  return (
    <div className="space-y-3">
      <ThinkingPipeline phases={phases} current={4} />
      <Bubble
        role="agent"
        body={`I cannot answer this with confidence — ${reasoning} Posting a verification task to a human worker now.`}
      />
      <InvoiceCard invoice={invoice} />
      <TaskCard task={task} pending />
    </div>
  );
}

// Real BOLT11 QR for the bounty escrow. Scannable with any Lightning
// wallet on Bitcoin Mainnet. The point is not to require payment to
// proceed (we mock the escrow) — it is to make visible that the rails
// underneath are real, not a screenshot.
function InvoiceCard({ invoice }: { invoice: LightningInvoice }) {
  const [copied, setCopied] = useState(false);
  const isMock = invoice.bolt11.startsWith("lnbc") && invoice.bolt11.includes("mock");

  async function copy() {
    try {
      await navigator.clipboard.writeText(invoice.bolt11);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-zinc-900/50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">
          {isMock ? "Lightning Invoice (Mock)" : "Lightning Mainnet · Bounty escrow"}
        </p>
        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
          {formatSats(invoice.amount_sats)}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-shrink-0 rounded-lg bg-white p-3">
          <QRCodeSVG
            value={invoice.bolt11}
            size={128}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-zinc-400">
            {isMock
              ? "Demo mode — switch the platform Lightning Address env var to scan a real Mainnet invoice here."
              : "Scan with any Lightning wallet on Bitcoin Mainnet to fund this bounty in real time."}
          </p>
          <button
            onClick={copy}
            className="mt-3 break-all rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-mono text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            {copied ? "Copied invoice" : `${invoice.bolt11.slice(0, 50)}…`}
          </button>
          <p className="mt-2 text-[10px] text-zinc-600">
            payment_hash: {invoice.payment_hash.slice(0, 32)}…
          </p>
        </div>
      </div>
    </div>
  );
}

function ThinkingPipeline({
  phases,
  current,
}: {
  phases: ThinkingPhase[];
  current: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <ol className="space-y-2">
        {phases.map((p, i) => {
          const meta = PHASE_META[p];
          const state = i < current ? "done" : i === current ? "active" : "pending";
          return (
            <li
              key={p}
              className={`flex items-center gap-3 text-sm transition ${
                state === "pending"
                  ? "text-zinc-600"
                  : state === "active"
                    ? "text-zinc-100"
                    : "text-zinc-400"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                  state === "active"
                    ? "animate-pulse border border-orange-500/60 bg-orange-500/10 text-orange-300"
                    : state === "done"
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border border-zinc-800"
                }`}
              >
                {state === "done" ? "✓" : meta.icon}
              </span>
              <span>{meta.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const PERSONA_BY_ID: Record<string, Persona> = PERSONAS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Persona>
);

function TaskCard({ task, pending }: { task: Task; pending?: boolean }) {
  const personaId = task.agent_id?.replace("-demo", "") ?? "";
  const persona = PERSONA_BY_ID[personaId];
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
      {persona && (
        <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
          {persona.emoji} {persona.label}
        </p>
      )}
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
