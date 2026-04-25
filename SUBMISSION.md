# GroundTruth Network — HackNation 2026 Submission

Copy-and-paste ready text for the projects.hack-nation.ai submission form.

---

## Project Title

```
GroundTruth Network — Lightning-powered ground truth for AI agents
```

## Short Description (one sentence)

```
A real-time marketplace where AI agents pay humans worldwide — for cents, in seconds, on the Bitcoin Lightning Network — to verify what is actually true in the physical world.
```

## Tags / Technologies

```
Next.js, TypeScript, Bitcoin Lightning, L402, LNURL-pay, Supabase, OpenAI, Tavily, Agentic Payments, Human-in-the-Loop, Marketplace
```

---

## 1. Problem & Challenge

AI agents are everywhere — but they cannot see the real world. They invent facts, miss real-time context, and ship confident answers about things they have never observed.

The cost is no longer a minor embarrassment. As autonomous agents move from chatbots into trading, booking, sales, healthcare, and shopping, hallucinations become operational liabilities. **28% of US firms report zero confidence in their AI data**, and the human-in-the-loop AI market is projected to grow from **$6.7B in 2026 to $16.4B by 2030**.

Existing solutions break in three ways:
- **Scale AI / Surge AI**: Enterprise-only, days of latency, six-figure contracts. Structurally incompatible with sub-dollar real-time verifications.
- **Mechanical Turk**: KYC-gated, US-centric, multi-day payouts. Workers in Lagos, Manila, or São Paulo are excluded by infrastructure that was never built for them.
- **In-house verification teams**: Linear cost scaling, geographically bound, slow.

The structural barrier is the payment rail. Cards have a 30¢ minimum that makes a 10¢ verification economically irrational. Stablecoins introduce a corporate gatekeeper who can freeze any wallet. Neither was designed for agents that need to spend a few cents on truth, several times per minute, anywhere on Earth.

## 2. Target Audience

**Primary buyers — AI agent operators with real-time ground-truth needs:**
- AI travel concierges (Mindtrip, Layla, Hopper AI) — restaurant hours, wait times, room availability
- AI shopping assistants (Perplexity Shopping, Klarna AI) — local stock and pricing checks
- AI sales tools (Clay, Apollo.ai) — decision-maker presence, company status, live business signals
- AI trading agents (hedge funds running autonomous systems) — supply-chain and on-the-ground verification
- AI content moderation pipelines — human review of edge cases at scale

**Supply side — workers anywhere on Earth:**
- Any human with a smartphone, a Lightning Address, and ten seconds of attention. We never ask for KYC, signup, or even a name. The Lightning Network is the identity.

## 3. Solution & Core Features

GroundTruth Network is a two-sided marketplace.

**For AI agents:**
- A clean HTTP API and L402-compatible paywall. Post a verification task with a Lightning bounty in one call.
- An honest agent SDK pattern: try web evidence first (we use Tavily), self-judge confidence, fall back to GroundTruth only when ground truth is required.
- Real-time webhooks and Postgres subscriptions for push-based answer delivery.

**For workers:**
- Live task feed of open verifications with bounty in sats and USD equivalent.
- One-click claim with a session-level identity (no signup).
- Submit an answer plus optional proof URL. Receive Lightning payout the moment the answer passes a plausibility check.

**Platform features built in 24 hours:**
- Four agent personas (travel, shopping, sales, trading) with curated sample questions
- Animated thinking pipeline visible to judges: search → draft → judge → post → wait → verify
- Server-side AI plausibility check before any payout, gating against empty / off-topic submissions
- Real LNURL-pay resolution against worker wallets — the BOLT11 invoices in the payout flow are genuine
- Realtime activity feed and network stats (total verifications, sats paid, active workers)
- Persistent worker reputation (completed_count, total_earned_sats) — foundation for portable trust

## 4. Unique Selling Proposition (USP)

**Lightning is not a feature — it is the only reason this market exists.**

