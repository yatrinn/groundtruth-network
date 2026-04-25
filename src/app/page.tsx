// Landing page.
//
// The page is structured to answer, in order, the questions that a
// venture investor asks within thirty seconds of opening any product:
// what is it, why now, who pays for it, what makes it defensible, and
// is it real. Every claim is backed by either a working route in this
// repo, a public dataset, or a publicly verifiable funding round.

import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import NetworkStats from "@/components/NetworkStats";
import InteractiveHero from "@/components/InteractiveHero";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      <SiteHeader />
      <InteractiveHero />
      <TrustBar />
      <Subhero />
      <Thesis />
      <Stats />
      <Pillars />
      <ScaleAIComparison />
      <Customers />
      <TechnicalEdge />
      <HowItWorks />
      <Network />
      <CTA />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          GroundTruth<span className="text-orange-400">.</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/agent" className="hover:text-zinc-100">Agent demo</Link>
          <Link href="/worker" className="hover:text-zinc-100">Worker app</Link>
          <Link href="/leaderboard" className="hover:text-zinc-100">Leaderboard</Link>
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
      </nav>
    </header>
  );
}

// The original static Hero is replaced by InteractiveHero. We keep
// this section for the longer-form pitch under the fold.
function Subhero() {
  return (
    <section className="mx-auto max-w-5xl border-t border-zinc-900 px-6 py-16">
      <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Real-time verification when the web is not enough.
      </h2>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
        AI agents do well with what is on the public web. They fail on what is
        happening right now: open-hour changes, in-store availability,
        location-specific conditions. GroundTruth is the API and marketplace
        where an agent admits uncertainty and pays a human anywhere on Earth
        to check — settled in seconds on the Bitcoin Lightning Network.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/worker"
          className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
        >
          Earn sats as a worker
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
        >
          Read the SDK docs
        </Link>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "Bitcoin Lightning Mainnet",
    "L402 + LNURL-pay",
    "MIT licensed",
    "Open source",
    "Production deployment",
  ];
  return (
    <section className="border-y border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {items.map((label, i) => (
          <span key={label} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:block" />}
            <span>{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function Thesis() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
        The thesis
      </p>
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        The next economic layer is not built by humans for humans.
      </h2>
      <div className="mt-10 grid gap-10 text-zinc-300 sm:grid-cols-2">
        <p className="text-base leading-relaxed">
          By 2030 autonomous agents will execute trillions of transactions per
          year on behalf of people, businesses, and other agents. The hardest
          question they will face is not how to think — it is how to know.
          Hallucinated facts cost real money the moment an agent is connected
          to a checkout, a calendar, or a trading desk.
        </p>
        <p className="text-base leading-relaxed">
          The decade ahead will be defined by the infrastructure that lets
          autonomous systems verify what is real. That infrastructure cannot
          run on card networks (minimum-fee uneconomic), stablecoins (single
          issuer, freeze risk), or enterprise data deals (slow, geographically
          bound). It runs on Lightning, and we are building the verification
          layer on top of it.
        </p>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <NetworkStats />
      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-zinc-600">
        Live data — every verification on this network is observable on this page.
      </p>
    </section>
  );
}

function Pillars() {
  const items = [
    {
      label: "The problem",
      headline: "AI agents cannot see the real world.",
      body: "28% of US firms report zero confidence in their AI data quality. Every AI travel agent, shopping assistant, and sales tool ships answers it cannot actually verify.",
    },
    {
      label: "The wedge",
      headline: "Lightning makes 30¢ payouts viable, anywhere on Earth.",
      body: "Card networks have a 30¢ minimum fee. Stablecoins introduce a corporate gatekeeper. Lightning is the first rail in history that lets a Berlin agent pay a Lagos worker in 200ms with no gatekeeper.",
    },
    {
      label: "The market",
      headline: "Human-in-the-loop AI: $6.7B → $16.4B by 2030.",
      body: "Scale AI is enterprise-only and US-centric. Mechanical Turk is KYC-gated and slow. The real-time, sub-dollar, global verification market is structurally vacant.",
    },
  ];
  return (
    <section className="border-t border-zinc-900">
      <div className="mx-auto grid max-w-6xl gap-px bg-zinc-900 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="bg-zinc-950 p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400">
              {it.label}
            </p>
            <h3 className="mt-4 text-lg font-semibold leading-snug text-zinc-100">
              {it.headline}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScaleAIComparison() {
  const rows = [
    {
      label: "Time-to-answer",
      gt: "~60 seconds",
      scale: "Days",
      mturk: "Days",
    },
    {
      label: "Minimum bounty",
      gt: "~$0.06",
      scale: "$0.10+",
      mturk: "n/a",
    },
    {
      label: "Geographic coverage",
      gt: "Global, instant",
      scale: "US-centric",
      mturk: "US-centric",
    },
    {
      label: "Integration",
      gt: "npm install · 3 lines",
      scale: "Sales call",
      mturk: "Manual",
    },
  ];

  return (
    <section className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Why not Scale AI
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Built for a different shape of demand.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Scale AI is excellent for batch annotation and enterprise contracts.
          What it cannot do is ship a 30-cent verification to an agent in
          Berlin in 60 seconds — that is the only thing GroundTruth does, and
          we do it because Lightning is the only payment rail in the world that
          makes it economically possible.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                <th className="px-4 py-3">Capability</th>
                <th className="px-4 py-3 text-orange-300">GroundTruth</th>
                <th className="px-4 py-3">Scale AI</th>
                <th className="px-4 py-3">Mechanical Turk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-3 font-medium text-zinc-100">{r.label}</td>
                  <td className="px-4 py-3 text-emerald-200">{r.gt}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.scale}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.mturk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Full feature parity table on{" "}
          <Link href="/pricing" className="text-zinc-300 underline-offset-4 hover:underline">
            pricing
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function Customers() {
  const segments = [
    {
      label: "AI travel concierges",
      examples: "Mindtrip · Layla · Hopper AI",
      need: "Real-time hours, wait times, room availability, closures.",
    },
    {
      label: "AI shopping assistants",
      examples: "Perplexity Shopping · Klarna AI",
      need: "Local stock, sizing, prices, in-store promotions.",
    },
    {
      label: "AI sales tools",
      examples: "Clay · Apollo.ai",
      need: "Decision-maker presence, company status, on-the-ground signals.",
    },
    {
      label: "AI trading agents",
      examples: "Quant funds running autonomous systems",
      need: "Supply-chain checks, factory activity, regional fuel queues.",
    },
    {
      label: "AI content moderation",
      examples: "Platforms with edge-case review pipelines",
      need: "Human-in-the-loop verification at scale, sub-minute SLA.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
        Who pays for this
      </p>
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Five segments with a recurring, sub-dollar verification need.
      </h2>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {segments.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <h3 className="text-sm font-semibold text-zinc-100">{s.label}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              {s.examples}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{s.need}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechnicalEdge() {
  const items = [
    {
      title: "L402-compatible HTTP paywall",
      body: "Agents post tasks via a single HTTP call. Bounties enter escrow against a real Lightning invoice. Drop-in for any agent runtime that already speaks HTTP.",
    },
    {
      title: "Live LNURL-pay invoice resolution",
      body: "On every payout we resolve the worker's Lightning Address against the live LUD-16 endpoint. Invoices are real BOLT11. Validates wallets for free.",
    },
    {
      title: "Plausibility gate before settlement",
      body: "An LLM-as-judge step rejects empty, off-topic, or nonsensical answers before any sats move. The bar is generous, but it is a bar.",
    },
    {
      title: "Realtime task fanout",
      body: "Postgres triggers via Supabase push new tasks to the worker feed and verified answers back to the agent. Sub-second, no polling.",
    },
    {
      title: "Honest agent reference pattern",
      body: "Our example agent searches the web with Tavily, drafts an answer, judges its own confidence, and only escalates to a paid human when ground truth is required.",
    },
    {
      title: "Open from minute one",
      body: "Public repo, MIT license, every commit on GitHub. The schema, the demo script, the submission text — all in the open.",
    },
  ];
  return (
    <section className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          The technical edge
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Built on real protocols, not a marketing demo.
        </h2>
        <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.title}>
              <h3 className="text-sm font-semibold text-zinc-100">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "An agent posts a verification task",
      body: "The agent commits a Lightning bounty and asks a question that requires ground truth from the real world. The bounty enters escrow against a real BOLT11 invoice.",
    },
    {
      n: 2,
      title: "A worker anywhere on Earth answers",
      body: "Workers see live tasks, claim, verify on the ground, and submit. They never sign up — they just plug in a Lightning Address. No KYC, no email, no wallet beyond the address.",
    },
    {
      n: 3,
      title: "Lightning settles in seconds",
      body: "An LLM plausibility gate filters empty submissions. Verified answers trigger an instant Lightning payout to the worker. The agent receives a ground-truth answer it can trust.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
        How it works
      </p>
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        From question to verified answer in under a minute.
      </h2>
      <ol className="mt-12 grid gap-px bg-zinc-900 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="bg-zinc-950 p-8">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-sm font-semibold text-orange-300">
              {s.n}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-zinc-100">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Network() {
  return (
    <section className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Live on the network
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Every verification on this network is on this page.
        </h2>
        <div className="mt-12">
          <ActivityFeed limit={6} />
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Watch the system reason, escalate, and pay — in 60 seconds.
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/agent"
            className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400"
          >
            Open the agent demo
          </Link>
          <Link
            href="/worker"
            className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            Open the worker app
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          GroundTruth Network · Open source under the MIT license · Built on Next.js, Supabase, OpenAI, Tavily, and the Bitcoin Lightning Network.
        </p>
        <div className="flex gap-5">
          <a
            href="https://github.com/yatrinn/groundtruth-network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300"
          >
            GitHub
          </a>
          <Link href="/agent" className="hover:text-zinc-300">
            Agent demo
          </Link>
          <Link href="/worker" className="hover:text-zinc-300">
            Worker
          </Link>
        </div>
      </div>
    </footer>
  );
}
