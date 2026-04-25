# GroundTruth Network

**Real-time human verification for AI agents, settled instantly on the Bitcoin Lightning Network.**

Built for [HackNation 2026](https://hack-nation.ai) — Challenge 02: *Earn in the Agent Economy*, powered by [Spiral](https://spiral.xyz).

---

## The Problem

AI agents are everywhere — but they hallucinate. They invent facts, miss real-time context, and make confident claims about a world they cannot see.

- **28% of US firms have zero confidence** in their AI data quality (AnalyticsWeek, 2026).
- The **Human-in-the-Loop AI market** is projected to reach **$16.4B by 2030** (24.7% CAGR).
- Existing solutions (Scale AI, Surge AI, Mechanical Turk) are slow, KYC-gated, US-centric, and structurally cannot serve sub-dollar real-time verifications.

When an AI travel agent says *"the restaurant is open"*, the customer who arrives at a closed door pays the price.

## The Solution

GroundTruth Network is a marketplace where AI agents pay humans worldwide — in seconds, for cents — to verify what's true in the real world.

1. An agent posts a verification task with a Lightning bounty.
2. A worker anywhere on Earth claims the task, completes it (photo, answer, judgement), and submits.
3. Lightning settles the payment instantly. The agent receives a verified, ground-truth answer.

This works **only** on the Lightning Network. Card networks have minimum fees that make sub-dollar payments uneconomic. Stablecoins introduce KYC gatekeepers and freeze risk. Lightning is the first payment rail that is permissionless, instant, global, and cheap enough to make every AI verification a viable economic event.

## Demo

- **Live**: _coming soon_
- **Demo video**: _coming soon_
- **Tech video**: _coming soon_

## How It Works

```
        AI AGENT                        WORKER (anywhere)
           |                                   |
           | 1. POST /tasks                    |
           |    + Lightning invoice            |
           |    pre-paid (L402 paywall)        |
           |                                   |
           |--------- TASK BROADCAST --------->|
           |                                   | 2. Claim, complete,
           |                                   |    submit answer + proof
           |<------- ANSWER + PROOF -----------|
           |                                   |
           | 3. Server verifies plausibility   |
           |    Lightning payout to worker     |
           |                                   |
           |<------ VERIFIED RESULT -----------|
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (Postgres) — tasks, workers, reputation
- **Lightning**: [MoneyDevKit](https://moneydevkit.com) for L402 paywall and agent wallets
- **Search and AI grounding**: [Tavily](https://tavily.com) for the demo agent client
- **Hosting**: [Vercel](https://vercel.com)

## Local Development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.local.example .env.local
# Fill in Supabase, MoneyDevKit, and Tavily keys

# Run dev server
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```
groundtruth-network/
|-- src/
|   |-- app/                       # Next.js App Router
|   |   |-- page.tsx               # Marketing landing page
|   |   |-- agent/                 # Agent client demo
|   |   |-- worker/                # Worker task feed
|   |   `-- api/                   # Server routes
|   |       |-- tasks/             # Create, claim, submit tasks
|   |       `-- verify/            # L402-paywalled verification endpoint
|   |-- components/                # Reusable UI components
|   `-- lib/                       # Supabase, Lightning, types, helpers
|-- public/                        # Static assets
`-- README.md
```

## Roadmap (post-hackathon)

- TypeScript and Python SDKs (`groundtruth-sdk`) for one-line agent integration
- Mobile PWA for workers with push notifications
- Multi-verifier consensus and dispute resolution
- On-chain reputation graph (portable trust scores)
- Integration partnerships with AI travel, shopping, sales, and trading platforms

## License

MIT — built and shipped during HackNation 2026.

## Author

Yannik Trinn — [yatrinn on GitHub](https://github.com/yatrinn)