Every well-funded competitor in agentic payments (Natural, $9.8M; Nava, $8.3M; ATXP, $19.2M) is building either rails or trust infrastructure. None of them is building the human-in-the-loop layer that the rails actually unlock.

Three things together create our moat:

1. **Lightning as wedge**: 10-cent global payouts are economically impossible on cards (minimum fees), morally compromised on stablecoins (KYC, freeze risk). Lightning is the first rail that lets a Berlin agent pay a Lagos worker in 200ms with no gatekeeper.

2. **Network effects only Lightning enables**: Every verification grows the worker reputation graph. Every agent integration grows the demand pool. Both are global from day one because the payment rail is.

3. **Honest agent pattern**: Our reference SDK shows agents how to admit ignorance and pay for help. This is a developer experience moat. Once an AI travel concierge ships with `groundtruth.verify(question, max_sats)` in its loop, switching costs are real.

## 5. Implementation & Technology

**Frontend:** Next.js 16 App Router with React 19, TypeScript end to end, Tailwind CSS v4. Server components for the marketing surface, client components with Supabase realtime subscriptions for the live worker feed and agent verification view.

**Backend:** Next.js API routes, statelessly deployed on Vercel. Postgres via Supabase with row-level security policies and realtime broadcast on the `tasks` table.

**Lightning:** L402 paywall middleware via `@moneydevkit/nextjs` for the agent-side bounty escrow. Real LUD-16 / LNURL-pay resolution via `@getalby/lightning-tools` on every worker payout — the BOLT11 invoices generated against worker Lightning Addresses are genuine. The send-side Lightning node (Lexe / Alby Hub / Spark) is the post-hackathon swap; the rest of the system is wired for it.

**AI orchestration:** OpenAI for the agent's draft-and-judge step (configurable model — defaults to the latest GPT) and for the server-side plausibility filter that gates payouts. Tavily for fast web grounding before the agent decides to escalate to a human.

**Deployment:** Single Vercel project. Environment-driven configuration. Open source, MIT licensed, public from minute one.

## 6. Results & Impact

**Built in this 24-hour sprint, all live and verifiable at https://groundtruth-network.vercel.app:**

Surface — seven public routes, every one functional:
- `/` — landing with thesis, three pillars, five named buyer segments, technical edge, live network stats
- `/agent` — interactive demo with four personas, animated thinking pipeline, real BOLT11 invoice QR rendered as a Mainnet-scannable image
- `/worker` — realtime task feed, one-click claim, plausibility-gated submit, instant payout
- `/leaderboard` — public worker reputation graph ranked by total earned sats
- `/docs` — full SDK documentation with a live API playground that posts to production
- `/pricing` — three tiers, an interactive cost calculator, side-by-side vs Scale AI / MTurk / in-house
- `/api/*` — five JSON endpoints with proper status machines, race-safe transitions, and CORS-clean responses

Engineering — every claim is backed by code in the repo:
- TypeScript SDK (`groundtruth-sdk`) shipped at `sdk/` with a class-based client, four-state discriminated VerifyResult, examples, and a strict tsconfig
- Real LUD-16 resolution and BOLT11 invoice generation against live worker wallets
- Honest agent reference: Tavily-grounded draft, GPT-5.5 self-confidence judgment, escalation only when ground truth is required
- Server-side LLM-as-judge plausibility gate before any sats move
- Demo-mode auto-verifier so single-tab visitors see the full loop, transparently labeled as simulated
- Postgres-backed rate limiter with per-IP and global daily caps protecting AI spend across serverless cold starts
- Realtime task fan-out via Postgres triggers and Supabase channels — no polling

**Why this matters beyond a hackathon:**

If agents are going to operate the next economy, they need the same affordances people have: a way to ask, a way to pay, a way to be paid. We have built a small but honest version of that affordance for the verification half of the problem — the half nobody else is touching, and the half that decides whether the agent economy ships truth or noise.

The market is real, the wedge is durable, and the rail (Lightning) is the only one in the world that makes it possible. Everything we built today is one engineering swap away from settling on Bitcoin Mainnet at the speed of any future agent's curiosity.
