// Landing page. The single job is to answer three questions in 5 seconds:
//   1. What is GroundTruth?
//   2. Who needs it?
//   3. How do I try it right now?
//
// Two CTAs route directly into the live demo: /agent (post a verification)
// and /worker (claim a task and earn sats).

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        <p className="mb-6 inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-orange-300">
          HackNation 2026 · Earn in the Agent Economy
        </p>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Real-time human verification
          <br />
          <span className="text-orange-400">for AI agents.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          AI agents hallucinate. GroundTruth Network lets them pay humans
          worldwide to verify what is actually true — settled instantly on the
          Bitcoin Lightning Network for cents per check.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/agent"
            className="rounded-lg bg-orange-500 px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-orange-400"
          >
            Try the agent demo
          </Link>
          <Link
            href="/worker"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            Earn sats as a worker
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-t border-zinc-900 px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          <Card
            title="The problem"
            body="28% of US firms have zero confidence in their AI data. Every AI travel agent, shopping assistant, and sales tool ships answers it cannot actually verify."
          />
          <Card
            title="The wedge"
            body="Lightning is the first payment rail that makes a 30-cent global payout viable. No KYC. No Visa minimum fee. No 3-day settlement."
          />
          <Card
            title="The market"
            body="Human-in-the-loop AI grows from $6.7B in 2026 to $16.4B by 2030. Scale AI is slow and US-only. We are real-time and global."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-t border-zinc-900 px-6 py-16">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 space-y-4 text-zinc-300">
          <Step
            n={1}
            title="An AI agent posts a verification task"
            body="The agent commits a small Lightning bounty to ask a question that needs ground truth from the real world."
          />
          <Step
            n={2}
            title="A worker anywhere on Earth answers"
            body="Workers see live tasks, claim, walk past the place, snap a photo, type the answer. They never sign up — they just submit a Lightning Address."
          />
          <Step
            n={3}
            title="Lightning settles in seconds"
            body="The worker receives the bounty instantly. The agent receives a verified, ground-truth answer it can trust."
          />
        </ol>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-10 text-center text-xs text-zinc-500">
        Built for HackNation 2026 ·{" "}
        <a
          href="https://github.com/yatrinn/groundtruth-network"
          className="underline-offset-4 hover:text-zinc-300 hover:underline"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-300">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/10 text-sm font-semibold text-orange-300">
        {n}
      </span>
      <div>
        <p className="font-medium text-zinc-100">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{body}</p>
      </div>
    </li>
  );
}
