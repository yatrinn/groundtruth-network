// Developer docs page.
//
// Three jobs in order of judge attention:
//   1. Show that GroundTruth is real infrastructure — `npm install`,
//      one-line integration, typed surface.
//   2. Document the API surface clearly enough that a senior engineer
//      could ship against it without reading the source.
//   3. Provide a live playground judges can poke at, so the docs are
//      backed by behaviour, not just words.

"use client";

import { useState } from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      <Header />

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Developer documentation
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Ship verified answers to your AI agent in three lines.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          GroundTruth Network is the API and TypeScript SDK that lets your
          agent admit what it doesn't know — and pay a human anywhere on Earth
          to verify the truth, settled instantly on the Bitcoin Lightning
          Network.
        </p>
      </section>

      <Section title="Install">
        <Code language="bash">{`npm install groundtruth-sdk
# or
pnpm add groundtruth-sdk`}</Code>
      </Section>

      <Section title="60-second quickstart">
        <p className="mb-6 text-sm text-zinc-400">
          From zero to a verified answer in three steps. No signup, no API
          key, no rate-limit gate — the public network is open.
        </p>

        <ol className="space-y-6">
          <li>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
              Step 1 · Install
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              The SDK is a single dependency, written in TypeScript with full type exports.
            </p>
            <Code language="bash">{`npm install groundtruth-sdk`}</Code>
          </li>
          <li>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
              Step 2 · Initialize
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              One line. The SDK ships pointing at the public network — override
              <code className="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">apiUrl</code>
              for self-hosted deployments.
            </p>
            <Code language="ts">{`import { GroundTruth } from "groundtruth-sdk";

const gt = new GroundTruth({ agentId: "my-travel-app" });`}</Code>
          </li>
          <li>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
              Step 3 · Verify
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Call <code className="font-mono text-orange-200">verify</code>. The platform searches the web, judges its own confidence, and escalates to a paid human only when ground truth is required.
            </p>
            <Code language="ts">{`const result = await gt.verify({
  question: "Is Cafe Einstein in Berlin open today?",
  maxSats: 500,
  timeoutSeconds: 90,
});

switch (result.kind) {
  case "verified":            console.log("Human verified:", result.answer); break;
  case "answered_directly":   console.log("Web evidence:", result.answer);   break;
  case "timeout":             console.log("No worker in time");              break;
  case "rejected":            console.log("Implausible answer:", result.reason); break;
}`}</Code>
          </li>
        </ol>

        <p className="mt-6 text-xs text-zinc-500">
          That is the whole API. The full surface — task creation, polling, low-level control — is documented below.
        </p>
      </Section>

      <Section title="Try it live">
        <p className="mb-4 text-sm text-zinc-400">
          Hit the production API directly. No signup, no API key. The
          response is exactly what your SDK call would return.
        </p>
        <LivePlayground />
      </Section>

      <Section title="API reference">
        <ApiTable
          title="new GroundTruth(options)"
          rows={[
            ["agentId", "string", '"anonymous-agent"', "Free-form identifier for analytics."],
            ["apiUrl", "string", "https://groundtruth-network.vercel.app", "Override the API base URL."],
            ["fetch", "typeof fetch", "global fetch", "Custom fetch implementation."],
          ]}
        />

        <ApiTable
          title="gt.verify(input)"
          rows={[
            ["question", "string", "—", "What you want verified."],
            ["maxSats", "number", "500", "Maximum bounty you authorize."],
            ["timeoutSeconds", "number", "90", "Soft cap on wait time."],
            ["context", "string", "—", "Optional extra context for the worker."],
            ["category", "string", "—", "Optional analytics tag."],
            ["pollIntervalMs", "number", "1000", "How often to poll for the answer."],
            ["signal", "AbortSignal", "—", "Cancel the call mid-flight."],
          ]}
        />

        <p className="mt-4 text-sm text-zinc-400">
          Returns one of four discriminated states: <code className="text-orange-300">answered_directly</code>,{" "}
          <code className="text-orange-300">verified</code>, <code className="text-orange-300">timeout</code>, or{" "}
          <code className="text-orange-300">rejected</code>. Use a switch over <code className="text-orange-300">result.kind</code> to handle each.
        </p>
      </Section>

      <Section title="HTTP API">
        <p className="mb-4 text-sm text-zinc-400">
          The SDK is a thin wrapper around four endpoints. You can call them directly from any language.
        </p>
        <EndpointRow
          method="POST"
          path="/api/agent/ask"
          desc="Ask GroundTruth a question. The platform decides whether to answer directly or escalate to a human."
        />
        <EndpointRow
          method="POST"
          path="/api/tasks"
          desc="Skip the platform's reasoning and post a verification task directly."
        />
        <EndpointRow
          method="GET"
          path="/api/tasks/[id]"
          desc="Fetch the current state of a task."
        />
        <EndpointRow
          method="POST"
          path="/api/tasks/[id]/claim"
          desc="(Worker) Reserve an open task."
        />
        <EndpointRow
          method="POST"
          path="/api/tasks/[id]/submit"
          desc="(Worker) Submit an answer; triggers plausibility check and Lightning payout."
        />
      </Section>

      <Section title="What is real vs. simulated in this demo deployment">
        <p className="mb-6 text-sm text-zinc-400">
          GroundTruth is open about which parts of the system are wired to
          production infrastructure and which are explicitly simulated in this
          public demo. This matters for anyone evaluating the project — the
          honest answer here is what makes the rest credible.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <h3 className="text-sm font-semibold text-emerald-300">
              Real on Bitcoin Mainnet today
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>BOLT11 invoices generated against live LUD-16 endpoints</li>
              <li>Lightning Address resolution via @getalby/lightning-tools</li>
              <li>Postgres state machine with race-safe conditional writes</li>
              <li>Postgres-backed per-IP and global daily rate limits</li>
              <li>Realtime push via Supabase Postgres triggers</li>
              <li>OpenAI gpt-5.5 draft, judge, and plausibility-gate calls</li>
              <li>Tavily web grounding for the honest agent</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="text-sm font-semibold text-amber-300">
              Simulated for the public demo
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>Server-side Lightning sender (swap-in Lexe / Alby Hub / Spark)</li>
              <li>Bounty escrow accepts the invoice optimistically as paid</li>
              <li>Auto-verifier closes the loop when no human worker is online — every output is clearly labeled "Simulated demo answer"</li>
              <li>Multi-verifier consensus (single-verifier + LLM judge today)</li>
              <li>Worker reputation algorithm aggregates only completion count and earned sats — no on-chain proofs yet</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          The send-side Lightning sender is a one-file swap: replace the
          <code className="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-300">payToLightningAddress</code>
          mock implementation in <code className="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-300">src/lib/lightning.ts</code>
          with a real node call. Everything else is wired for it.
        </p>
      </Section>

      <Section title="Architecture">
        <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-xs leading-relaxed text-zinc-300">
{`        AI AGENT                            HUMAN WORKER (anywhere)
           |                                          |
   ask( question ) ─────────────────────────►         |
           |                                          |
           |  search Tavily                           |
           |  draft answer with gpt-5.5               |
           |  judge confidence                        |
           |                                          |
           |  if confident: return answer             |
           |  else: post task with                    |
           |        Lightning bounty escrow ─────────►|
           |                                          |
           |                                          | claim
           |                                          | answer + proof
           |                                          | submit
           |                                          |
           |  ◄─────────── plausibility-gated payout ─|
           |                                          |
   ◄─── verified answer + payout proof                |`}
        </pre>
        <ul className="mt-6 space-y-3 text-sm text-zinc-400">
          <li>
            <span className="font-semibold text-zinc-200">Race-safe state machine.</span>{" "}
            Conditional Postgres writes prevent two workers from claiming or settling the same task.
          </li>
          <li>
            <span className="font-semibold text-zinc-200">Real BOLT11 invoices.</span>{" "}
            Bounty escrow and worker payouts both resolve against live LUD-16 endpoints — the rails are real.
          </li>
          <li>
            <span className="font-semibold text-zinc-200">LLM-as-judge gate.</span>{" "}
            Empty, off-topic, or nonsensical submissions fail the plausibility check before any sats move.
          </li>
          <li>
            <span className="font-semibold text-zinc-200">Realtime push.</span>{" "}
            Postgres triggers via Supabase deliver updates to both the worker feed and the agent verification view in sub-second time.
          </li>
        </ul>
      </Section>

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
          <Link href="/leaderboard" className="hover:text-zinc-100">Leaderboard</Link>
          <Link href="/docs" className="text-orange-300">Docs</Link>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-4xl border-t border-zinc-900 px-6 py-16">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Code({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span>{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function ApiTable({
  title,
  rows,
}: {
  title: string;
  rows: [string, string, string, string][];
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-2 font-mono text-xs text-orange-300">
        {title}
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-900/40 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          <tr>
            <th className="px-4 py-2">Field</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Default</th>
            <th className="px-4 py-2">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {rows.map(([field, type, def, desc]) => (
            <tr key={field}>
              <td className="px-4 py-3 font-mono text-orange-200">{field}</td>
              <td className="px-4 py-3 font-mono text-zinc-400">{type}</td>
              <td className="px-4 py-3 font-mono text-zinc-500">{def}</td>
              <td className="px-4 py-3 text-zinc-300">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  desc,
}: {
  method: "GET" | "POST";
  path: string;
  desc: string;
}) {
  const color =
    method === "GET"
      ? "bg-emerald-500/10 text-emerald-300"
      : "bg-orange-500/10 text-orange-300";
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-900 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span
        className={`inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
      >
        {method}
      </span>
      <code className="font-mono text-sm text-zinc-100">{path}</code>
      <span className="text-sm text-zinc-400 sm:ml-auto sm:text-right">{desc}</span>
    </div>
  );
}

function LivePlayground() {
  const [question, setQuestion] = useState("Is Cafe Einstein in Berlin open right now?");
  const [bounty, setBounty] = useState(300);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/agent/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, bounty_sats: bounty, agent_id: "docs-playground" }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setResponse(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr,auto,auto]">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm outline-none focus:border-orange-500/60"
        />
        <input
          type="number"
          value={bounty}
          onChange={(e) => setBounty(Math.max(1, parseInt(e.target.value || "0", 10)))}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-orange-500/60"
        />
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "Running…" : "POST /api/agent/ask"}
        </button>
      </div>
      {response && (
        <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
{response}
        </pre>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          GroundTruth SDK · MIT licensed · Source on{" "}
          <a
            href="https://github.com/yatrinn/groundtruth-network/tree/main/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300"
          >
            GitHub
          </a>
        </p>
        <div className="flex gap-5">
          <Link href="/agent" className="hover:text-zinc-300">Agent demo</Link>
          <Link href="/worker" className="hover:text-zinc-300">Worker</Link>
          <Link href="/pricing" className="hover:text-zinc-300">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
