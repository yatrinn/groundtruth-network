// Pricing page.
//
// Three jobs:
//   1. Show that we have a real, simple business model — pay only
//      for what you use, no signup, no subscription required.
//   2. Defang the inevitable jury question "but why not Scale AI?"
//      with a side-by-side that makes the comparison undeniable.
//   3. Let visitors play with a calculator so they can see, in their
//      own scenario, that the unit economics work.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatSats, satsToUsd } from "@/lib/utils";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      <Header />

      <section className="mx-auto max-w-5xl px-6 pt-20 pb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Pricing
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Pay per verified answer.
          <br />
          <span className="text-orange-400">Nothing else.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          No seat licenses. No platform subscription. No minimum spend. You
          fund a Lightning bounty, the worker earns it, GroundTruth takes a
          small cut. Your costs scale linearly with your traffic — and only
          when an agent actually used a human.
        </p>
      </section>

      <Tiers />
      <Calculator />
      <Comparison />
      <FAQ />

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
          <Link href="/docs" className="hover:text-zinc-100">Docs</Link>
          <Link href="/pricing" className="text-orange-300">Pricing</Link>
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

function Tiers() {
  const tiers = [
    {
      name: "Self-serve",
      take: "10%",
      lead: "Best for prototypes and small agents.",
      bullets: [
        "Pay-as-you-go, no subscription",
        "Public TypeScript SDK and HTTP API",
        "Community support",
        "Up to 10k verifications / month",
      ],
      cta: { label: "Start with the SDK", href: "/docs" },
      highlight: false,
    },
    {
      name: "Growth",
      take: "7%",
      lead: "Production agents that ship to real users.",
      bullets: [
        "Volume discount on platform take rate",
        "Priority worker routing for sub-30s SLA",
        "Reputation graph access",
        "10k–1M verifications / month",
      ],
      cta: { label: "Talk to us", href: "mailto:hello@groundtruth.network" },
      highlight: true,
    },
    {
      name: "Enterprise",
      take: "5%",
      lead: "Compliance, dedicated workers, white-glove integration.",
      bullets: [
        "Lowest take rate, custom contract",
        "Dedicated worker pools by region or domain",
        "SOC 2 / GDPR readiness on request",
        "1M+ verifications / month",
      ],
      cta: { label: "Contact sales", href: "mailto:hello@groundtruth.network" },
      highlight: false,
    },
  ];

  return (
    <section className="mx-auto max-w-5xl border-t border-zinc-900 px-6 py-16">
      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border p-6 ${
              t.highlight
                ? "border-orange-500/40 bg-gradient-to-b from-orange-500/10 to-zinc-900/40"
                : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">
              {t.name}
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              {t.take} <span className="text-base text-zinc-400">platform fee</span>
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{t.lead}</p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-300">
              {t.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-orange-400" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href={t.cta.href}
                className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  t.highlight
                    ? "bg-orange-500 text-zinc-950 hover:bg-orange-400"
                    : "border border-zinc-700 text-zinc-100 hover:border-zinc-500"
                }`}
              >
                {t.cta.label}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-zinc-500">
        Bounties paid to workers are a separate cost set by you. Typical demo bounties run 100–1,000 sats (about $0.06–$0.60 at $100k BTC).
      </p>
    </section>
  );
}

function Calculator() {
  const [verifications, setVerifications] = useState(100);
  const [bountySats, setBountySats] = useState(500);
  const [takeRate, setTakeRate] = useState(0.1);

  const result = useMemo(() => {
    const bountyMonth = verifications * 30 * bountySats;
    const platformMonth = bountyMonth * takeRate;
    const total = bountyMonth + platformMonth;
    return { bountyMonth, platformMonth, total };
  }, [verifications, bountySats, takeRate]);

  return (
    <section className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Cost calculator</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Plug in your traffic and your bounty target. Numbers update live.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Verifications per day
            </label>
            <input
              type="range"
              min={10}
              max={10000}
              step={10}
              value={verifications}
              onChange={(e) => setVerifications(parseInt(e.target.value, 10))}
              className="mt-3 w-full accent-orange-500"
            />
            <p className="mt-1 text-2xl font-semibold">
              {verifications.toLocaleString("en-US")}
            </p>

            <label className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Average bounty (sats)
            </label>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={bountySats}
              onChange={(e) => setBountySats(parseInt(e.target.value, 10))}
              className="mt-3 w-full accent-orange-500"
            />
            <p className="mt-1 text-2xl font-semibold">
              {formatSats(bountySats)}{" "}
              <span className="text-base font-normal text-zinc-500">
                ({satsToUsd(bountySats)})
              </span>
            </p>

            <label className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Platform tier
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Self-serve", rate: 0.1 },
                { label: "Growth", rate: 0.07 },
                { label: "Enterprise", rate: 0.05 },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTakeRate(t.rate)}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    takeRate === t.rate
                      ? "border-orange-500/60 bg-orange-500/10 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {t.label}
                  <br />
                  <span className="text-[10px] text-zinc-500">{(t.rate * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-zinc-900/40 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">
              Estimated monthly spend
            </p>

            <div className="mt-6 space-y-4">
              <Row
                label="Worker bounties (paid out)"
                value={`${formatSats(result.bountyMonth)} (${satsToUsd(result.bountyMonth)})`}
              />
              <Row
                label="GroundTruth platform fee"
                value={`${formatSats(Math.round(result.platformMonth))} (${satsToUsd(result.platformMonth)})`}
              />
              <div className="my-3 border-t border-orange-500/20" />
              <Row
                label="Total monthly cost"
                value={`${formatSats(Math.round(result.total))} (${satsToUsd(result.total)})`}
                emphasize
              />
            </div>

            <p className="mt-6 text-xs text-zinc-500">
              For comparison: a Scale AI enterprise contract starts at <span className="text-zinc-300">$50k+ per year</span> with multi-day turnaround. The 100 verifications/day scenario above runs around <span className="text-zinc-300">{satsToUsd(result.total * 12)}/year</span> with sub-minute turnaround and global coverage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`font-mono ${
          emphasize ? "text-2xl font-semibold text-zinc-100" : "text-sm text-zinc-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Comparison() {
  const rows: { feature: string; cells: (string | boolean)[] }[] = [
    { feature: "Time-to-answer", cells: ["~60 seconds", "Days", "Days", "Hours"] },
    { feature: "Minimum bounty", cells: ["~$0.06 (sub-cent)", "$0.10+", "n/a", "n/a"] },
    { feature: "Geographic coverage", cells: ["Global, instant", "US-centric", "Limited LMICs", "Wherever you have staff"] },
    { feature: "Worker signup", cells: [false, true, true, true] },
    { feature: "API-first integration", cells: [true, "limited", false, false] },
    { feature: "Settlement", cells: ["Lightning, sub-second", "1–3 days", "1–7 days", "Internal"] },
    { feature: "Open source SDK", cells: [true, false, false, false] },
    { feature: "Real-time use case", cells: [true, false, false, false] },
  ];

  const columns = ["GroundTruth", "Scale AI", "Mechanical Turk", "In-house team"];

  return (
    <section className="mx-auto max-w-5xl border-t border-zinc-900 px-6 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Why not Scale AI</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Built for a different shape of demand: real-time, global, sub-dollar, agent-native.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              <th className="px-4 py-3">Capability</th>
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={`px-4 py-3 ${
                    i === 0 ? "text-orange-300" : ""
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((r) => (
              <tr key={r.feature}>
                <td className="px-4 py-3 font-medium text-zinc-100">{r.feature}</td>
                {r.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3 ${
                      i === 0
                        ? typeof cell === "boolean"
                          ? cell
                            ? "text-emerald-300"
                            : "text-zinc-500"
                          : "text-emerald-200"
                        : typeof cell === "boolean"
                          ? cell
                            ? "text-zinc-300"
                            : "text-zinc-600"
                          : "text-zinc-400"
                    }`}
                  >
                    {typeof cell === "boolean" ? (cell ? "Yes" : "No") : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Do I need an account?",
      a: "No. The HTTP API and TypeScript SDK are open. You only need a Lightning Address to receive payouts — and only if you are a worker.",
    },
    {
      q: "Is there a minimum spend?",
      a: "No. You can run a single verification for a few hundred sats. Costs scale linearly with traffic.",
    },
    {
      q: "What happens if a worker submits a wrong answer?",
      a: "An LLM-as-judge plausibility gate filters obviously bad submissions before payout. For higher-stakes flows, you can require multi-verifier consensus on the Growth and Enterprise tiers.",
    },
    {
      q: "Can I self-host the platform?",
      a: "Yes — the codebase is MIT licensed. You bring your own Supabase, OpenAI key, and a server-side Lightning sender (Lexe, Alby Hub, Spark). Hosted GroundTruth still wins on the worker network and reputation graph.",
    },
  ];
  return (
    <section className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.q}>
              <h3 className="text-sm font-semibold text-zinc-100">{it.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          GroundTruth Network · Open source under the MIT license · Built on Next.js, Supabase, OpenAI, Tavily, and the Bitcoin Lightning Network.
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
