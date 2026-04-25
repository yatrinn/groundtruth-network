// Interactive hero for the landing page.
//
// The hero is the most expensive screen real estate on the entire
// site — and the first impression for any judge or visitor. Instead
// of asking them to read pitch copy and click through to a demo, we
// put the demo IN the hero: type a question, hit Verify, deep-link
// straight into the running agent flow at /agent?q=...
//
// Inspired by the dominant-input pattern: chat-like input, sample
// prompts as one-click buttons, big primary CTA.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE_PROMPTS = [
  "How long is the line at Berghain right now?",
  "Is Cafe Einstein on Kurfuerstenstrasse open today?",
  "Is the BYD Shenzhen factory parking lot full this morning?",
];

export default function InteractiveHero() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function start(text?: string) {
    const q = (text ?? question).trim();
    if (!q) return;
    setSubmitting(true);
    router.push(`/agent?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-emerald-400 align-middle" />
          Live on Bitcoin Mainnet
        </span>
        <span className="rounded-full border border-zinc-700 bg-zinc-900/40 px-3 py-1 text-zinc-300">
          Open source · MIT
        </span>
        <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-orange-200">
          30¢ payouts in 200ms · cards and stablecoins cannot
        </span>
      </div>

      <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
        What does your agent
        <br />
        <span className="text-orange-400">need to verify?</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
        Type any question that requires real-time, on-the-ground truth. The
        agent will search the web, judge its own confidence, and pay a human
        worker on Lightning when the answer needs verification.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
        className="mt-10 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/60 shadow-2xl shadow-orange-500/5 focus-within:border-orange-500/60"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start();
            }
          }}
          rows={3}
          placeholder="How long is the line at Berghain right now?"
          className="block w-full resize-none bg-transparent px-5 py-4 text-base text-zinc-100 placeholder-zinc-500 outline-none sm:text-lg"
          disabled={submitting}
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => start(p)}
                disabled={submitting}
                className="truncate rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
              >
                {p.length > 36 ? p.slice(0, 35) + "…" : p}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting || !question.trim()}
            className="ml-auto rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400 disabled:opacity-50"
          >
            {submitting ? "Starting…" : "Verify  →"}
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-zinc-500">
        Press Enter to begin · the next page runs the verification on a real
        BOLT11 invoice.
      </p>
    </section>
  );
}
